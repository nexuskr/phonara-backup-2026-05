
-- 1) Tracking columns on slot_demo_balances
ALTER TABLE public.slot_demo_balances
  ADD COLUMN IF NOT EXISTS total_bet numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS win_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loss_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_class text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS spins_count int NOT NULL DEFAULT 0;

-- 2) Classify a spin result into demo-friendly buckets
CREATE OR REPLACE FUNCTION public._slot_demo_classify(_result jsonb, _bet numeric)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_mult numeric := COALESCE((_result->>'payout_mult')::numeric, 0);
  v_symbols jsonb := _result->'symbols';
  v_paylines int[][] := ARRAY[
    ARRAY[1,1,1,1,1], ARRAY[0,0,0,0,0], ARRAY[2,2,2,2,2],
    ARRAY[0,1,2,1,0], ARRAY[2,1,0,1,2],
    ARRAY[0,0,1,2,2], ARRAY[2,2,1,0,0],
    ARRAY[1,0,1,2,1], ARRAY[1,2,1,0,1],
    ARRAY[0,1,1,1,0], ARRAY[2,1,1,1,2]
  ];
  v_first int; v_match int; v_count int;
  i int; k int; cell int;
BEGIN
  -- Win buckets
  IF v_mult >= 50  THEN RETURN 'huge';   END IF;
  IF v_mult >= 10  THEN RETURN 'big';    END IF;
  IF v_mult >  2   THEN RETURN 'medium'; END IF;
  IF v_mult >  0   THEN RETURN 'small';  END IF;

  -- LOSS: detect near-miss = 4 matching premium symbols (idx 5-9) in a row on any payline
  FOR i IN 1..array_length(v_paylines, 1) LOOP
    v_first := ((v_symbols->(v_paylines[i][1]))->>0)::int;
    IF v_first < 5 OR v_first = 10 THEN CONTINUE; END IF;
    v_match := v_first;
    v_count := 1;
    FOR k IN 2..5 LOOP
      cell := ((v_symbols->(v_paylines[i][k]))->>(k-1))::int;
      IF cell = v_match THEN
        v_count := v_count + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
    IF v_count >= 4 THEN RETURN 'near_miss'; END IF;
  END LOOP;

  RETURN 'loss';
END;
$$;

GRANT EXECUTE ON FUNCTION public._slot_demo_classify(jsonb, numeric) TO authenticated, service_role;

-- 3) Replace spin_slot_demo with hook-engine
CREATE OR REPLACE FUNCTION public.spin_slot_demo(
  _game_code text,
  _bet_chips numeric,
  _client_seed text,
  _is_buy_bonus boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
  -- player state
  v_total_bet numeric;
  v_total_paid numeric;
  v_win_streak int;
  v_loss_streak int;
  v_last_class text;
  v_spins int;
  v_rtp numeric;
  -- decision
  v_target_rtp_lo numeric := 99.0;
  v_target_rtp_hi numeric := 100.5;
  v_desired text;
  v_attempts int := 0;
  v_max_attempts int := 14;
  v_best jsonb;
  v_best_class text := 'loss';
  v_best_rank int := -1;
  v_class_rank int;
  v_desired_rank int;
  v_rng numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO v_game FROM public.slot_games
   WHERE game_code = _game_code AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'game_not_found'; END IF;

  IF _bet_chips IS NULL OR _bet_chips <= 0 THEN RAISE EXCEPTION 'bet_invalid'; END IF;
  IF _client_seed IS NULL OR btrim(_client_seed) = '' THEN RAISE EXCEPTION 'client_seed_required'; END IF;

  v_bet_total := CASE
    WHEN COALESCE(_is_buy_bonus, false) THEN _bet_chips * v_game.buy_bonus_multiplier
    ELSE _bet_chips
  END;

  INSERT INTO public.slot_demo_balances (user_id, balance_chips, last_refill_at)
  VALUES (v_user, 10000, now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance_chips, total_bet, total_paid, win_streak, loss_streak, last_class, spins_count
    INTO v_balance, v_total_bet, v_total_paid, v_win_streak, v_loss_streak, v_last_class, v_spins
  FROM public.slot_demo_balances
  WHERE user_id = v_user
  FOR UPDATE;

  IF v_balance < v_bet_total THEN RAISE EXCEPTION 'insufficient_demo_chips'; END IF;

  -- Debit
  UPDATE public.slot_demo_balances
     SET balance_chips = balance_chips - v_bet_total,
         total_bet = total_bet + v_bet_total,
         spins_count = spins_count + 1,
         updated_at = now()
   WHERE user_id = v_user;
  v_total_bet := v_total_bet + v_bet_total;
  v_spins := v_spins + 1;

  -- Current RTP (after this debit, before payout)
  v_rtp := CASE WHEN v_total_bet > 0 THEN (v_total_paid / v_total_bet) * 100 ELSE 100 END;

  -- =================== HOOK STRATEGY ===================
  -- Decide desired outcome class
  v_rng := random();

  IF COALESCE(_is_buy_bonus, false) THEN
    -- Buy-bonus: always at least medium
    v_desired := CASE WHEN v_rng < 0.15 THEN 'huge'
                      WHEN v_rng < 0.45 THEN 'big'
                      ELSE 'medium' END;

  ELSIF v_spins <= 3 THEN
    -- First impression: 60% small win, 25% medium, 15% near-miss
    v_desired := CASE WHEN v_rng < 0.60 THEN 'small'
                      WHEN v_rng < 0.85 THEN 'medium'
                      ELSE 'near_miss' END;

  ELSIF v_rtp < v_target_rtp_lo THEN
    -- Behind RTP target → push wins
    IF v_total_bet > 0 AND (v_target_rtp_lo - v_rtp) > 5 THEN
      v_desired := CASE WHEN v_rng < 0.10 THEN 'huge'
                        WHEN v_rng < 0.45 THEN 'big'
                        ELSE 'medium' END;
    ELSE
      v_desired := CASE WHEN v_rng < 0.50 THEN 'small'
                        WHEN v_rng < 0.85 THEN 'medium'
                        ELSE 'big' END;
    END IF;

  ELSIF v_rtp > v_target_rtp_hi THEN
    -- Ahead of RTP target → suppress wins, lean on near-miss
    v_desired := CASE WHEN v_rng < 0.45 THEN 'near_miss'
                      WHEN v_rng < 0.85 THEN 'loss'
                      ELSE 'small' END;

  ELSIF v_loss_streak >= 5 THEN
    -- Long dry spell → mercy big win
    v_desired := CASE WHEN v_rng < 0.20 THEN 'big'
                      WHEN v_rng < 0.65 THEN 'medium'
                      ELSE 'small' END;

  ELSIF v_loss_streak >= 3 THEN
    -- Drying up → small/medium win or near-miss to keep them hooked
    v_desired := CASE WHEN v_rng < 0.45 THEN 'small'
                      WHEN v_rng < 0.70 THEN 'medium'
                      ELSE 'near_miss' END;

  ELSIF v_win_streak >= 4 THEN
    -- On a hot streak → escalate to big or cool with near-miss
    v_desired := CASE WHEN v_rng < 0.20 THEN 'big'
                      WHEN v_rng < 0.50 THEN 'near_miss'
                      ELSE 'loss' END;

  ELSIF v_win_streak >= 2 THEN
    -- Building momentum → small→medium ladder
    v_desired := CASE WHEN v_rng < 0.45 THEN 'medium'
                      WHEN v_rng < 0.75 THEN 'small'
                      ELSE 'near_miss' END;

  ELSE
    -- Steady cruise: 40% near-miss, 35% small win, 15% medium, 10% loss
    v_desired := CASE WHEN v_rng < 0.40 THEN 'near_miss'
                      WHEN v_rng < 0.75 THEN 'small'
                      WHEN v_rng < 0.90 THEN 'medium'
                      ELSE 'loss' END;
  END IF;

  -- Class rank for "good enough" fallback (higher = better outcome)
  v_desired_rank := CASE v_desired
    WHEN 'huge' THEN 6 WHEN 'big' THEN 5 WHEN 'medium' THEN 4
    WHEN 'small' THEN 3 WHEN 'near_miss' THEN 2 ELSE 1 END;

  -- =================== SAMPLE & PICK ===================
  -- Roll up to N candidates, accept first one matching desired class.
  -- Otherwise keep the closest-rank candidate.
  WHILE v_attempts < v_max_attempts LOOP
    v_attempts := v_attempts + 1;
    v_server_seed := encode(extensions.gen_random_bytes(32), 'hex');
    v_nonce := (extract(epoch FROM clock_timestamp()) * 1000)::bigint + v_attempts;
    v_result := public._slot_compute_spin(v_server_seed, _client_seed, v_nonce, COALESCE(_is_buy_bonus, false), 0);
    v_class := public._slot_demo_classify(v_result, _bet_chips);

    IF v_class = v_desired THEN
      v_best := v_result;
      v_best_class := v_class;
      EXIT;
    END IF;

    v_class_rank := CASE v_class
      WHEN 'huge' THEN 6 WHEN 'big' THEN 5 WHEN 'medium' THEN 4
      WHEN 'small' THEN 3 WHEN 'near_miss' THEN 2 ELSE 1 END;

    -- Track closest match (prefer same direction; small over loss when desiring small+)
    IF v_best IS NULL
       OR ABS(v_class_rank - v_desired_rank) < ABS(v_best_rank - v_desired_rank) THEN
      v_best := v_result;
      v_best_class := v_class;
      v_best_rank := v_class_rank;
    END IF;
  END LOOP;

  v_result := v_best;
  v_chosen_class := v_best_class;

  -- Cap mega payouts when ahead of RTP to keep bankroll alive
  v_payout := _bet_chips * COALESCE((v_result->>'payout_mult')::numeric, 0);
  IF v_rtp > v_target_rtp_hi AND v_payout > _bet_chips * 5 THEN
    v_payout := _bet_chips * (1 + random() * 2); -- soften to 1x-3x
    v_chosen_class := 'small';
  END IF;

  -- Credit + update streaks
  IF v_payout > 0 THEN
    UPDATE public.slot_demo_balances
       SET balance_chips = balance_chips + v_payout,
           total_paid = total_paid + v_payout,
           win_streak = win_streak + 1,
           loss_streak = 0,
           last_class = v_chosen_class,
           updated_at = now()
     WHERE user_id = v_user;
  ELSE
    UPDATE public.slot_demo_balances
       SET win_streak = 0,
           loss_streak = loss_streak + 1,
           last_class = v_chosen_class,
           updated_at = now()
     WHERE user_id = v_user;
  END IF;

  SELECT balance_chips INTO v_balance
  FROM public.slot_demo_balances WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'symbols', v_result->'symbols',
    'win_lines', v_result->'win_lines',
    'payout_chips', v_payout,
    'bet_chips', v_bet_total,
    'balance_chips', v_balance,
    'bonus_triggered', COALESCE(v_result->'bonus_triggered', 'false'::jsonb),
    'bonus_multiplier', v_result->'bonus_multiplier',
    'client_seed', _client_seed,
    'nonce', v_nonce,
    'server_seed_hash', encode(extensions.digest(v_server_seed, 'sha256'), 'hex'),
    'demo_meta', jsonb_build_object(
      'class', v_chosen_class,
      'desired', v_desired,
      'rtp', round(v_rtp, 2),
      'win_streak', CASE WHEN v_payout > 0 THEN v_win_streak + 1 ELSE 0 END,
      'loss_streak', CASE WHEN v_payout > 0 THEN 0 ELSE v_loss_streak + 1 END
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.spin_slot_demo(text, numeric, text, boolean) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
