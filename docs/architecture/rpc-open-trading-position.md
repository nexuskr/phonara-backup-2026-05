# RPC: open_trading_position

**Status**: Draft  
**Priority**: Critical  
**Related**: trading-wallet-contract.md, trading-wallet-implementation-plan.md

## Purpose

Open a new Long or Short trading position while correctly locking the required margin from the user's available balance.

This is one of the most critical operations in the entire platform because it directly affects user funds.

## Input Parameters

| Parameter     | Type     | Required | Description |
|---------------|----------|----------|-------------|
| `user_id`     | uuid     | Yes      | User who is opening the position |
| `symbol`      | string   | Yes      | Trading pair (e.g. "BTCUSDT") |
| `side`        | string   | Yes      | `"long"` or `"short"` |
| `size`        | numeric  | Yes      | Position size (in base currency or contracts) |
| `leverage`    | numeric  | Yes      | Leverage multiplier (e.g. 10, 20, 50) |
| `margin`      | numeric  | Yes      | Amount of margin to lock (in quote currency) |

## Preconditions / Validations

The RPC must validate the following **before** touching any balance:

1. User exists and is authenticated
2. `margin > 0`
3. User has sufficient `available_balance` in `wallet_balances`
4. `leverage` is within allowed range for the symbol/user tier
5. Symbol is valid and tradable
6. No existing conflicting position (if one-per-symbol policy is enforced)

## Balance Logic

### On Success:
- Decrease `available_balance` by `margin`
- Increase `locked_balance` by `margin`
- `total_balance` remains unchanged at this point

This operation must be **atomic**.

## Atomicity Requirement

This RPC **must** be implemented as an atomic operation:

**Recommended approaches:**
- Single Database Function with explicit transaction
- Or a carefully designed Edge Function that uses Supabase transactions

If the position creation fails after locking balance, the locked amount **must** be released back to `available_balance`.

## Success Response

```json
{
  "success": true,
  "position_id": "uuid",
  "locked_margin": 1234.56,
  "new_available_balance": 8765.43,
  "new_locked_balance": 1234.56
}
```

## Error Responses

| Error Code                    | Meaning                              | HTTP-like Status |
|-------------------------------|--------------------------------------|------------------|
| `insufficient_balance`        | Not enough available_balance         | 400              |
| `invalid_leverage`            | Leverage out of allowed range        | 400              |
| `invalid_symbol`              | Symbol not tradable                  | 400              |
| `position_limit_reached`      | User already has max positions       | 400              |
| `internal_error`              | Unexpected server error              | 500              |

## Frontend Responsibilities

- Call this RPC instead of manually updating balance
- Show clear loading state during the call
- On success: Refresh wallet via `useWallet` or `wallet:refresh` event
- On failure: Show specific error message based on error code
- Never optimistically lock balance on the client

## Implementation Notes

- This RPC should also create the initial position record in `live_positions` (or equivalent table)
- All balance changes must be logged in `transactions` or a dedicated trading ledger
- Consider adding `idempotency_key` parameter for safer retries

## Future Enhancements

- Support for isolated vs cross margin
- Partial position opening
- Pre-trade risk checks (max leverage per symbol, etc.)

## Success Criteria

- Calling this RPC never results in negative `available_balance`
- `locked_balance` correctly increases by the margin amount
- Position is created only if balance lock succeeds
- Clear and actionable error messages for users