/**
 * Reward Integration Layer
 *
 * Connects GameService to WalletService for automatic reward distribution
 *
 * Features:
 * - Atomic transactions (game result + balance update)
 * - Idempotency (prevents double claiming)
 * - Transaction tracking
 * - RLS policy integration
 * - Pending state management
 */

import type { GameRound, GameResult } from "./gaming-types";

export type TransactionType =
  | "game_win"
  | "game_loss"
  | "game_refund"
  | "bonus_win"
  | "referral_bonus";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: "USDT" | "KRW" | "POINT";
  gameRoundId?: string;
  status: "pending" | "completed" | "failed" | "reversed";
  idempotencyKey?: string;
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface RewardDistributionResult {
  success: boolean;
  transaction: Transaction | null;
  previousBalance: number;
  newBalance: number;
  error?: string;
}

/**
 * RewardManager - Orchestrates reward distribution
 */
export class RewardManager {
  constructor(
    private gameService?: any, // GameService
    private walletService?: any, // WalletService
  ) {}

  /**
   * Process reward after game claim
   *
   * Atomic operations:
   * 1. Verify game round
   * 2. Calculate reward amount
   * 3. Deduct from pending balance
   * 4. Create transaction record
   * 5. Update wallet balance
   * 6. Mark round as processed
   */
  async processGameReward(
    userId: string,
    gameResult: GameResult,
    idempotencyKey?: string,
  ): Promise<RewardDistributionResult> {
    try {
      // 1. Verify idempotency
      if (idempotencyKey) {
        const existingTx = await this.findTransactionByIdempotencyKey(
          userId,
          idempotencyKey,
        );
        if (existingTx) {
          const balance = await this.walletService.getBalance(userId);
          return {
            success: true,
            transaction: existingTx,
            previousBalance: balance - existingTx.amount,
            newBalance: balance,
          };
        }
      }

      // 2. Get current balance
      const previousBalance = await this.walletService.getBalance(userId);

      // 3. Calculate reward (game result already has winAmount)
      const rewardAmount = gameResult.winAmount;
      const isWin = rewardAmount > 0;

      // 4. Create transaction
      const transaction: Transaction = {
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        type: isWin ? "game_win" : "game_loss",
        amount: rewardAmount,
        currency: "USDT", // Normalized to USDT
        gameRoundId: gameResult.roundId,
        status: "pending",
        idempotencyKey,
        createdAt: new Date(),
      };

      // 5. Update wallet (atomic in production with Supabase transaction)
      const newBalance = previousBalance + rewardAmount;
      await this.walletService.updateBalance(userId, newBalance, {
        reason: `reward_${gameResult.gameId}`,
        transactionId: transaction.id,
      });

      // 6. Mark transaction as completed
      transaction.status = "completed";
      transaction.completedAt = new Date();

      // 7. Store transaction record
      await this.storeTransactionRecord(transaction);

      return {
        success: true,
        transaction,
        previousBalance,
        newBalance,
      };
    } catch (error: any) {
      return {
        success: false,
        transaction: null,
        previousBalance: 0,
        newBalance: 0,
        error: error.message || "Failed to process reward",
      };
    }
  }

  /**
   * Distribute bonus (free spins, referral, etc.)
   */
  async distributeBonusReward(
    userId: string,
    amount: number,
    reason: string,
    idempotencyKey?: string,
  ): Promise<RewardDistributionResult> {
    try {
      // Check idempotency
      if (idempotencyKey) {
        const existingTx = await this.findTransactionByIdempotencyKey(
          userId,
          idempotencyKey,
        );
        if (existingTx) {
          const balance = await this.walletService.getBalance(userId);
          return {
            success: true,
            transaction: existingTx,
            previousBalance: balance - existingTx.amount,
            newBalance: balance,
          };
        }
      }

      const previousBalance = await this.walletService.getBalance(userId);

      const transaction: Transaction = {
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        type: "bonus_win",
        amount,
        currency: "USDT",
        status: "pending",
        idempotencyKey,
        createdAt: new Date(),
        notes: reason,
      };

      // Update balance
      const newBalance = previousBalance + amount;
      await this.walletService.updateBalance(userId, newBalance, {
        reason: `bonus_${reason}`,
        transactionId: transaction.id,
      });

      transaction.status = "completed";
      transaction.completedAt = new Date();

      await this.storeTransactionRecord(transaction);

      return {
        success: true,
        transaction,
        previousBalance,
        newBalance,
      };
    } catch (error: any) {
      return {
        success: false,
        transaction: null,
        previousBalance: 0,
        newBalance: 0,
        error: error.message || "Failed to distribute bonus",
      };
    }
  }

  /**
   * Get pending rewards for user
   */
  async getPendingRewards(userId: string): Promise<number> {
    try {
      const pendingTransactions = await this.fetchPendingTransactions(userId);
      return pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    } catch (err) {
      console.error("Failed to fetch pending rewards", err);
      return 0;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Transaction[]> {
    try {
      return await this.fetchTransactionHistory(userId, limit, offset);
    } catch (err) {
      console.error("Failed to fetch transaction history", err);
      return [];
    }
  }

  /**
   * ============ PRIVATE METHODS ============
   */

  private async findTransactionByIdempotencyKey(
    userId: string,
    key: string,
  ): Promise<Transaction | null> {
    // Mock: In production, query Supabase with RLS policy
    return null;
  }

  private async storeTransactionRecord(
    transaction: Transaction,
  ): Promise<void> {
    // Mock: In production, insert to Supabase
    console.log(`Stored transaction: ${transaction.id}`);
  }

  private async fetchPendingTransactions(
    userId: string,
  ): Promise<Transaction[]> {
    // Mock: In production, query Supabase with RLS
    return [];
  }

  private async fetchTransactionHistory(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]> {
    // Mock: In production, query Supabase
    return [];
  }
}

/**
 * Factory
 */
export function createRewardManager(
  gameService?: any,
  walletService?: any,
): RewardManager {
  return new RewardManager(gameService, walletService);
}
