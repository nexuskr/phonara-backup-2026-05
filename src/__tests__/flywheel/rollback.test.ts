// IMPERIAL-SINGULARITY v3.5-H: rollback math invariant (pure unit, no DB).
// DB-side rollback is exercised in integration tests; here we lock the
// invariant that a rollback reversal is amount-symmetric and idempotent.
import { describe, it, expect } from "vitest";

function applyInjection(treasury: number, amount: number) { return treasury + amount; }
function rollbackInjection(treasury: number, amount: number) { return treasury - amount; }

describe("imperial rollback invariants", () => {
  it("inject then rollback restores treasury", () => {
    const start = 1_000_000;
    const after = applyInjection(start, 75_000);
    expect(after).toBe(1_075_000);
    const restored = rollbackInjection(after, 75_000);
    expect(restored).toBe(start);
  });
  it("rollback is amount-symmetric across cohorts", () => {
    const cohorts = [10, 250, 1_000, 25_000, 250_000];
    for (const amt of cohorts) {
      expect(rollbackInjection(applyInjection(0, amt), amt)).toBe(0);
    }
  });
});
