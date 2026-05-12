-- Phase B: server-side input validation for profile name / dob / phone
CREATE OR REPLACE FUNCTION public.validate_profile_input(
  _real_name text,
  _birth_date date,
  _phone text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  errs jsonb := '{}'::jsonb;
  age_years int;
BEGIN
  -- real_name: 2~20 chars, Korean/English/space only
  IF _real_name IS NOT NULL THEN
    IF char_length(btrim(_real_name)) < 2 OR char_length(btrim(_real_name)) > 20 THEN
      errs := errs || jsonb_build_object('real_name', 'length_2_20');
    ELSIF _real_name !~ '^[가-힣A-Za-z][가-힣A-Za-z\s]{1,19}$' THEN
      errs := errs || jsonb_build_object('real_name', 'invalid_chars');
    END IF;
  END IF;

  -- birth_date: >= 19 years, sane lower bound
  IF _birth_date IS NOT NULL THEN
    IF _birth_date < DATE '1900-01-01' OR _birth_date > CURRENT_DATE THEN
      errs := errs || jsonb_build_object('birth_date', 'out_of_range');
    ELSE
      age_years := EXTRACT(YEAR FROM age(CURRENT_DATE, _birth_date))::int;
      IF age_years < 19 THEN
        errs := errs || jsonb_build_object('birth_date', 'under_19');
      END IF;
    END IF;
  END IF;

  -- phone: Korean mobile (010/011/016/017/018/019), 10-11 digits, no separators
  IF _phone IS NOT NULL AND _phone <> '' THEN
    IF _phone !~ '^01[016789][0-9]{7,8}$' THEN
      errs := errs || jsonb_build_object('phone', 'invalid_format');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', (errs = '{}'::jsonb),
    'errors', errs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_profile_input(text, date, text) TO authenticated, anon;

-- Trigger guard: refuse malformed values regardless of source
CREATE OR REPLACE FUNCTION public.trg_validate_profile_input()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  res jsonb;
BEGIN
  -- Only validate when the relevant fields are being set/changed
  IF TG_OP = 'INSERT'
     OR NEW.real_name IS DISTINCT FROM OLD.real_name
     OR NEW.birth_date IS DISTINCT FROM OLD.birth_date
     OR NEW.phone IS DISTINCT FROM OLD.phone THEN
    res := public.validate_profile_input(NEW.real_name, NEW.birth_date, NEW.phone);
    IF (res->>'ok')::boolean = false THEN
      RAISE EXCEPTION 'profile_input_invalid: %', res->'errors'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_input ON public.profiles;
CREATE TRIGGER trg_validate_profile_input
BEFORE INSERT OR UPDATE OF real_name, birth_date, phone
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_validate_profile_input();

COMMENT ON FUNCTION public.validate_profile_input(text, date, text) IS
  'Phase B: validates real_name (2-20 KR/EN), birth_date (>=19), phone (KR mobile). Returns {ok, errors}.';
COMMENT ON FUNCTION public.trg_validate_profile_input() IS
  'Phase B: BEFORE INSERT/UPDATE trigger enforcing validate_profile_input on profiles.';