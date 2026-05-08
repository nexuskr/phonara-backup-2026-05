-- =========================================================
-- STEP 1 — BASE TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS viral_verification_log (
  submission_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  milestone text,
  catalog_key_redacted text,
  verification_status text NOT NULL CHECK (verification_status IN ('valid','invalid','suspect')),
  risk_score int NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  signals_initial jsonb NOT NULL,
  decided_by text NOT NULL DEFAULT 'rule',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viral_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid,
  event_type text NOT NULL,
  signals_raw jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vve_submission ON viral_verification_events(submission_id);
CREATE INDEX IF NOT EXISTS idx_vve_created    ON viral_verification_events(created_at DESC);

CREATE TABLE IF NOT EXISTS viral_settlement_log (
  submission_id uuid PRIMARY KEY,
  first_settled_at timestamptz NOT NULL DEFAULT now(),
  final_eligible boolean NOT NULL,
  final_bonus_credit bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS viral_settlement_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  event_type text NOT NULL,
  actor text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vsa_submission ON viral_settlement_audit(submission_id);

-- RLS: admin-only read across the verification core
ALTER TABLE viral_verification_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_verification_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_settlement_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_settlement_audit     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vvl_admin_read ON viral_verification_log;
CREATE POLICY vvl_admin_read ON viral_verification_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS vve_admin_read ON viral_verification_events;
CREATE POLICY vve_admin_read ON viral_verification_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS vsl_admin_read ON viral_settlement_log;
CREATE POLICY vsl_admin_read ON viral_settlement_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS vsa_admin_read ON viral_settlement_audit;
CREATE POLICY vsa_admin_read ON viral_settlement_audit
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- STEP 2 — IMMUTABILITY (v6 Fix 1)
-- =========================================================

CREATE OR REPLACE FUNCTION guard_verification_log_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'viral_verification_log is write-once immutable';
END $$;

CREATE OR REPLACE FUNCTION guard_signals_initial_shape()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  k text;
BEGIN
  IF NEW.signals_initial IS NULL OR jsonb_typeof(NEW.signals_initial) <> 'object' THEN
    RAISE EXCEPTION 'signals_initial must be a jsonb object';
  END IF;
  FOR k IN SELECT jsonb_object_keys(NEW.signals_initial) LOOP
    IF k NOT IN ('rules_fired','risk_score','model_version','decided_at') THEN
      RAISE EXCEPTION 'invalid key in signals_initial: %', k;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_vvl_immutable ON viral_verification_log;
CREATE TRIGGER trg_vvl_immutable
  BEFORE UPDATE OR DELETE ON viral_verification_log
  FOR EACH ROW EXECUTE FUNCTION guard_verification_log_immutable();

DROP TRIGGER IF EXISTS trg_vvl_insert_guard ON viral_verification_log;
CREATE TRIGGER trg_vvl_insert_guard
  BEFORE INSERT ON viral_verification_log
  FOR EACH ROW EXECUTE FUNCTION guard_signals_initial_shape();

-- =========================================================
-- STEP 3 — RULE VERIFY RPC (deterministic only)
-- =========================================================

CREATE OR REPLACE FUNCTION rule_verify_submission(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_status text := 'valid';
  v_score int := 10;
  v_rules text := 'basic';
BEGIN
  SELECT * INTO v_sub
  FROM viral_mission_submissions
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission not found: %', p_submission_id;
  END IF;

  IF v_sub.proof_hash IS NULL THEN
    v_status := 'invalid';
    v_score  := 100;
    v_rules  := 'missing_proof';
  END IF;

  INSERT INTO viral_verification_log (
    submission_id, user_id, milestone,
    verification_status, risk_score, signals_initial, decided_by
  ) VALUES (
    p_submission_id, v_sub.user_id, v_sub.milestone,
    v_status, v_score,
    jsonb_build_object(
      'rules_fired', v_rules,
      'risk_score',  v_score,
      'model_version','rule-v1',
      'decided_at',  now()
    ),
    'rule'
  )
  ON CONFLICT (submission_id) DO NOTHING;

  RETURN jsonb_build_object(
    'status', v_status,
    'risk_score', v_score,
    'submission_id', p_submission_id
  );
END $$;

REVOKE ALL ON FUNCTION rule_verify_submission(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION rule_verify_submission(uuid) TO service_role;

-- =========================================================
-- STEP 4 — AI CIRCUIT (v6 Fix 2)
-- =========================================================

CREATE TABLE IF NOT EXISTS viral_ai_circuit_state (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  state text NOT NULL DEFAULT 'closed'
    CHECK (state IN ('closed','open','half_open')),
  opened_at timestamptz,
  last_evaluated_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

INSERT INTO viral_ai_circuit_state (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE viral_ai_circuit_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vacs_admin_read ON viral_ai_circuit_state;
CREATE POLICY vacs_admin_read ON viral_ai_circuit_state
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION transition_ai_circuit(
  _new_state text,
  _reason    text,
  _meta      jsonb DEFAULT '{}'::jsonb
)
RETURNS viral_ai_circuit_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec viral_ai_circuit_state;
BEGIN
  PERFORM set_config('app.circuit_rpc', 'on', true);
  PERFORM pg_advisory_xact_lock(8821736401);

  SELECT * INTO rec FROM viral_ai_circuit_state WHERE id = 1 FOR UPDATE;

  IF NOT (
       (rec.state = 'closed'    AND _new_state = 'open')
    OR (rec.state = 'open'      AND _new_state = 'half_open')
    OR (rec.state = 'half_open' AND _new_state IN ('closed','open'))
    OR (rec.state = _new_state)
  ) THEN
    RAISE EXCEPTION 'invalid circuit transition % -> %', rec.state, _new_state;
  END IF;

  UPDATE viral_ai_circuit_state
     SET state = _new_state,
         opened_at = CASE WHEN _new_state = 'open' THEN now() ELSE opened_at END,
         last_evaluated_at = now(),
         reason = _reason
   WHERE id = 1
   RETURNING * INTO rec;

  INSERT INTO viral_verification_events (submission_id, event_type, signals_raw)
  VALUES (NULL, 'ai_circuit_transition',
          jsonb_build_object('to', _new_state, 'reason', _reason, 'meta', _meta));

  RETURN rec;
END $$;

REVOKE ALL ON FUNCTION transition_ai_circuit(text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION transition_ai_circuit(text, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION guard_circuit_write()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('app.circuit_rpc', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'direct circuit mutation forbidden — use transition_ai_circuit()';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_circuit_block ON viral_ai_circuit_state;
CREATE TRIGGER trg_circuit_block
  BEFORE INSERT OR UPDATE OR DELETE ON viral_ai_circuit_state
  FOR EACH ROW EXECUTE FUNCTION guard_circuit_write();

-- =========================================================
-- STEP 5 — AUDIT PARTITION + DUAL-WRITE (v6 Fix 3)
-- =========================================================

CREATE TABLE IF NOT EXISTS viral_settlement_audit_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  event_type text NOT NULL,
  actor text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS viral_settlement_audit_v2_2026_05
  PARTITION OF viral_settlement_audit_v2
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS viral_settlement_audit_v2_2026_06
  PARTITION OF viral_settlement_audit_v2
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

ALTER TABLE viral_settlement_audit_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vsav2_admin_read ON viral_settlement_audit_v2;
CREATE POLICY vsav2_admin_read ON viral_settlement_audit_v2
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION ensure_settlement_audit_partition(_when timestamptz DEFAULT now())
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  start_d date := date_trunc('month', _when)::date;
  end_d   date := (date_trunc('month', _when) + interval '1 month')::date;
  pname   text := format('viral_settlement_audit_v2_%s', to_char(start_d, 'YYYY_MM'));
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF viral_settlement_audit_v2 FOR VALUES FROM (%L) TO (%L)',
    pname, start_d, end_d
  );
END $$;

CREATE OR REPLACE FUNCTION audit_dualwrite()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO viral_settlement_audit_v2
    (id, submission_id, event_type, actor, details, created_at)
  VALUES
    (NEW.id, NEW.submission_id, NEW.event_type, NEW.actor, NEW.details, NEW.created_at)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_dualwrite ON viral_settlement_audit;
CREATE TRIGGER trg_audit_dualwrite
  AFTER INSERT ON viral_settlement_audit
  FOR EACH ROW EXECUTE FUNCTION audit_dualwrite();

CREATE OR REPLACE FUNCTION assert_audit_sync()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE diff int;
BEGIN
  SELECT abs(
    (SELECT count(*) FROM viral_settlement_audit) -
    (SELECT count(*) FROM viral_settlement_audit_v2)
  ) INTO diff;
  IF diff <> 0 THEN
    RAISE EXCEPTION 'audit mismatch (diff=%)', diff;
  END IF;
END $$;