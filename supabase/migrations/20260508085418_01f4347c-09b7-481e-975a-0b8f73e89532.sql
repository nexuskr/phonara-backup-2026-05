-- 1) profiles: prevent direct updates to sensitive/privileged columns by users
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Privileged columns: must never be changed by the user via direct UPDATE.
  -- These are managed exclusively by SECURITY DEFINER RPCs (admin or system).
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    NEW.tier := OLD.tier;
  END IF;
  IF NEW.withdraw_pin_hash IS DISTINCT FROM OLD.withdraw_pin_hash THEN
    NEW.withdraw_pin_hash := OLD.withdraw_pin_hash;
  END IF;
  IF NEW.total_coin_deposits IS DISTINCT FROM OLD.total_coin_deposits THEN
    NEW.total_coin_deposits := OLD.total_coin_deposits;
  END IF;
  IF NEW.total_withdrawn IS DISTINCT FROM OLD.total_withdrawn THEN
    NEW.total_withdrawn := OLD.total_withdrawn;
  END IF;
  IF NEW.coin_master_unlocked IS DISTINCT FROM OLD.coin_master_unlocked THEN
    NEW.coin_master_unlocked := OLD.coin_master_unlocked;
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code AND OLD.referral_code IS NOT NULL THEN
    NEW.referral_code := OLD.referral_code;
  END IF;
  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by AND OLD.referred_by IS NOT NULL THEN
    NEW.referred_by := OLD.referred_by;
  END IF;
  IF NEW.attendance_streak IS DISTINCT FROM OLD.attendance_streak THEN
    NEW.attendance_streak := OLD.attendance_streak;
  END IF;
  IF NEW.last_attendance IS DISTINCT FROM OLD.last_attendance THEN
    NEW.last_attendance := OLD.last_attendance;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_sensitive_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_sensitive_columns();

-- 2) empire_founding_seats: tighten SELECT policy to owner/admin only.
-- Public seat-remaining count remains available via SECURITY DEFINER RPC
-- get_empire_seats_remaining() and the empire_founding_seats_public view.
DROP POLICY IF EXISTS efs_authed_read ON public.empire_founding_seats;
CREATE POLICY efs_self_or_admin_select ON public.empire_founding_seats
  FOR SELECT TO authenticated
  USING ((auth.uid() = claimed_by) OR public.has_role(auth.uid(), 'admin'::app_role));
