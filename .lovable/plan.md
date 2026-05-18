# Phonara Ω∞ — Sovereign Verification Organism

Ascension of the governance kernel from "test framework" into a **constitutional runtime** that discovers, models, attacks, replays, audits, and quarantines itself — without ever touching the immutable money-flow, operator isolation, or settlement RPC bodies.

## Immutable laws (0-byte freeze)

- 8 money-flow paths
- `imperial_*` RPC bodies
- Operator isolation chunks
- RLS / SECURITY DEFINER allowlist
- Realtime partition wrappers

Every artifact below lives under `governance-kernel/`. Nothing in `src/`, `supabase/migrations/`, or `supabase/functions/` is mutated by this plan.

## Phase order (no skipping, no parallel constitutional mutation)

```text
P0 Topology Constitution
   └─ P1 Financial Ledger Physics
        └─ P2 Realtime Adversarial Sim
             └─ P3 Court-Admissible Replay
                  └─ P4 Zero-Trust Operator Fortress
                       └─ P5 Sovereign Governance Score
                            └─ P6 Adversarial Dual-AI
                                 └─ P7 Self-Governing Loop
```

Each phase ends with a signed snapshot + governance score delta. The next phase cannot start until the previous phase's score ≥ 92 on its own axis.

---

## P0 — Topology as constitutional state

Reality is **discovered**, never asserted by humans.

```
governance-kernel/topology/
  discover.migrations.ts      # parse supabase/migrations/*.sql → tables, FKs, triggers
  discover.rpcs.ts            # pg_proc introspection via read_query
  discover.edges.ts           # supabase/functions/* manifest + verify_jwt + secrets
  discover.routes.ts          # vite route + lazy chunk map
  discover.realtime.ts        # @pkg/realtime partition + region shards
  discover.oracle.ts          # oracle_source_weights + health
  signed.snapshot.ts          # SHA-256 over canonical JSON, ed25519 signature
  topology.diff.engine.ts     # prev vs next → additions/removals/mutations
  topology.constitution.json  # immutable laws + invariant generators
```

Deploy gate: `constitution(prev) → constitution(next)` must not violate immutable laws. Diff engine outputs `governance-kernel/reports/topology-diff-<ts>.json`.

## P1 — Ledger physics (state-transition correctness)

```
governance-kernel/financial/
  transition.physics.ts          # legal predecessor/successor state derivation
  impossible-state.detector.ts   # negative temporal balance, phantom mint, orphan delta
  double-spend.simulator.ts      # idempotency key collision fuzz
  concurrent-ledger-fuzzer.ts    # 1M synthetic mutations, deterministic seed
  conservation.prover.ts         # Σ(assets+liabilities+treasury) invariant
```

Targets: 1M concurrent synthetic mutations, deterministic replay, zero conservation violation. Runs against an **ephemeral shadow schema** — never the live `imperial_*` or `wallet_*` tables.

## P2 — Realtime adversarial distributed-system warfare

```
governance-kernel/realtime/
  shard-desync.injector.ts    # AP 9s delay, EU dup frames, US partial corruption
  split-brain.simulator.ts
  quorum-collapse.ts
  reconnect-herd.ts           # 50k synthetic clients
  ws-memory-pressure.ts
  clock-skew.injector.ts
```

Success: no balance divergence, no duplicate settlement, no phantom payout, no UI state hallucination. Executed against a sandboxed realtime broker mirror — production realtime untouched.

## P3 — Court-admissible replay capsules

```
governance-kernel/replay/
  capsule.signature.ts      # ed25519 over capsule manifest
  deterministic.hash.ts     # canonical JSON + stable key order
  replay.proof.ts           # divergence → identifies nondeterministic source
```

Capsule contains: topology hash, migration hash, oracle hash, edge fn hash, ws frame checksum, storage checksum, runtime seed. Replay confidence becomes a governance multiplier in P5.

## P4 — Zero-trust operator fortress

```
governance-kernel/fortress/
  privilege-escalation.scanner.ts
  jwt-scope-diff.ts
  admin-surface-shadow.ts
  secret-leak.forensics.ts
```

Scans: source maps, hydration payloads, HAR, IndexedDB, service workers, preload graphs, ws payloads, memory snapshots, console, env exposure. Extends existing `scripts/check-operator-isolation.mjs`; no production admin code changes.

## P5 — Sovereign governance score (deploy gate, not report)

```
governance-kernel/governance/
  score.compute.ts              # 12-axis weighted aggregate 0..100
  constitutional.thresholds.ts  # 92 / 80 cutoffs
  deploy.lock.ts                # writes .governance-lock if score < threshold
  drift.penalty.ts
```

Behaviour:
- `< 92` → rollout frozen, migrations blocked at CI, alerts escalated, replay sampling intensified
- `< 80` → only rollback/hotfix lanes permitted
- No human override. Lock removed only by a passing recompute.

CI integration: new `.github/workflows/governance-gate.yml` blocks merge when lock present.

## P6 — Adversarial dual-AI (generator / hostile verifier / auditor)

```
governance-kernel/dual-ai/
  adversary.engine.ts
  mutation.breaker.ts
  exploit.inventor.ts
  constitutional.crossexaminer.ts
```

Verifier is hostile: invents exploit chains, mutates ws ordering, RPC timings, oracle inputs, replay seeds, admin boundaries, topology assumptions. Auditor rejects unverifiable assumptions, hidden side effects, mutation amplification, non-deterministic repairs. No single AI may generate + approve + replay + merge the same artifact chain.

## P7 — Self-governing loop

```
governance-kernel/loop/
  scheduler.ts        # discover → model → attack → replay → audit → score → quarantine
  quarantine.bus.ts   # auto-isolates regressing surfaces
  evolution.gate.ts   # blocks unsafe evolution (constitution diff + score drop)
```

Continuous 24/7 loop. Output: `governance-kernel/reports/state-<ts>.json` + dashboard at `/admin/ops/governance` (AAL2, read-only, no money-flow touch).

---

## What this plan explicitly does NOT touch

- `imperial_place_phon_bet`, `_settle_*`, `_apply_house_edge_split` bodies
- `request_withdrawal`, `credit_crypto_deposit`, `subscribe_vip_pass_phon`
- `award_crown`, `recompute_empire_level`
- 8 money-flow paths (verified by `scripts/check-money-flow-freeze.mjs`)
- Operator chunk boundaries (verified by `scripts/check-operator-isolation.mjs`)
- Existing RLS policies, SECURITY DEFINER allowlist, realtime partitions

## Execution cadence

One phase per directive cycle. Each phase ends with:
1. Signed topology snapshot
2. Governance score axis update
3. Reports written to `governance-kernel/reports/`
4. Explicit "ready for next phase" confirmation

No production chaos. No auto-merge for treasury / RLS / settlement. Begin **P0 only** on approval.
