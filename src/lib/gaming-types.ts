/**
 * Gaming Domain Types
 * Central type definitions for all gaming features (Slots, Duel, Crash)
 * Organized by concern: Game, Round, Result, Leaderboard
 */

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

export type GameTheme =
  | "cosmic_forge"
  | "neon_tokyo_88"
  | "pirates_curse"
  | "pharaohs_vault"
  | "viking_thunder"
  | "aztec_sun"
  | "cherry_sakura";
export type GameType = "slots" | "duel" | "crash";
export type Volatility = "low" | "mid" | "high" | "very_high";

export interface GameMetadata {
  id: GameTheme;
  type: GameType;
  title: string;
  description: string;
  volatility: Volatility;
  minBet: number;
  maxBet: number;
  rtpTarget: number; // 0.96 = 96%
  maxMultiplier: number; // theoretical cap
  iconUrl?: string;
  previewUrl?: string;
}

export interface GameConfig {
  metadata: GameMetadata;
  rules: Record<string, unknown>; // Theme-specific rules
}

// ============================================================================
// ROUND & SESSION STATE
// ============================================================================

export type RoundStatus =
  | "pending"
  | "playing"
  | "completed"
  | "claimed"
  | "cancelled";
export type GameSessionState =
  | "idle"
  | "playing"
  | "pending_claim"
  | "claimed"
  | "error";

export interface GameRound {
  id: string; // UUID
  userId: string;
  gameId: GameTheme;
  roundNumber: number;
  betAmount: number;
  betCurrency: "USDT" | "KRW" | "POINT";
  status: RoundStatus;
  result?: GameResult;
  createdAt: Date;
  playedAt?: Date;
  claimedAt?: Date;
  expiresAt: Date; // Claim window
}

// ============================================================================
// GAME RESULTS
// ============================================================================

export interface GameResult {
  roundId: string;
  gameId: GameTheme;
  seed: string; // Hex-encoded seed for reproducibility
  outcome: SlotsOutcome | DuelOutcome | CrashOutcome;
  winAmount: number;
  isWin: boolean;
  multiplier: number; // Total multiplier applied
  timestamp: Date;
}

// --- SLOTS ---
export interface SlotsOutcome {
  type: "slots";
  reels: readonly number[][]; // 5 reels, 3 rows each
  symbols: readonly string[]; // Symbol names
  paylines: PaylineMatch[];
  baseWin: number;
  bonusTriggered: boolean;
  bonusOutcome?: BonusOutcome;
  totalWin: number;
}

export interface PaylineMatch {
  paylineId: number;
  symbols: string[];
  matchCount: number;
  multiplier: number;
  payout: number;
}

export interface BonusOutcome {
  type: string; // sticky_multi, hold88, crash_cannon, pick_reveal, three_path, cluster_tumble, mission_trail
  spins?: number;
  wins: number;
  totalBonus: number;
}

// --- DUEL ---
export interface DuelOutcome {
  type: "duel";
  matchId: string;
  opponent: {
    id: string;
    username: string;
    avatar?: string;
  };
  playerResult: "win" | "loss" | "draw";
  playerScore: number;
  opponentScore: number;
  reason: "superior_score" | "timeout" | "disconnect" | "draw" | "house_edge";
  houseEdgeApplied: number; // 0.02 = 2%
}

// --- CRASH ---
export interface CrashOutcome {
  type: "crash";
  crashPoint: number; // e.g., 1.45 where the game crashed
  playerCashout?: number; // null if not cashed out before crash
  wasCashedOut: boolean;
  profitLoss: number; // negative if crashed before cashout
}

// ============================================================================
// GAME SESSION & STATE
// ============================================================================

export interface GameSession {
  id: string;
  userId: string;
  gameId: GameTheme;
  state: GameSessionState;
  currentRound?: GameRound;
  lastResult?: GameResult;
  totalBetThisSession: number;
  totalWinThisSession: number;
  startedAt: Date;
  updatedAt: Date;
}

// ============================================================================
// LEADERBOARD
// ============================================================================

export type LeaderboardPeriod = "daily" | "weekly" | "all_time";
export type LeaderboardMetric = "total_wins" | "total_profit" | "games_played";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  value: number; // metric value
  gameId?: GameTheme; // null for global
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  updatedAt: Date;
}

export interface LeaderboardSnapshot {
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  gameId?: GameTheme;
  generatedAt: Date;
  entries: LeaderboardEntry[];
}

// ============================================================================
// ANALYTICS & EVENTS
// ============================================================================

export type GameEventType =
  | "game_started"
  | "game_result"
  | "game_claimed"
  | "bonus_triggered"
  | "big_win" // >= 100x
  | "ultra_win" // >= 1000x
  | "loss_streak"
  | "duel_matched"
  | "crash_cashed_out";

export interface GameEvent {
  id: string;
  userId: string;
  eventType: GameEventType;
  gameId: GameTheme;
  roundId?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface UserGameStats {
  userId: string;
  gameId: GameTheme;
  totalGames: number;
  totalBet: number;
  totalWin: number;
  profitLoss: number; // Gross win - total bet
  winRate: number; // wins / totalGames
  avgBet: number;
  avgWin: number;
  maxWin: number;
  maxMultiplier: number;
  bigWins: number; // >= 100x
  ultraWins: number; // >= 1000x
  lastPlayedAt: Date;
  consecutiveLosses: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export type GameErrorCode =
  | "INSUFFICIENT_BALANCE"
  | "BET_OUT_OF_RANGE"
  | "GAME_NOT_FOUND"
  | "ROUND_NOT_FOUND"
  | "ROUND_ALREADY_CLAIMED"
  | "CLAIM_WINDOW_EXPIRED"
  | "INVALID_SEED"
  | "RNG_FAILURE"
  | "OPPONENT_NOT_FOUND"
  | "MATCH_TIMEOUT"
  | "INTERNAL_ERROR";

export class GameError extends Error {
  constructor(
    public code: GameErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "GameError";
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface BetRequest {
  gameId: GameTheme;
  betAmount: number;
  currency: "USDT" | "KRW" | "POINT";
  idempotencyKey?: string; // For retry safety
}

export interface PlayResponse {
  roundId: string;
  status: RoundStatus;
  gameSession: GameSession;
  expiresAt: Date; // Claim window
}

export interface ClaimRequest {
  roundId: string;
  idempotencyKey?: string;
}

export interface ClaimResponse {
  roundId: string;
  result: GameResult;
  walletUpdate: {
    previousBalance: number;
    newBalance: number;
    changeAmount: number;
  };
  timestamp: Date;
}

export interface HistoryRequest {
  gameId?: GameTheme; // null = all games
  limit: number; // 1..100
  offset: number; // pagination
  period?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface HistoryResponse {
  userId: string;
  rounds: GameRound[];
  total: number;
  limit: number;
  offset: number;
}
