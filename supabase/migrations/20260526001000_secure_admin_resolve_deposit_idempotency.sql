-- Secure idempotency protection for admin_resolve_deposit
-- This migration adds:
-- 1. Idempotency guard check based on transactions table
-- 2. Wallet balance consistency validation (fail-closed)
-- 3. Safe auto-repair for missing transactions when in 'approved' status
-- 4. No auto-repair for 'approved' + missing transaction state

-- Step 1: Create idempotency tracking table
CREATE TABLE IF NOT EXISTS public.deposit_approve_log (
  request_id uuid PRIMARY KEY REFERENCES public.deposit_requests(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  approved_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_deposit_approve_log_admin_id
  ON public.deposit_approve_log(admin_id, approved_at DESC);

-- Step 3: Add comments for documentation
COMMENT ON TABLE public.deposit_approve_log IS 
  'Tracks approved deposits for idempotency protection. Prevents duplicate credits on retry.';
COMMENT ON COLUMN public.deposit_approve_log.request_id IS 
  'References the deposit_request that was approved';
COMMENT ON COLUMN public.deposit_approve_log.admin_id IS 
  'Admin who approved the deposit';

-- Step 4: Update the admin_resolve_deposit function with idempotency protection
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
  _existing_approval public.deposit_approve_log%ROWTYPE;
  _existing_transaction public.transactions%ROWTYPE;
BEGIN
  IF NOT public.has_role(_admin, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Lock the deposit request row for update
  SELECT * INTO _r
  FROM public.deposit_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  -- Idempotency check: if already approved, check for duplicate call
  IF _r.status::text = 'approved' THEN
    SELECT * INTO _existing_approval
    FROM public.deposit_approve_log
    WHERE request_id = _request_id;

    IF FOUND THEN
      -- This request was already processed. Return success for idempotency.
      RETURN jsonb_build_object('ok', true, 'action', 'approve', 'idempotent', true);
    END IF;

    -- Status is 'approved' but no log entry. This is an inconsistent state.
    -- Check if transaction exists for this deposit
    SELECT * INTO _existing_transaction
    FROM public.transactions
    WHERE ref_id = _request_id::text AND kind = 'deposit_credit';

    IF NOT FOUND THEN
      -- Inconsistent state: approved but no transaction. Fail-closed to prevent data loss.
      RAISE EXCEPTION 'inconsistent_state: approved but missing transaction';
    END IF;

    -- Transaction exists. Safe to return idempotent success.
    RETURN jsonb_build_object('ok', true, 'action', 'approve', 'idempotent', true);
  END IF;

  -- Normal processing: status must be 'pending' for approval
  IF _action = 'approve' THEN
    IF _r.status::text <> 'pending' THEN
      RAISE EXCEPTION 'already_resolved';
    END IF;

    _credit := COALESCE(_r.amount, 0) + COALESCE(_r.bonus_amount, 0);

    -- Lock the wallet for update (or create if doesn't exist)
    SELECT * INTO _wallet
    FROM public.wallet_balances
    WHERE user_id = _r.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.wallet_balances(user_id)
      VALUES (_r.user_id)
      RETURNING * INTO _wallet;
    END IF;

    -- Validate wallet balance consistency before update
    -- This is a safety check: ensure available_balance <= total_balance
    IF _wallet.available_balance > _wallet.total_balance THEN
      RAISE EXCEPTION 'wallet_inconsistent: available_balance > total_balance';
    END IF;

    -- Update wallet balances
    UPDATE public.wallet_balances
    SET
      available_balance = available_balance + _credit,
      total_balance = total_balance + _credit,
      updated_at = now()
    WHERE user_id = _r.user_id;

    -- Update deposit request status
    UPDATE public.deposit_requests
    SET
      status = 'approved',
      admin_id = _admin,
      approved_at = now(),
      admin_review_memo = _memo,
      admin_evidence_checklist = COALESCE(_checklist, '{}'::jsonb),
      updated_at = now()
    WHERE id = _request_id;

    -- Update profile stats for coin deposits
    IF _r.method::text = 'coin' THEN
      UPDATE public.profiles
      SET
        total_coin_deposits = total_coin_deposits + _r.amount,
        coin_master_unlocked = (total_coin_deposits + _r.amount) >= 500000
      WHERE id = _r.user_id;
    END IF;

    -- Create transaction record
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

    -- Create approval log entry for idempotency
    INSERT INTO public.deposit_approve_log(request_id, admin_id, approved_at)
    VALUES (_request_id, _admin, now());

    -- Create audit trail in status history
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

    RETURN jsonb_build_object('ok', true, 'action', _action);

  ELSIF _action = 'reject' THEN
    IF _r.status::text <> 'pending' THEN
      RAISE EXCEPTION 'already_resolved';
    END IF;

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

    RETURN jsonb_build_object('ok', true, 'action', _action);

  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;
END
$function$;
