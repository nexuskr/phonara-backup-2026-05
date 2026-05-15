CREATE TABLE IF NOT EXISTS public.slot_anomaly_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  game_code text,
  kind text NOT NULL CHECK (kind IN ('spin_failed','sound_init_failed','payout_mismatch','overlay_timeout')),
  expected numeric,
  actual numeric,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slot_anomaly_log_user ON public.slot_anomaly_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slot_anomaly_log_kind ON public.slot_anomaly_log(kind, created_at DESC);

ALTER TABLE public.slot_anomaly_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slot_anomaly_log self select"
ON public.slot_anomaly_log FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "slot_anomaly_log self insert"
ON public.slot_anomaly_log FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "slot_anomaly_log admin update"
ON public.slot_anomaly_log FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "slot_anomaly_log admin delete"
ON public.slot_anomaly_log FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.trg_slot_anomaly_promote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kind = 'payout_mismatch' THEN
    BEGIN
      INSERT INTO public.anomaly_events(rule, severity, user_id, payload, dedupe_key)
      VALUES (
        'slot_payout_mismatch',
        'warn',
        NEW.user_id,
        jsonb_build_object(
          'game_code', NEW.game_code,
          'expected', NEW.expected,
          'actual', NEW.actual,
          'meta', NEW.meta
        ),
        'slot_payout_mismatch:' || COALESCE(NEW.user_id::text,'anon') || ':' || COALESCE(NEW.game_code,'') || ':' || to_char(NEW.created_at,'YYYY-MM-DD"T"HH24:MI')
      )
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS slot_anomaly_promote ON public.slot_anomaly_log;
CREATE TRIGGER slot_anomaly_promote
AFTER INSERT ON public.slot_anomaly_log
FOR EACH ROW EXECUTE FUNCTION public.trg_slot_anomaly_promote();