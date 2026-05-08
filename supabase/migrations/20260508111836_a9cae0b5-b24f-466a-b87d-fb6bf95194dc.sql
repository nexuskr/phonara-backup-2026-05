CREATE TABLE IF NOT EXISTS public.dm_composer_prefs (
  user_id UUID PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'instagram',
  keywords TEXT NOT NULL DEFAULT '부업, AI, 재테크',
  persona TEXT NOT NULL DEFAULT '20~30대 직장인 부업 관심층',
  tone TEXT NOT NULL DEFAULT 'friendly',
  count INTEGER NOT NULL DEFAULT 5,
  daily_safe_line INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dm_composer_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY dcp_self_select ON public.dm_composer_prefs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY dcp_self_insert ON public.dm_composer_prefs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY dcp_self_update ON public.dm_composer_prefs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY dcp_self_delete ON public.dm_composer_prefs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);