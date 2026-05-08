
-- ============================================================
-- A. ACCOUNT FREEZE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.account_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'system', -- 'system' | 'admin'
  severity text NOT NULL DEFAULT 'high',
  frozen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  released_at timestamptz,
  released_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS af_active_idx ON public.account_freezes (user_id) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS af_expires_idx ON public.account_freezes (expires_at) WHERE released_at IS NULL;

ALTER TABLE public.account_freezes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS af_self_select ON public.account_freezes;
CREATE POLICY af_self_select ON public.account_freezes
  FOR SELECT TO public
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS af_admin_write ON public.account_freezes;
CREATE POLICY af_admin_write ON public.account_freezes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Helper: is user currently frozen
CREATE OR REPLACE FUNCTION public.is_account_frozen(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_freezes
    WHERE user_id = _user_id
      AND released_at IS NULL
      AND expires_at > now()
  );
$$;
REVOKE ALL ON FUNCTION public.is_account_frozen(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_frozen(uuid) TO authenticated, service_role;

-- Trigger: block withdrawal when frozen
CREATE OR REPLACE FUNCTION public.block_withdrawal_when_frozen()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_account_frozen(NEW.user_id) THEN
    RAISE EXCEPTION 'account_frozen: withdrawals are temporarily disabled for this account'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_block_withdrawal_when_frozen ON public.withdrawal_requests;
CREATE TRIGGER trg_block_withdrawal_when_frozen
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.block_withdrawal_when_frozen();

-- Auto freeze: scan unack high/critical anomalies and freeze 24h
CREATE OR REPLACE FUNCTION public.auto_freeze_critical_anomalies()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  frozen int := 0;
BEGIN
  WITH targets AS (
    SELECT DISTINCT a.user_id, a.rule, a.severity
    FROM public.anomaly_events a
    WHERE a.user_id IS NOT NULL
      AND a.acknowledged = false
      AND a.severity IN ('high','critical')
      AND a.created_at > now() - interval '15 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.account_freezes f
        WHERE f.user_id = a.user_id AND f.released_at IS NULL AND f.expires_at > now()
      )
  ), ins AS (
    INSERT INTO public.account_freezes(user_id, reason, source, severity, expires_at, metadata)
    SELECT user_id,
           'auto:' || rule,
           'system',
           severity,
           now() + interval '24 hours',
           jsonb_build_object('rule', rule)
    FROM targets
    RETURNING 1
  )
  SELECT count(*) INTO frozen FROM ins;
  RETURN jsonb_build_object('ok', true, 'frozen', frozen, 'at', now());
END;
$$;
REVOKE ALL ON FUNCTION public.auto_freeze_critical_anomalies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_freeze_critical_anomalies() TO service_role;

-- Auto unfreeze expired
CREATE OR REPLACE FUNCTION public.unfreeze_expired()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE released int := 0;
BEGIN
  WITH upd AS (
    UPDATE public.account_freezes
    SET released_at = now()
    WHERE released_at IS NULL AND expires_at <= now()
    RETURNING 1
  )
  SELECT count(*) INTO released FROM upd;
  RETURN jsonb_build_object('ok', true, 'released', released);
END;
$$;
REVOKE ALL ON FUNCTION public.unfreeze_expired() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unfreeze_expired() TO service_role;

-- Schedule
DO $$ DECLARE jid int;
BEGIN
  FOR jid IN SELECT jobid FROM cron.job WHERE jobname IN ('phonara-auto-freeze','phonara-unfreeze-expired') LOOP
    PERFORM cron.unschedule(jid);
  END LOOP;
  PERFORM cron.schedule('phonara-auto-freeze', '*/5 * * * *',
    $cron$ SELECT public.auto_freeze_critical_anomalies(); $cron$);
  PERFORM cron.schedule('phonara-unfreeze-expired', '7 * * * *',
    $cron$ SELECT public.unfreeze_expired(); $cron$);
END $$;

-- ============================================================
-- C. WEBHOOKS + 90d HEATMAP
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  secret text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['anomaly','slo_breach','freeze'],
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_delivered_at timestamptz,
  last_status integer
);
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ws_admin_all ON public.webhook_subscriptions;
CREATE POLICY ws_admin_all ON public.webhook_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  http_status integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wd_sub_idx ON public.webhook_deliveries (subscription_id, created_at DESC);
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wd_admin_read ON public.webhook_deliveries;
CREATE POLICY wd_admin_read ON public.webhook_deliveries
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 90 day uptime heatmap (daily success rate)
CREATE OR REPLACE FUNCTION public.public_uptime_heatmap_90d()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH days AS (
    SELECT generate_series(date_trunc('day', now() - interval '89 days'),
                           date_trunc('day', now()),
                           interval '1 day')::date AS d
  ),
  agg AS (
    SELECT date_trunc('day', checked_at)::date AS d,
           count(*) AS total,
           count(*) FILTER (WHERE ok) AS ok_cnt
    FROM public.uptime_pings
    WHERE checked_at >= now() - interval '90 days'
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'days', coalesce(jsonb_agg(jsonb_build_object(
      'date', to_char(d.d, 'YYYY-MM-DD'),
      'samples', coalesce(a.total, 0),
      'success_rate', CASE WHEN coalesce(a.total,0) = 0 THEN NULL
                           ELSE round(100.0 * a.ok_cnt::numeric / a.total, 2) END
    ) ORDER BY d.d), '[]'::jsonb),
    'generated_at', now()
  )
  FROM days d LEFT JOIN agg a ON a.d = d.d;
$$;
REVOKE ALL ON FUNCTION public.public_uptime_heatmap_90d() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_uptime_heatmap_90d() TO anon, authenticated;

-- ============================================================
-- D. OBSERVABILITY (spans)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.spans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL,
  parent_span_id uuid,
  op text NOT NULL,
  status text NOT NULL DEFAULT 'ok', -- 'ok' | 'error'
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_ms integer NOT NULL,
  user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS spans_trace_idx ON public.spans (trace_id, started_at);
CREATE INDEX IF NOT EXISTS spans_op_dur_idx ON public.spans (op, duration_ms DESC);
CREATE INDEX IF NOT EXISTS spans_created_idx ON public.spans (created_at DESC);

ALTER TABLE public.spans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spans_admin_read ON public.spans;
CREATE POLICY spans_admin_read ON public.spans
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.record_span(
  _trace_id uuid, _parent uuid, _op text, _status text,
  _started_at timestamptz, _ended_at timestamptz, _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_id uuid;
  uid uuid := auth.uid();
BEGIN
  INSERT INTO public.spans(trace_id, parent_span_id, op, status, started_at, ended_at, duration_ms, user_id, metadata)
  VALUES (_trace_id, _parent, _op, coalesce(_status, 'ok'),
          _started_at, _ended_at,
          GREATEST(0, EXTRACT(EPOCH FROM (_ended_at - _started_at))::int * 1000),
          uid, coalesce(_metadata, '{}'::jsonb))
  RETURNING id INTO new_id;
  -- retention 7d
  DELETE FROM public.spans WHERE created_at < now() - interval '7 days';
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_span(uuid,uuid,text,text,timestamptz,timestamptz,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_span(uuid,uuid,text,text,timestamptz,timestamptz,jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.slow_requests_top(_limit int DEFAULT 20)
RETURNS TABLE(op text, p95_ms numeric, avg_ms numeric, max_ms integer, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT op,
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric AS p95_ms,
         avg(duration_ms)::numeric AS avg_ms,
         max(duration_ms) AS max_ms,
         count(*) AS count
  FROM public.spans
  WHERE created_at > now() - interval '24 hours'
  GROUP BY op
  ORDER BY p95_ms DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;
REVOKE ALL ON FUNCTION public.slow_requests_top(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.slow_requests_top(int) TO authenticated;

-- ============================================================
-- E. CHAOS RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chaos_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  total_probes integer NOT NULL,
  passed integer NOT NULL,
  failed integer NOT NULL,
  duration_ms integer,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'manual'
);
CREATE INDEX IF NOT EXISTS cr_ran_idx ON public.chaos_runs (ran_at DESC);
ALTER TABLE public.chaos_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cr_admin_read ON public.chaos_runs;
CREATE POLICY cr_admin_read ON public.chaos_runs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.record_chaos_run(
  _total int, _passed int, _failed int, _duration_ms int,
  _results jsonb, _source text DEFAULT 'manual'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.chaos_runs(total_probes, passed, failed, duration_ms, results, source)
  VALUES (_total, _passed, _failed, _duration_ms, coalesce(_results, '[]'::jsonb), coalesce(_source,'manual'))
  RETURNING id INTO new_id;
  DELETE FROM public.chaos_runs WHERE ran_at < now() - interval '180 days';
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_chaos_run(int,int,int,int,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_chaos_run(int,int,int,int,jsonb,text) TO service_role;

CREATE OR REPLACE FUNCTION public.latest_chaos_run()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'ran_at', ran_at,
    'total_probes', total_probes,
    'passed', passed,
    'failed', failed,
    'duration_ms', duration_ms,
    'pass_rate', CASE WHEN total_probes = 0 THEN NULL
                      ELSE round(100.0 * passed::numeric / total_probes, 2) END,
    'source', source
  )
  FROM public.chaos_runs
  ORDER BY ran_at DESC
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.latest_chaos_run() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.latest_chaos_run() TO anon, authenticated;

-- Realtime for new admin views
ALTER TABLE public.account_freezes REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='account_freezes') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.account_freezes';
  END IF;
END $$;
