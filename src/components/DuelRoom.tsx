/**
 * DuelRoom Component - 1v1 PvP Duel UI
 *
 * Features:
 * - Opponent matching display
 * - Score visualization
 * - Real-time battle animation
 * - Result announcement
 */

import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameStateContext";
import type { DuelOutcome } from "../lib/gaming-types";

export function DuelRoom() {
  const {
    play,
    claim,
    state,
    lastResult,
    error,
    canPlay,
    canClaim,
    isLoading,
  } = useGame();

  const [bet, setBet] = useState(10);
  const [opponentUsername, setOpponentUsername] = useState(
    "Finding Opponent...",
  );
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isMatching, setIsMatching] = useState(false);

  const handleFindMatch = async () => {
    if (!canPlay || isLoading) return;

    setIsMatching(true);
    try {
      await play("duel", bet, "USDT");
      // Simulate opponent matching
      setOpponentUsername(
        `Player-${Math.random().toString(36).substring(7).toUpperCase()}`,
      );
    } catch (err) {
      setIsMatching(false);
    }
  };

  const handleClaimVictory = async () => {
    if (!canClaim || isLoading) return;

    try {
      await claim();
      setIsMatching(false);
    } catch (err) {
      setIsMatching(false);
    }
  };

  // Simulate score animation during matching
  useEffect(() => {
    if (state === "playing" && isMatching) {
      const interval = setInterval(() => {
        setPlayerScore((prev) => Math.min(prev + Math.random() * 20, 100));
        setOpponentScore((prev) => Math.min(prev + Math.random() * 15, 100));
      }, 300);

      return () => clearInterval(interval);
    }
  }, [state, isMatching]);

  const duelResult = lastResult?.outcome as DuelOutcome | undefined;

  return (
    <div className="duel-room p-8 bg-gradient-to-b from-red-900 to-black rounded-lg shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">⚔️ DUEL ARENA</h2>
        <p className="text-gray-400">1v1 PvP Battle</p>
      </div>

      {/* Duel Layout */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Player 1 */}
        <div className="bg-blue-900 rounded-lg p-6 text-center border-2 border-blue-500">
          <div className="text-5xl mb-2">🧙</div>
          <p className="text-white font-bold mb-2">YOU</p>
          <div className="text-4xl font-bold text-yellow-400 mb-4">
            {Math.floor(playerScore)}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${playerScore}%` }}
            />
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <div className="text-4xl font-bold text-white">VS</div>
        </div>

        {/* Player 2 */}
        <div className="bg-red-900 rounded-lg p-6 text-center border-2 border-red-500">
          <div className="text-5xl mb-2">🧙</div>
          <p className="text-white font-bold mb-2">{opponentUsername}</p>
          <div className="text-4xl font-bold text-yellow-400 mb-4">
            {Math.floor(opponentScore)}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all"
              style={{ width: `${opponentScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bet Control */}
      {!isMatching && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <label className="text-white font-semibold">Bet Amount:</label>
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(parseFloat(e.target.value) || 10)}
              disabled={isLoading}
              className="bg-gray-800 text-white px-4 py-2 rounded w-32 border border-gray-600"
              min="1"
              max="1000"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        {!isMatching ? (
          <button
            onClick={handleFindMatch}
            disabled={!canPlay || isLoading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg text-xl disabled:opacity-50"
          >
            {isLoading ? "⏳ Matching..." : "🎯 Find Match"}
          </button>
        ) : (
          <>
            <button
              onClick={handleClaimVictory}
              disabled={!canClaim || isLoading}
              className="flex-1 bg-gradient-to-r from-green-400 to-green-600 text-black font-bold py-4 px-6 rounded-lg text-xl disabled:opacity-50"
            >
              {isLoading ? "⏳ Processing..." : "🏆 CLAIM WIN"}
            </button>
            <button
              onClick={() => {
                setIsMatching(false);
                setPlayerScore(0);
                setOpponentScore(0);
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg"
            >
              🚫 Forfeit
            </button>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border-l-4 border-red-600 text-red-100 p-4 mb-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error.message}</p>
        </div>
      )}

      {/* Result Display */}
      {duelResult && (
        <div
          className={`rounded-lg p-6 border-l-4 text-center ${
            duelResult.playerResult === "win"
              ? "bg-green-900 border-green-600 text-green-100"
              : duelResult.playerResult === "loss"
                ? "bg-red-900 border-red-600 text-red-100"
                : "bg-yellow-900 border-yellow-600 text-yellow-100"
          }`}
        >
          <p className="text-3xl font-bold mb-2">
            {duelResult.playerResult === "win"
              ? "🎉 VICTORY!"
              : duelResult.playerResult === "loss"
                ? "💔 DEFEAT"
                : "🤝 DRAW"}
          </p>
          <p className="text-xl mb-2">
            Final Score: {duelResult.playerScore} vs {duelResult.opponentScore}
          </p>
          <p className="text-sm">Reason: {duelResult.reason}</p>
        </div>
      )}

      {/* Status */}
      {isMatching && (
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>⚔️ Battle in progress...</p>
        </div>
      )}
    </div>
  );
}
