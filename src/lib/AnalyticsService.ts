/**
 * AnalyticsService - Game Event Tracking & Statistics
 *
 * Features:
 * - Event tracking (game_started, game_result, game_claimed, big_win, etc.)
 * - User statistics aggregation
 * - Real-time metrics collection
 * - Batch event processing
 *
 * Events tracked:
 * - game_started: User initiates a game
 * - game_result: Game outcome determined
 * - game_claimed: User claims reward
 * - bonus_triggered: Free spins/bonus activated
 * - big_win: Multiplier >= 100x
 * - ultra_win: Multiplier >= 1000x
 * - loss_streak: 3+ consecutive losses
 * - duel_matched: Player matched in duel
 * - crash_cashed_out: Successfully cashed out in crash
 */

import type {
  GameEvent,
  GameEventType,
  UserGameStats,
  GameTheme,
  GameResult,
} from "./gaming-types";

interface EventBatch {
  events: GameEvent[];
  flushedAt: Date | null;
  batchSize: number;
}

/**
 * Analytics Service
 */
export class AnalyticsService {
  private eventBuffer: GameEvent[] = [];
  private userStats: Map<string, UserGameStats> = new Map();
  private maxBufferSize = 100;
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private db?: any,
    private flushIntervalMs: number = 30000, // 30 second flush
  ) {
    this.startAutoFlush();
  }

  /**
   * Track a game event
   */
  trackEvent(event: Omit<GameEvent, "id" | "timestamp">): void {
    const fullEvent: GameEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    this.eventBuffer.push(fullEvent);

    // Auto-flush if buffer is full
    if (this.eventBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Track game result with automatic event generation
   */
  trackGameResult(gameResult: GameResult, userId: string): void {
    // game_result event
    this.trackEvent({
      userId,
      eventType: "game_result",
      gameId: gameResult.gameId,
      roundId: gameResult.roundId,
      metadata: {
        winAmount: gameResult.winAmount,
        multiplier: gameResult.multiplier,
        isWin: gameResult.isWin,
      },
    });

    // Generate special events
    if (gameResult.multiplier >= 1000) {
      this.trackEvent({
        userId,
        eventType: "ultra_win",
        gameId: gameResult.gameId,
        roundId: gameResult.roundId,
        metadata: {
          multiplier: gameResult.multiplier,
          winAmount: gameResult.winAmount,
        },
      });
    } else if (gameResult.multiplier >= 100) {
      this.trackEvent({
        userId,
        eventType: "big_win",
        gameId: gameResult.gameId,
        roundId: gameResult.roundId,
        metadata: {
          multiplier: gameResult.multiplier,
          winAmount: gameResult.winAmount,
        },
      });
    }
  }

  /**
   * Get user statistics for a specific game
   */
  async getUserStats(
    userId: string,
    gameId: GameTheme,
  ): Promise<UserGameStats | null> {
    // Check cache first
    const cacheKey = `${userId}:${gameId}`;
    if (this.userStats.has(cacheKey)) {
      return this.userStats.get(cacheKey) || null;
    }

    // Fetch from DB (mock implementation)
    try {
      const stats = await this.fetchUserStatsFromDB(userId, gameId);
      if (stats) {
        this.userStats.set(cacheKey, stats);
      }
      return stats;
    } catch (err) {
      console.error("Failed to fetch user stats", err);
      return null;
    }
  }

  /**
   * Get all-game statistics
   */
  async getUserAggregateStats(userId: string): Promise<{
    totalGames: number;
    totalBet: number;
    totalWin: number;
    profitLoss: number;
    winRate: number;
  }> {
    try {
      const stats = await this.fetchAggregateStatsFromDB(userId);
      return (
        stats || {
          totalGames: 0,
          totalBet: 0,
          totalWin: 0,
          profitLoss: 0,
          winRate: 0,
        }
      );
    } catch (err) {
      console.error("Failed to fetch aggregate stats", err);
      return {
        totalGames: 0,
        totalBet: 0,
        totalWin: 0,
        profitLoss: 0,
        winRate: 0,
      };
    }
  }

  /**
   * Flush events to database
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await this.sendEventsToDatabase(eventsToFlush);
    } catch (err) {
      console.error("Failed to flush events", err);
      // Re-add failed events to buffer
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  /**
   * Start automatic event flushing
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  /**
   * Stop automatic event flushing
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(): Promise<{
    totalEvents: number;
    eventsByType: Record<GameEventType, number>;
    bufferedEvents: number;
  }> {
    // Mock implementation
    return {
      totalEvents: 0,
      eventsByType: {
        game_started: 0,
        game_result: 0,
        game_claimed: 0,
        bonus_triggered: 0,
        big_win: 0,
        ultra_win: 0,
        loss_streak: 0,
        duel_matched: 0,
        crash_cashed_out: 0,
      },
      bufferedEvents: this.eventBuffer.length,
    };
  }

  /**
   * ============ PRIVATE METHODS ============
   */

  private async sendEventsToDatabase(events: GameEvent[]): Promise<void> {
    // In production, call Supabase function
    // await this.db.rpc('insert_game_events', { events })
    console.log(`Flushed ${events.length} events to database`);
  }

  private async fetchUserStatsFromDB(
    userId: string,
    gameId: GameTheme,
  ): Promise<UserGameStats | null> {
    // Mock data
    return {
      userId,
      gameId,
      totalGames: Math.floor(Math.random() * 100),
      totalBet: Math.random() * 10000,
      totalWin: Math.random() * 8000,
      profitLoss: Math.random() * 2000 - 1000,
      winRate: Math.random(),
      avgBet: Math.random() * 100,
      avgWin: Math.random() * 200,
      maxWin: Math.random() * 5000,
      maxMultiplier: Math.random() * 500,
      bigWins: Math.floor(Math.random() * 20),
      ultraWins: Math.floor(Math.random() * 5),
      lastPlayedAt: new Date(),
      consecutiveLosses: Math.floor(Math.random() * 5),
    };
  }

  private async fetchAggregateStatsFromDB(userId: string): Promise<{
    totalGames: number;
    totalBet: number;
    totalWin: number;
    profitLoss: number;
    winRate: number;
  }> {
    // Mock data
    return {
      totalGames: Math.floor(Math.random() * 500),
      totalBet: Math.random() * 50000,
      totalWin: Math.random() * 40000,
      profitLoss: Math.random() * 10000 - 5000,
      winRate: Math.random(),
    };
  }
}

/**
 * Factory for creating AnalyticsService
 */
export function createAnalyticsService(db?: any): AnalyticsService {
  return new AnalyticsService(db);
}
