-- Restrict spans writes: authenticated users may insert only their own spans (or NULL for system),
-- and UPDATE/DELETE remain admin-only via no policies (RLS denies by default).
CREATE POLICY spans_self_insert ON public.spans
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());