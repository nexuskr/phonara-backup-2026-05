/**
 * CrashGame Component - Crash Betting Game UI
 *
 * Features:
 * - Real-time crash point graph
 * - Multiplier display with growth animation
 * - Cashout button logic
 * - Result feedback (win/loss)
 */

import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameStateContext";
import type { CrashOutcome } from "../lib/gaming-types";

export function CrashGame() {
  const {
    play,
    claim,
    state,
    error,
    canPlay,
    canClaim,
    isLoading,
    lastResult,
  } = useGame();

  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [isCashed, setIsCashed] = useState(false);
  const [graphPoints, setGraphPoints] = useState<number[]>([1.0]);

  const handleStartGame = async () => {
    if (!canPlay || isLoading) return;

    try {
      await play("crash", bet, "USDT");
      setMultiplier(1.0);
      setCrashPoint(null);
      setIsCashed(false);
      setGraphPoints([1.0]);
    } catch (err) {
      // Error handled in context
    }
  };

  const handleCashout = async () => {
    if (isCashed || state !== "playing") return;

    setIsCashed(true);
    // After small delay, claim the result
    setTimeout(() => {
      if (canClaim) {
        claim();
      }
    }, 500);
  };

  // Simulate crash multiplier growth
  useEffect(() => {
    if (state === "playing" && !isCashed && !crashPoint) {
      const interval = setInterval(() => {
        setMultiplier((prev) => {
          const newMult = prev * 1.08; // 8% growth per tick
          setGraphPoints((pts) => [...pts, newMult]);

          // Random crash (3% chance per tick)
          if (Math.random() < 0.03 || newMult > 100) {
            setCrashPoint(newMult);
            return prev;
          }

          return newMult;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state, isCashed, crashPoint]);

  const crashResult = lastResult?.outcome as CrashOutcome | undefined;
  const isWin = crashResult?.wasCashedOut && crashResult?.profitLoss >= 0;

  return (
    <div className="crash-game p-8 bg-gradient-to-br from-orange-900 via-black to-red-900 rounded-lg shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">📈 CRASH GAME</h2>
        <p className="text-gray-400">Cash out before it crashes!</p>
      </div>

      {/* Game Display */}
      <div className="bg-black rounded-lg p-8 mb-6 border-2 border-orange-500">
        {/* Multiplier Display */}
        <div className="text-center mb-6">
          <div className="text-7xl font-bold mb-2">
            <span
              className={`${
                crashPoint && !isCashed
                  ? "text-red-500"
                  : isCashed
                    ? "text-green-500"
                    : "text-yellow-400"
              } transition-all`}
            >
              {multiplier.toFixed(2)}x
            </span>
          </div>

          {crashPoint && !isCashed && (
            <div className="text-4xl text-red-500 font-bold animate-pulse">
              💥 CRASHED!
            </div>
          )}
          {isCashed && (
            <div className="text-4xl text-green-500 font-bold">
              ✅ CASHED OUT!
            </div>
          )}
        </div>

        {/* Mini Graph */}
        <div className="h-32 bg-gray-900 rounded border border-gray-700 p-2 mb-4">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 300 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={100 - y}
                x2="300"
                y2={100 - y}
                stroke="#444"
                strokeWidth="0.5"
              />
            ))}

            {/* Plot line */}
            {graphPoints.length > 1 && (
              <polyline
                points={graphPoints
                  .map((p, i) => {
                    const x = (i / graphPoints.length) * 300;
                    const y = 100 - Math.min(p / 10, 100); // Scale to graph
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={crashPoint && !isCashed ? "#ef4444" : "#fbbf24"}
                strokeWidth="2"
              />
            )}

            {/* Crash point marker */}
            {crashPoint && (
              <circle
                cx={((graphPoints.length - 1) / graphPoints.length) * 300}
                cy={100 - Math.min(crashPoint / 10, 100)}
                r="4"
                fill="#ef4444"
              />
            )}
          </svg>
        </div>

        {/* Status Text */}
        <div className="text-center text-gray-300 text-sm">
          {graphPoints.length > 0 && (
            <p>
              {crashPoint
                ? `Crashed at ${crashPoint.toFixed(2)}x`
                : `Current: ${multiplier.toFixed(2)}x`}
            </p>
          )}
        </div>
      </div>

      {/* Bet Control */}
      {state === "idle" && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <label className="text-white font-semibold">Bet Amount:</label>
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(parseFloat(e.target.value) || 10)}
              disabled={isLoading}
              className="bg-gray-800 text-white px-4 py-2 rounded w-32 border border-gray-600"
              min="0.1"
              max="10000"
              step="0.1"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        {state === "idle" ? (
          <button
            onClick={handleStartGame}
            disabled={!canPlay || isLoading}
            className="flex-1 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-black font-bold py-4 px-6 rounded-lg text-xl disabled:opacity-50"
          >
            {isLoading ? "⏳ Starting..." : "🚀 START"}
          </button>
        ) : state === "playing" && !isCashed && !crashPoint ? (
          <button
            onClick={handleCashout}
            className="flex-1 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-black font-bold py-4 px-6 rounded-lg text-xl"
          >
            💰 CASH OUT @ {multiplier.toFixed(2)}x
          </button>
        ) : null}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border-l-4 border-red-600 text-red-100 p-4 mb-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error.message}</p>
        </div>
      )}

      {/* Result Display */}
      {crashResult && (
        <div
          className={`rounded-lg p-6 border-l-4 ${
            isWin
              ? "bg-green-900 border-green-600 text-green-100"
              : "bg-red-900 border-red-600 text-red-100"
          }`}
        >
          <p className="text-3xl font-bold mb-2">
            {isWin ? "🎉 WIN!" : "💥 LOSS"}
          </p>
          <div className="text-lg mb-2">
            <p>Crash Point: {crashResult.crashPoint.toFixed(2)}x</p>
            {crashResult.playerCashout && (
              <p>Your Cashout: {crashResult.playerCashout.toFixed(2)}x</p>
            )}
          </div>
          <p className="text-2xl font-bold">
            Profit/Loss: ${crashResult.profitLoss.toFixed(2)}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
}
