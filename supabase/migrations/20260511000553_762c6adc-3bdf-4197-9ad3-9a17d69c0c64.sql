CREATE OR REPLACE FUNCTION public.check_daily_ev_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from timestamptz := (CURRENT_DATE - INTERVAL '1 day')::timestamptz;
  v_to   timestamptz := CURRENT_DATE::timestamptz;
  v_pnl  jsonb;
  v_net  numeric;
  v_zlc  boolean;
  v_dedupe text := 'negative_ev:' || to_char(CURRENT_DATE - 1, 'YYYY-MM-DD');
BEGIN
  SELECT public.admin_operator_pnl(v_from, v_to) INTO v_pnl;

  v_net := COALESCE((v_pnl->>'operator_net_pnl')::numeric, 0);
  v_zlc := COALESCE((v_pnl->>'zero_loss_check')::boolean, true);

  IF v_net < 0 OR v_zlc = false THEN
    INSERT INTO public.anomaly_events (rule, severity, dedupe_key, evidence)
    VALUES (
      'negative_ev',
      CASE WHEN v_net < -1000000 THEN 'high' ELSE 'medium' END,
      v_dedupe,
      jsonb_build_object(
        'date', (CURRENT_DATE - 1)::text,
        'operator_net_pnl', v_net,
        'zero_loss_check', v_zlc,
        'snapshot', v_pnl
      )
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'date', (CURRENT_DATE - 1)::text,
    'operator_net_pnl', v_net,
    'zero_loss_check', v_zlc,
    'alerted', (v_net < 0 OR v_zlc = false)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_daily_ev_health() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_daily_ev_health() TO postgres, service_role;

INSERT INTO public.function_permissions_baseline (function_name, function_args, allowed_roles, category, note)
VALUES (
  'check_daily_ev_health',
  '',
  ARRAY['postgres','service_role']::text[],
  'operations',
  'P7-A: daily PnL guard. Invoked by pg_cron; writes negative_ev anomaly_events on operator loss.'
)
ON CONFLICT (function_name, function_args) DO UPDATE
  SET allowed_roles = EXCLUDED.allowed_roles,
      category = EXCLUDED.category,
      note = EXCLUDED.note,
      updated_at = now();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-ev-health-check') THEN
      PERFORM cron.unschedule('daily-ev-health-check');
    END IF;
    PERFORM cron.schedule(
      'daily-ev-health-check',
      '5 15 * * *',
      $cron$ SELECT public.check_daily_ev_health(); $cron$
    );
  END IF;
END $$;