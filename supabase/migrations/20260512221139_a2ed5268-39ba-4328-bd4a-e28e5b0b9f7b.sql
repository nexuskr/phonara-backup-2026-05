-- PR-A: Empire AI Concierge — events log for CTR measurement
CREATE TABLE IF NOT EXISTS public.concierge_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('view','click','dismiss','suggest')),
  cta TEXT,
  route TEXT,
  message TEXT,
  empire_level INT,
  crown_score INT,
  booster_active BOOLEAN,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_events_user_created
  ON public.concierge_events(user_id, created_at DESC);

ALTER TABLE public.concierge_events ENABLE ROW LEVEL SECURITY;

-- Owner can insert own rows
CREATE POLICY "concierge_events insert own"
  ON public.concierge_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner can select own rows (for cooldown / dedupe checks)
CREATE POLICY "concierge_events select own"
  ON public.concierge_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can select all (funnel analysis)
CREATE POLICY "concierge_events admin select all"
  ON public.concierge_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));