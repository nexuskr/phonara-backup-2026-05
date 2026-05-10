
DROP VIEW IF EXISTS public.insurance_fund_24h;
CREATE VIEW public.insurance_fund_24h
WITH (security_invoker = true)
AS
  SELECT
    COALESCE(SUM(delta) FILTER (WHERE delta > 0 AND ts > now() - interval '24 hours'), 0)::bigint AS contributed_24h,
    COALESCE(SUM(-delta) FILTER (WHERE delta < 0 AND ts > now() - interval '24 hours'), 0)::bigint AS paid_24h,
    COUNT(*) FILTER (WHERE ts > now() - interval '24 hours') AS events_24h
  FROM public.insurance_fund_log;
GRANT SELECT ON public.insurance_fund_24h TO authenticated;
