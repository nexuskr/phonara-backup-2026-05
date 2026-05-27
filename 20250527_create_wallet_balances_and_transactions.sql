-- 20250527_create_wallet_balances_and_transactions.sql
-- Create wallet_balances (SSOT) and wallet_transactions (immutable audit log)
-- NOTE: This is the approved migration content. Save as the filename above and apply with your migration tool.

-- wallet_balances: SSOT
CREATE TABLE IF NOT EXISTS wallet_balances (
  user_id UUID NOT NULL,
  currency TEXT NOT NULL,
  total BIGINT NOT NULL DEFAULT 0,
  available BIGINT NOT NULL DEFAULT 0,
  reserved_for_trade BIGINT NOT NULL DEFAULT 0,
  locked_for_rewards BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, currency),
  CHECK (available >= 0),
  CHECK (reserved_for_trade >= 0),
  CHECK (locked_for_rewards >= 0),
  CHECK (total >= 0),
  CHECK ( total = available + reserved_for_trade + locked_for_rewards )
);

CREATE INDEX IF NOT EXISTS idx_wallet_balances_user ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_updated_at ON wallet_balances(updated_at);

-- Trigger function: set updated_at on UPDATE
CREATE OR REPLACE FUNCTION wallet_trg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wallet_balances_set_updated_at ON wallet_balances;
CREATE TRIGGER wallet_balances_set_updated_at
BEFORE UPDATE ON wallet_balances
FOR EACH ROW
EXECUTE FUNCTION wallet_trg_set_updated_at();


-- wallet_transactions: immutable audit log
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  currency TEXT NOT NULL,
  type TEXT NOT NULL,
  amount BIGINT NOT NULL,       -- signed amount: deposit +, withdrawal -
  balance_before BIGINT,        -- NULL allowed
  balance_after BIGINT,         -- NULL allowed
  ref_id UUID,                  -- optional reference (order id, tx id)
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (type IN (
    'deposit',
    'withdrawal',
    'reserve_for_trade',
    'release_reserve',
    'credit_reward',
    'claim_reward'
  ))
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_ref ON wallet_transactions(ref_id);
