/**
 * Gaming Dashboard - Comprehensive Overview
 *
 * Features:
 * - Real-time game status
 * - Quick access to all games
 * - Recent wins/losses
 * - Session summary
 */

import React, { useState } from "react";
import type { GameTheme } from "../lib/gaming-types";

interface GamingDashboardProps {
  userId?: string;
  onGameSelect: (gameId: GameTheme) => void;
}

export function GamingDashboard({
  userId,
  onGameSelect,
}: GamingDashboardProps) {
  const games: Array<{
    id: GameTheme;
    name: string;
    emoji: string;
    description: string;
    volatility: "low" | "mid" | "high" | "very_high";
  }> = [
    {
      id: "cosmic_forge",
      name: "Cosmic Forge",
      emoji: "✨",
      description: "Money Train style sticky multiplier",
      volatility: "high",
    },
    {
      id: "neon_tokyo_88",
      name: "Neon Tokyo 88",
      emoji: "🌃",
      description: "Big Bass style hold & spin",
      volatility: "mid",
    },
    {
      id: "pirates_curse",
      name: "Pirate's Curse",
      emoji: "🏴‍☠️",
      description: "Crash-as-bonus feature",
      volatility: "very_high",
    },
    {
      id: "pharaohs_vault",
      name: "Pharaoh's Vault",
      emoji: "🏺",
      description: "Pick & reveal jackpot",
      volatility: "high",
    },
    {
      id: "viking_thunder",
      name: "Viking Thunder",
      emoji: "⚡",
      description: "Three-path free spins",
      volatility: "mid",
    },
    {
      id: "aztec_sun",
      name: "Aztec Sun",
      emoji: "☀️",
      description: "Cluster pays tumble",
      volatility: "low",
    },
    {
      id: "cherry_sakura",
      name: "Cherry Sakura",
      emoji: "🌸",
      description: "Slingo trail adventure",
      volatility: "low",
    },
  ];

  const volatilityColor = (v: string): string => {
    switch (v) {
      case "low":
        return "bg-green-900 border-green-600 text-green-300";
      case "mid":
        return "bg-yellow-900 border-yellow-600 text-yellow-300";
      case "high":
        return "bg-orange-900 border-orange-600 text-orange-300";
      case "very_high":
        return "bg-red-900 border-red-600 text-red-300";
      default:
        return "bg-gray-900 border-gray-600 text-gray-300";
    }
  };

  return (
    <div className="gaming-dashboard p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">
          🎮 PHONARA GAMING
        </h1>
        <p className="text-gray-400">Choose a game and start winning!</p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            className="group cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 hover:border-yellow-500 p-6 transition-all transform hover:scale-105 hover:shadow-2xl"
          >
            {/* Game Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="text-5xl">{game.emoji}</div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold border ${volatilityColor(game.volatility)}`}
              >
                {game.volatility.toUpperCase()}
              </span>
            </div>

            {/* Game Title */}
            <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4">{game.description}</p>

            {/* Play Button */}
            <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-2 px-4 rounded transition-all group-hover:shadow-lg">
              PLAY NOW
            </button>

            {/* Stats Placeholder */}
            <div className="mt-3 text-xs text-gray-500 text-center">
              RTP: 96% | MAX: 500x
            </div>
          </div>
        ))}
      </div>

      {/* Shortcuts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-600">
          <h3 className="text-lg font-bold text-white mb-3">📊 Quick Stats</h3>
          <div className="space-y-2 text-sm text-blue-100">
            <p>
              Games Today: <span className="font-bold">12</span>
            </p>
            <p>
              Win Rate: <span className="font-bold text-green-300">42%</span>
            </p>
            <p>
              Balance: <span className="font-bold">$1,250.50</span>
            </p>
          </div>
        </div>

        {/* Recent Wins */}
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 border border-green-600">
          <h3 className="text-lg font-bold text-white mb-3">🏆 Recent Wins</h3>
          <div className="space-y-2 text-sm text-green-100">
            <p>
              Slots: <span className="font-bold">250x</span>
            </p>
            <p>
              Duel: <span className="font-bold">+$150</span>
            </p>
            <p>
              Crash: <span className="font-bold">2.45x</span>
            </p>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-6 border border-purple-600">
          <h3 className="text-lg font-bold text-white mb-3">🎁 Rewards</h3>
          <div className="space-y-2 text-sm text-purple-100">
            <p>
              Pending: <span className="font-bold">$25.00</span>
            </p>
            <p>
              Today's Bonus: <span className="font-bold">+$10</span>
            </p>
            <p>
              Referral: <span className="font-bold">+$50</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>🎲 Enjoy responsible gaming. All games are fair and transparent.</p>
      </div>
    </div>
  );
}

export default GamingDashboard;
