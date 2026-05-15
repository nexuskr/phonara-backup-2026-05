
-- 1) bonus_kind column
ALTER TABLE public.slot_games
  ADD COLUMN IF NOT EXISTS bonus_kind text NOT NULL DEFAULT 'wheel';

-- 2) Seed bonus_kind per game (data-driven mirror of src/lib/slots/engine/games.ts)
UPDATE public.slot_games SET bonus_kind = CASE game_code
  WHEN 'cosmic_forge_5000'   THEN 'sticky_multi'
  WHEN 'neon_tokyo_88'       THEN 'hold88'
  WHEN 'pirates_curse_1500'  THEN 'crash_cannon'
  WHEN 'pharaohs_vault_2500' THEN 'pick_reveal'
  WHEN 'viking_thunder_4000' THEN 'three_path'
  WHEN 'aztec_sun_1200'      THEN 'cluster_tumble'
  WHEN 'cherry_sakura_500'   THEN 'mission_trail'
  WHEN 'olympus_1000'        THEN 'wheel'
  WHEN 'wizard_2000'         THEN 'wheel'
  WHEN 'dragon_500'          THEN 'wheel'
  ELSE bonus_kind
END;

-- 3) Replace spin_slot_real to include bonus_kind + bonus_seed in response
CREATE OR REPLACE FUNCTION public.spin_slot_real(
  _game_code text, _bet_phon numeric, _client_seed text, _is_buy_bonus boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_game record;
  v_balance numeric;
  v_bet_total numeric;
  v_server_seed text; v_server_seed_hash text; v_nonce bigint;
  v_result jsonb; v_payout numeric;
  v_nft_boost numeric := 0; v_streak_boost numeric := 0; v_total_boost numeric := 0;
  v_kill record;
  v_recent_wins int := 0; v_recent_bet numeric := 0; v_recent_paid numeric := 0;
  v_recent_rtp numeric := 100;
  v_target_rtp_lo numeric := 95.0; v_target_rtp_hi numeric := 97.0;
  v_max_mult numeric;
  v_bonus_seed bigint;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF public.is_account_frozen(v_user) THEN RAISE EXCEPTION 'account_frozen'; END IF;

  SELECT key, enabled INTO v_kill FROM public.platform_kill_switches WHERE key='trading_halt';
  IF FOUND AND v_kill.enabled THEN RAISE EXCEPTION 'trading_halted'; END IF;

  SELECT * INTO v_game FROM public.slot_games WHERE game_code=_game_code AND active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'game_not_found'; END IF;
  v_max_mult := COALESCE(v_game.max_multiplier, 1000);

  IF _bet_phon < v_game.min_bet_phon OR _bet_phon > v_game.max_bet_phon THEN
    RAISE EXCEPTION 'bet_out_of_range';
  END IF;

  v_bet_total := CASE WHEN _is_buy_bonus THEN _bet_phon * v_game.buy_bonus_multiplier ELSE _bet_phon END;

  BEGIN
    SELECT LEAST(public.get_my_total_boost_pct(),100) * 0.005 INTO v_nft_boost;
    IF v_nft_boost > 0.25 THEN v_nft_boost := 0.25; END IF;
  EXCEPTION WHEN OTHERS THEN v_nft_boost := 0; END;

  SELECT
    COUNT(*) FILTER (WHERE payout_phon > 0),
    COALESCE(SUM(bet_phon),0),
    COALESCE(SUM(payout_phon),0)
  INTO v_recent_wins, v_recent_bet, v_recent_paid
  FROM (
    SELECT bet_phon, payout_phon FROM public.slot_spins
     WHERE user_id=v_user AND game_code=_game_code
     ORDER BY created_at DESC LIMIT 10
  ) s;

  v_recent_rtp := CASE WHEN v_recent_bet > 0 THEN (v_recent_paid / v_recent_bet) * 100 ELSE 96 END;
  IF v_recent_rtp < v_target_rtp_lo THEN
    v_streak_boost := LEAST(0.08, (v_target_rtp_lo - v_recent_rtp) * 0.005);
  END IF;
  v_total_boost := LEAST(0.30, v_nft_boost + v_streak_boost);

  SELECT balance INTO v_balance FROM public.phon_balances WHERE user_id=v_user FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_bet_total THEN RAISE EXCEPTION 'insufficient_phon'; END IF;

  UPDATE public.phon_balances SET balance = balance - v_bet_total, updated_at = now() WHERE user_id=v_user;

  v_server_seed := encode(extensions.gen_random_bytes(32),'hex');
  v_server_seed_hash := encode(extensions.digest(v_server_seed,'sha256'),'hex');
  v_nonce := (extract(epoch FROM clock_timestamp()) * 1000)::bigint;

  v_result := public._slot_compute_spin(
    v_server_seed, _client_seed, v_nonce, _is_buy_bonus, v_total_boost,
    v_game.symbol_weights, v_game.paytable, v_game.bonus_table, v_max_mult
  );
  v_payout := _bet_phon * (v_result->>'payout_mult')::numeric;

  IF v_recent_rtp > (v_target_rtp_hi + 10) AND v_payout > _bet_phon * 50 THEN
    v_payout := _bet_phon * 50;
  END IF;
  IF v_payout > _bet_phon * v_max_mult THEN
    v_payout := _bet_phon * v_max_mult;
  END IF;

  IF v_payout > 0 THEN
    UPDATE public.phon_balances SET balance = balance + v_payout, updated_at = now() WHERE user_id=v_user;
  END IF;

  -- Deterministic per-spin seed for the bonus overlay (so visuals reproduce server math)
  v_bonus_seed := ('x' || substr(encode(extensions.digest(
    v_server_seed || ':' || _client_seed || ':' || v_nonce::text || ':bonus','sha256'
  ),'hex'),1,12))::BIT(48)::BIGINT;

  INSERT INTO public.slot_spins(user_id, game_code, bet_phon, payout_phon, symbols, win_lines,
    bonus_triggered, bonus_multiplier, is_buy_bonus, server_seed_hash, server_seed_revealed,
    client_seed, nonce)
  VALUES (v_user, _game_code, v_bet_total, v_payout, v_result->'symbols', v_result->'win_lines',
          (v_result->>'bonus_triggered')::boolean, NULLIF((v_result->>'bonus_multiplier')::int, 0),
          _is_buy_bonus, v_server_seed_hash, v_server_seed, _client_seed, v_nonce);

  RETURN jsonb_build_object(
    'symbols', v_result->'symbols',
    'win_lines', v_result->'win_lines',
    'payout_phon', v_payout,
    'bet_phon', v_bet_total,
    'bonus_triggered', v_result->'bonus_triggered',
    'bonus_multiplier', v_result->'bonus_multiplier',
    'bonus_kind', CASE WHEN (v_result->>'bonus_triggered')::boolean THEN v_game.bonus_kind ELSE NULL END,
    'bonus_seed', v_bonus_seed,
    'server_seed_hash', v_server_seed_hash,
    'server_seed', v_server_seed,
    'client_seed', _client_seed,
    'nonce', v_nonce,
    'rtp_boost_pct', v_total_boost * 100
  );
END; $function$;

-- 4) Same fields for demo
CREATE OR REPLACE FUNCTION public.spin_slot_demo(
  _game_code text, _bet_chips numeric, _client_seed text, _is_buy_bonus boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_game record;
  v_balance numeric;
  v_bet_total numeric;
  v_server_seed text; v_server_seed_hash text; v_nonce bigint;
  v_result jsonb; v_payout numeric;
  v_max_mult numeric;
  v_bonus_seed bigint;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_game FROM public.slot_games WHERE game_code=_game_code AND active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'game_not_found'; END IF;
  v_max_mult := COALESCE(v_game.max_multiplier, 1000);

  v_bet_total := CASE WHEN _is_buy_bonus THEN _bet_chips * v_game.buy_bonus_multiplier ELSE _bet_chips END;
  IF _bet_chips <= 0 THEN RAISE EXCEPTION 'bet_out_of_range'; END IF;

  SELECT balance_chips INTO v_balance FROM public.slot_demo_balances WHERE user_id=v_user FOR UPDATE;
  IF v_balance IS NULL THEN
    INSERT INTO public.slot_demo_balances(user_id, balance_chips) VALUES (v_user, 10000)
      ON CONFLICT (user_id) DO NOTHING;
    v_balance := 10000;
  END IF;
  IF v_balance < v_bet_total THEN RAISE EXCEPTION 'insufficient_chips'; END IF;

  UPDATE public.slot_demo_balances
     SET balance_chips = balance_chips - v_bet_total, updated_at = now()
   WHERE user_id=v_user;

  v_server_seed := encode(extensions.gen_random_bytes(32),'hex');
  v_server_seed_hash := encode(extensions.digest(v_server_seed,'sha256'),'hex');
  v_nonce := (extract(epoch FROM clock_timestamp()) * 1000)::bigint;

  v_result := public._slot_compute_spin(
    v_server_seed, _client_seed, v_nonce, _is_buy_bonus, 0,
    v_game.symbol_weights, v_game.paytable, v_game.bonus_table, v_max_mult
  );
  v_payout := _bet_chips * (v_result->>'payout_mult')::numeric;
  IF v_payout > _bet_chips * v_max_mult THEN v_payout := _bet_chips * v_max_mult; END IF;

  IF v_payout > 0 THEN
    UPDATE public.slot_demo_balances
       SET balance_chips = balance_chips + v_payout, updated_at = now()
     WHERE user_id=v_user;
  END IF;

  v_bonus_seed := ('x' || substr(encode(extensions.digest(
    v_server_seed || ':' || _client_seed || ':' || v_nonce::text || ':bonus','sha256'
  ),'hex'),1,12))::BIT(48)::BIGINT;

  SELECT balance_chips INTO v_balance FROM public.slot_demo_balances WHERE user_id=v_user;

  RETURN jsonb_build_object(
    'symbols', v_result->'symbols',
    'win_lines', v_result->'win_lines',
    'payout_chips', v_payout,
    'bet_chips', v_bet_total,
    'balance_chips', v_balance,
    'bonus_triggered', v_result->'bonus_triggered',
    'bonus_multiplier', v_result->'bonus_multiplier',
    'bonus_kind', CASE WHEN (v_result->>'bonus_triggered')::boolean THEN v_game.bonus_kind ELSE NULL END,
    'bonus_seed', v_bonus_seed,
    'server_seed_hash', v_server_seed_hash,
    'server_seed', v_server_seed,
    'client_seed', _client_seed,
    'nonce', v_nonce
  );
END; $function$;

-- 5) Buy-bonus quote: server is single source of truth for the price
CREATE OR REPLACE FUNCTION public.get_slot_buy_bonus_quote(_game_code text, _bet_phon numeric)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_game record;
BEGIN
  SELECT game_code, name, buy_bonus_multiplier, max_multiplier, bonus_kind, min_bet_phon, max_bet_phon
    INTO v_game FROM public.slot_games WHERE game_code=_game_code AND active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'game_not_found'; END IF;
  IF _bet_phon < v_game.min_bet_phon OR _bet_phon > v_game.max_bet_phon THEN
    RAISE EXCEPTION 'bet_out_of_range';
  END IF;
  RETURN jsonb_build_object(
    'game_code', v_game.game_code,
    'name', v_game.name,
    'bet_phon', _bet_phon,
    'buy_bonus_multiplier', v_game.buy_bonus_multiplier,
    'cost_phon', _bet_phon * v_game.buy_bonus_multiplier,
    'max_multiplier', v_game.max_multiplier,
    'bonus_kind', v_game.bonus_kind
  );
END; $function$;

REVOKE ALL ON FUNCTION public.get_slot_buy_bonus_quote(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.get_slot_buy_bonus_quote(text, numeric) TO authenticated;
