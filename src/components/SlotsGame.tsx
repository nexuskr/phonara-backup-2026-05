/**
 * SlotsGame Component - Slots Machine UI
 *
 * Features:
 * - 5 spinning reels animation
 * - Payline visualization
 * - Bet input & controls
 * - Result display
 * - Win/Loss feedback
 */

import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameStateContext";
import type { GameTheme, SlotsOutcome } from "../lib/gaming-types";

interface SlotsGameProps {
  gameTheme: GameTheme;
  minBet?: number;
  maxBet?: number;
  onResultDisplay?: (outcome: SlotsOutcome) => void;
}

export function SlotsGame({
  gameTheme,
  minBet = 0.1,
  maxBet = 1000,
  onResultDisplay,
}: SlotsGameProps) {
  const {
    play,
    claim,
    state,
    currentRound,
    lastResult,
    error,
    canPlay,
    canClaim,
    isLoading,
  } = useGame();

  const [bet, setBet] = useState(minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayReels, setDisplayReels] = useState([
    [0, 1, 2],
    [1, 2, 3],
    [2, 3, 4],
    [3, 4, 5],
    [4, 5, 6],
  ]);

  // Handle spin button
  const handleSpin = async () => {
    if (!canPlay || isLoading) return;

    setIsSpinning(true);
    try {
      await play(gameTheme, bet, "USDT");
    } catch (err) {
      setIsSpinning(false);
    }
  };

  // Handle claim button
  const handleClaim = async () => {
    if (!canClaim || isLoading) return;

    try {
      const result = await claim();
      if (result) {
        onResultDisplay?.(result.outcome);
      }
      setIsSpinning(false);
    } catch (err) {
      setIsSpinning(false);
    }
  };

  // Simulate reel spinning animation
  useEffect(() => {
    if (state === "playing") {
      const interval = setInterval(() => {
        setDisplayReels((prev) =>
          prev.map((reel) => [
            (reel[0] + 1) % 11,
            (reel[1] + 1) % 11,
            (reel[2] + 1) % 11,
          ]),
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [state]);

  const getSymbolEmoji = (index: number): string => {
    const emojis = [
      "🔟",
      "🇯",
      "🇶",
      "🇰",
      "🅰️",
      "⭐",
      "✨",
      "💎",
      "👑",
      "🃏",
      "🎯",
    ];
    return emojis[index] ?? "?";
  };

  return (
    <div className="slots-game-container p-8 bg-gradient-to-b from-purple-900 to-black rounded-lg shadow-2xl">
      {/* Game Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {gameTheme.replace(/_/g, " ")}
        </h2>
        <div className="text-yellow-400 text-2xl font-bold">
          💰 Slots Machine
        </div>
      </div>

      {/* Reels */}
      <div className="bg-black rounded-lg p-6 mb-6 border-4 border-yellow-500">
        <div className="flex justify-between gap-2 mb-4">
          {displayReels.map((reel, reelIdx) => (
            <div
              key={reelIdx}
              className="flex-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded p-3 border-2 border-yellow-400 text-center transition-transform"
              style={{
                transform:
                  state === "playing"
                    ? `translateY(${Math.random() * 20}px)`
                    : "translateY(0)",
              }}
            >
              <div className="space-y-2">
                {reel.map((symbol, idx) => (
                  <div
                    key={idx}
                    className={`text-4xl font-bold transition-all ${
                      idx === 1
                        ? "text-yellow-300 scale-125"
                        : "text-gray-400 scale-75"
                    }`}
                  >
                    {getSymbolEmoji(symbol)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Payline Indicator */}
        <div className="flex justify-center gap-2 text-yellow-500">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"
              />
            ))}
        </div>
      </div>

      {/* Bet Controls */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <label className="text-white font-semibold">Bet Amount:</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBet(Math.max(minBet, bet - 1))}
              disabled={bet <= minBet || isLoading}
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white disabled:opacity-50"
            >
              −
            </button>
            <input
              type="number"
              value={bet}
              onChange={(e) =>
                setBet(
                  Math.min(
                    maxBet,
                    Math.max(minBet, parseFloat(e.target.value) || minBet),
                  ),
                )
              }
              disabled={isLoading}
              className="bg-gray-800 text-white text-right px-4 py-2 rounded w-24 border border-gray-600"
              step="0.1"
            />
            <button
              onClick={() => setBet(Math.min(maxBet, bet + 1))}
              disabled={bet >= maxBet || isLoading}
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-white disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick Bet Buttons */}
        <div className="flex gap-2">
          {[0.1, 1, 10, 100].map((amount) => (
            <button
              key={amount}
              onClick={() => setBet(amount)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm disabled:opacity-50"
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSpin}
          disabled={!canPlay || isLoading}
          className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-4 px-6 rounded-lg text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "⏳ Processing..." : "🎰 SPIN"}
        </button>

        {canClaim && (
          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-black font-bold py-4 px-6 rounded-lg text-xl disabled:opacity-50 transition-all"
          >
            {isLoading ? "⏳ Claiming..." : "💰 CLAIM"}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-900 border-l-4 border-red-600 text-red-100 p-4 mb-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error.message}</p>
        </div>
      )}

      {lastResult && state === "claimed" && (
        <div
          className={`rounded-lg p-4 border-l-4 ${lastResult.isWin ? "bg-green-900 border-green-600 text-green-100" : "bg-gray-800 border-gray-600 text-gray-100"}`}
        >
          <p className="font-bold text-lg">
            {lastResult.isWin ? "🎉 WIN!" : "😢 Loss"}
          </p>
          <p className="text-xl font-bold">${lastResult.winAmount}</p>
          <p className="text-sm">
            {lastResult.multiplier.toFixed(2)}x Multiplier
          </p>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <p className="mt-2">Playing... {state}</p>
        </div>
      )}
    </div>
  );
}
