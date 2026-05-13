-- ============================================
-- #4: Phonara Pay (USDT TRC20 → PHON)
-- ============================================

-- 1) phon_balances
CREATE TABLE IF NOT EXISTS public.phon_balances (
  user_id uuid PRIMARY KEY,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phon_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phon_bal_select_own"
ON public.phon_balances FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "phon_bal_admin_all"
ON public.phon_balances FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) phon_transactions
CREATE TABLE IF NOT EXISTS public.phon_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  kind text NOT NULL CHECK (kind IN ('deposit_usdt','first_deposit_godmode','war_prize','referral','admin_adjust','spend','buyback')),
  ref text NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phon_tx_user ON public.phon_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phon_tx_ref ON public.phon_transactions(ref) WHERE ref IS NOT NULL;

ALTER TABLE public.phon_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phon_tx_select_own"
ON public.phon_transactions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "phon_tx_admin_all"
ON public.phon_transactions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) crypto_deposit_intents
CREATE TABLE IF NOT EXISTS public.crypto_deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  network text NOT NULL DEFAULT 'tron' CHECK (network IN ('tron')),
  asset text NOT NULL DEFAULT 'usdt',
  receive_address text NOT NULL,
  requested_amount numeric NOT NULL CHECK (requested_amount > 0),
  unique_amount numeric NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','filled','expired','canceled')),
  matched_tx_hash text NULL,
  matched_from_addr text NULL,
  matched_at timestamptz NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdi_user ON public.crypto_deposit_intents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdi_pending ON public.crypto_deposit_intents(status, expires_at) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS uq_cdi_tx_hash ON public.crypto_deposit_intents(matched_tx_hash) WHERE matched_tx_hash IS NOT NULL;

ALTER TABLE public.crypto_deposit_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cdi_select_own"
ON public.crypto_deposit_intents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "cdi_admin_all"
ON public.crypto_deposit_intents FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) RPC: create_crypto_deposit_intent
CREATE OR REPLACE FUNCTION public.create_crypto_deposit_intent(_amount numeric, _receive_address text)
RETURNS public.crypto_deposit_intents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing public.crypto_deposit_intents;
  v_row public.crypto_deposit_intents;
  v_unique numeric;
  v_attempt int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF _amount IS NULL OR _amount < 1 OR _amount > 10000 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF _receive_address IS NULL OR length(_receive_address) < 30 THEN
    RAISE EXCEPTION 'invalid_address';
  END IF;

  -- 같은 사용자의 같은 base amount pending 재사용
  SELECT * INTO v_existing FROM public.crypto_deposit_intents
  WHERE user_id = v_uid
    AND requested_amount = _amount
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- unique_amount 충돌 회피 (최대 8회)
  LOOP
    v_attempt := v_attempt + 1;
    -- 0.0001~0.9999 4자리 랜덤
    v_unique := _amount + (floor(random() * 9999) + 1) / 10000.0;

    BEGIN
      INSERT INTO public.crypto_deposit_intents(
        user_id, receive_address, requested_amount, unique_amount, expires_at
      ) VALUES (
        v_uid, _receive_address, _amount, v_unique, now() + interval '30 minutes'
      ) RETURNING * INTO v_row;
      RETURN v_row;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 8 THEN RAISE; END IF;
    END;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.create_crypto_deposit_intent(numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_crypto_deposit_intent(numeric, text) TO authenticated;

-- 5) RPC: credit_crypto_deposit (service_role/admin only)
CREATE OR REPLACE FUNCTION public.credit_crypto_deposit(
  _tx_hash text,
  _amount numeric,
  _from_addr text,
  _to_addr text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent public.crypto_deposit_intents;
  v_phon numeric;
  v_caller_uid uuid := auth.uid();
BEGIN
  -- service_role(auth.uid()=NULL) 또는 admin만
  IF v_caller_uid IS NOT NULL AND NOT public.has_role(v_caller_uid, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _tx_hash IS NULL OR length(_tx_hash) < 8 THEN
    RAISE EXCEPTION 'invalid_tx_hash';
  END IF;

  -- 중복 처리 방지
  IF EXISTS (SELECT 1 FROM public.crypto_deposit_intents WHERE matched_tx_hash = _tx_hash) THEN
    RETURN jsonb_build_object('status','duplicate','tx_hash',_tx_hash);
  END IF;

  -- 정확 매칭 (소수 4자리)
  SELECT * INTO v_intent FROM public.crypto_deposit_intents
  WHERE status = 'pending'
    AND expires_at > now()
    AND round(unique_amount, 4) = round(_amount, 4)
    AND lower(receive_address) = lower(_to_addr)
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_intent.id IS NULL THEN
    RETURN jsonb_build_object('status','no_match','amount',_amount);
  END IF;

  UPDATE public.crypto_deposit_intents
  SET status = 'filled',
      matched_tx_hash = _tx_hash,
      matched_from_addr = _from_addr,
      matched_at = now()
  WHERE id = v_intent.id;

  -- 1 USDT = 1,300 PHON
  v_phon := round(v_intent.unique_amount * 1300);

  -- PHON 잔액 upsert
  INSERT INTO public.phon_balances(user_id, balance, updated_at)
  VALUES (v_intent.user_id, v_phon, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = phon_balances.balance + EXCLUDED.balance,
        updated_at = now();

  -- 트랜잭션 원장
  INSERT INTO public.phon_transactions(user_id, amount, kind, ref, meta)
  VALUES (
    v_intent.user_id, v_phon, 'deposit_usdt', _tx_hash,
    jsonb_build_object(
      'usdt', v_intent.unique_amount,
      'from', _from_addr,
      'to', _to_addr,
      'intent_id', v_intent.id
    )
  );

  RETURN jsonb_build_object(
    'status','credited',
    'user_id', v_intent.user_id,
    'usdt', v_intent.unique_amount,
    'phon', v_phon,
    'intent_id', v_intent.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_crypto_deposit(text, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_crypto_deposit(text, numeric, text, text) TO service_role;

-- 6) RPC: get_phon_balance
CREATE OR REPLACE FUNCTION public.get_phon_balance()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT balance FROM public.phon_balances WHERE user_id = auth.uid()), 0);
$$;

REVOKE ALL ON FUNCTION public.get_phon_balance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_phon_balance() TO authenticated;

-- 7) RPC: get_my_pending_deposits
CREATE OR REPLACE FUNCTION public.get_my_pending_deposits()
RETURNS SETOF public.crypto_deposit_intents
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.crypto_deposit_intents
  WHERE user_id = auth.uid() AND status = 'pending' AND expires_at > now()
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_pending_deposits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_pending_deposits() TO authenticated;

-- 8) Realtime: 사용자가 매칭 즉시 알림받도록
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_deposit_intents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.phon_balances;
