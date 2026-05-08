-- ============================================================================
-- POLICY AS CODE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.policy_assertions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description text NOT NULL,
  table_name text NOT NULL,
  op text NOT NULL CHECK (op IN ('select','insert','update','delete')),
  role text NOT NULL CHECK (role IN ('anon','authenticated','service_role')),
  expected text NOT NULL CHECK (expected IN ('deny','allow')),
  test_sql text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_assertions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pa_admin_read ON public.policy_assertions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.policy_assertion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assertion_key text NOT NULL,
  passed boolean NOT NULL,
  observed text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_assertion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY par_admin_read ON public.policy_assertion_runs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_par_created ON public.policy_assertion_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_par_key ON public.policy_assertion_runs(assertion_key, created_at DESC);

-- Seed core assertions
INSERT INTO public.policy_assertions (key, description, table_name, op, role, expected, test_sql) VALUES
  ('anon_no_transactions_select', 'anon must not read transactions', 'transactions', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.transactions LIMIT 1;'),
  ('anon_no_wallet_select', 'anon must not read wallet_balances', 'wallet_balances', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.wallet_balances LIMIT 1;'),
  ('anon_no_withdrawals_select', 'anon must not read withdrawal_requests', 'withdrawal_requests', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.withdrawal_requests LIMIT 1;'),
  ('anon_no_profiles_select', 'anon must not read profiles', 'profiles', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.profiles LIMIT 1;'),
  ('anon_no_user_roles_select', 'anon must not read user_roles', 'user_roles', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.user_roles LIMIT 1;'),
  ('anon_no_security_audit', 'anon must not read security_audit_log', 'security_audit_log', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.security_audit_log LIMIT 1;'),
  ('anon_no_admin_audit', 'anon must not read admin_audit_log', 'admin_audit_log', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.admin_audit_log LIMIT 1;'),
  ('anon_no_idempotency', 'anon must not read idempotency_keys', 'idempotency_keys', 'select', 'anon', 'deny',
    'SET LOCAL ROLE anon; SELECT 1 FROM public.idempotency_keys LIMIT 1;')
ON CONFLICT (key) DO NOTHING;

-- Runner: executes each active assertion in a savepoint, expects deny=>permission_denied
CREATE OR REPLACE FUNCTION public.run_policy_assertions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  passed boolean;
  observed text;
  err text;
  total int := 0;
  pass_count int := 0;
  fail_count int := 0;
  failures jsonb := '[]'::jsonb;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role' OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR r IN SELECT * FROM public.policy_assertions WHERE active = true LOOP
    total := total + 1;
    passed := false;
    observed := NULL;
    err := NULL;
    BEGIN
      BEGIN
        EXECUTE r.test_sql;
        observed := 'allowed';
        passed := (r.expected = 'allow');
      EXCEPTION WHEN insufficient_privilege OR sqlstate '42501' THEN
        observed := 'denied';
        passed := (r.expected = 'deny');
      WHEN OTHERS THEN
        err := SQLERRM;
        observed := 'error';
        passed := false;
      END;
    END;
    -- Reset role context
    PERFORM set_config('role', '', true);

    INSERT INTO public.policy_assertion_runs(assertion_key, passed, observed, error)
    VALUES (r.key, passed, observed, err);

    IF passed THEN
      pass_count := pass_count + 1;
    ELSE
      fail_count := fail_count + 1;
      failures := failures || jsonb_build_object('key', r.key, 'expected', r.expected, 'observed', observed, 'error', err);
    END IF;
  END LOOP;

  -- Mirror to security_audit_log
  INSERT INTO public.security_audit_log(ok, source, issues, issue_count)
  VALUES (fail_count = 0, 'policy_assertions', failures, fail_count);

  RETURN jsonb_build_object('ok', fail_count = 0, 'total', total, 'passed', pass_count, 'failed', fail_count, 'failures', failures);
END;
$$;

REVOKE ALL ON FUNCTION public.run_policy_assertions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.run_policy_assertions() TO authenticated, service_role;

-- ============================================================================
-- ANOMALY DETECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.anomaly_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  rule text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  ack_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  dedupe_key text UNIQUE
);

ALTER TABLE public.anomaly_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ae_admin_read ON public.anomaly_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY ae_admin_update ON public.anomaly_events
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_ae_created ON public.anomaly_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_unack ON public.anomaly_events(acknowledged, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_user ON public.anomaly_events(user_id);

CREATE OR REPLACE FUNCTION public.detect_anomalies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted int := 0;
  cnt int;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role' OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Rule 1: 1시간 내 출금 시도 5회 이상
  WITH offenders AS (
    SELECT user_id, count(*) AS c
    FROM public.withdrawal_requests
    WHERE created_at > now() - interval '1 hour'
    GROUP BY user_id
    HAVING count(*) >= 5
  ), ins AS (
    INSERT INTO public.anomaly_events(user_id, rule, severity, evidence, dedupe_key)
    SELECT user_id, 'withdrawal_burst_1h', 'high',
      jsonb_build_object('count', c, 'window', '1h'),
      'withdrawal_burst_1h:' || user_id || ':' || to_char(now(), 'YYYY-MM-DD-HH24')
    FROM offenders
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO cnt FROM ins;
  inserted := inserted + cnt;

  -- Rule 2: 정산 직후 즉시 출금 (정산 5분 이내 출금 시도)
  WITH suspect AS (
    SELECT DISTINCT w.user_id, w.id AS withdrawal_id
    FROM public.withdrawal_requests w
    JOIN public.transactions t
      ON t.user_id = w.user_id
     AND t.kind = 'package_settle'
     AND t.created_at BETWEEN w.created_at - interval '5 minutes' AND w.created_at
    WHERE w.created_at > now() - interval '15 minutes'
  ), ins AS (
    INSERT INTO public.anomaly_events(user_id, rule, severity, evidence, dedupe_key)
    SELECT user_id, 'settle_then_withdraw', 'medium',
      jsonb_build_object('withdrawal_id', withdrawal_id),
      'settle_then_withdraw:' || withdrawal_id
    FROM suspect
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO cnt FROM ins;
  inserted := inserted + cnt;

  -- Rule 3: 1시간 내 미션 100회 초과 (봇 의심)
  WITH offenders AS (
    SELECT user_id, count(*) AS c
    FROM public.mission_history
    WHERE created_at > now() - interval '1 hour'
    GROUP BY user_id
    HAVING count(*) > 100
  ), ins AS (
    INSERT INTO public.anomaly_events(user_id, rule, severity, evidence, dedupe_key)
    SELECT user_id, 'mission_spam_1h', 'medium',
      jsonb_build_object('count', c, 'window', '1h'),
      'mission_spam_1h:' || user_id || ':' || to_char(now(), 'YYYY-MM-DD-HH24')
    FROM offenders
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO cnt FROM ins;
  inserted := inserted + cnt;

  -- Rule 4: 동일 사용자 24h 내 거부된 출금 3건 이상
  WITH offenders AS (
    SELECT user_id, count(*) AS c
    FROM public.withdrawal_requests
    WHERE status = 'rejected' AND created_at > now() - interval '24 hours'
    GROUP BY user_id
    HAVING count(*) >= 3
  ), ins AS (
    INSERT INTO public.anomaly_events(user_id, rule, severity, evidence, dedupe_key)
    SELECT user_id, 'repeated_rejected_withdrawals_24h', 'high',
      jsonb_build_object('count', c),
      'rej_wd_24h:' || user_id || ':' || to_char(now(), 'YYYY-MM-DD')
    FROM offenders
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO cnt FROM ins;
  inserted := inserted + cnt;

  RETURN jsonb_build_object('ok', true, 'inserted', inserted, 'at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.detect_anomalies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.detect_anomalies() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.acknowledge_anomaly(_id uuid, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.anomaly_events
     SET acknowledged = true,
         acknowledged_by = auth.uid(),
         acknowledged_at = now(),
         ack_note = _note
   WHERE id = _id;
  INSERT INTO public.admin_audit_log(admin_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'anomaly_acknowledge', 'anomaly_event', _id, jsonb_build_object('note', _note));
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_anomaly(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_anomaly(uuid, text) TO authenticated, service_role;

-- ============================================================================
-- CRON JOBS
-- ============================================================================

DO $$
BEGIN
  PERFORM cron.unschedule('run-policy-assertions-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'run-policy-assertions-daily',
  '30 3 * * *',
  $$ SELECT public.run_policy_assertions(); $$
);

DO $$
BEGIN
  PERFORM cron.unschedule('detect-anomalies-5min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'detect-anomalies-5min',
  '*/5 * * * *',
  $$ SELECT public.detect_anomalies(); $$
);