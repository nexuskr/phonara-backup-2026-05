# Trading RPC Review Checklist (Atomic Balance Focus)

**Purpose**: Use this checklist when reviewing or implementing `live_open_position`, `live_close_position`, and related RPCs.

## 1. Atomicity

- [ ] Balance change and position state change happen in the **same database transaction**.
- [ ] If position creation fails after locking balance, the locked amount is **automatically released** (or rolled back).
- [ ] No partial state is left (e.g., balance locked but position not created).

## 2. Balance Handling (`wallet_balances`)

- [ ] `available_balance` is correctly decreased when opening a position.
- [ ] `locked_balance` is correctly increased by the margin amount.
- [ ] `available_balance + locked_balance` consistency is maintained.
- [ ] Negative `available_balance` is impossible.
- [ ] On close: `locked_balance` is fully released back to `available_balance`.
- [ ] PnL is correctly applied to `available_balance` (or `total_balance`).

## 3. Validation

- [ ] Sufficient `available_balance` is checked **before** locking.
- [ ] Leverage and margin validation happens before any balance change.
- [ ] Symbol and side validation is performed.

## 4. Idempotency

- [ ] `client_request_id` (or similar) is supported to safely handle retries.
- [ ] Duplicate requests with the same ID return the same result without double-charging balance.

## 5. Error Handling & Messages

- [ ] Clear, consistent error codes/messages are returned.
- [ ] Frontend can map errors to user-friendly messages.
- [ ] Audit failure logs are written on error paths (recommended).

## 6. Logging & Audit

- [ ] Important balance changes are logged with before/after values.
- [ ] Position ID and PnL are recorded with balance changes.
- [ ] Timestamp and user context are included.

## 7. Frontend Integration

- [ ] After successful RPC, `wallet:refresh` event or proper state update is triggered.
- [ ] Safety net subscriptions (e.g. `live_trade_history`) are still considered temporary.
- [ ] No direct balance manipulation from frontend during trading.

## 8. Overall Quality

- [ ] The RPC follows the principles in `trading-wallet-contract.md`.
- [ ] The implementation matches the requirements in `backend-rpc-requirements.md`.

## Notes

- Priority: Atomicity and correct balance movement are non-negotiable.
- Once these RPCs reliably meet the checklist, the frontend safety net in `use-wallet.ts` can be gradually reduced.

**Use this checklist during code review or implementation of trading-related RPCs.**