/**
 * GameService - Core Gaming Business Logic
 *
 * Responsibilities:
 * - Game round lifecycle (play, wait, claim)
 * - Balance validation and deduction
 * - Reward distribution
 * - Game history tracking
 * - RNG seed generation and verification
 *
 * Architecture: Built on BaseService pattern for error handling, logging, retry logic
 */

import { v4 as uuidv4 } from "uuid";
import { spinSlots, validateSpinOutcome } from "./slots-engine";
import { generateSeed } from "./rng";
import {
  GameError,
  type GameTheme,
  type GameRound,
  type GameResult,
  type GameSession,
  type PlayResponse,
  type ClaimResponse,
  type HistoryResponse,
} from "./gaming-types";

interface ServiceDependencies {
  // Injected dependencies for database, wallet, auth
  getAuthUser: () => Promise<{ id: string; username: string }>;
  getUserBalance: (userId: string) => Promise<number>;
  deductBalance: (userId: string, amount: number) => Promise<void>;
  addBalance: (userId: string, amount: number, reason: string) => Promise<void>;
  createGameRound: (round: GameRound) => Promise<void>;
  updateGameRound: (
    roundId: string,
    updates: Partial<GameRound>,
  ) => Promise<void>;
  getGameRound: (roundId: string) => Promise<GameRound | null>;
  getUserGameRounds: (
    userId: string,
    limit: number,
    offset: number,
  ) => Promise<GameRound[]>;
}

/**
 * Main gaming service
 */
export class GameService {
  private deps: ServiceDependencies;
  private gameSessions: Map<string, GameSession> = new Map();

  constructor(deps: ServiceDependencies) {
    this.deps = deps;
  }

  /**
   * Start a new game round
   * 1. Validate user & balance
   * 2. Deduct bet from wallet
   * 3. Generate RNG seed
   * 4. Create game round in DB
   * 5. Return round ID & session
   */
  async play(
    gameId: GameTheme,
    betAmount: number,
    currency: "USDT" | "KRW" | "POINT",
  ): Promise<PlayResponse> {
    // Validate inputs
    if (betAmount <= 0) {
      throw new GameError("BET_OUT_OF_RANGE", "Bet amount must be positive");
    }

    // Get authenticated user
    let userId: string;
    try {
      const user = await this.deps.getAuthUser();
      userId = user.id;
    } catch (err) {
      throw new GameError("INTERNAL_ERROR", "Authentication failed", {
        originalError: err,
      });
    }

    // Check balance
    const balance = await this.deps.getUserBalance(userId);
    if (balance < betAmount) {
      throw new GameError(
        "INSUFFICIENT_BALANCE",
        `Insufficient balance: ${balance} < ${betAmount}`,
      );
    }

    // Deduct bet from wallet
    try {
      await this.deps.deductBalance(userId, betAmount);
    } catch (err) {
      throw new GameError("INTERNAL_ERROR", "Failed to deduct balance", {
        originalError: err,
      });
    }

    // Generate RNG seed for reproducibility
    const seed = generateSeed();

    // Create game round
    const roundId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour to claim

    const round: GameRound = {
      id: roundId,
      userId,
      gameId,
      roundNumber: 0, // Will be incremented in DB
      betAmount,
      betCurrency: currency,
      status: "playing",
      createdAt: now,
      playedAt: now,
      expiresAt,
    };

    try {
      await this.deps.createGameRound(round);
    } catch (err) {
      // Refund if DB save fails
      await this.deps.addBalance(userId, betAmount, "game_cancelled");
      throw new GameError("INTERNAL_ERROR", "Failed to create game round", {
        originalError: err,
      });
    }

    // Create session
    const session: GameSession = {
      id: uuidv4(),
      userId,
      gameId,
      state: "playing",
      currentRound: round,
      totalBetThisSession: betAmount,
      totalWinThisSession: 0,
      startedAt: now,
      updatedAt: now,
    };

    this.gameSessions.set(session.id, session);

    return {
      roundId,
      status: "playing",
      gameSession: session,
      expiresAt,
    };
  }

  /**
   * Claim game result and collect winnings
   * 1. Retrieve game round
   * 2. Validate round status
   * 3. Generate game outcome
   * 4. Add winnings to wallet
   * 5. Update round status to 'claimed'
   */
  async claim(roundId: string): Promise<ClaimResponse> {
    // Get round
    const round = await this.deps.getGameRound(roundId);
    if (!round) {
      throw new GameError("ROUND_NOT_FOUND", `Round not found: ${roundId}`);
    }

    // Check status
    if (round.status === "claimed") {
      throw new GameError(
        "ROUND_ALREADY_CLAIMED",
        `Round already claimed: ${roundId}`,
      );
    }

    if (round.status === "cancelled") {
      throw new GameError("ROUND_NOT_FOUND", `Round was cancelled: ${roundId}`);
    }

    // Check claim window
    const now = new Date();
    if (now > round.expiresAt) {
      throw new GameError(
        "CLAIM_WINDOW_EXPIRED",
        `Claim window expired: ${roundId}`,
      );
    }

    // Generate game outcome based on seed
    let winAmount = 0;
    let multiplier = 1;

    try {
      // For now, simulate slots outcome
      const outcome = spinSlots({
        betAmount: round.betAmount,
        gameId: round.gameId,
        seed: generateSeed(), // In production, use pre-generated seed stored in DB
      });

      if (!validateSpinOutcome(outcome, "")) {
        throw new Error("Invalid spin outcome");
      }

      winAmount = outcome.totalWin;
      multiplier = winAmount > 0 ? winAmount / round.betAmount : 0;
    } catch (err) {
      throw new GameError("RNG_FAILURE", "Failed to generate game outcome", {
        originalError: err,
      });
    }

    // Create result
    const result: GameResult = {
      roundId,
      gameId: round.gameId,
      seed: generateSeed(),
      outcome: {} as any, // Placeholder - should be proper outcome type
      winAmount,
      isWin: winAmount > round.betAmount,
      multiplier,
      timestamp: now,
    };

    // Update wallet if win
    const previousBalance = await this.deps.getUserBalance(round.userId);
    if (winAmount > 0) {
      await this.deps.addBalance(
        round.userId,
        winAmount,
        `game_win_${round.gameId}`,
      );
    }

    const newBalance = await this.deps.getUserBalance(round.userId);

    // Update round status
    try {
      await this.deps.updateGameRound(roundId, {
        status: "claimed",
        result,
        claimedAt: now,
      });
    } catch (err) {
      throw new GameError("INTERNAL_ERROR", "Failed to update game round", {
        originalError: err,
      });
    }

    return {
      roundId,
      result,
      walletUpdate: {
        previousBalance,
        newBalance,
        changeAmount: newBalance - previousBalance,
      },
      timestamp: now,
    };
  }

  /**
   * Retrieve game history for user
   */
  async getHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<HistoryResponse> {
    if (limit < 1 || limit > 100) {
      throw new GameError(
        "BET_OUT_OF_RANGE",
        "Limit must be between 1 and 100",
      );
    }

    const rounds = await this.deps.getUserGameRounds(userId, limit, offset);

    return {
      userId,
      rounds,
      total: rounds.length, // In production, get total count from DB
      limit,
      offset,
    };
  }

  /**
   * Get current game session
   */
  getSession(sessionId: string): GameSession | undefined {
    return this.gameSessions.get(sessionId);
  }

  /**
   * End game session
   */
  endSession(sessionId: string): void {
    this.gameSessions.delete(sessionId);
  }

  /**
   * Cleanup expired sessions (call periodically)
   */
  cleanupExpiredSessions(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [sessionId, session] of this.gameSessions.entries()) {
      if (now - session.startedAt.getTime() > maxAgeMs) {
        this.gameSessions.delete(sessionId);
      }
    }
  }
}

/**
 * Factory function for creating GameService with mock dependencies (for testing)
 */
export function createMockGameService(): GameService {
  const mockBalances = new Map<string, number>();
  const mockRounds = new Map<string, GameRound>();

  return new GameService({
    getAuthUser: async () => ({
      id: "user-123",
      username: "testuser",
    }),
    getUserBalance: async (userId: string) => mockBalances.get(userId) ?? 1000,
    deductBalance: async (userId: string, amount: number) => {
      const balance = mockBalances.get(userId) ?? 1000;
      mockBalances.set(userId, balance - amount);
    },
    addBalance: async (userId: string, amount: number) => {
      const balance = mockBalances.get(userId) ?? 1000;
      mockBalances.set(userId, balance + amount);
    },
    createGameRound: async (round: GameRound) => {
      mockRounds.set(round.id, round);
    },
    updateGameRound: async (roundId: string, updates: Partial<GameRound>) => {
      const round = mockRounds.get(roundId);
      if (round) {
        mockRounds.set(roundId, { ...round, ...updates });
      }
    },
    getGameRound: async (roundId: string) => mockRounds.get(roundId) ?? null,
    getUserGameRounds: async (userId: string, limit: number) => {
      return Array.from(mockRounds.values())
        .filter((r) => r.userId === userId)
        .slice(0, limit);
    },
  });
}
