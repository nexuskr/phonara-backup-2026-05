/**
 * GameStateContext - Game Session State Management
 *
 * Features:
 * - Central state for current game session
 * - Session lifecycle (idle → playing → claiming → claimed)
 * - Result caching
 * - Error handling
 *
 * Usage:
 *   const { state, play, claim, error } = useGame();
 *   await play('slots', 100);
 *   const result = await claim();
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  GameSession,
  GameRound,
  GameResult,
  GameError,
} from "../lib/gaming-types";

export type GameContextState =
  | "idle"
  | "playing"
  | "pending_claim"
  | "claimed"
  | "error";

interface GameContextType {
  // State
  state: GameContextState;
  currentSession: GameSession | null;
  currentRound: GameRound | null;
  lastResult: GameResult | null;
  error: GameError | null;
  isLoading: boolean;

  // Actions
  play: (gameId: string, betAmount: number, currency: string) => Promise<void>;
  claim: () => Promise<GameResult | null>;
  reset: () => void;
  clearError: () => void;

  // Utilities
  canClaim: boolean;
  canPlay: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameContextProviderProps {
  children: React.ReactNode;
  gameService?: any; // Injected GameService
}

export function GameContextProvider({
  children,
  gameService,
}: GameContextProviderProps) {
  const [state, setState] = useState<GameContextState>("idle");
  const [currentSession, setCurrentSession] = useState<GameSession | null>(
    null,
  );
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<GameError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const play = useCallback(
    async (gameId: string, betAmount: number, currency: string) => {
      if (!gameService) {
        setError(new Error("GameService not provided") as any);
        setState("error");
        return;
      }

      setIsLoading(true);
      try {
        const response = await gameService.play(gameId, betAmount, currency);
        setCurrentSession(response.gameSession);
        setCurrentRound(response.gameSession.currentRound);
        setState("playing");
        setError(null);
      } catch (err) {
        setError(err as GameError);
        setState("error");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [gameService],
  );

  const claim = useCallback(async (): Promise<GameResult | null> => {
    if (!gameService || !currentRound) {
      return null;
    }

    setIsLoading(true);
    setState("pending_claim");
    try {
      const response = await gameService.claim(currentRound.id);
      setLastResult(response.result);
      setState("claimed");
      setError(null);
      return response.result;
    } catch (err) {
      setError(err as GameError);
      setState("error");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [gameService, currentRound]);

  const reset = useCallback(() => {
    setState("idle");
    setCurrentSession(null);
    setCurrentRound(null);
    setLastResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (state === "error") {
      setState("idle");
    }
  }, [state]);

  const value: GameContextType = {
    state,
    currentSession,
    currentRound,
    lastResult,
    error,
    isLoading,
    play,
    claim,
    reset,
    clearError,
    canClaim: state === "playing" && currentRound !== null,
    canPlay: state === "idle" && !isLoading,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Hook to use game context
 */
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameContextProvider");
  }
  return context;
}
