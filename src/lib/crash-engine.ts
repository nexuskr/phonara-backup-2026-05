/**
 * Crash Game Engine - Multiplier-based Betting Game
 *
 * Features:
 * - Exponential multiplier growth
 * - Crash point calculation
 * - Cashout logic
 * - High volatility with big win potential
 */

import { SeededRandom } from "./rng";
import { HOUSE_EDGE_PERCENT } from "./game-catalog";
import type { CrashOutcome } from "./gaming-types";

export interface CrashGameConfig {
  seed: string;
  betAmount: number;
  playerCashout?: number; // Null if player didn't cash out
}

/**
 * Simulate a crash game round
 */
export function simulateCrashGame(config: CrashGameConfig): CrashOutcome {
  const rng = new SeededRandom(config.seed);

  // Generate crash point (weighted towards early crashes)
  // Using geometric distribution for realistic crash patterns
  const crashProbabilityPerTick = 0.02 + HOUSE_EDGE_PERCENT / 1000; // ~2-4% base
  let multiplier = 1.0;
  let ticks = 0;
  const maxTicks = 1000; // Prevent infinite loops

  while (ticks < maxTicks && !rng.boolean(crashProbabilityPerTick)) {
    multiplier *= 1.08; // 8% growth per tick (100ms)
    ticks++;
  }

  // Add randomness to crash point
  const crashPoint = Math.min(multiplier * (0.95 + rng.float(0, 0.1)), 100); // Cap at 100x

  // Determine if player cashed out
  let playerCashout = config.playerCashout;
  let wasCashedOut = false;
  let profitLoss = 0;

  if (playerCashout !== undefined && playerCashout !== null) {
    wasCashedOut = playerCashout <= crashPoint; // Successful cashout if before crash
    if (wasCashedOut) {
      profitLoss = Math.floor(config.betAmount * (playerCashout - 1));
    } else {
      profitLoss = -config.betAmount; // Lost entire bet
    }
  } else {
    // No cashout attempt = loss
    profitLoss = -config.betAmount;
  }

  return {
    type: "crash",
    crashPoint,
    playerCashout: playerCashout ?? undefined,
    wasCashedOut,
    profitLoss,
  };
}

/**
 * Calculate crash game payout
 */
export function calculateCrashPayout(
  outcome: CrashOutcome,
  betAmount: number,
): number {
  if (!outcome.wasCashedOut || outcome.profitLoss < 0) {
    return 0; // Crash before cashout = loss
  }

  // Profit with house edge applied
  const grossProfit = outcome.profitLoss;
  const houseEdgeCut = Math.floor((grossProfit * HOUSE_EDGE_PERCENT) / 100);

  return Math.max(0, betAmount + grossProfit - houseEdgeCut);
}

/**
 * Simulate crash game history (for leaderboard/analytics)
 */
export function simulateCrashGameSession(
  seed: string,
  numberOfRounds: number = 10,
): CrashOutcome[] {
  const rng = new SeededRandom(seed);
  const outcomes: CrashOutcome[] = [];

  for (let i = 0; i < numberOfRounds; i++) {
    const roundSeed = rng.hex(16);
    // Random player action: 40% cash out, 60% crash
    const playerCashout = rng.boolean(0.4)
      ? rng.float(1.1, 3.0) // Random cashout between 1.1x and 3x
      : undefined;

    const outcome = simulateCrashGame({
      seed: roundSeed,
      betAmount: 100, // Normalized
      playerCashout,
    });

    outcomes.push(outcome);
  }

  return outcomes;
}

/**
 * Validate crash outcome
 */
export function validateCrashOutcome(outcome: CrashOutcome): boolean {
  if (outcome.crashPoint < 1.0 || outcome.crashPoint > 1000) return false;
  if (
    outcome.playerCashout !== undefined &&
    (outcome.playerCashout < 1.0 || outcome.playerCashout > 1000)
  ) {
    return false;
  }
  if (typeof outcome.wasCashedOut !== "boolean") return false;
  if (outcome.profitLoss >= 0 && !outcome.wasCashedOut) return false; // Profit should only exist if cashed out
  return true;
}

/**
 * Calculate average crash point (for fairness audit)
 */
export function calculateAverageCrashPoint(outcomes: CrashOutcome[]): number {
  if (outcomes.length === 0) return 0;
  const sum = outcomes.reduce((acc, o) => acc + o.crashPoint, 0);
  return sum / outcomes.length;
}

/**
 * Calculate win rate (% of successful cashouts)
 */
export function calculateCrashWinRate(outcomes: CrashOutcome[]): number {
  if (outcomes.length === 0) return 0;
  const wins = outcomes.filter(
    (o) => o.wasCashedOut && o.profitLoss >= 0,
  ).length;
  return (wins / outcomes.length) * 100;
}
