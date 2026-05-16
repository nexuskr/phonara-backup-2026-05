#!/usr/bin/env node
/**
 * scripts/check-money-flow-freeze.mjs
 *
 * CI guard for the Phase 2 Visibility plan: the FREEZE inventory listed in
 * .lovable/plan.md must remain in lockstep with ESLint protected paths
 * (which prevent direct sonner / raw channel access in money-flow code).
 *
 * Fails if any plan-listed FREEZE path is missing from the source tree.
 */
import fs from "node:fs";
import path from "node:path";

const FREEZE = [
  "src/packages/wallet/hooks/useDeposit.ts",
  "src/packages/wallet/hooks/useDepositRealtime.ts",
  "src/packages/wallet/hooks/useDepositCountdown.ts",
  "src/lib/paper-trading/bybit-feed.ts",
  "src/components/crash/hooks/useCrashRound.ts",
  "src/components/trading/MegaOrderPanel.tsx",
  "src/hooks/use-kill-switches.ts",
  "src/hooks/use-auto-bet.ts",
];

const missing = FREEZE.filter((p) => !fs.existsSync(path.resolve(p)));
if (missing.length > 0) {
  console.error("[freeze] money-flow inventory drift — missing files:");
  for (const m of missing) console.error("  - " + m);
  console.error("Update .lovable/plan.md FREEZE inventory or restore the path.");
  process.exit(1);
}
console.log("[freeze] OK — " + FREEZE.length + " money-flow paths intact.");
