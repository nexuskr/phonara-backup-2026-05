/**
 * Slots Game Engine - Core mechanics
 *
 * Features:
 * - RNG-based spin outcome generation
 * - Paytable evaluation
 * - Bonus trigger detection
 * - House edge application
 */

import { SeededRandom } from "./rng";
import {
  PAYTABLES,
  SYMBOL_WEIGHTS,
  BONUS_CONFIG,
  HOUSE_EDGE_PERCENT,
} from "./game-catalog";
import type {
  GameTheme,
  SlotsOutcome,
  PaylineMatch,
  BonusOutcome,
} from "./gaming-types";

const REELS = 5;
const ROWS = 3;
const SYMBOLS_PER_POSITION = 11; // 0-10

/**
 * Payline definitions (243 ways to win)
 * Each payline is an array of row indices for each reel
 */
export const PAYLINES_243 = generatePaylines243();

function generatePaylines243(): number[][] {
  const paylines: number[][] = [];
  // Generate all 3^5 = 243 combinations
  for (let i = 0; i < 243; i++) {
    const payline: number[] = [];
    let temp = i;
    for (let reel = 0; reel < REELS; reel++) {
      payline.push(temp % ROWS);
      temp = Math.floor(temp / ROWS);
    }
    paylines.push(payline);
  }
  return paylines;
}

interface SpinConfig {
  betAmount: number;
  gameId: GameTheme;
  seed: string;
  multiplyBonus?: number; // For free spins bonus
}

/**
 * Spin outcome generator
 */
export function spinSlots(config: SpinConfig): SlotsOutcome {
  const rng = new SeededRandom(config.seed);
  const weights = SYMBOL_WEIGHTS[config.gameId];

  // Generate reel results
  const reels: number[][] = [];
  for (let reelIdx = 0; reelIdx < REELS; reelIdx++) {
    const reel: number[] = [];
    for (let rowIdx = 0; rowIdx < ROWS; rowIdx++) {
      // Pick random symbol based on weights
      const symbol = rng.weighted(weights.map((w, idx) => [idx, w] as const));
      reel.push(symbol);
    }
    reels.push(reel);
  }

  // Evaluate paylines
  const paylines: PaylineMatch[] = [];
  let totalBaseWin = 0;
  let scatterCount = 0;
  const paytable = PAYTABLES[config.gameId];

  for (let lineIdx = 0; lineIdx < PAYLINES_243.length; lineIdx++) {
    const payline = PAYLINES_243[lineIdx];

    // Get symbols on this payline
    const symbols = payline.map((rowIdx, reelIdx) => reels[reelIdx][rowIdx]);

    // Count consecutive matching symbols from left
    let matchCount = 1;
    for (let i = 1; i < symbols.length; i++) {
      if (symbols[i] === symbols[0]) matchCount++;
      else break;
    }

    const symbol = symbols[0];

    // Check for scatter (always wins regardless of position)
    if (symbol === 10) scatterCount++;

    // Regular payline matching (3+)
    if (matchCount >= 3 && symbol < 9) {
      // Exclude wild/scatter for normal paylines
      const multiplier = paytable[symbol]?.[matchCount - 3] || 0;
      const payout = Math.floor(multiplier * config.betAmount);

      if (payout > 0) {
        paylines.push({
          paylineId: lineIdx,
          symbols: symbols.map((s) => getSymbolName(s)),
          matchCount,
          multiplier,
          payout,
        });
        totalBaseWin += payout;
      }
    }
  }

  // Bonus trigger (3+ scatters)
  const bonusTriggered =
    scatterCount >= (BONUS_CONFIG[config.gameId].scatterTrigger ?? 3);
  let bonusOutcome: BonusOutcome | undefined;
  let totalBonusWin = 0;

  if (bonusTriggered) {
    bonusOutcome = simulateBonus(rng, config.gameId, config.betAmount);
    totalBonusWin = bonusOutcome.totalBonus;
  }

  const totalWinBeforeHouse = totalBaseWin + totalBonusWin;
  const houseEdgeReduction = Math.floor(
    totalWinBeforeHouse * (HOUSE_EDGE_PERCENT / 100),
  );
  const totalWin = Math.max(0, totalWinBeforeHouse - houseEdgeReduction);

  return {
    type: "slots",
    reels: reels as readonly number[][],
    symbols: reels.map((reel) => reel.map(getSymbolName)) as readonly string[],
    paylines,
    baseWin: totalBaseWin,
    bonusTriggered,
    bonusOutcome,
    totalWin,
  };
}

/**
 * Simulate bonus outcome (simplified)
 */
function simulateBonus(
  rng: SeededRandom,
  gameId: GameTheme,
  betAmount: number,
): BonusOutcome {
  const config = BONUS_CONFIG[gameId];

  // Simplified: random bonus payout (normally per-game specific)
  const bonusMultiplier = rng.float(10, 50);
  const totalBonus = Math.floor(bonusMultiplier * betAmount);

  return {
    type: "generic_bonus",
    spins: config.freeSpin as number,
    wins: Math.floor(rng.integer(1, 5)),
    totalBonus,
  };
}

/**
 * Get symbol name by index
 */
function getSymbolName(index: number): string {
  const names = [
    "10",
    "J",
    "Q",
    "K",
    "A",
    "P1",
    "P2",
    "P3",
    "P4",
    "WILD",
    "SCATTER",
  ];
  return names[index] ?? "UNKNOWN";
}

/**
 * Validate spin outcome
 */
export function validateSpinOutcome(
  outcome: SlotsOutcome,
  seed: string,
): boolean {
  if (!seed || typeof seed !== "string") return false;
  if (outcome.reels.length !== REELS) return false;
  if (outcome.reels.some((r) => r.length !== ROWS)) return false;
  if (outcome.totalWin < 0) return false;
  if (!outcome.bonusTriggered && outcome.bonusOutcome) return false;

  return true;
}

/**
 * Calculate RTP for a game (via simulation)
 */
export function calculateGameRTP(
  gameId: GameTheme,
  simulationCount: number = 100000,
): number {
  let totalBet = 0;
  let totalWin = 0;
  const betAmount = 1; // Normalized

  for (let i = 0; i < simulationCount; i++) {
    const seed = i.toString(16).padStart(16, "0");
    const outcome = spinSlots({
      betAmount,
      gameId,
      seed,
    });

    totalBet += betAmount;
    totalWin += outcome.totalWin;
  }

  return totalWin / totalBet;
}
