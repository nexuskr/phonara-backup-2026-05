# Phase 3.5 Hardening — Limited Rollout Production Bible

Imperial Empire PHON Real Betting의 마지막 Hardening 단계 — Safety, Token Burn + NFT Synergy, Cinematic, Rollback, Admin Controls, Limited Rollout.

## 1. Global Safety

### Tables
- `imperial_kill_switches(key pk, enabled, reason, updated_at, updated_by)` — authenticated SELECT, admin RPC write only.
- `imperial_kill_switch_audit` — append-only, admin SELECT.

### Switches (default OFF)
| key | scope |
|---|---|
| `imperial_betting` | All Imperial Duel placements |
| `imperial_flywheel` | Flywheel split + injection cron |
| `imperial_withdrawal` | Withdraw RPC entry guard |
| `imperial_burn` | `apply_token_burn` short-circuit |
| `imperial_nft_mint` | `_maybe_upgrade_nft` short-circuit |

### RPCs
- `imperial_is_betting_allowed()` → bool
- `admin_set_imperial_kill_switch(_key, _enabled, _reason)` (admin)
- `emergency_freeze_all(_reason)` / `emergency_unfreeze_all(_reason)` (admin AAL2)

## 2. Token Burn + NFT Synergy

### Burn Rates (`imperial_get_burn_rate`)
- House Edge: **26%** base + volatility tier extra
- Volatility extra (per tier): calm 0.8% / warm 1.2% / hot 1.8% / surge 2.4% / extreme 3.2%
- Near-miss strong band: 12% .. 22% (RNG)

### NFT Tiers (`imperial_nft_tier_for`)
| Tier | Name | Threshold (PHON) | Rev Share | Yield Boost | Gov Weight |
|---|---|---|---|---|---|
| 1 | Ember Witness | 1,000 | 0.05% | +0.25% | 1× |
| 2 | Flame Sovereign | 25,000 | 0.15% | +0.75% | 3× |
| 3 | Pyric Marshal | 250,000 | 0.40% | +2.00% | 8× |
| 4 | Eternal Sacrifice | 2,500,000 | 1.00% | +5.00% | 21× |
| 5 | Imperial Ascendant | 25,000,000 | 2.50% | +12.00% | 55× |

### Ledger & Idempotency
`imperial_token_burns` unique on `(source, ref_id, ref_type)` — calling `apply_token_burn` twice for the same ref is a no-op. NFT tier upgrade is monotonic (downgrade impossible).

## 3. Cinematic + Thunder Reverb

### Components
- `BurnRevealOverlay` — per-tier ring/glow/label, mounts on every confirmed bet
- `MythicThunder` — Tier-5 only, lazy-loaded, lightning + screen shake + particle storm
- `NftUpgradeReveal` — Golden Rift + crown particles + perks plate (3.6s)

### Audio (`useImperialThunderWithReverb`)
- WebAudio: noise burst → low-pass sweep → procedural ConvolutionReverb (2.2s normal / 3.6s mythic)
- Sub-bass rumble (55Hz → 22Hz)
- Respects `prefers-reduced-motion`; disabled inside `degrade:` / `low:` Tailwind variants

## 4. Rollback

`rollback_injection_event(_event_id, _reason)` (admin AAL2):
1. `FOR UPDATE` lock event row, refuse if `rolled_back_at` set
2. Snapshot `pre` → `imperial_rollback_snapshots`
3. Append reversal entry to `imperial_treasury_ledger` (kind=`injection_in_out`, amount = `-original`)
4. Mark `imperial_injection_events.rolled_back_at/_by`
5. Write `post` snapshot

Tests: `src/__tests__/flywheel/rollback.test.ts` (math) + admin Drill (live event).

## 5. Admin `/admin/duel` Flywheel Tab

`<FlywheelAdmin>` now mounts:
- `<FlywheelEmergencyPanel>` — FREEZE ALL / UNFREEZE ALL (reason required) + 5 per-switch toggles
- `<FlywheelRollbackPanel>` — last 50 injections, one-click rollback (reason + double confirm)
- `<BurnLeaderboardPanel>` — Top 20 burners + NFT tier distribution
- Existing KPI cards, heatmap, injection history, param hot-reload, kill switches

All 15s auto-refresh, AAL2 gated for sensitive RPCs.

## 6. Limited Rollout Guardrails

- `imperial_rollout_tiers.tier` 0..3, default 0 (block)
- `imperial_rollout_consents` self-insert via `imperial_record_consent()`
- `imperial_can_participate(_user)` returns `{tier, consented, betting_allowed, can_play, daily_cap_phon}`
- `<ImperialRolloutGate>` wraps RealBetSlip mount points

### Daily caps
| Tier | Cap |
|---|---|
| 0 | 0 (blocked) |
| 1 | 50,000 PHON |
| 2 | 250,000 PHON |
| 3 | ∞ |

## 7. Guardrails — Money-Flow FREEZE

All 8 money-flow paths listed in `scripts/check-money-flow-freeze.mjs` are git diff = 0:

```
src/packages/wallet/hooks/useDeposit.ts
src/packages/wallet/hooks/useDepositRealtime.ts
src/packages/wallet/hooks/useDepositCountdown.ts
src/lib/paper-trading/bybit-feed.ts
src/components/crash/hooks/useCrashRound.ts
src/components/trading/MegaOrderPanel.tsx
src/hooks/use-kill-switches.ts
src/hooks/use-auto-bet.ts
```

`imperial_place_phon_bet` / `imperial_settle_phon_bet` SQL bodies unchanged. Burn integration is via new RPC `apply_token_burn` callable from existing `_apply_house_edge_split` in a follow-up surgical 1-line patch (deferred until limited rollout opens).

## 8. Rollout Plan

1. **Internal alpha (Tier 1, 5 users, 72h)** — `imperial_burn` ON, `imperial_nft_mint` ON, all others OFF
2. **Closed beta (Tier 2, 50 users, 7d)** — monitor edge variance 6.0~6.4%, rollback drill once
3. **Open beta (Tier 3, public consent)** — auto-promote Tier 3 on consent + AML pass
4. Kill switch any time → full freeze in <500ms via `emergency_freeze_all`

## 9. QA Checklist

- [x] `bun run test src/__tests__/flywheel/*` (burn-rates + rollback math)
- [x] `node scripts/check-money-flow-freeze.mjs` PASS
- [x] `node scripts/check-operator-isolation.mjs` PASS
- [x] Lighthouse 60fps on `BurnRevealOverlay` Tier 5 (Mythic Thunder + particle storm)
- [x] Manual: FREEZE ALL → RealBetSlip "frozen" branch renders
- [x] Manual: Rollback injection → treasury balance restored in next snapshot
