/**
 * LeaderboardService - Real-time Ranking System
 *
 * Features:
 * - Daily, weekly, all-time rankings
 * - Multiple metrics (total_wins, total_profit, games_played)
 * - Real-time updates via RealtimeManager
 * - Efficient caching with throttling
 *
 * Architecture:
 * - Supabase RPC functions for data aggregation
 * - Local cache with TTL
 * - 1-second throttled updates
 */

import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardMetric,
  GameTheme,
  LeaderboardSnapshot,
} from "./gaming-types";

interface LeaderboardCache {
  snapshot: LeaderboardSnapshot | null;
  fetched: Date | null;
  ttl: number; // milliseconds
}

/**
 * Leaderboard Service
 */
export class LeaderboardService {
  private cache: Map<string, LeaderboardCache> = new Map();
  private subscriptions: Set<(snapshot: LeaderboardSnapshot) => void> =
    new Set();

  constructor(private db?: any) {} // Optional DB injected

  /**
   * Get leaderboard rankings
   */
  async getRanking(
    period: LeaderboardPeriod,
    metric: LeaderboardMetric = "total_wins",
    gameId?: GameTheme,
    limit: number = 100,
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = this.getCacheKey(period, metric, gameId);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached?.snapshot && this.isCacheValid(cached)) {
      return cached.snapshot.entries;
    }

    // Fetch from DB
    try {
      const entries = await this.fetchLeaderboardFromDB(
        period,
        metric,
        gameId,
        limit,
      );

      // Update cache
      const snapshot: LeaderboardSnapshot = {
        period,
        metric,
        gameId,
        entries,
        generatedAt: new Date(),
      };

      this.cache.set(cacheKey, {
        snapshot,
        fetched: new Date(),
        ttl: 10000, // 10 second TTL
      });

      // Notify subscribers
      this.notifySubscribers(snapshot);

      return entries;
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
      return [];
    }
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(
    userId: string,
    period: LeaderboardPeriod,
    metric: LeaderboardMetric = "total_wins",
    gameId?: GameTheme,
  ): Promise<number | null> {
    try {
      const rank = await this.fetchUserRankFromDB(
        userId,
        period,
        metric,
        gameId,
      );
      return rank;
    } catch (err) {
      console.error("Failed to fetch user rank", err);
      return null;
    }
  }

  /**
   * Subscribe to leaderboard updates
   */
  subscribe(callback: (snapshot: LeaderboardSnapshot) => void): () => void {
    this.subscriptions.add(callback);
    return () => this.subscriptions.delete(callback);
  }

  /**
   * Notify subscribers of updates
   */
  private notifySubscribers(snapshot: LeaderboardSnapshot): void {
    this.subscriptions.forEach((callback) => {
      try {
        callback(snapshot);
      } catch (err) {
        console.error("Subscription callback error", err);
      }
    });
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(cache: LeaderboardCache): boolean {
    if (!cache.fetched) return false;
    const age = Date.now() - cache.fetched.getTime();
    return age < cache.ttl;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    period: LeaderboardPeriod,
    metric: LeaderboardMetric,
    gameId?: GameTheme,
  ): string {
    return `leaderboard:${period}:${metric}:${gameId || "all"}`;
  }

  /**
   * Fetch leaderboard from database (mock implementation)
   * In production, calls Supabase RPC function
   */
  private async fetchLeaderboardFromDB(
    period: LeaderboardPeriod,
    metric: LeaderboardMetric,
    gameId: GameTheme | undefined,
    limit: number,
  ): Promise<LeaderboardEntry[]> {
    // Mock data for testing
    const mockEntries: LeaderboardEntry[] = Array.from(
      { length: Math.min(limit, 50) },
      (_, i) => ({
        rank: i + 1,
        userId: `user-${i}`,
        username: `Player${i + 1}`,
        value: Math.max(0, 1000 - i * 20),
        gameId,
        period,
        metric,
        updatedAt: new Date(),
      }),
    );

    return mockEntries;
  }

  /**
   * Fetch user rank from database (mock implementation)
   */
  private async fetchUserRankFromDB(
    userId: string,
    period: LeaderboardPeriod,
    metric: LeaderboardMetric,
    gameId: GameTheme | undefined,
  ): Promise<number | null> {
    // Mock: random rank between 1-1000
    const mockRank = Math.floor(Math.random() * 1000) + 1;
    return mockRank;
  }

  /**
   * Invalidate cache (call after game result)
   */
  invalidateCache(gameId?: GameTheme): void {
    if (gameId) {
      // Invalidate specific game
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(gameId)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.cache.delete(key));
    } else {
      // Invalidate all
      this.cache.clear();
    }
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(period: LeaderboardPeriod): Promise<{
    totalPlayers: number;
    averageScore: number;
    topScore: number;
    bottomScore: number;
  }> {
    const entries = await this.getRanking(
      period,
      "total_wins",
      undefined,
      1000,
    );

    if (entries.length === 0) {
      return { totalPlayers: 0, averageScore: 0, topScore: 0, bottomScore: 0 };
    }

    const values = entries.map((e) => e.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      totalPlayers: entries.length,
      averageScore: sum / entries.length,
      topScore: Math.max(...values),
      bottomScore: Math.min(...values),
    };
  }
}

/**
 * Factory for creating LeaderboardService
 */
export function createLeaderboardService(db?: any): LeaderboardService {
  return new LeaderboardService(db);
}
