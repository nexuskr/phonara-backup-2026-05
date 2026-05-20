# Rate Limiting Strategy (PR-P0-1)

> Status: Documentation only. No backend RL is added in this PR.
> The `no-backend-rate-limiting` directive remains in effect — Lovable Cloud
> does not yet expose primitives for safe per-route RL on money-flow RPCs,
> so all rate limiting lives in **edge / infra / client** layers.

---

## Layer Model

```text
┌──────────────────────────────────────────────────────────┐
│  L1  Cloudflare WAF / Rate Limiting Rules  (infra)       │  ← future
├──────────────────────────────────────────────────────────┤
│  L2  Edge Function gate         (Deno / supabase fns)    │  ← per-fn token bucket
├──────────────────────────────────────────────────────────┤
│  L3  Client cooperative caps    (debounce / SWR / poll)  │  ← already live
├──────────────────────────────────────────────────────────┤
│  L4  Database — NO RL on money_flow RPCs                 │  ← forbidden
└──────────────────────────────────────────────────────────┘
```

Money flow RPCs (`request_withdrawal`, `credit_crypto_deposit`,
`imperial_place_phon_bet`, `imperial_settle_*`, `_apply_house_edge_split`,
`subscribe_vip_pass_phon`, `swap_*`, `stake_*`) **must not** be wrapped in
any DB-level RL. They are protected by:

- BEFORE INSERT triggers (`trg_enforce_leverage_gate`, kill switches)
- `is_account_frozen()` velocity guards
- AAL2 + OTP step-up enforcement
- Idempotency keys (`source + ref_id + ref_type` unique)

These guards are correctness, not RL. Adding RL on top would risk
silently dropping legitimate executions during volatility spikes.

---

## L1 — Cloudflare (planned)

Where: in front of `*.lovable.app` and `phonara.world`.

Suggested rules (apply when CF is configured for the apex domain):

| Path pattern                                  | Rule                          | Action     |
|-----------------------------------------------|-------------------------------|------------|
| `/auth/v1/*` (signup, otp, password)          | 20 req / 5 min / IP           | Challenge  |
| `/functions/v1/send-otp*`                     | 5 req / 5 min / IP            | Block 10m  |
| `/functions/v1/send-push*`                    | 30 req / 1 min / IP           | Challenge  |
| `/functions/v1/oracle-refresh*`               | system-only — block public IP | Block      |
| `/rest/v1/rpc/get_*` (public read RPCs)       | 600 req / 1 min / IP          | Challenge  |
| All other `/rest/v1/rpc/*`                    | 300 req / 1 min / IP          | Challenge  |
| `/rest/v1/rpc/request_withdrawal`             | **NO RL** (money flow)        | Pass-through |
| `/rest/v1/rpc/imperial_place_phon_bet`        | **NO RL** (money flow)        | Pass-through |

Bot fight mode: ON for `/auth/*`, OFF for `/rest/v1/*` (interferes with
realtime websocket upgrades).

JS Challenge timeout: 30s — short enough that mobile users on flaky
networks aren't trapped after a brief disconnect.

---

## L2 — Edge functions

Pattern (token bucket, in-memory per isolate; best-effort):

```ts
// supabase/functions/_shared/rateLimit.ts (NOT YET CREATED)
const buckets = new Map<string, { tokens: number; last: number }>();
export function take(key: string, rate: number, burst: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: burst, last: now };
  const elapsed = (now - b.last) / 1000;
  b.tokens = Math.min(burst, b.tokens + elapsed * rate);
  b.last = now;
  if (b.tokens < 1) { buckets.set(key, b); return false; }
  b.tokens -= 1; buckets.set(key, b);
  return true;
}
```

Apply ONLY to:

- `send-otp` — 1 req / 30s per phone+ip
- `send-push` — 3 req / day per user (already enforced via `push_send_log`)
- `emperor-coach` — 10 req / hour per user (LLM cost guard)

Do NOT apply to money-flow edges (`imperial-bet-place`, `imperial-settle`,
`oracle-refresh*`, `credit-crypto-deposit`, `request-withdrawal-*`).

---

## L3 — Client cooperative caps (live)

This PR materially improves L3 by migrating 5 polling hooks from raw
`setInterval` to `setVisibleInterval` from `@/lib/util/visible-interval`.
Background tabs no longer fire the RPC at all.

Migrated:

| Hook                       | RPC                          | Interval | Category   |
|----------------------------|------------------------------|----------|------------|
| `useRecentPhonWins`        | `get_recent_phon_wins`       | 60s      | cosmetic   |
| `usePhonTraders24h`        | `get_phon_traders_24h`       | 60s      | cosmetic   |
| `useMissionRecovery`       | `get_mission_recovery_state` | 5m       | cosmetic   |
| `useHotSymbols`            | `get_hot_symbols_24h`        | 30s      | cosmetic   |
| `useSymbolSideCounts`      | `get_symbol_side_counts`     | 15s      | cosmetic   |
| `usePhonHubSummary`        | `phon_hub_summary`           | 12s      | cosmetic   |

Each registers with the Phase 2 visibility ledger (`owner` + `category`)
so the DEV runtime governor can pause/resume by category and surface
entropy in `<EntropyChip />`.

Additional client caps already in place (no change in this PR):

- Public-RPC SWR whitelist (`@pkg/core/swr.ts`, PR-M)
- Realtime 4-partition channel reuse (`@pkg/realtime`, PR-J/N)
- `_headers` immutable assets / HTML must-revalidate (PR-M)

---

## L4 — Database

Forbidden. See `<no-backend-rate-limiting>` directive.

If a security scanner flags missing RL on a money-flow RPC, suppress the
finding with a memory note pointing here. The mitigation is correctness
(triggers + idempotency + AAL2 + freeze guards), not RL.

---

## Verification

After this PR:

1. Open the app in two tabs. Park one in the background.
2. Wait 2 minutes.
3. In DevTools → Network of the backgrounded tab, confirm zero new calls
   to the 6 RPCs above.
4. Switch back to the backgrounded tab. Confirm a single catch-up call
   fires within 1s of focus.

Expected reduction in background RPC volume from a single idle desktop
client: ~30 calls/min → 0.
