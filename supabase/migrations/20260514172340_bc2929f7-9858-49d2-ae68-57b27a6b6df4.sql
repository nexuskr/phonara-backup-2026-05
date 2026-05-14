
CREATE OR REPLACE FUNCTION public.execute_bequest(_req_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req bequest_requests%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF (auth.jwt() ->> 'aal') <> 'aal2' THEN RAISE EXCEPTION 'aal2_required'; END IF;
  SELECT * INTO v_req FROM bequest_requests WHERE id = _req_id AND parent_id = v_uid FOR UPDATE;
  IF v_req.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_req.status NOT IN ('cooldown','executable') THEN RAISE EXCEPTION 'not_pending'; END IF;
  IF now() < v_req.cooldown_until THEN RAISE EXCEPTION 'cooldown_active'; END IF;

  IF v_req.asset_kind = 'phon' THEN
    INSERT INTO phon_balances(user_id, balance) VALUES (v_req.child_id, v_req.phon_amount)
      ON CONFLICT (user_id) DO UPDATE SET balance = phon_balances.balance + EXCLUDED.balance, updated_at = now();
    INSERT INTO phon_transactions(user_id, amount, kind, ref, meta)
      VALUES (v_req.child_id, v_req.phon_amount, 'bequest_in', _req_id::text,
              jsonb_build_object('from_parent', v_req.parent_id));
  ELSIF v_req.asset_kind = 'nft' THEN
    UPDATE nft_collection
      SET user_id = v_req.child_id, source = 'bequest', bequeathed_from = v_req.parent_id, locked_for_migration = false
      WHERE id = v_req.nft_id;
  END IF;

  UPDATE bequest_requests SET status = 'executed', executed_at = now() WHERE id = _req_id;
  RETURN jsonb_build_object('ok',true,'asset_kind',v_req.asset_kind);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_bequest(_req_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req bequest_requests%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT * INTO v_req FROM bequest_requests WHERE id = _req_id AND parent_id = v_uid FOR UPDATE;
  IF v_req.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_req.status NOT IN ('cooldown','executable') THEN RAISE EXCEPTION 'not_cancellable'; END IF;

  IF v_req.asset_kind = 'phon' THEN
    UPDATE phon_balances SET balance = balance + v_req.phon_amount, updated_at = now() WHERE user_id = v_uid;
    INSERT INTO phon_transactions(user_id, amount, kind, ref, meta)
      VALUES (v_uid, v_req.phon_amount, 'bequest_in', _req_id::text || '_refund',
              jsonb_build_object('refund_from_escrow', true));
  ELSIF v_req.asset_kind = 'nft' THEN
    UPDATE nft_collection SET locked_for_migration = false WHERE id = v_req.nft_id;
  END IF;

  UPDATE bequest_requests SET status = 'cancelled', cancelled_at = now() WHERE id = _req_id;
  RETURN jsonb_build_object('ok',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_bequests()
RETURNS TABLE(id uuid, role text, parent_id uuid, child_id uuid, asset_kind text, phon_amount numeric, nft_id uuid, status text, cooldown_until timestamptz, created_at timestamptz, executed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id,
    CASE WHEN parent_id = auth.uid() THEN 'parent' ELSE 'child' END,
    parent_id, child_id, asset_kind, phon_amount, nft_id, status, cooldown_until, created_at, executed_at
  FROM bequest_requests
  WHERE parent_id = auth.uid() OR child_id = auth.uid()
  ORDER BY created_at DESC LIMIT 50;
$$;
