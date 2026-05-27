/**
 * Gaming Feature Index
 *
 * Central export for all gaming-related services and utilities
 * Used by applications to import all gaming functionality in one place
 */

// Core Types
export * from "./gaming-types";

// RNG & Engines
export { SeededRandom, generateSeed, verifyRngReproducibility } from "./rng";
export {
  GAME_CATALOG,
  PAYTABLES,
  SYMBOL_WEIGHTS,
  BONUS_CONFIG,
} from "./game-catalog";
export {
  spinSlots,
  validateSpinOutcome,
  calculateGameRTP,
  PAYLINES_243,
} from "./slots-engine";
export {
  simulateDuelMatch,
  calculateDuelPayout,
  validateDuelOutcome,
} from "./duel-engine";
export {
  simulateCrashGame,
  calculateCrashPayout,
  simulateCrashGameSession,
  validateCrashOutcome,
  calculateAverageCrashPoint,
  calculateCrashWinRate,
} from "./crash-engine";

// Services
export { GameService, createMockGameService } from "./GameService";
export {
  LeaderboardService,
  createLeaderboardService,
} from "./LeaderboardService";
export { AnalyticsService, createAnalyticsService } from "./AnalyticsService";
export { RewardManager, createRewardManager } from "./RewardManager";

// API Handlers
export {
  handlePlayGame,
  handleClaimGame,
  handleGetGameHistory,
  createErrorResponse,
  createSuccessResponse,
  type ApiResponse,
} from "./gaming-api";

/**
 * Gaming Module Configuration
 */
export interface GamingConfig {
  maxBetPerGame: number;
  minBetPerGame: number;
  claimWindowMs: number;
  sessionTimeoutMs: number;
  analyticsFlushIntervalMs: number;
  leaderboardCacheTtlMs: number;
}

export const DEFAULT_GAMING_CONFIG: GamingConfig = {
  maxBetPerGame: 10000,
  minBetPerGame: 0.1,
  claimWindowMs: 3600000, // 1 hour
  sessionTimeoutMs: 3600000, // 1 hour
  analyticsFlushIntervalMs: 30000, // 30 seconds
  leaderboardCacheTtlMs: 10000, // 10 seconds
};

/**
 * Gaming Module Factory
 *
 * Creates a fully configured gaming system
 */
export interface GamingModuleServices {
  gameService: GameService;
  leaderboardService: LeaderboardService;
  analyticsService: AnalyticsService;
  rewardManager: RewardManager;
}

export function createGamingModule(
  config: Partial<GamingConfig> = {},
): GamingModuleServices {
  const finalConfig = { ...DEFAULT_GAMING_CONFIG, ...config };

  const gameService = new GameService({
    getAuthUser: async () => ({ id: "guest", username: "Guest" }),
    getUserBalance: async (userId: string) => 1000,
    deductBalance: async () => {},
    addBalance: async () => {},
    createGameRound: async () => {},
    updateGameRound: async () => {},
    getGameRound: async () => null,
    getUserGameRounds: async () => [],
  });

  const leaderboardService = new LeaderboardService();
  const analyticsService = new AnalyticsService(
    undefined,
    finalConfig.analyticsFlushIntervalMs,
  );
  const rewardManager = new RewardManager(gameService);

  return {
    gameService,
    leaderboardService,
    analyticsService,
    rewardManager,
  };
}
