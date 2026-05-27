/**
 * Duel Game Engine - 1v1 PvP Game
 *
 * Features:
 * - Matchmaking system
 * - Score calculation
 * - House edge application
 * - Draw handling
 */

import { SeededRandom } from "./rng";
import { HOUSE_EDGE_PERCENT } from "./game-catalog";
import type { DuelOutcome } from "./gaming-types";

export interface DuelMatchConfig {
  player1Id: string;
  player2Id: string;
  betAmount: number;
  seed: string;
}

/**
 * Simulate a duel match
 */
export function simulateDuelMatch(config: DuelMatchConfig): DuelOutcome {
  const rng = new SeededRandom(config.seed);

  // Generate player scores (0-100)
  const p1Score = rng.integer(0, 100);
  const p2Score = rng.integer(0, 100);

  // Determine winner
  let playerResult: "win" | "loss" | "draw";
  let reason:
    | "superior_score"
    | "timeout"
    | "disconnect"
    | "draw"
    | "house_edge";

  if (p1Score === p2Score) {
    playerResult = "draw";
    reason = "draw";
  } else if (p1Score > p2Score) {
    // Apply house edge: 2% chance that higher scorer loses
    const applyHouseEdge = rng.float(0, 100) < HOUSE_EDGE_PERCENT / 2;
    if (applyHouseEdge) {
      playerResult = "loss";
      reason = "house_edge";
    } else {
      playerResult = "win";
      reason = "superior_score";
    }
  } else {
    const applyHouseEdge = rng.float(0, 100) < HOUSE_EDGE_PERCENT / 2;
    if (applyHouseEdge) {
      playerResult = "loss";
      reason = "house_edge";
    } else {
      playerResult = "win";
      reason = "superior_score";
    }
  }

  return {
    type: "duel",
    matchId: `match-${Date.now()}`,
    opponent: {
      id: config.player2Id,
      username: `opponent-${config.player2Id.substring(0, 8)}`,
    },
    playerResult,
    playerScore: p1Score,
    opponentScore: p2Score,
    reason,
    houseEdgeApplied: HOUSE_EDGE_PERCENT / 100,
  };
}

/**
 * Calculate duel payout
 */
export function calculateDuelPayout(
  outcome: DuelOutcome,
  betAmount: number,
  isWinner: boolean,
): number {
  if (!isWinner) {
    return 0; // Loser gets nothing
  }

  if (outcome.playerResult === "draw") {
    return betAmount; // Draw refund
  }

  if (outcome.playerResult === "win") {
    // 2x payout minus house edge
    const payout = betAmount * 2;
    const houseEdgeCut = Math.floor((payout * HOUSE_EDGE_PERCENT) / 100);
    return payout - houseEdgeCut;
  }

  return 0;
}

/**
 * Validate duel outcome
 */
export function validateDuelOutcome(outcome: DuelOutcome): boolean {
  if (outcome.playerScore < 0 || outcome.playerScore > 100) return false;
  if (outcome.opponentScore < 0 || outcome.opponentScore > 100) return false;
  if (!outcome.opponent?.id) return false;
  return true;
}
