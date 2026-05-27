/**
 * PlayerStats Component - User Game Statistics Display
 *
 * Features:
 * - Overall statistics
 * - Per-game breakdown
 * - Win rate visualization
 * - Profit/Loss chart
 * - Streak indicators
 */

import React, { useState, useEffect } from "react";
import { AnalyticsService } from "../lib/AnalyticsService";
import type { UserGameStats, GameTheme } from "../lib/gaming-types";

interface PlayerStatsProps {
  userId: string;
  analyticsService: AnalyticsService;
}

export function PlayerStats({ userId, analyticsService }: PlayerStatsProps) {
  const [aggregateStats, setAggregateStats] = useState<{
    totalGames: number;
    totalBet: number;
    totalWin: number;
    profitLoss: number;
    winRate: number;
  } | null>(null);

  const [gameStats, setGameStats] = useState<Map<GameTheme, UserGameStats>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const aggregate = await analyticsService.getUserAggregateStats(userId);
        setAggregateStats(aggregate);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId, analyticsService]);

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 to-black rounded-lg">
        <div className="text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!aggregateStats) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 to-black rounded-lg text-gray-400">
        <p>No statistics available yet. Start playing to see your stats!</p>
      </div>
    );
  }

  const profitLossClass =
    aggregateStats.profitLoss >= 0 ? "text-green-400" : "text-red-400";
  const profitLossSign = aggregateStats.profitLoss >= 0 ? "+" : "";

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-2xl border border-gray-700 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          📊 YOUR STATISTICS
        </h2>
        <p className="text-gray-400">
          View your gaming performance and achievements
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Games */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4 border border-blue-600">
          <p className="text-gray-300 text-sm font-semibold mb-1">
            Games Played
          </p>
          <p className="text-3xl font-bold text-blue-300">
            {aggregateStats.totalGames}
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-4 border border-purple-600">
          <p className="text-gray-300 text-sm font-semibold mb-1">Win Rate</p>
          <p className="text-3xl font-bold text-purple-300">
            {(aggregateStats.winRate * 100).toFixed(1)}%
          </p>
        </div>

        {/* Total Bet */}
        <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-4 border border-orange-600">
          <p className="text-gray-300 text-sm font-semibold mb-1">
            Total Wagered
          </p>
          <p className="text-3xl font-bold text-orange-300">
            ${aggregateStats.totalBet.toFixed(2)}
          </p>
        </div>

        {/* Profit/Loss */}
        <div
          className={`bg-gradient-to-br ${aggregateStats.profitLoss >= 0 ? "from-green-900 to-green-800" : "from-red-900 to-red-800"} rounded-lg p-4 border ${aggregateStats.profitLoss >= 0 ? "border-green-600" : "border-red-600"}`}
        >
          <p className="text-gray-300 text-sm font-semibold mb-1">
            Profit/Loss
          </p>
          <p className={`text-3xl font-bold ${profitLossClass}`}>
            {profitLossSign}${Math.abs(aggregateStats.profitLoss).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">
          📈 Performance Breakdown
        </h3>

        <div className="space-y-3">
          {/* Total Wagered vs Total Won */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Total Wagered vs Won</span>
              <span className="text-white font-semibold">
                ${aggregateStats.totalBet.toFixed(2)} vs $
                {aggregateStats.totalWin.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${Math.min((aggregateStats.totalWin / aggregateStats.totalBet) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Win Rate Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-white font-semibold">
                {(aggregateStats.winRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${aggregateStats.winRate * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RTP Indicator */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg p-4 border border-purple-600">
        <h3 className="text-lg font-bold text-white mb-2">💡 Your RTP</h3>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-4xl font-bold text-yellow-300">
              {(
                (aggregateStats.totalWin / aggregateStats.totalBet) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {(aggregateStats.totalWin / aggregateStats.totalBet) * 100 > 96
                ? "📈 Above average!"
                : "📉 Keep playing!"}
            </p>
          </div>
          <div className="flex-1">
            <div className="text-right text-sm text-gray-400">
              <p>House Target: 96%</p>
              <p>
                Your Return:{" "}
                {(
                  (aggregateStats.totalWin / aggregateStats.totalBet) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Updated at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

export default PlayerStats;
