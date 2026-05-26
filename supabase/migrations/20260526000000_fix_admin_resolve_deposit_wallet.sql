CREATE OR REPLACE FUNCTION public.admin_resolve_deposit(
  _request_id uuid,
  _action text,
  _reason text DEFAULT NULL,
  _memo text DEFAULT NULL,
  _checklist jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _admin uuid := auth.uid();
  _r public.deposit_requests%ROWTYPE;
  _wallet public.wallet_balances%ROWTYPE;
  _credit bigint;
  _meta jsonb;
BEGIN
  IF NOT public.has_role(_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO _r
  FROM public.deposit_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF _r.status::text <> 'pending' THEN
    RAISE EXCEPTION 'already_resolved';
  END IF;

  _credit := COALESCE(_r.amount, 0) + COALESCE(_r.bonus_amount, 0);

  IF _action = 'approve' THEN
    SELECT * INTO _wallet
    FROM public.wallet_balances
    WHERE user_id = _r.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.wallet_balances(user_id)
      VALUES (_r.user_id)
      RETURNING * INTO _wallet;
    END IF;

    UPDATE public.wallet_balances
    SET
      available_balance = available_balance + _credit,
      total_balance = total_balance + _credit,
      updated_at = now()
    WHERE user_id = _r.user_id;

    UPDATE public.deposit_requests
    SET
      status = 'approved',
      admin_id = _admin,
      approved_at = now(),
      admin_review_memo = _memo,
      admin_evidence_checklist = COALESCE(_checklist, '{}'::jsonb),
      updated_at = now()
    WHERE id = _request_id;

    IF _r.method::text = 'coin' THEN
      UPDATE public.profiles
      SET
        total_coin_deposits = total_coin_deposits + _r.amount,
        coin_master_unlocked = (total_coin_deposits + _r.amount) >= 500000
      WHERE id = _r.user_id;
    END IF;

    _meta := jsonb_build_object(
      'kind', 'deposit_approve',
      'method', _r.method::text,
      'package_id', _r.package_id,
      'principal', _r.amount,
      'bonus', _r.bonus_amount,
      'bonus_pct', _r.bonus_pct,
      'voucher_brand', _r.voucher_brand,
      'admin_id', _admin
    );

    INSERT INTO public.transactions(
      user_id,
      kind,
      direction,
      amount,
      balance_after,
      available_after,
      ref_id,
      metadata
    )
    VALUES (
      _r.user_id,
      'deposit_credit',
      'credit',
      _credit,
      _wallet.total_balance + _credit,
      _wallet.available_balance + _credit,
      _request_id::text,
      _meta
    );

    INSERT INTO public.request_status_history(
      request_kind,
      request_id,
      user_id,
      from_status,
      to_status,
      actor_id,
      actor_role,
      memo,
      evidence
    )
    VALUES (
      'deposit',
      _request_id,
      _r.user_id,
      'pending',
      'approved',
      _admin,
      'admin',
      _memo,
      COALESCE(_checklist, '{}'::jsonb)
    ), (
      'deposit',
      _request_id,
      _r.user_id,
      'approved',
      'completed',
      _admin,
      'admin',
      NULL,
      '{}'::jsonb
    );

  ELSIF _action = 'reject' THEN
    UPDATE public.deposit_requests
    SET
      status = 'rejected',
      admin_id = _admin,
      rejected_reason = _reason,
      admin_review_memo = _memo,
      admin_evidence_checklist = COALESCE(_checklist, '{}'::jsonb),
      updated_at = now()
    WHERE id = _request_id;

    INSERT INTO public.request_status_history(
      request_kind,
      request_id,
      user_id,
      from_status,
      to_status,
      actor_id,
      actor_role,
      memo,
      evidence
    )
    VALUES (
      'deposit',
      _request_id,
      _r.user_id,
      'pending',
      'rejected',
      _admin,
      'admin',
      COALESCE(_reason, _memo),
      COALESCE(_checklist, '{}'::jsonb)
    );
  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;

  RETURN jsonb_build_object('ok', true, 'action', _action);
END
$function$;
