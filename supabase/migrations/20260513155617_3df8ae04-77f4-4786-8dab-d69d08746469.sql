-- ============================================
-- #2: 3-Minute Cash Loop + First Deposit God Mode
-- ============================================

-- 1) cash_loop_sessions: 익명/로그인 모두 가능
CREATE TABLE IF NOT EXISTS public.cash_loop_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  session_token text NOT NULL UNIQUE,
  phase text NOT NULL DEFAULT 'welcome' CHECK (phase IN ('welcome','sim_win','deposit_prompt','converted','expired')),
  sim_balance numeric NOT NULL DEFAULT 3000,
  sim_pnl numeric NOT NULL DEFAULT 0,
  is_simulated boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  converted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_loop_sessions_user ON public.cash_loop_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_loop_sessions_token ON public.cash_loop_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_cash_loop_sessions_phase ON public.cash_loop_sessions(phase, started_at DESC);

ALTER TABLE public.cash_loop_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cls_select_own"
ON public.cash_loop_sessions FOR SELECT
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR user_id IS NULL
);

CREATE POLICY "cls_admin_all"
ON public.cash_loop_sessions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) first_deposit_godmode: 1유저 1회 한정
CREATE TABLE IF NOT EXISTS public.first_deposit_godmode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  deposit_amount_krw numeric NOT NULL,
  bonus_krw numeric NOT NULL,
  phon_credited numeric NOT NULL DEFAULT 0,
  founding_avatar_tier int NOT NULL DEFAULT 1,
  loss_protection_until timestamptz NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_godmode_user ON public.first_deposit_godmode(user_id);

ALTER TABLE public.first_deposit_godmode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "godmode_select_own"
ON public.first_deposit_godmode FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "godmode_admin_all"
ON public.first_deposit_godmode FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION public._cls_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_cls_touch ON public.cash_loop_sessions;
CREATE TRIGGER trg_cls_touch
BEFORE UPDATE ON public.cash_loop_sessions
FOR EACH ROW EXECUTE FUNCTION public._cls_touch();

-- 4) RPC: start_cash_loop_session
CREATE OR REPLACE FUNCTION public.start_cash_loop_session(_token text)
RETURNS public.cash_loop_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.cash_loop_sessions;
BEGIN
  IF _token IS NULL OR length(_token) < 8 THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  -- 동일 토큰 24h 재사용
  SELECT * INTO v_row FROM public.cash_loop_sessions
  WHERE session_token = _token AND started_at > now() - interval '24 hours'
  LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    -- 로그인된 경우 user_id 동기화
    IF v_uid IS NOT NULL AND v_row.user_id IS NULL THEN
      UPDATE public.cash_loop_sessions SET user_id = v_uid WHERE id = v_row.id
      RETURNING * INTO v_row;
    END IF;
    RETURN v_row;
  END IF;

  INSERT INTO public.cash_loop_sessions(user_id, session_token, phase, sim_balance, is_simulated)
  VALUES (v_uid, _token, 'welcome', 3000, true)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.start_cash_loop_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_cash_loop_session(text) TO anon, authenticated;

-- 5) RPC: advance_cash_loop_phase
CREATE OR REPLACE FUNCTION public.advance_cash_loop_phase(_token text, _phase text, _sim_pnl numeric DEFAULT NULL)
RETURNS public.cash_loop_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.cash_loop_sessions;
BEGIN
  IF _phase NOT IN ('welcome','sim_win','deposit_prompt','converted','expired') THEN
    RAISE EXCEPTION 'invalid_phase';
  END IF;

  UPDATE public.cash_loop_sessions
  SET phase = _phase,
      sim_pnl = COALESCE(_sim_pnl, sim_pnl),
      sim_balance = CASE WHEN _sim_pnl IS NOT NULL THEN sim_balance + _sim_pnl ELSE sim_balance END,
      completed_at = CASE WHEN _phase IN ('converted','expired') THEN now() ELSE completed_at END,
      converted_at = CASE WHEN _phase = 'converted' THEN now() ELSE converted_at END
  WHERE session_token = _token
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_cash_loop_phase(text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_cash_loop_phase(text, text, numeric) TO anon, authenticated;

-- 6) RPC: claim_first_deposit_godmode
CREATE OR REPLACE FUNCTION public.claim_first_deposit_godmode(_deposit_krw numeric)
RETURNS public.first_deposit_godmode
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing public.first_deposit_godmode;
  v_row public.first_deposit_godmode;
  v_bonus numeric;
  v_phon numeric;
  v_tier int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  IF _deposit_krw IS NULL OR _deposit_krw < 50000 THEN
    RAISE EXCEPTION 'min_deposit_50000_krw';
  END IF;

  SELECT * INTO v_existing FROM public.first_deposit_godmode WHERE user_id = v_uid;
  IF v_existing.id IS NOT NULL THEN
    RAISE EXCEPTION 'already_claimed';
  END IF;

  -- +200% 보너스 (최대 ₩2,000,000 캡)
  v_bonus := LEAST(_deposit_krw * 2.0, 2000000);

  -- PHON 사전 크레딧: 입금 ₩1,000당 1,000 PHON
  v_phon := floor(_deposit_krw / 1000) * 1000;

  -- Founding Avatar tier (입금 규모 기반)
  v_tier := CASE
    WHEN _deposit_krw >= 1000000 THEN 5
    WHEN _deposit_krw >= 500000 THEN 4
    WHEN _deposit_krw >= 200000 THEN 3
    WHEN _deposit_krw >= 100000 THEN 2
    ELSE 1
  END;

  INSERT INTO public.first_deposit_godmode(
    user_id, deposit_amount_krw, bonus_krw, phon_credited,
    founding_avatar_tier, loss_protection_until, meta
  )
  VALUES (
    v_uid, _deposit_krw, v_bonus, v_phon,
    v_tier, now() + interval '7 days',
    jsonb_build_object('source','first_deposit_godmode','version','v1')
  )
  RETURNING * INTO v_row;

  -- 변환 표시 (현재 활성 세션이 있으면)
  UPDATE public.cash_loop_sessions
  SET phase = 'converted', converted_at = now(), completed_at = now()
  WHERE user_id = v_uid AND phase NOT IN ('converted','expired');

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_deposit_godmode(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_deposit_godmode(numeric) TO authenticated;

-- 7) Public read RPC: get_my_godmode_status
CREATE OR REPLACE FUNCTION public.get_my_godmode_status()
RETURNS public.first_deposit_godmode
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.first_deposit_godmode WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_godmode_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_godmode_status() TO authenticated;
