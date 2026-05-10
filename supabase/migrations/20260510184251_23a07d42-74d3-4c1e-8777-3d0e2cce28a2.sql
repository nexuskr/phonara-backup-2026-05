CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fp_hash text NOT NULL,
  ua text,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  trusted boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, fp_hash)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices(user_id, last_seen DESC);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own devices" ON public.user_devices;
CREATE POLICY "Users view own devices" ON public.user_devices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own devices" ON public.user_devices;
CREATE POLICY "Users delete own devices" ON public.user_devices FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own devices" ON public.user_devices;
CREATE POLICY "Users update own devices" ON public.user_devices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all devices" ON public.user_devices;
CREATE POLICY "Admins view all devices" ON public.user_devices FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.register_device(_fp text, _ua text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_new boolean := false;
  device_count integer := 0;
  row_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = 'P0001';
  END IF;
  IF _fp IS NULL OR length(_fp) < 16 OR length(_fp) > 128 THEN
    RAISE EXCEPTION 'invalid_fingerprint' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO device_count FROM public.user_devices WHERE user_id = uid;

  INSERT INTO public.user_devices (user_id, fp_hash, ua, last_seen)
  VALUES (uid, _fp, NULLIF(left(coalesce(_ua,''), 256), ''), now())
  ON CONFLICT (user_id, fp_hash)
  DO UPDATE SET last_seen = now(), ua = COALESCE(EXCLUDED.ua, public.user_devices.ua)
  RETURNING id, (xmax = 0) INTO row_id, is_new;

  IF is_new AND device_count > 0 THEN
    INSERT INTO public.anomaly_events (user_id, rule, severity, evidence, dedupe_key)
    VALUES (
      uid, 'new_device', 'info',
      jsonb_build_object(
        'fp_hash_prefix', left(_fp, 12),
        'ua', NULLIF(left(coalesce(_ua,''), 256), ''),
        'prior_device_count', device_count
      ),
      'new_device:' || uid::text || ':' || left(_fp, 16) || ':' || to_char(now(), 'YYYY-MM-DD')
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('device_id', row_id, 'is_new', is_new, 'prior_count', device_count);
END;
$$;

REVOKE ALL ON FUNCTION public.register_device(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_device(text, text) TO authenticated;

INSERT INTO public.function_permissions_baseline (function_name, function_args, allowed_roles, category, note)
VALUES (
  'register_device', '(text, text)',
  ARRAY['authenticated']::text[],
  'security',
  'Registers a device fingerprint for the current user; logs anomaly_events.new_device when a brand new fingerprint appears for an existing account.'
)
ON CONFLICT (function_name, function_args) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    category = EXCLUDED.category,
    note = EXCLUDED.note,
    updated_at = now();