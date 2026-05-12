CREATE OR REPLACE FUNCTION public.get_whale_strike_funnel()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _d24 timestamptz := _now - interval '24 hours';
  _d7  timestamptz := _now - interval '7 days';
  imp_24 bigint; clk_24 bigint; imp_7 bigint; clk_7 bigint;
  unique_clk_users_7 bigint; conv_users_7 bigint; conv_amount_7 numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO imp_24 FROM public.conversion_events
    WHERE surface='whale_rail' AND event_type='view' AND created_at >= _d24;
  SELECT COUNT(*) INTO clk_24 FROM public.conversion_events
    WHERE surface='whale_rail' AND event_type='cta_click' AND created_at >= _d24;
  SELECT COUNT(*) INTO imp_7 FROM public.conversion_events
    WHERE surface='whale_rail' AND event_type='view' AND created_at >= _d7;
  SELECT COUNT(*) INTO clk_7 FROM public.conversion_events
    WHERE surface='whale_rail' AND event_type='cta_click' AND created_at >= _d7;

  SELECT COUNT(DISTINCT user_id) INTO unique_clk_users_7 FROM public.conversion_events
    WHERE surface='whale_rail' AND event_type='cta_click'
      AND user_id IS NOT NULL AND created_at >= _d7;

  WITH clicks AS (
    SELECT user_id, MIN(created_at) AS first_click
    FROM public.conversion_events
    WHERE surface='whale_rail' AND event_type='cta_click'
      AND user_id IS NOT NULL AND created_at >= _d7
    GROUP BY user_id
  ), deps AS (
    SELECT c.user_id, COALESCE(SUM(r.amount_krw), 0) AS amt
    FROM clicks c
    LEFT JOIN public.revenue_events r
      ON r.user_id = c.user_id
     AND r.amount_krw > 0
     AND r.created_at >= c.first_click
     AND r.created_at <  c.first_click + interval '24 hours'
    GROUP BY c.user_id
  )
  SELECT COUNT(*) FILTER (WHERE amt > 0), COALESCE(SUM(amt), 0)
    INTO conv_users_7, conv_amount_7 FROM deps;

  RETURN jsonb_build_object(
    'impressions_24h', imp_24,
    'clicks_24h', clk_24,
    'ctr_24h', CASE WHEN imp_24>0 THEN (clk_24::numeric/imp_24) ELSE 0 END,
    'impressions_7d', imp_7,
    'clicks_7d', clk_7,
    'ctr_7d', CASE WHEN imp_7>0 THEN (clk_7::numeric/imp_7) ELSE 0 END,
    'unique_clickers_7d', unique_clk_users_7,
    'depositors_7d', conv_users_7,
    'click_to_deposit_7d', CASE WHEN unique_clk_users_7>0 THEN (conv_users_7::numeric/unique_clk_users_7) ELSE 0 END,
    'deposit_amount_7d', conv_amount_7,
    'generated_at', _now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_whale_strike_funnel() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_whale_strike_funnel() TO authenticated;

INSERT INTO public.function_permissions_baseline (function_name, function_args, allowed_roles, category, note)
VALUES ('get_whale_strike_funnel', '', ARRAY['authenticated']::text[], 'admin_kpi', 'PR-10 admin-only KPI: whale strike conversion funnel')
ON CONFLICT (function_name, function_args) DO UPDATE
  SET allowed_roles = EXCLUDED.allowed_roles, category = EXCLUDED.category, note = EXCLUDED.note, updated_at = now();