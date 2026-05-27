/**
 * Leaderboard Component - Real-time Ranking Display
 *
 * Features:
 * - Multiple period tabs (daily, weekly, all-time)
 * - Metric selector (wins, profit, games played)
 * - User highlight
 * - Real-time updates (throttled)
 * - Pagination
 */

import React, { useState, useEffect } from "react";
import { LeaderboardService } from "../lib/LeaderboardService";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardMetric,
} from "../lib/gaming-types";

interface LeaderboardProps {
  userId?: string;
  leaderboardService: LeaderboardService;
  limit?: number;
}

export function Leaderboard({
  userId,
  leaderboardService,
  limit = 50,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<LeaderboardPeriod>("all_time");
  const [metric, setMetric] = useState<LeaderboardMetric>("total_wins");
  const [userRank, setUserRank] = useState<number | null>(null);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await leaderboardService.getRanking(
          period,
          metric,
          undefined,
          limit,
        );
        setEntries(data);

        if (userId) {
          const rank = await leaderboardService.getUserRank(
            userId,
            period,
            metric,
          );
          setUserRank(rank);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time updates (1-second throttle)
    const unsubscribe = leaderboardService.subscribe((snapshot) => {
      if (snapshot.period === period && snapshot.metric === metric) {
        setEntries(snapshot.entries);
      }
    });

    return unsubscribe;
  }, [period, metric, leaderboardService, userId, limit]);

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const getMetricLabel = (metric: LeaderboardMetric): string => {
    switch (metric) {
      case "total_wins":
        return "Wins";
      case "total_profit":
        return "Profit";
      case "games_played":
        return "Games";
      default:
        return metric;
    }
  };

  return (
    <div className="leaderboard p-6 bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-2xl border border-gray-700">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-4">🏆 LEADERBOARD</h2>

        {/* Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(["daily", "weekly", "all_time"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded font-semibold transition ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {p === "all_time"
                  ? "All Time"
                  : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex gap-2">
            {(["total_wins", "total_profit", "games_played"] as const).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    metric === m
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {getMetricLabel(m)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* User Rank */}
        {userId && userRank && (
          <div className="mt-4 p-3 bg-blue-900 rounded border border-blue-500 text-blue-100">
            <p className="font-semibold">Your Rank: #{userRank}</p>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
          <p>Loading leaderboard...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No leaderboard data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="px-4 py-3 font-bold text-gray-300">#</th>
                <th className="px-4 py-3 font-bold text-gray-300">Player</th>
                <th className="px-4 py-3 font-bold text-gray-300 text-right">
                  {getMetricLabel(metric)}
                </th>
                <th className="px-4 py-3 font-bold text-gray-300 text-right">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isCurrentUser = userId && entry.userId === userId;
                const rowClass = isCurrentUser
                  ? "bg-blue-900 bg-opacity-30 border-l-4 border-blue-500"
                  : idx % 2 === 0
                    ? "bg-gray-900 bg-opacity-50"
                    : "";

                return (
                  <tr
                    key={`${entry.userId}-${entry.rank}`}
                    className={`${rowClass} border-b border-gray-700 hover:bg-gray-800 transition`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getMedalEmoji(entry.rank) && (
                          <span className="text-2xl">
                            {getMedalEmoji(entry.rank)}
                          </span>
                        )}
                        <span className="font-bold text-gray-300">
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">
                          {entry.username}
                        </p>
                        {isCurrentUser && (
                          <p className="text-xs text-blue-400">(You)</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-yellow-400 text-lg">
                        {entry.value}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-400">↑</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Updated at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

export default Leaderboard;
