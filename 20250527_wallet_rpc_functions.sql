-- 20250527_wallet_rpc_functions.sql
-- PL/pgSQL function stubs for wallet RPCs: process_deposit, process_withdrawal,
-- reserve_for_trade, release_reserve, credit_reward, claim_reward
-- Each function performs atomic updates on wallet_balances and inserts a row
-- into wallet_transactions. Functions raise exceptions on error to trigger rollback.

SET search_path = public;

-- process_deposit
CREATE OR REPLACE FUNCTION process_deposit(
  p_user_id UUID,
  p_currency TEXT,
  p_amount BIGINT,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(total BIGINT, available BIGINT, reserved_for_trade BIGINT, locked_for_rewards BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_total_before BIGINT;
  v_available_before BIGINT;
  v_reserved_before BIGINT;
  v_locked_before BIGINT;
  v_total_after BIGINT;
  v_available_after BIGINT;
  v_reserved_after BIGINT;
  v_locked_after BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'process_deposit: p_amount must be > 0';
  END IF;

  -- Try to lock existing row
  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO wallet_balances(user_id, currency, total, available, reserved_for_trade, locked_for_rewards)
      VALUES (p_user_id, p_currency, p_amount, p_amount, 0, 0);

      v_total_before := NULL;
      v_available_before := NULL;
      v_reserved_before := 0;
      v_locked_before := 0;
    EXCEPTION WHEN unique_violation THEN
      -- concurrent insert; lock and update instead
      SELECT total, available, reserved_for_trade, locked_for_rewards
        INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
      FROM wallet_balances
      WHERE user_id = p_user_id AND currency = p_currency
      FOR UPDATE;

      UPDATE wallet_balances
      SET available = available + p_amount,
          total = total + p_amount
      WHERE user_id = p_user_id AND currency = p_currency;
    END;
  ELSE
    -- existing row locked: perform update
    UPDATE wallet_balances
    SET available = available + p_amount,
        total = total + p_amount
    WHERE user_id = p_user_id AND currency = p_currency;
  END IF;

  -- Read after-update values
  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_after, v_available_after, v_reserved_after, v_locked_after
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency;

  -- Insert audit log
  INSERT INTO wallet_transactions(user_id, currency, type, amount, balance_before, balance_after, meta)
  VALUES (p_user_id, p_currency, 'deposit', p_amount, v_total_before, v_total_after, p_meta);

  -- Return final balances
  RETURN QUERY SELECT v_total_after, v_available_after, v_reserved_after, v_locked_after;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- process_withdrawal
CREATE OR REPLACE FUNCTION process_withdrawal(
  p_user_id UUID,
  p_currency TEXT,
  p_amount BIGINT,
  p_ref_id UUID DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(total BIGINT, available BIGINT, reserved_for_trade BIGINT, locked_for_rewards BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_total_before BIGINT;
  v_available_before BIGINT;
  v_reserved_before BIGINT;
  v_locked_before BIGINT;
  v_total_after BIGINT;
  v_available_after BIGINT;
  v_reserved_after BIGINT;
  v_locked_after BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'process_withdrawal: p_amount must be > 0';
  END IF;

  -- Lock user's balance row
  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'process_withdrawal: no balance record for user % and currency %', p_user_id, p_currency;
  END IF;

  IF v_available_before < p_amount THEN
    RAISE EXCEPTION 'process_withdrawal: insufficient available funds (have %, need %)', v_available_before, p_amount;
  END IF;

  UPDATE wallet_balances
  SET available = available - p_amount,
      total = total - p_amount
  WHERE user_id = p_user_id AND currency = p_currency;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_after, v_available_after, v_reserved_after, v_locked_after
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency;

  INSERT INTO wallet_transactions(user_id, currency, type, amount, balance_before, balance_after, ref_id, meta)
  VALUES (p_user_id, p_currency, 'withdrawal', -p_amount, v_total_before, v_total_after, p_ref_id, p_meta);

  RETURN QUERY SELECT v_total_after, v_available_after, v_reserved_after, v_locked_after;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- reserve_for_trade
CREATE OR REPLACE FUNCTION reserve_for_trade(
  p_user_id UUID,
  p_currency TEXT,
  p_amount BIGINT,
  p_order_id UUID,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(total BIGINT, available BIGINT, reserved_for_trade BIGINT, locked_for_rewards BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_total_before BIGINT;
  v_available_before BIGINT;
  v_reserved_before BIGINT;
  v_locked_before BIGINT;
  v_total_after BIGINT;
  v_available_after BIGINT;
  v_reserved_after BIGINT;
  v_locked_after BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'reserve_for_trade: p_amount must be > 0';
  END IF;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reserve_for_trade: no balance record for user % and currency %', p_user_id, p_currency;
  END IF;

  IF v_available_before < p_amount THEN
    RAISE EXCEPTION 'reserve_for_trade: insufficient available funds (have %, need %)', v_available_before, p_amount;
  END IF;

  UPDATE wallet_balances
  SET available = available - p_amount,
      reserved_for_trade = reserved_for_trade + p_amount
  WHERE user_id = p_user_id AND currency = p_currency;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_after, v_available_after, v_reserved_after, v_locked_after
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency;

  INSERT INTO wallet_transactions(user_id, currency, type, amount, balance_before, balance_after, ref_id, meta)
  VALUES (p_user_id, p_currency, 'reserve_for_trade', -p_amount, v_total_before, v_total_after, p_order_id, p_meta);

  RETURN QUERY SELECT v_total_after, v_available_after, v_reserved_after, v_locked_after;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- release_reserve
CREATE OR REPLACE FUNCTION release_reserve(
  p_user_id UUID,
  p_currency TEXT,
  p_amount BIGINT,
  p_order_id UUID,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(total BIGINT, available BIGINT, reserved_for_trade BIGINT, locked_for_rewards BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_total_before BIGINT;
  v_available_before BIGINT;
  v_reserved_before BIGINT;
  v_locked_before BIGINT;
  v_total_after BIGINT;
  v_available_after BIGINT;
  v_reserved_after BIGINT;
  v_locked_after BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'release_reserve: p_amount must be > 0';
  END IF;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'release_reserve: no balance record for user % and currency %', p_user_id, p_currency;
  END IF;

  IF v_reserved_before < p_amount THEN
    RAISE EXCEPTION 'release_reserve: insufficient reserved funds (have %, need %)', v_reserved_before, p_amount;
  END IF;

  UPDATE wallet_balances
  SET reserved_for_trade = reserved_for_trade - p_amount,
      available = available + p_amount
  WHERE user_id = p_user_id AND currency = p_currency;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_after, v_available_after, v_reserved_after, v_locked_after
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency;

  INSERT INTO wallet_transactions(user_id, currency, type, amount, balance_before, balance_after, ref_id, meta)
  VALUES (p_user_id, p_currency, 'release_reserve', p_amount, v_total_before, v_total_after, p_order_id, p_meta);

  RETURN QUERY SELECT v_total_after, v_available_after, v_reserved_after, v_locked_after;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- credit_reward
CREATE OR REPLACE FUNCTION credit_reward(
  p_user_id UUID,
  p_currency TEXT,
  p_amount BIGINT,
  p_reason TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(total BIGINT, available BIGINT, reserved_for_trade BIGINT, locked_for_rewards BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_total_before BIGINT;
  v_available_before BIGINT;
  v_reserved_before BIGINT;
  v_locked_before BIGINT;
  v_total_after BIGINT;
  v_available_after BIGINT;
  v_reserved_after BIGINT;
  v_locked_after BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'credit_reward: p_amount must be > 0';
  END IF;

  -- upsert: try lock existing row
  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO wallet_balances(user_id, currency, total, available, reserved_for_trade, locked_for_rewards)
      VALUES (p_user_id, p_currency, p_amount, 0, 0, p_amount);

      v_total_before := NULL;
      v_available_before := 0;
      v_reserved_before := 0;
      v_locked_before := 0;
    EXCEPTION WHEN unique_violation THEN
      SELECT total, available, reserved_for_trade, locked_for_rewards
        INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
      FROM wallet_balances
      WHERE user_id = p_user_id AND currency = p_currency
      FOR UPDATE;

      UPDATE wallet_balances
      SET locked_for_rewards = locked_for_rewards + p_amount,
          total = total + p_amount
      WHERE user_id = p_user_id AND currency = p_currency;
    END;
  ELSE
    UPDATE wallet_balances
    SET locked_for_rewards = locked_for_rewards + p_amount,
        total = total + p_amount
    WHERE user_id = p_user_id AND currency = p_currency;
  END IF;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_after, v_available_after, v_reserved_after, v_locked_after
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency;

  INSERT INTO wallet_transactions(user_id, currency, type, amount, balance_before, balance_after, meta)
  VALUES (p_user_id, p_currency, 'credit_reward', p_amount, v_total_before, v_total_after, jsonb_build_object('reason', p_reason) || p_meta);

  RETURN QUERY SELECT v_total_after, v_available_after, v_reserved_after, v_locked_after;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- claim_reward
CREATE OR REPLACE FUNCTION claim_reward(
  p_user_id UUID,
  p_currency TEXT,
  p_amount BIGINT,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(total BIGINT, available BIGINT, reserved_for_trade BIGINT, locked_for_rewards BIGINT)
LANGUAGE plpgsql AS $$
DECLARE
  v_total_before BIGINT;
  v_available_before BIGINT;
  v_reserved_before BIGINT;
  v_locked_before BIGINT;
  v_total_after BIGINT;
  v_available_after BIGINT;
  v_reserved_after BIGINT;
  v_locked_after BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'claim_reward: p_amount must be > 0';
  END IF;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_before, v_available_before, v_reserved_before, v_locked_before
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'claim_reward: no balance record for user % and currency %', p_user_id, p_currency;
  END IF;

  IF v_locked_before < p_amount THEN
    RAISE EXCEPTION 'claim_reward: insufficient locked rewards (have %, need %)', v_locked_before, p_amount;
  END IF;

  UPDATE wallet_balances
  SET locked_for_rewards = locked_for_rewards - p_amount,
      available = available + p_amount
  WHERE user_id = p_user_id AND currency = p_currency;

  SELECT total, available, reserved_for_trade, locked_for_rewards
    INTO v_total_after, v_available_after, v_reserved_after, v_locked_after
  FROM wallet_balances
  WHERE user_id = p_user_id AND currency = p_currency;

  INSERT INTO wallet_transactions(user_id, currency, type, amount, balance_before, balance_after, meta)
  VALUES (p_user_id, p_currency, 'claim_reward', p_amount, v_total_before, v_total_after, p_meta);

  RETURN QUERY SELECT v_total_after, v_available_after, v_reserved_after, v_locked_after;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- End of file
