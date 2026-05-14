
-- ===== PHON 사용처 RPC =====

CREATE OR REPLACE FUNCTION public.spend_phon_for_fee_discount(_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_bal numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 1000 THEN
    RAISE EXCEPTION 'invalid_amount: 1~1000 PHON';
  END IF;
  SELECT balance INTO v_bal FROM phon_balances WHERE user_id = v_uid FOR UPDATE;
  IF COALESCE(v_bal,0) < _amount THEN RAISE EXCEPTION 'insufficient_phon'; END IF;
  UPDATE phon_balances SET balance = balance - _amount, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO phon_transactions(user_id, amount, kind, ref, meta)
    VALUES (v_uid, -_amount, 'fee_discount', 'withdraw_fee', jsonb_build_object('discount_pct',50));
  RETURN jsonb_build_object('ok',true,'spent',_amount,'discount_pct',50);
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_phon_for_booster()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_bal numeric; v_active int; v_cost numeric := 5000;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT COUNT(*) INTO v_active FROM empire_boosters WHERE user_id = v_uid AND expires_at > now();
  IF v_active > 0 THEN RAISE EXCEPTION 'booster_already_active'; END IF;
  SELECT balance INTO v_bal FROM phon_balances WHERE user_id = v_uid FOR UPDATE;
  IF COALESCE(v_bal,0) < v_cost THEN RAISE EXCEPTION 'insufficient_phon'; END IF;
  UPDATE phon_balances SET balance = balance - v_cost, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO phon_transactions(user_id, amount, kind, ref, meta)
    VALUES (v_uid, -v_cost, 'booster_purchase', 'phon_booster_24h', '{}'::jsonb);
  INSERT INTO empire_boosters(user_id, kind, fee_discount, crown_multiplier, leverage, expires_at, source)
    VALUES (v_uid, 'phon_24h', 0.30, 1.5, 7.0, now() + interval '24 hours', 'phon_purchase');
  RETURN jsonb_build_object('ok',true,'spent',v_cost,'expires_at', now() + interval '24 hours');
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_phon_for_crown_boost()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_bal numeric; v_active int; v_cost numeric := 1000;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT COUNT(*) INTO v_active FROM empire_boosters WHERE user_id = v_uid AND expires_at > now() AND kind = 'phon_crown_24h';
  IF v_active > 0 THEN RAISE EXCEPTION 'crown_boost_already_active'; END IF;
  SELECT balance INTO v_bal FROM phon_balances WHERE user_id = v_uid FOR UPDATE;
  IF COALESCE(v_bal,0) < v_cost THEN RAISE EXCEPTION 'insufficient_phon'; END IF;
  UPDATE phon_balances SET balance = balance - v_cost, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO phon_transactions(user_id, amount, kind, ref, meta)
    VALUES (v_uid, -v_cost, 'crown_boost_purchase', 'phon_crown_24h', '{}'::jsonb);
  INSERT INTO empire_boosters(user_id, kind, fee_discount, crown_multiplier, leverage, expires_at, source)
    VALUES (v_uid, 'phon_crown_24h', 0, 1.5, 1.0, now() + interval '24 hours', 'phon_purchase');
  RETURN jsonb_build_object('ok',true,'spent',v_cost,'expires_at', now() + interval '24 hours');
END;
$$;

-- ===== Dynasty 링크 RPC =====

CREATE OR REPLACE FUNCTION public.request_dynasty_link(_child_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_count int; v_token text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _child_email IS NULL OR _child_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  SELECT COUNT(*) INTO v_count FROM dynasty_links
    WHERE parent_id = v_uid AND status IN ('pending','active');
  IF v_count >= 3 THEN RAISE EXCEPTION 'max_3_children'; END IF;
  v_token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO dynasty_links(parent_id, child_email, invite_token, status)
    VALUES (v_uid, lower(_child_email), v_token, 'pending');
  RETURN jsonb_build_object('ok',true,'invite_token',v_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_dynasty_link(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_link dynasty_links%ROWTYPE;
  v_email text;
  v_kyc_ok boolean;
  v_birthdate date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT * INTO v_link FROM dynasty_links WHERE invite_token = _token AND status = 'pending' FOR UPDATE;
  IF v_link.id IS NULL THEN RAISE EXCEPTION 'invalid_or_used_token'; END IF;
  IF v_link.parent_id = v_uid THEN RAISE EXCEPTION 'cannot_accept_own_invite'; END IF;
  IF lower(v_email) <> v_link.child_email THEN RAISE EXCEPTION 'email_mismatch'; END IF;
  -- KYC + 성인 확인 (profiles.kyc_verified + birthdate)
  SELECT (kyc_verified IS TRUE), birthdate INTO v_kyc_ok, v_birthdate
    FROM profiles WHERE user_id = v_uid;
  IF v_kyc_ok IS NOT TRUE THEN RAISE EXCEPTION 'kyc_required'; END IF;
  IF v_birthdate IS NULL OR (now()::date - v_birthdate) < 19*365 THEN
    RAISE EXCEPTION 'adult_required';
  END IF;
  UPDATE dynasty_links SET child_id = v_uid, status = 'active', accepted_at = now() WHERE id = v_link.id;
  RETURN jsonb_build_object('ok',true,'link_id',v_link.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_dynasty_link(_link_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_link dynasty_links%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT * INTO v_link FROM dynasty_links WHERE id = _link_id FOR UPDATE;
  IF v_link.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_link.parent_id <> v_uid AND v_link.child_id <> v_uid THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE dynasty_links SET status = 'revoked', revoked_at = now() WHERE id = _link_id;
  RETURN jsonb_build_object('ok',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_dynasty_links()
RETURNS TABLE(id uuid, role text, parent_id uuid, child_id uuid, child_email text, status text, created_at timestamptz, accepted_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id,
    CASE WHEN parent_id = auth.uid() THEN 'parent' ELSE 'child' END,
    parent_id, child_id, child_email, status, created_at, accepted_at
  FROM dynasty_links
  WHERE (parent_id = auth.uid() OR child_id = auth.uid())
    AND status IN ('pending','active')
  ORDER BY created_at DESC;
$$;
