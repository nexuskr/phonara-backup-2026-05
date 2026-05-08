
ALTER TABLE public.deposit_requests
  ADD COLUMN IF NOT EXISTS voucher_brand text,
  ADD COLUMN IF NOT EXISTS voucher_pin_hash text,
  ADD COLUMN IF NOT EXISTS bonus_amount bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_pct numeric NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_coin_deposits bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coin_master_unlocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_withdrawn bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.aml_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level int NOT NULL CHECK (level BETWEEN 1 AND 3),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  selfie_path text,
  doc_signed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  rejected_reason text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aml_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amlv_self_select ON public.aml_verifications;
DROP POLICY IF EXISTS amlv_self_insert ON public.aml_verifications;
DROP POLICY IF EXISTS amlv_admin_update ON public.aml_verifications;
CREATE POLICY amlv_self_select ON public.aml_verifications FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY amlv_self_insert ON public.aml_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY amlv_admin_update ON public.aml_verifications FOR UPDATE
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_amlv_user ON public.aml_verifications(user_id, level, status);

CREATE TABLE IF NOT EXISTS public.aml_risk_scores (
  user_id uuid PRIMARY KEY,
  score int NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  factors jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aml_risk_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ars_self_select ON public.aml_risk_scores;
DROP POLICY IF EXISTS ars_admin_write ON public.aml_risk_scores;
CREATE POLICY ars_self_select ON public.aml_risk_scores FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY ars_admin_write ON public.aml_risk_scores FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.deposit_bonus_pct(_method public.deposit_method)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _method::text
    WHEN 'bank' THEN 0
    WHEN 'voucher' THEN 3
    WHEN 'coin' THEN 8
    ELSE 0
  END::numeric
$$;

CREATE OR REPLACE FUNCTION public.submit_deposit(
  _amount bigint,
  _method public.deposit_method,
  _package_id text,
  _package_name text,
  _receipt_url text,
  _memo text,
  _voucher_brand text DEFAULT NULL,
  _voucher_pin text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  _uid UUID := auth.uid();
  _id UUID;
  _pct numeric;
  _bonus bigint;
  _pin_hash text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _amount <= 0 OR _amount > 100000000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  IF _method::text = 'voucher' THEN
    IF _voucher_brand IS NULL OR _voucher_brand NOT IN ('culture','happy','cultureland') THEN
      RAISE EXCEPTION 'invalid_voucher_brand';
    END IF;
    IF _voucher_pin IS NULL OR length(_voucher_pin) < 12 OR length(_voucher_pin) > 24 THEN
      RAISE EXCEPTION 'invalid_voucher_pin';
    END IF;
    _pin_hash := encode(digest(_voucher_pin || _uid::text, 'sha256'), 'hex');
  END IF;

  _pct := public.deposit_bonus_pct(_method);
  _bonus := floor(_amount * _pct / 100.0)::bigint;

  INSERT INTO public.deposit_requests(
    user_id, amount, method, package_id, package_name, receipt_url, memo,
    voucher_brand, voucher_pin_hash, bonus_amount, bonus_pct
  )
  VALUES (
    _uid, _amount, _method, _package_id, _package_name, _receipt_url, _memo,
    _voucher_brand, _pin_hash, _bonus, _pct
  )
  RETURNING id INTO _id;

  RETURN jsonb_build_object('ok',true,'id',_id,'bonus_amount',_bonus,'bonus_pct',_pct);
END $function$;

CREATE OR REPLACE FUNCTION public.admin_resolve_deposit(_request_id uuid, _action text, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  _uid UUID := auth.uid();
  _row public.deposit_requests%ROWTYPE;
  _wallet public.wallet_balances%ROWTYPE;
  _credit bigint;
BEGIN
  IF NOT public.has_role(_uid,'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _row FROM public.deposit_requests WHERE id=_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _row.status <> 'pending' THEN RAISE EXCEPTION 'invalid_state'; END IF;

  IF _action = 'approve' THEN
    _credit := _row.amount + COALESCE(_row.bonus_amount, 0);
    SELECT * INTO _wallet FROM public.wallet_balances WHERE user_id=_row.user_id FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO public.wallet_balances(user_id) VALUES (_row.user_id) RETURNING * INTO _wallet;
    END IF;
    UPDATE public.wallet_balances SET
      available_balance = available_balance + _credit,
      total_balance = total_balance + _credit,
      updated_at = now()
    WHERE user_id=_row.user_id;
    UPDATE public.deposit_requests SET status='approved', approved_at=now(), admin_id=_uid WHERE id=_request_id;
    IF _row.method::text = 'coin' THEN
      UPDATE public.profiles
        SET total_coin_deposits = total_coin_deposits + _row.amount,
            coin_master_unlocked = (total_coin_deposits + _row.amount) >= 500000
        WHERE id = _row.user_id;
    END IF;
    INSERT INTO public.transactions(user_id, kind, direction, amount, balance_after, available_after, ref_id, metadata)
      VALUES (_row.user_id,'deposit_credit','credit',_credit,
              _wallet.total_balance + _credit, _wallet.available_balance + _credit,
              _request_id::text,
              jsonb_build_object(
                'method',_row.method,
                'package_id',_row.package_id,
                'principal',_row.amount,
                'bonus',_row.bonus_amount,
                'bonus_pct',_row.bonus_pct,
                'voucher_brand',_row.voucher_brand
              ));
  ELSIF _action = 'reject' THEN
    UPDATE public.deposit_requests SET status='rejected', rejected_reason=_reason, admin_id=_uid WHERE id=_request_id;
  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;
  RETURN jsonb_build_object('ok',true,'action',_action);
END $function$;

CREATE OR REPLACE FUNCTION public.aml_required_level(_user_id uuid, _amount bigint)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _total bigint;
  _projected bigint;
  _level1_ok boolean := false;
  _level2_ok boolean := false;
  _level3_ok boolean := false;
  _required int := 1;
  _risk int := 0;
BEGIN
  SELECT COALESCE(total_withdrawn,0) INTO _total FROM public.profiles WHERE id = _user_id;
  _projected := _total + COALESCE(_amount,0);
  SELECT EXISTS(SELECT 1 FROM public.aml_verifications WHERE user_id=_user_id AND level=1 AND status='approved') INTO _level1_ok;
  SELECT EXISTS(SELECT 1 FROM public.aml_verifications WHERE user_id=_user_id AND level=2 AND status='approved') INTO _level2_ok;
  SELECT EXISTS(SELECT 1 FROM public.aml_verifications WHERE user_id=_user_id AND level=3 AND status='approved') INTO _level3_ok;
  SELECT COALESCE(score,0) INTO _risk FROM public.aml_risk_scores WHERE user_id=_user_id;

  IF _projected >= 10000000 THEN _required := 3;
  ELSIF _projected >= 1000000 THEN _required := 2;
  ELSE _required := 1;
  END IF;
  IF _risk >= 70 AND _required < 2 THEN _required := 2; END IF;

  RETURN jsonb_build_object(
    'required_level', _required,
    'projected_total', _projected,
    'risk_score', _risk,
    'level1_ok', _level1_ok,
    'level2_ok', _level2_ok,
    'level3_ok', _level3_ok,
    'gate_passed', CASE
      WHEN _required = 1 THEN true
      WHEN _required = 2 THEN _level2_ok
      WHEN _required = 3 THEN _level3_ok
      ELSE false
    END
  );
END $$;

REVOKE ALL ON FUNCTION public.aml_required_level(uuid,bigint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.aml_required_level(uuid,bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.deposit_bonus_pct(public.deposit_method) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.deposit_bonus_pct(public.deposit_method) TO authenticated;
