-- Internal evaluator without admin guard (called from trigger as table owner)
CREATE OR REPLACE FUNCTION public._evaluate_deposit_rules_internal(_deposit_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d record;
  r record;
  prior_count int;
  inserted int := 0;
BEGIN
  SELECT id, user_id, amount, method, status
    INTO d
    FROM public.deposit_requests
   WHERE id = _deposit_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT COUNT(*) INTO prior_count
    FROM public.deposit_requests
   WHERE user_id = d.user_id AND status = 'approved';

  FOR r IN
    SELECT * FROM public.deposit_auto_rules
     WHERE enabled = true
     ORDER BY priority ASC
  LOOP
    IF (r.amount_min IS NULL OR d.amount >= r.amount_min)
       AND (r.amount_max IS NULL OR d.amount <= r.amount_max)
       AND (r.method IS NULL OR r.method = d.method)
       AND (prior_count >= COALESCE(r.min_prior_approved, 0))
    THEN
      INSERT INTO public.auto_rule_decisions
        (rule_id, rule_name, deposit_id, user_id, suggested_action, actual_action, payload)
      VALUES
        (r.id, r.name, d.id, d.user_id, r.action, d.status,
         jsonb_build_object('amount', d.amount, 'method', d.method,
                            'prior_approved', prior_count,
                            'trigger', TG_OP));
      inserted := inserted + 1;
    END IF;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public._evaluate_deposit_rules_internal(uuid) FROM PUBLIC, anon, authenticated;

-- Trigger: shadow-evaluate on insert and on status change
CREATE OR REPLACE FUNCTION public.trg_deposit_shadow_eval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public._evaluate_deposit_rules_internal(NEW.id);
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Update existing decision rows' actual_action and resolved_at
    UPDATE public.auto_rule_decisions
       SET actual_action = NEW.status,
           resolved_at = COALESCE(resolved_at, now())
     WHERE deposit_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deposit_shadow_eval ON public.deposit_requests;
CREATE TRIGGER trg_deposit_shadow_eval
  AFTER INSERT OR UPDATE OF status ON public.deposit_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_deposit_shadow_eval();