/**
 * Game Metadata & Catalog
 * Defines all 7 game themes with configurations, paytables, and rules
 */

import type { GameMetadata, GameTheme, Volatility } from "./gaming-types";

export const GAME_CATALOG: Record<GameTheme, GameMetadata> = {
  cosmic_forge: {
    id: "cosmic_forge",
    type: "slots",
    title: "Cosmic Forge",
    description: "Money Train style sticky multiplier free spins",
    volatility: "high",
    minBet: 0.1,
    maxBet: 1000,
    rtpTarget: 0.96,
    maxMultiplier: 500,
    iconUrl: "/images/cosmic-forge.png",
    previewUrl: "/videos/cosmic-forge.mp4",
  },
  neon_tokyo_88: {
    id: "neon_tokyo_88",
    type: "slots",
    title: "Neon Tokyo 88",
    description: "Big Bass style hold & spin bonus",
    volatility: "mid",
    minBet: 0.1,
    maxBet: 1000,
    rtpTarget: 0.96,
    maxMultiplier: 250,
    iconUrl: "/images/neon-tokyo.png",
    previewUrl: "/videos/neon-tokyo.mp4",
  },
  pirates_curse: {
    id: "pirates_curse",
    type: "slots",
    title: "Pirate's Curse",
    description: "Crash-as-bonus feature",
    volatility: "very_high",
    minBet: 0.1,
    maxBet: 1000,
    rtpTarget: 0.96,
    maxMultiplier: 1000,
    iconUrl: "/images/pirates-curse.png",
    previewUrl: "/videos/pirates-curse.mp4",
  },
  pharaohs_vault: {
    id: "pharaohs_vault",
    type: "slots",
    title: "Pharaoh's Vault",
    description: "Pick & reveal with jackpot wheel",
    volatility: "high",
    minBet: 0.1,
    maxBet: 1000,
    rtpTarget: 0.96,
    maxMultiplier: 300,
    iconUrl: "/images/pharaohs-vault.png",
    previewUrl: "/videos/pharaohs-vault.mp4",
  },
  viking_thunder: {
    id: "viking_thunder",
    type: "slots",
    title: "Viking Thunder",
    description: "Three path free spin selection",
    volatility: "mid",
    minBet: 0.1,
    maxBet: 1000,
    rtpTarget: 0.96,
    maxMultiplier: 200,
    iconUrl: "/images/viking-thunder.png",
    previewUrl: "/videos/viking-thunder.mp4",
  },
  aztec_sun: {
    id: "aztec_sun",
    type: "slots",
    title: "Aztec Sun",
    description: "Cluster pays with tumbling reels",
    volatility: "low",
    minBet: 0.1,
    maxBet: 1000,
    rtpTarget: 0.96,
    maxMultiplier: 150,
    iconUrl: "/images/aztec-sun.png",
    previewUrl: "/videos/aztec-sun.mp4",
  },
  cherry_sakura: {
    id: "cherry_sakura",
    type: "slots",
    title: "Cherry Sakura",
    description: "Slingo-style trail with checkpoint rewards",
    volatility: "low",
    minBet: 0.1,
    maxBet: 1000,
    rtpTarget: 0.96,
    maxMultiplier: 120,
    iconUrl: "/images/cherry-sakura.png",
    previewUrl: "/videos/cherry-sakura.mp4",
  },
};

/**
 * Paytable for all slot games
 * Symbol indices: 0-4 (low cards), 5-8 (premium), 9 (WILD), 10 (SCATTER)
 */
export const PAYTABLES = {
  cosmic_forge: {
    // [3-match, 4-match, 5-match]
    0: [5, 25, 100], // Card 10
    1: [5, 25, 100], // Card J
    2: [5, 25, 100], // Card Q
    3: [10, 50, 200], // Card K
    4: [10, 50, 200], // Card A
    5: [20, 100, 400], // Premium 1
    6: [20, 100, 400], // Premium 2
    7: [50, 250, 1000], // Premium 3
    8: [100, 500, 2000], // Premium 4
    9: [10, 50, 250], // WILD (substitutes)
    10: [0, 0, 0], // SCATTER (triggers bonus)
  },
  neon_tokyo_88: {
    0: [3, 15, 75],
    1: [3, 15, 75],
    2: [3, 15, 75],
    3: [5, 25, 125],
    4: [5, 25, 125],
    5: [15, 75, 300],
    6: [15, 75, 300],
    7: [40, 200, 800],
    8: [80, 400, 1600],
    9: [8, 40, 200],
    10: [0, 0, 0],
  },
  pirates_curse: {
    0: [8, 40, 150],
    1: [8, 40, 150],
    2: [8, 40, 150],
    3: [15, 75, 300],
    4: [15, 75, 300],
    5: [30, 150, 600],
    6: [30, 150, 600],
    7: [60, 300, 1200],
    8: [120, 600, 2400],
    9: [12, 60, 300],
    10: [0, 0, 0],
  },
  pharaohs_vault: {
    0: [4, 20, 80],
    1: [4, 20, 80],
    2: [4, 20, 80],
    3: [8, 40, 160],
    4: [8, 40, 160],
    5: [16, 80, 320],
    6: [16, 80, 320],
    7: [40, 200, 800],
    8: [80, 400, 1600],
    9: [10, 50, 250],
    10: [0, 0, 0],
  },
  viking_thunder: {
    0: [3, 15, 60],
    1: [3, 15, 60],
    2: [3, 15, 60],
    3: [5, 25, 100],
    4: [5, 25, 100],
    5: [12, 60, 240],
    6: [12, 60, 240],
    7: [30, 150, 600],
    8: [60, 300, 1200],
    9: [8, 40, 200],
    10: [0, 0, 0],
  },
  aztec_sun: {
    0: [2, 10, 40],
    1: [2, 10, 40],
    2: [2, 10, 40],
    3: [3, 15, 60],
    4: [3, 15, 60],
    5: [6, 30, 120],
    6: [6, 30, 120],
    7: [15, 75, 300],
    8: [30, 150, 600],
    9: [5, 25, 125],
    10: [0, 0, 0],
  },
  cherry_sakura: {
    0: [2, 8, 30],
    1: [2, 8, 30],
    2: [2, 8, 30],
    3: [3, 12, 50],
    4: [3, 12, 50],
    5: [5, 20, 80],
    6: [5, 20, 80],
    7: [10, 40, 160],
    8: [20, 80, 320],
    9: [4, 16, 80],
    10: [0, 0, 0],
  },
} as const;

/**
 * Symbol weights for each game
 * Distribution: Low cards (0-4), Premium (5-8), Wild, Scatter
 */
export const SYMBOL_WEIGHTS = {
  cosmic_forge: [150, 130, 120, 100, 90, 80, 75, 60, 40, 40, 15] as const,
  neon_tokyo_88: [160, 140, 130, 110, 100, 70, 70, 50, 30, 35, 15] as const,
  pirates_curse: [140, 120, 110, 90, 80, 90, 85, 70, 50, 30, 20] as const,
  pharaohs_vault: [150, 130, 120, 100, 90, 75, 70, 55, 35, 40, 15] as const,
  viking_thunder: [160, 140, 130, 110, 100, 70, 70, 50, 30, 35, 15] as const,
  aztec_sun: [170, 150, 140, 120, 110, 60, 55, 40, 20, 40, 15] as const,
  cherry_sakura: [180, 160, 150, 130, 120, 50, 50, 30, 15, 40, 15] as const,
} as const;

/**
 * Bonus trigger settings for each game
 */
export const BONUS_CONFIG = {
  cosmic_forge: {
    scatterTrigger: 3,
    freeSpin: 10,
    multiStartVal: 1,
    multiMaxVal: 10,
    stickyWildChance: 0.15, // 15% chance per spin for wild to stick
  },
  neon_tokyo_88: {
    scatterTrigger: 3,
    freeSpin: 8,
    coinChance: 0.2, // 20% chance coin lands
    coinMax: 15,
  },
  pirates_curse: {
    scatterTrigger: 3,
    freeSpin: 12,
    crashGrowth: 1.08, // 8% growth per tick
    crashHazard: 0.03, // 3% crash chance per tick
  },
  pharaohs_vault: {
    scatterTrigger: 3,
    picks: 5,
    jackpotChance: 0.05, // 5% chance for jackpot
  },
  viking_thunder: {
    scatterTrigger: 3,
    paths: ["Midgard", "Muspelheim", "Helheim"],
    freeSpin: [8, 10, 12],
  },
  aztec_sun: {
    scatterTrigger: 4,
    clusterTumble: true,
    multiLadder: [2, 4, 8, 16, 32, 64],
  },
  cherry_sakura: {
    scatterTrigger: 3,
    trailSteps: 20,
    moveMin: 1,
    moveMax: 5,
  },
} as const;

/**
 * House edge applied to all games (in payout calculation)
 */
export const HOUSE_EDGE_PERCENT = 4; // 4% edge = 96% RTP
