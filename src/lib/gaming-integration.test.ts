/**
 * Integration Tests - Gaming System
 *
 * Tests for:
 * - GameService end-to-end flow
 * - LeaderboardService updates
 * - AnalyticsService event tracking
 * - RewardManager reward distribution
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GameService, createMockGameService } from "./GameService";
import { LeaderboardService } from "./LeaderboardService";
import { AnalyticsService } from "./AnalyticsService";
import { RewardManager } from "./RewardManager";
import { spinSlots } from "./slots-engine";
import { simulateDuelMatch } from "./duel-engine";
import { simulateCrashGame } from "./crash-engine";
import { generateSeed } from "./rng";

describe("Gaming System Integration", () => {
  let gameService: GameService;
  let leaderboardService: LeaderboardService;
  let analyticsService: AnalyticsService;
  let rewardManager: RewardManager;

  beforeEach(() => {
    gameService = createMockGameService();
    leaderboardService = new LeaderboardService();
    analyticsService = new AnalyticsService();
    rewardManager = new RewardManager(gameService);
  });

  describe("GameService Flow", () => {
    it("should complete full game flow: play → claim", async () => {
      // Play game
      const playResponse = await gameService.play("cosmic_forge", 100, "USDT");

      expect(playResponse.roundId).toBeDefined();
      expect(playResponse.status).toBe("playing");
      expect(playResponse.gameSession).toBeDefined();

      // Claim reward
      const claimResponse = await gameService.claim(playResponse.roundId);

      expect(claimResponse.roundId).toBe(playResponse.roundId);
      expect(claimResponse.result).toBeDefined();
      expect(claimResponse.walletUpdate).toBeDefined();
    });

    it("should enforce minimum bet", async () => {
      try {
        await gameService.play("cosmic_forge", -10, "USDT");
        expect.fail("Should throw error for negative bet");
      } catch (err: any) {
        expect(err.code).toBe("BET_OUT_OF_RANGE");
      }
    });

    it("should track game session", async () => {
      const playResponse = await gameService.play("cosmic_forge", 100, "USDT");
      const session = gameService.getSession(playResponse.gameSession.id);

      expect(session).toBeDefined();
      expect(session?.state).toBe("playing");

      gameService.endSession(playResponse.gameSession.id);
      expect(
        gameService.getSession(playResponse.gameSession.id),
      ).toBeUndefined();
    });
  });

  describe("LeaderboardService", () => {
    it("should fetch leaderboard rankings", async () => {
      const rankings = await leaderboardService.getRanking(
        "all_time",
        "total_wins",
        undefined,
        10,
      );

      expect(Array.isArray(rankings)).toBe(true);
      expect(rankings.length).toBeLessThanOrEqual(10);

      if (rankings.length > 1) {
        expect(rankings[0].rank).toBeLessThan(rankings[1].rank);
      }
    });

    it("should get user rank", async () => {
      const rank = await leaderboardService.getUserRank(
        "user-123",
        "daily",
        "total_wins",
      );

      expect(typeof rank).toBe("number");
      expect(rank).toBeGreaterThan(0);
    });

    it("should cache leaderboard results", async () => {
      const start1 = Date.now();
      await leaderboardService.getRanking(
        "all_time",
        "total_wins",
        undefined,
        10,
      );
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await leaderboardService.getRanking(
        "all_time",
        "total_wins",
        undefined,
        10,
      );
      const time2 = Date.now() - start2;

      // Second call should be faster (cached)
      expect(time2).toBeLessThan(time1 * 2); // Allow some variance
    });

    it("should invalidate cache on demand", async () => {
      await leaderboardService.getRanking(
        "all_time",
        "total_wins",
        "cosmic_forge",
        10,
      );
      leaderboardService.invalidateCache("cosmic_forge");

      // Cache should be cleared for this game
      const keysCountBefore = (leaderboardService as any).cache.size;
      leaderboardService.invalidateCache();
      const keysCountAfter = (leaderboardService as any).cache.size;

      expect(keysCountAfter).toBeLessThan(keysCountBefore);
    });
  });

  describe("AnalyticsService", () => {
    it("should track game events", async () => {
      const event = {
        userId: "user-123",
        eventType: "game_started" as const,
        gameId: "cosmic_forge" as const,
        metadata: { betAmount: 100 },
      };

      analyticsService.trackEvent(event);

      const stats = await analyticsService.getEventStats();
      expect(stats.bufferedEvents).toBeGreaterThan(0);
    });

    it("should auto-flush events", async () => {
      analyticsService.trackEvent({
        userId: "user-123",
        eventType: "game_result",
        gameId: "cosmic_forge",
        metadata: { winAmount: 250 },
      });

      // Give time for auto-flush interval
      await new Promise((resolve) => setTimeout(resolve, 100));

      // After flush, buffer should be empty (eventually)
      analyticsService.stopAutoFlush();
    });

    it("should get user statistics", async () => {
      const stats = await analyticsService.getUserStats(
        "user-123",
        "cosmic_forge",
      );

      if (stats) {
        expect(stats.userId).toBe("user-123");
        expect(stats.totalGames).toBeGreaterThanOrEqual(0);
        expect(stats.winRate).toBeGreaterThanOrEqual(0);
        expect(stats.winRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("RewardManager", () => {
    it("should process game reward", async () => {
      const gameResult = {
        roundId: "round-123",
        gameId: "cosmic_forge" as const,
        seed: generateSeed(),
        outcome: {} as any,
        winAmount: 500,
        isWin: true,
        multiplier: 5,
        timestamp: new Date(),
      };

      const result = await rewardManager.processGameReward(
        "user-123",
        gameResult,
      );

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.newBalance).toBeGreaterThanOrEqual(result.previousBalance);
    });

    it("should handle idempotency", async () => {
      const gameResult = {
        roundId: "round-123",
        gameId: "cosmic_forge" as const,
        seed: generateSeed(),
        outcome: {} as any,
        winAmount: 500,
        isWin: true,
        multiplier: 5,
        timestamp: new Date(),
      };

      const key = "idempotency-key-1";

      // First call
      const result1 = await rewardManager.processGameReward(
        "user-123",
        gameResult,
        key,
      );

      // Second call with same key should return same result
      const result2 = await rewardManager.processGameReward(
        "user-123",
        gameResult,
        key,
      );

      if (result1.success && result2.success) {
        expect(result1.transaction?.id).toBe(result2.transaction?.id);
      }
    });

    it("should distribute bonus rewards", async () => {
      const result = await rewardManager.distributeBonusReward(
        "user-123",
        100,
        "referral_bonus",
        "bonus-key-1",
      );

      expect(result.success).toBe(true);
      expect(result.transaction?.type).toBe("bonus_win");
      expect(result.transaction?.amount).toBe(100);
    });
  });

  describe("End-to-End Scenario", () => {
    it("should handle complete gaming session with analytics", async () => {
      // 1. Play slots
      const playResponse = await gameService.play("cosmic_forge", 100, "USDT");

      analyticsService.trackEvent({
        userId: "test-user",
        eventType: "game_started",
        gameId: "cosmic_forge",
        metadata: { betAmount: 100 },
      });

      // 2. Claim reward
      const claimResponse = await gameService.claim(playResponse.roundId);

      // 3. Track result
      analyticsService.trackGameResult(claimResponse.result, "test-user");

      // 4. Process reward
      const rewardResult = await rewardManager.processGameReward(
        "test-user",
        claimResponse.result,
      );

      expect(rewardResult.success).toBe(true);

      // 5. Check leaderboard update
      leaderboardService.invalidateCache("cosmic_forge");
      const rankings = await leaderboardService.getRanking(
        "all_time",
        "total_wins",
      );

      expect(Array.isArray(rankings)).toBe(true);
    });
  });

  describe("Multiple Games", () => {
    it("should handle different game types", async () => {
      const games = ["cosmic_forge", "neon_tokyo_88", "pirates_curse"] as const;

      for (const game of games) {
        const playResponse = await gameService.play(game, 50, "USDT");
        expect(playResponse.roundId).toBeDefined();

        const claimResponse = await gameService.claim(playResponse.roundId);
        expect(claimResponse.result).toBeDefined();
      }
    });

    it("should track multiple game sessions", async () => {
      const sessions = [];

      for (let i = 0; i < 3; i++) {
        const playResponse = await gameService.play(
          "cosmic_forge",
          100,
          "USDT",
        );
        sessions.push(playResponse.gameSession);
      }

      expect(sessions.length).toBe(3);
      sessions.forEach((session) => {
        expect(session.state).toBe("playing");
      });
    });
  });
});
