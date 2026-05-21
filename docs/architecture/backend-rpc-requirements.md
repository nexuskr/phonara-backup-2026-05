# Backend RPC Requirements for Trading + Balance

**Date**: 2026-05-22  
**Purpose**: Define what the critical backend RPCs must guarantee to align with our architecture.

## Core RPCs

### 1. `live_open_position`

**Must Guarantee:**
- Atomicity: Balance lock (`available_balance` → `locked_balance`) + Position creation must succeed or fail together.
- Validation: Check sufficient `available_balance` before locking.
- Idempotency: Support `client_request_id` to handle retries safely.
- Error handling: Clear, actionable error messages (insufficient balance, invalid leverage, etc.).
- Logging: Record the operation for audit.

**Should NOT:**
- Leave balance in inconsistent state if position creation fails.
- Allow negative `available_balance`.

### 2. `live_close_position`

**Must Guarantee:**
- Atomicity: Release locked margin + Apply realized PnL in one transaction.
- Correct PnL calculation based on entry, close price, side, and leverage.
- Full release of `locked_balance` back to `available_balance`.
- Update position status properly.
- Trigger wallet refresh or notify properly.

**Should NOT:**
- Leave `locked_balance` partially released.
- Apply PnL without releasing margin.

### 3. `live_liquidate_position`

**Must Guarantee:**
- Atomic handling of liquidation (apply loss, release margin, close position).
- Proper loss calculation.
- Clear audit trail.

## General Requirements for All Trading RPCs

- All balance mutations must go through these RPCs (no direct table updates from client).
- Use database transactions for atomicity.
- Maintain `available_balance + locked_balance` consistency.
- Log important state changes (before/after balance, PnL, position ID).
- Support proper error codes that frontend can map to user-friendly messages.

## Current Gaps (as of analysis)

- We rely on `wallet:refresh` event as a safety net after RPC calls.
- True atomicity between balance and position state needs verification inside the RPCs.
- Clear contract between these RPCs and `wallet_balances` table needs to be enforced.

## Recommended Next Steps

1. Review existing `live_open_position` and `live_close_position` implementations against this spec.
2. Add missing atomicity guarantees if not present.
3. Strengthen error handling and logging.
4. Update frontend to reduce reliance on safety nets once RPCs are reliable.

## Notes

This document should be used as the acceptance criteria when implementing or reviewing the trading RPCs.