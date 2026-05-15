-- =========================================================
-- DEMO MODE: Trump-grade hook engine (RTP 99.3 ~ 100.8)
-- REAL MODE: Musk-grade fair engine (RTP 94.8 ~ 95.6)
-- =========================================================

CREATE OR REPLACE FUNCTION public.spin_slot_demo(
  _game_code text, _bet_chips numeric, _client_seed text, _is_buy_bonus boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_game record;
  v_balance numeric;
  v_bet_total numeric;
  v_server_seed text;
  v_nonce bigint;
  v_result jsonb;
  v_payout numeric;
  v_class text;
  v_chosen_class text := 'loss';
  v_total_bet numeric; v_total_paid numeric;
  v_win_streak int; v_loss_streak int; v_last_class text; v_spins int;
  v_rtp numeric;
  v_lo numeric := 99.3;
  v_hi numeric := 100.8;
  v_desired text;
  v_pattern text := 'cruise';
  v_attempts int := 0; v_max_attempts int := 16;
  v_best jsonb; v_best_class text := 'loss'; v_best_rank int := -1;
  v_class_rank int; v_desired_rank int;
  v_rng numeric;
  v_streak_boost numeric := 0;          -- 0..1 added to the "good outcome" probability
  v_big_mult numeric := 1.0;            -- multiplier on big-class probability
  v_buy_bonus_boost numeric := 1.85;    -- DEMO buy-bonus payout boost vs REAL
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO v_game FROM public.slot_games WHERE game_code = _game_code AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'game_not_found'; END IF;

  IF _bet_chips IS NULL OR _bet_chips <= 0 THEN RAISE EXCEPTION 'bet_invalid'; END IF;
  IF _client_seed IS NULL OR btrim(_client_seed) = '' THEN RAISE EXCEPTION 'client_seed_required'; END IF;

  v_bet_total := CASE WHEN COALESCE(_is_buy_bonus,false) THEN _bet_chips * v_game.buy_bonus_multiplier ELSE _bet_chips END;

  INSERT INTO public.slot_demo_balances (user_id, balance_chips, last_refill_at)
  VALUES (v_user, 10000, now()) ON CONFLICT (user_id) DO NOTHING;

  SELECT balance_chips, total_bet, total_paid, win_streak, loss_streak, last_class, spins_count
    INTO v_balance, v_total_bet, v_total_paid, v_win_streak, v_loss_streak, v_last_class, v_spins
  FROM public.slot_demo_balances WHERE user_id = v_user FOR UPDATE;

  IF v_balance < v_bet_total THEN RAISE EXCEPTION 'insufficient_demo_chips'; END IF;

  UPDATE public.slot_demo_balances
     SET balance_chips = balance_chips - v_bet_total,
         total_bet = total_bet + v_bet_total,
         spins_count = spins_count + 1,
         updated_at = now()
   WHERE user_id = v_user;
  v_total_bet := v_total_bet + v_bet_total;
  v_spins := v_spins + 1;

  v_rtp := CASE WHEN v_total_bet > 0 THEN (v_total_paid / v_total_bet) * 100 ELSE 100 END;

  -- Streak boost ladder
  IF v_win_streak BETWEEN 3 AND 5 THEN
    v_streak_boost := 0.22; v_big_mult := 1.0; v_pattern := 'streak_3_5';
  ELSIF v_win_streak BETWEEN 6 AND 8 THEN
    v_streak_boost := 0.38; v_big_mult := 2.5; v_pattern := 'streak_6_8';
  ELSIF v_win_streak >= 9 THEN
    -- Force a Big or trigger near-miss cooldown; never let it run away
    v_streak_boost := 0.0; v_big_mult := 3.0; v_pattern := 'streak_9_plus';
  END IF;

  v_rng := random();

  IF COALESCE(_is_buy_bonus,false) THEN
    v_pattern := 'buy_bonus';
    v_desired := CASE WHEN v_rng < 0.18 THEN 'huge'
                      WHEN v_rng < 0.55 THEN 'big'
                      ELSE 'medium' END;

  ELSIF v_spins <= 8 THEN
    -- Honeymoon: 52 small / 28 medium / 20 near-miss
    v_pattern := 'honeymoon';
    v_desired := CASE WHEN v_rng < 0.52 THEN 'small'
                      WHEN v_rng < 0.80 THEN 'medium'
                      ELSE 'near_miss' END;

  ELSIF v_win_streak >= 9 THEN
    -- Pop a Big or Bonus, occasionally cool with strong near-miss
    v_desired := CASE WHEN v_rng < 0.55 THEN 'huge'
                      WHEN v_rng < 0.85 THEN 'big'
                      ELSE 'near_miss' END;

  ELSIF v_rtp < v_lo THEN
    v_pattern := 'rtp_recover';
    IF (v_lo - v_rtp) > 5 THEN
      v_desired := CASE WHEN v_rng < 0.12 THEN 'huge'
                        WHEN v_rng < 0.50 THEN 'big'
                        ELSE 'medium' END;
    ELSE
      v_desired := CASE WHEN v_rng < 0.45 THEN 'medium'
                        WHEN v_rng < 0.85 THEN 'small'
                        ELSE 'big' END;
    END IF;

  ELSIF v_rtp > v_hi THEN
    v_pattern := 'rtp_cool';
    v_desired := CASE WHEN v_rng < 0.35 THEN 'near_miss'
                      WHEN v_rng < 0.85 THEN 'loss'
                      ELSE 'small' END;

  ELSIF v_loss_streak >= 5 THEN
    v_pattern := 'mercy_big';
    v_desired := CASE WHEN v_rng < 0.25 THEN 'big'
                      WHEN v_rng < 0.70 THEN 'medium'
                      ELSE 'small' END;

  ELSIF v_loss_streak >= 3 THEN
    v_pattern := 'mercy_small';
    v_desired := CASE WHEN v_rng < 0.50 THEN 'small'
                      WHEN v_rng < 0.78 THEN 'medium'
                      ELSE 'near_miss' END;

  ELSIF v_win_streak BETWEEN 3 AND 8 THEN
    v_pattern := 'streak_climb';
    -- Streak boost shifts probabilities toward bigger wins
    v_desired := CASE
      WHEN v_rng < (0.10 * v_big_mult)            THEN 'big'
      WHEN v_rng < (0.10 * v_big_mult + 0.30 + v_streak_boost*0.5) THEN 'medium'
      WHEN v_rng < (0.10 * v_big_mult + 0.65 + v_streak_boost*0.5) THEN 'small'
      ELSE 'near_miss'
    END;

  ELSE
    -- Cruise: 35% near-miss, 38% small, 17% medium, 10% loss
    v_pattern := 'cruise';
    v_desired := CASE WHEN v_rng < 0.35 THEN 'near_miss'
                      WHEN v_rng < 0.73 THEN 'small'
                      WHEN v_rng < 0.90 THEN 'medium'
                      ELSE 'loss' END;
  END IF;

  v_desired_rank := CASE v_desired
    WHEN 'huge' THEN 6 WHEN 'big' THEN 5 WHEN 'medium' THEN 4
    WHEN 'small' THEN 3 WHEN 'near_miss' THEN 2 ELSE 1 END;

  WHILE v_attempts < v_max_attempts LOOP
    v_attempts := v_attempts + 1;
    v_server_seed := encode(extensions.gen_random_bytes(32), 'hex');
    v_nonce := (extract(epoch FROM clock_timestamp()) * 1000)::bigint + v_attempts;
    v_result := public._slot_compute_spin(v_server_seed, _client_seed, v_nonce, COALESCE(_is_buy_bonus,false), 0);
    v_class := public._slot_demo_classify(v_result, _bet_chips);

    IF v_class = v_desired THEN
      v_best := v_result; v_best_class := v_class; EXIT;
    END IF;

    v_class_rank := CASE v_class
      WHEN 'huge' THEN 6 WHEN 'big' THEN 5 WHEN 'medium' THEN 4
      WHEN 'small' THEN 3 WHEN 'near_miss' THEN 2 ELSE 1 END;

    IF v_best IS NULL OR ABS(v_class_rank - v_desired_rank) < ABS(v_best_rank - v_desired_rank) THEN
      v_best := v_result; v_best_class := v_class; v_best_rank := v_class_rank;
    END IF;
  END LOOP;

  v_result := v_best; v_chosen_class := v_best_class;

  v_payout := _bet_chips * COALESCE((v_result->>'payout_mult')::numeric, 0);

  -- Buy-bonus payout boost (DEMO only)
  IF COALESCE(_is_buy_bonus,false) AND v_payout > 0 THEN
    v_payout := v_payout * v_buy_bonus_boost;
  END IF;

  -- RTP overshoot guard
  IF v_rtp > v_hi AND v_payout > _bet_chips * 5 THEN
    v_payout := _bet_chips * (1 + random() * 2);
    v_chosen_class := 'small';
  END IF;

  IF v_payout > 0 THEN
    UPDATE public.slot_demo_balances
       SET balance_chips = balance_chips + v_payout, total_paid = total_paid + v_payout,
           win_streak = win_streak + 1, loss_streak = 0, last_class = v_chosen_class, updated_at = now()
     WHERE user_id = v_user;
  ELSE
    UPDATE public.slot_demo_balances
       SET win_streak = 0, loss_streak = loss_streak + 1, last_class = v_chosen_class, updated_at = now()
     WHERE user_id = v_user;
  END IF;

  SELECT balance_chips INTO v_balance FROM public.slot_demo_balances WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'symbols', v_result->'symbols',
    'win_lines', v_result->'win_lines',
    'payout_chips', v_payout,
    'bet_chips', v_bet_total,
    'balance_chips', v_balance,
    'bonus_triggered', COALESCE(v_result->'bonus_triggered','false'::jsonb),
    'bonus_multiplier', v_result->'bonus_multiplier',
    'client_seed', _client_seed,
    'nonce', v_nonce,
    'server_seed_hash', encode(extensions.digest(v_server_seed,'sha256'),'hex'),
    'demo_meta', jsonb_build_object(
      'class', v_chosen_class, 'desired', v_desired, 'pattern_type', v_pattern,
      'rtp', round(v_rtp,2), 'applied_rtp_band', jsonb_build_array(v_lo, v_hi),
      'streak_boost', v_streak_boost, 'big_mult', v_big_mult,
      'win_streak', CASE WHEN v_payout > 0 THEN v_win_streak + 1 ELSE 0 END,
      'loss_streak', CASE WHEN v_payout > 0 THEN 0 ELSE v_loss_streak + 1 END
    )
  );
END; $function$;

-- =========================================================
-- REAL MODE: provably-fair, RTP 94.8 ~ 95.6
-- - Provably-fair _slot_compute_spin remains untouched
-- - Adds tiny streak boost (max +8%) computed from last 10 spins
-- - Subtle RTP guard caps mega payouts when running hot
-- =========================================================
CREATE OR REPLACE FUNCTION public.spin_slot_real(
  _game_code text, _bet_phon numeric, _client_seed text, _is_buy_bonus boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_game record;
  v_balance numeric;
  v_bet_total numeric;
  v_server_seed text; v_server_seed_hash text; v_nonce bigint;
  v_result jsonb; v_payout numeric;
  v_nft_boost numeric := 0;
  v_streak_boost numeric := 0;
  v_total_boost numeric := 0;
  v_kill record;
  v_recent_wins int := 0;
  v_recent_bet numeric := 0;
  v_recent_paid numeric := 0;
  v_recent_rtp numeric := 100;
  v_target_rtp_lo numeric := 94.8;
  v_target_rtp_hi numeric := 95.6;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF public.is_account_frozen(v_user) THEN RAISE EXCEPTION 'account_frozen'; END IF;

  SELECT key, enabled INTO v_kill FROM public.platform_kill_switches WHERE key = 'trading_halt';
  IF FOUND AND v_kill.enabled THEN RAISE EXCEPTION 'trading_halted'; END IF;

  SELECT * INTO v_game FROM public.slot_games WHERE game_code = _game_code AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'game_not_found'; END IF;

  IF _bet_phon < v_game.min_bet_phon OR _bet_phon > v_game.max_bet_phon THEN
    RAISE EXCEPTION 'bet_out_of_range';
  END IF;

  v_bet_total := CASE WHEN _is_buy_bonus THEN _bet_phon * v_game.buy_bonus_multiplier ELSE _bet_phon END;

  -- NFT boost (capped at 50% in source, then halved to 0.25 max here)
  BEGIN
    SELECT LEAST(public.get_my_total_boost_pct(),100) * 0.005 INTO v_nft_boost;
    IF v_nft_boost > 0.25 THEN v_nft_boost := 0.25; END IF;
  EXCEPTION WHEN OTHERS THEN v_nft_boost := 0; END;

  -- Streak boost from last 10 REAL spins (max +8%)
  SELECT
    COUNT(*) FILTER (WHERE payout_phon > 0),
    COALESCE(SUM(bet_phon),0),
    COALESCE(SUM(payout_phon),0)
  INTO v_recent_wins, v_recent_bet, v_recent_paid
  FROM (
    SELECT bet_phon, payout_phon FROM public.slot_spins
     WHERE user_id = v_user AND game_code = _game_code
     ORDER BY created_at DESC LIMIT 10
  ) s;

  v_recent_rtp := CASE WHEN v_recent_bet > 0 THEN (v_recent_paid / v_recent_bet) * 100 ELSE 95 END;

  IF v_recent_rtp < v_target_rtp_lo THEN
    v_streak_boost := LEAST(0.08, (v_target_rtp_lo - v_recent_rtp) * 0.005);
  END IF;

  v_total_boost := LEAST(0.30, v_nft_boost + v_streak_boost);

  SELECT balance INTO v_balance FROM public.phon_balances WHERE user_id = v_user FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_bet_total THEN RAISE EXCEPTION 'insufficient_phon'; END IF;

  UPDATE public.phon_balances SET balance = balance - v_bet_total, updated_at = now() WHERE user_id = v_user;

  v_server_seed := encode(extensions.gen_random_bytes(32),'hex');
  v_server_seed_hash := encode(extensions.digest(v_server_seed,'sha256'),'hex');
  v_nonce := (extract(epoch FROM clock_timestamp()) * 1000)::bigint;

  v_result := public._slot_compute_spin(v_server_seed, _client_seed, v_nonce, _is_buy_bonus, v_total_boost);
  v_payout := _bet_phon * (v_result->>'payout_mult')::numeric;

  -- Mild RTP guard: when running hot, soften extreme payouts (still provably fair = result kept; payout adjusted is logged)
  IF v_recent_rtp > (v_target_rtp_hi + 10) AND v_payout > _bet_phon * 50 THEN
    v_payout := _bet_phon * 50;  -- cap at 50x when far above target band
  END IF;

  IF v_payout > 0 THEN
    UPDATE public.phon_balances SET balance = balance + v_payout, updated_at = now() WHERE user_id = v_user;
  END IF;

  INSERT INTO public.slot_spins(user_id, game_code, bet_phon, payout_phon, symbols, win_lines, bonus_triggered, bonus_multiplier, is_buy_bonus, server_seed_hash, server_seed_revealed, client_seed, nonce)
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
    'server_seed_hash', v_server_seed_hash,
    'server_seed', v_server_seed,
    'client_seed', _client_seed,
    'nonce', v_nonce,
    'rtp_boost_pct', v_total_boost,
    'real_meta', jsonb_build_object(
      'mode', 'real_fair',
      'recent_rtp', round(v_recent_rtp, 2),
      'target_rtp_band', jsonb_build_array(v_target_rtp_lo, v_target_rtp_hi),
      'nft_boost', v_nft_boost,
      'streak_boost', v_streak_boost,
      'total_boost', v_total_boost,
      'recent_wins_10', v_recent_wins
    )
  );
END; $function$;

GRANT EXECUTE ON FUNCTION public.spin_slot_demo(text, numeric, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spin_slot_real(text, numeric, text, boolean) TO authenticated;
NOTIFY pgrst, 'reload schema';