-- P0: Fix Empire priority queue (CASE checked obsolete 'sovereign' value vs actual enum 'empire')
-- P1: Add advisory lock to settle_package_daily so two concurrent crons cannot interleave

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _amount bigint, _method withdrawal_method,
  _bank_name text, _bank_account text,
  _coin_address text, _coin_network text, _pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _tier public.user_tier;
  _pin_hash TEXT;
  _wallet public.wallet_balances%ROWTYPE;
  _today DATE := CURRENT_DATE;
  _wd_count INT;
  _min BIGINT;
  _process_by TIMESTAMPTZ;
  _tx_code TEXT;
  _gate jsonb;
  _required int;
  _priority smallint;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF _pin IS NULL OR length(_pin) <> 6 THEN RAISE EXCEPTION 'invalid pin'; END IF;

  SELECT tier, withdraw_pin_hash INTO _tier, _pin_hash
    FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _pin_hash IS NULL THEN
    UPDATE public.profiles
       SET withdraw_pin_hash = encode(digest(_pin || _uid::text,'sha256'),'hex')
     WHERE id=_uid;
  ELSIF _pin_hash <> encode(digest(_pin || _uid::text,'sha256'),'hex') THEN
    RAISE EXCEPTION 'pin mismatch';
  END IF;

  _gate := public.aml_required_level(_uid, _amount);
  _required := (_gate->>'required_level')::int;
  IF (_gate->>'gate_passed')::boolean = false THEN
    RAISE EXCEPTION 'aml_required:%', _required;
  END IF;

  _min := public.tier_withdraw_min(_tier);
  IF _amount < _min THEN RAISE EXCEPTION 'below_min:%', _min; END IF;

  IF _tier = 'normal' THEN
    SELECT COUNT(*) INTO _wd_count FROM public.withdrawal_requests
      WHERE user_id=_uid AND created_at::date=_today
        AND status<>'rejected' AND status<>'cancelled';
    IF _wd_count >= 3 THEN RAISE EXCEPTION 'daily_withdraw_limit'; END IF;
  END IF;

  SELECT * INTO _wallet FROM public.wallet_balances WHERE user_id=_uid FOR UPDATE;
  IF _wallet.available_balance < _amount THEN RAISE EXCEPTION 'insufficient_funds'; END IF;

  UPDATE public.wallet_balances SET
    available_balance = available_balance - _amount,
    locked_balance = locked_balance + _amount,
    updated_at = now()
  WHERE user_id=_uid;

  UPDATE public.profiles
    SET total_withdrawn = COALESCE(total_withdrawn,0) + _amount,
        updated_at = now()
  WHERE id = _uid;

  _process_by := now() + (public.tier_process_minutes(_tier) || ' minutes')::interval;
  _tx_code := 'PM-' || upper(substr(md5(random()::text||_uid::text||now()::text),1,10));

  -- v3: priority queue uses ACTUAL user_tier enum values
  -- (previous version checked obsolete 'sovereign' literal -> empire fell through to 100)
  _priority := CASE _tier
    WHEN 'empire' THEN 10::smallint
    WHEN 'god'    THEN 30::smallint
    WHEN 'vip'    THEN 50::smallint
    ELSE              100::smallint
  END;

  INSERT INTO public.withdrawal_requests(
    user_id, amount, method, bank_name, bank_account, coin_address, coin_network,
    tx_code, status, process_by, tier_at_request, priority
  ) VALUES (
    _uid, _amount, _method, _bank_name, _bank_account, _coin_address, _coin_network,
    _tx_code, 'pending', _process_by, _tier, _priority
  );

  RETURN jsonb_build_object('ok',true,'tx_code',_tx_code,'process_by',_process_by,'priority',_priority);
END $function$;

-- ============================================================
-- settle_package_daily: add transaction-scoped advisory lock so
-- two concurrent cron invocations cannot enter the loop together.
-- The pg_try_advisory_xact_lock returns false if another tx holds it;
-- we exit cleanly with settled=0 and caller='lock_busy'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.settle_package_daily()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _r RECORD;
  _count INT := 0;
  _wallet public.wallet_balances%ROWTYPE;
  _is_service_role boolean := coalesce(
    current_setting('request.jwt.claims', true)::jsonb->>'role','') = 'service_role';
  _got_lock boolean;
BEGIN
  IF _uid IS NULL AND NOT _is_service_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _uid IS NOT NULL AND NOT public.has_role(_uid,'admin') AND NOT _is_service_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- single-flight guard (key derived from function name hash; namespace 4242)
  _got_lock := pg_try_advisory_xact_lock(4242, hashtext('settle_package_daily'));
  IF NOT _got_lock THEN
    RETURN jsonb_build_object('ok', true, 'settled', 0, 'skipped', 'lock_busy');
  END IF;

  FOR _r IN
    SELECT * FROM public.package_purchases
    WHERE status='active' AND next_settle_at <= now()
    ORDER BY next_settle_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT * INTO _wallet FROM public.wallet_balances WHERE user_id=_r.user_id FOR UPDATE;
    IF NOT FOUND THEN CONTINUE; END IF;

    UPDATE public.wallet_balances SET
      available_balance = available_balance + _r.daily_return,
      total_balance = total_balance + _r.daily_return,
      updated_at = now()
    WHERE user_id=_r.user_id;

    INSERT INTO public.transactions(user_id, kind, direction, amount, balance_after, available_after, ref_id, metadata)
      VALUES (_r.user_id, 'mission_win','credit', _r.daily_return,
              _wallet.total_balance + _r.daily_return,
              _wallet.available_balance + _r.daily_return,
              _r.id::text,
              jsonb_build_object('source','package_settle','package_id',_r.package_id));

    IF _r.settled_count + 1 >= _r.duration_days THEN
      UPDATE public.package_purchases
        SET settled_count = settled_count+1,
            total_settled = total_settled + _r.daily_return,
            status='completed', completed_at=now(),
            next_settle_at=NULL
        WHERE id=_r.id;
    ELSE
      UPDATE public.package_purchases
        SET settled_count = settled_count+1,
            total_settled = total_settled + _r.daily_return,
            next_settle_at = now() + interval '1 day'
        WHERE id=_r.id;
    END IF;
    _count := _count + 1;
  END LOOP;
  RETURN jsonb_build_object('ok',true,'settled',_count);
END $function$;