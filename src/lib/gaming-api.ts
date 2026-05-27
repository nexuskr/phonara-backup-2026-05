/**
 * Gaming API Routes Handler
 *
 * Endpoints:
 * - POST /api/gaming/play - Start a game round
 * - POST /api/gaming/claim - Claim game result
 * - GET /api/gaming/history - Get game history
 * - GET /api/gaming/stats - Get user statistics
 */

import { GameService } from "../lib/GameService";
import type {
  BetRequest,
  ClaimRequest,
  HistoryRequest,
} from "../lib/gaming-types";

/**
 * Type definitions for API responses
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  traceId?: string;
}

/**
 * POST /api/gaming/play
 * Start a new game round
 */
export async function handlePlayGame(
  gameService: GameService,
  userId: string,
  request: BetRequest,
): Promise<ApiResponse<any>> {
  const traceId = crypto.randomUUID?.() || Date.now().toString();

  try {
    const response = await gameService.play(
      request.gameId,
      request.betAmount,
      request.currency,
    );

    return {
      success: true,
      data: {
        roundId: response.roundId,
        status: response.status,
        expiresAt: response.expiresAt,
        gameSession: response.gameSession,
      },
      traceId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to start game",
      errorCode: error.code || "INTERNAL_ERROR",
      traceId,
    };
  }
}

/**
 * POST /api/gaming/claim
 * Claim game result and collect winnings
 */
export async function handleClaimGame(
  gameService: GameService,
  userId: string,
  request: ClaimRequest,
): Promise<ApiResponse<any>> {
  const traceId = crypto.randomUUID?.() || Date.now().toString();

  try {
    const response = await gameService.claim(request.roundId);

    return {
      success: true,
      data: {
        roundId: response.roundId,
        result: response.result,
        walletUpdate: response.walletUpdate,
        timestamp: response.timestamp,
      },
      traceId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to claim game",
      errorCode: error.code || "INTERNAL_ERROR",
      traceId,
    };
  }
}

/**
 * GET /api/gaming/history
 * Get user's game history
 */
export async function handleGetGameHistory(
  gameService: GameService,
  userId: string,
  request: HistoryRequest,
): Promise<ApiResponse<any>> {
  const traceId = crypto.randomUUID?.() || Date.now().toString();

  try {
    const response = await gameService.getHistory(
      userId,
      request.limit,
      request.offset,
    );

    return {
      success: true,
      data: {
        rounds: response.rounds,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
      },
      traceId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch game history",
      errorCode: error.code || "INTERNAL_ERROR",
      traceId,
    };
  }
}

/**
 * Error Response Helper
 */
export function createErrorResponse(
  message: string,
  errorCode: string = "INTERNAL_ERROR",
  status: number = 500,
): ApiResponse<null> {
  return {
    success: false,
    error: message,
    errorCode,
    traceId: crypto.randomUUID?.() || Date.now().toString(),
  };
}

/**
 * Success Response Helper
 */
export function createSuccessResponse<T>(
  data: T,
  traceId?: string,
): ApiResponse<T> {
  return {
    success: true,
    data,
    traceId: traceId || crypto.randomUUID?.() || Date.now().toString(),
  };
}
