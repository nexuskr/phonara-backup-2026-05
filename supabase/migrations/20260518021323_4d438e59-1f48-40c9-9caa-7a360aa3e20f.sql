CREATE OR REPLACE FUNCTION public.imperial_place_phon_bet(
  p_room_id uuid, p_side text, p_amount numeric, p_idem_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
  v_house uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_room imperial_duel_rooms;
  v_bal numeric;
  v_kill boolean;
  v_existing imperial_duel_bets;
  v_new_house_bal numeric;
  v_bet_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
  IF p_side NOT IN ('left','right') THEN RAISE EXCEPTION 'invalid_side'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF p_idem_key IS NULL OR length(p_idem_key) < 8 THEN RAISE EXCEPTION 'invalid_idem_key'; END IF;

  SELECT enabled INTO v_kill FROM platform_kill_switches WHERE key='phon_betting_enabled';
  IF NOT COALESCE(v_kill,false) THEN RAISE EXCEPTION 'phon_betting_disabled'; END IF;

  -- Idempotent replay
  SELECT * INTO v_existing FROM imperial_duel_bets WHERE user_id=v_uid AND idem_key=p_idem_key;
  IF FOUND THEN
    RETURN jsonb_build_object('ok',true,'idempotent_replay',true,'bet_id',v_existing.id);
  END IF;

  SELECT * INTO v_room FROM imperial_duel_rooms WHERE id=p_room_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'room_not_found'; END IF;
  IF v_room.status <> 'open' THEN RAISE EXCEPTION 'room_not_open'; END IF;
  IF now() >= v_room.lock_at THEN RAISE EXCEPTION 'room_locked'; END IF;
  IF p_amount < v_room.min_bet THEN RAISE EXCEPTION 'amount_below_min'; END IF;
  IF p_amount > v_room.max_bet THEN RAISE EXCEPTION 'amount_above_max'; END IF;

  SELECT balance INTO v_bal FROM phon_balances WHERE user_id=v_uid FOR UPDATE;
  IF v_bal IS NULL OR v_bal < p_amount THEN RAISE EXCEPTION 'insufficient_phon'; END IF;

  -- Atomic: deduct user, credit house pot, insert bet, audit, ledger
  UPDATE phon_balances SET balance=balance-p_amount, updated_at=now() WHERE user_id=v_uid;
  UPDATE phon_balances SET balance=balance+p_amount, updated_at=now()
    WHERE user_id=v_house RETURNING balance INTO v_new_house_bal;

  INSERT INTO imperial_duel_bets(room_id,user_id,side,amount_phon,odds_at_place,idem_key)
  VALUES (p_room_id,v_uid,p_side,p_amount,2.0,p_idem_key)
  RETURNING id INTO v_bet_id;

  INSERT INTO imperial_house_ledger(room_id,kind,amount_phon,balance_after,operator_isolation_flag,meta)
  VALUES (p_room_id,'pot_in',p_amount,v_new_house_bal,true,
          jsonb_build_object('user_id',v_uid,'side',p_side,'bet_id',v_bet_id));

  INSERT INTO imperial_duel_audit(room_id,user_id,event,amount_phon,balance_before,balance_after,meta)
  VALUES (p_room_id,v_uid,'bet_placed',p_amount,v_bal,v_bal-p_amount,
          jsonb_build_object('side',p_side,'bet_id',v_bet_id,'idem_key',p_idem_key));

  RETURN jsonb_build_object('ok',true,'bet_id',v_bet_id,'balance_after',v_bal-p_amount);
END $fn$;

REVOKE ALL ON FUNCTION public.imperial_place_phon_bet(uuid,text,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imperial_place_phon_bet(uuid,text,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.imperial_cancel_duel(p_room_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
  v_house uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_room imperial_duel_rooms;
  v_bet imperial_duel_bets;
  v_new_house_bal numeric;
  v_refund_count int := 0;
BEGIN
  IF NOT has_role(v_uid,'admin'::app_role) THEN RAISE EXCEPTION 'not_admin'; END IF;
  SELECT * INTO v_room FROM imperial_duel_rooms WHERE id=p_room_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'room_not_found'; END IF;
  IF v_room.status IN ('settled','cancelled') THEN RAISE EXCEPTION 'already_finalized'; END IF;

  FOR v_bet IN SELECT * FROM imperial_duel_bets WHERE room_id=p_room_id AND status='placed' FOR UPDATE LOOP
    UPDATE phon_balances SET balance=balance+v_bet.amount_phon, updated_at=now() WHERE user_id=v_bet.user_id;
    UPDATE phon_balances SET balance=balance-v_bet.amount_phon, updated_at=now()
      WHERE user_id=v_house RETURNING balance INTO v_new_house_bal;

    UPDATE imperial_duel_bets SET status='refunded', settled_at=now(), payout_phon=v_bet.amount_phon
      WHERE id=v_bet.id;

    INSERT INTO imperial_house_ledger(room_id,kind,amount_phon,balance_after,operator_isolation_flag,meta)
    VALUES (p_room_id,'refund',v_bet.amount_phon,v_new_house_bal,true,
            jsonb_build_object('bet_id',v_bet.id,'user_id',v_bet.user_id));

    INSERT INTO imperial_duel_audit(room_id,user_id,event,amount_phon,meta)
    VALUES (p_room_id,v_bet.user_id,'refunded',v_bet.amount_phon,
            jsonb_build_object('bet_id',v_bet.id,'reason','room_cancelled'));
    v_refund_count := v_refund_count + 1;
  END LOOP;

  UPDATE imperial_duel_rooms SET status='cancelled', settle_at=now() WHERE id=p_room_id;
  INSERT INTO imperial_duel_audit(room_id,user_id,event,meta)
  VALUES (p_room_id,v_uid,'cancelled',jsonb_build_object('refunds',v_refund_count));

  RETURN jsonb_build_object('ok',true,'refunds',v_refund_count);
END $fn$;

REVOKE ALL ON FUNCTION public.imperial_cancel_duel(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imperial_cancel_duel(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.imperial_get_duel_state(p_room_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
  SELECT jsonb_build_object(
    'room', to_jsonb(r) - 'server_seed',
    'left_pot', COALESCE((SELECT SUM(amount_phon) FROM imperial_duel_bets WHERE room_id=r.id AND side='left'),0),
    'right_pot', COALESCE((SELECT SUM(amount_phon) FROM imperial_duel_bets WHERE room_id=r.id AND side='right'),0),
    'bet_count', COALESCE((SELECT COUNT(*) FROM imperial_duel_bets WHERE room_id=r.id),0),
    'my_bets', COALESCE((SELECT jsonb_agg(to_jsonb(b)) FROM imperial_duel_bets b
                          WHERE b.room_id=r.id AND b.user_id=auth.uid()),'[]'::jsonb)
  )
  FROM imperial_duel_rooms r WHERE r.id = p_room_id;
$fn$;

REVOKE ALL ON FUNCTION public.imperial_get_duel_state(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imperial_get_duel_state(uuid) TO authenticated;