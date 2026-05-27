/**
 * Gaming Engine Unit Tests
 *
 * Tests for RNG, Slots, Duel, and Crash engines
 */

import { describe, it, expect } from "vitest";
import { SeededRandom, generateSeed, verifyRngReproducibility } from "./rng";
import {
  spinSlots,
  validateSpinOutcome,
  calculateGameRTP,
} from "./slots-engine";
import { simulateDuelMatch, validateDuelOutcome } from "./duel-engine";
import {
  simulateCrashGame,
  validateCrashOutcome,
  calculateCrashWinRate,
  calculateAverageCrashPoint,
} from "./crash-engine";

describe("SeededRandom", () => {
  it("should generate deterministic sequences", () => {
    const seed = "0123456789abcdef";
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);

    for (let i = 0; i < 100; i++) {
      expect(rng1.integer(0, 1000000)).toBe(rng2.integer(0, 1000000));
    }
  });

  it("should generate different sequences for different seeds", () => {
    const rng1 = new SeededRandom("0000000000000000");
    const rng2 = new SeededRandom("ffffffffffffffff");

    const nums1 = Array.from({ length: 10 }, () => rng1.integer(0, 1000));
    const nums2 = Array.from({ length: 10 }, () => rng2.integer(0, 1000));

    expect(nums1).not.toEqual(nums2);
  });

  it("should generate floats in correct range", () => {
    const rng = new SeededRandom("0123456789abcdef");
    for (let i = 0; i < 100; i++) {
      const num = rng.float(10, 20);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
    }
  });

  it("should handle weighted choice", () => {
    const rng = new SeededRandom("0123456789abcdef");
    const items = [
      [1, 90],
      [2, 10],
    ] as const;
    const choices = Array.from({ length: 100 }, () => rng.weighted(items));
    const count1 = choices.filter((x) => x === 1).length;
    // Should be roughly 90% (allow 70-100%)
    expect(count1).toBeGreaterThan(70);
    expect(count1).toBeLessThanOrEqual(100);
  });

  it("should verify reproducibility", () => {
    const seed = generateSeed();
    expect(verifyRngReproducibility(seed, 1000)).toBe(true);
  });
});

describe("Slots Engine", () => {
  it("should generate valid spin outcomes", () => {
    const outcome = spinSlots({
      betAmount: 100,
      gameId: "cosmic_forge",
      seed: "0123456789abcdef",
    });

    expect(outcome.type).toBe("slots");
    expect(outcome.reels.length).toBe(5);
    expect(outcome.reels[0].length).toBe(3);
    expect(outcome.totalWin).toBeGreaterThanOrEqual(0);
    expect(validateSpinOutcome(outcome, "0123456789abcdef")).toBe(true);
  });

  it("should handle all game themes", () => {
    const themes = [
      "cosmic_forge",
      "neon_tokyo_88",
      "pirates_curse",
      "pharaohs_vault",
      "viking_thunder",
      "aztec_sun",
      "cherry_sakura",
    ] as const;

    for (const theme of themes) {
      const outcome = spinSlots({
        betAmount: 100,
        gameId: theme,
        seed: generateSeed(),
      });

      expect(outcome.type).toBe("slots");
      expect(outcome.totalWin).toBeGreaterThanOrEqual(0);
      expect(validateSpinOutcome(outcome, "")).toBe(true);
    }
  });

  it("should generate reproducible outcomes", () => {
    const seed = "0123456789abcdef";
    const outcome1 = spinSlots({
      betAmount: 100,
      gameId: "cosmic_forge",
      seed,
    });
    const outcome2 = spinSlots({
      betAmount: 100,
      gameId: "cosmic_forge",
      seed,
    });

    expect(outcome1.reels).toEqual(outcome2.reels);
    expect(outcome1.totalWin).toBe(outcome2.totalWin);
  });

  it("should calculate RTP approximately correct", () => {
    // RTP should be around 96% (4% house edge)
    // With 10k simulations, expect result between 92-100%
    const rtp = calculateGameRTP("cosmic_forge", 10000);
    expect(rtp).toBeGreaterThan(0.9);
    expect(rtp).toBeLessThan(1.05);
  });
});

describe("Duel Engine", () => {
  it("should generate valid duel outcomes", () => {
    const outcome = simulateDuelMatch({
      player1Id: "player1",
      player2Id: "player2",
      betAmount: 100,
      seed: "0123456789abcdef",
    });

    expect(outcome.type).toBe("duel");
    expect(validateDuelOutcome(outcome)).toBe(true);
    expect(["win", "loss", "draw"]).toContain(outcome.playerResult);
  });

  it("should have valid score range", () => {
    for (let i = 0; i < 100; i++) {
      const outcome = simulateDuelMatch({
        player1Id: "p1",
        player2Id: "p2",
        betAmount: 100,
        seed: generateSeed(),
      });

      expect(outcome.playerScore).toBeGreaterThanOrEqual(0);
      expect(outcome.playerScore).toBeLessThanOrEqual(100);
      expect(outcome.opponentScore).toBeGreaterThanOrEqual(0);
      expect(outcome.opponentScore).toBeLessThanOrEqual(100);
    }
  });

  it("should handle draw correctly", () => {
    // With enough simulations, should see some draws
    let drawCount = 0;
    for (let i = 0; i < 1000; i++) {
      const outcome = simulateDuelMatch({
        player1Id: "p1",
        player2Id: "p2",
        betAmount: 100,
        seed: i.toString(16).padStart(16, "0"),
      });

      if (outcome.playerResult === "draw") drawCount++;
    }

    // Should have at least a few draws
    expect(drawCount).toBeGreaterThan(0);
  });
});

describe("Crash Engine", () => {
  it("should generate valid crash outcomes", () => {
    const outcome = simulateCrashGame({
      seed: "0123456789abcdef",
      betAmount: 100,
      playerCashout: 1.5,
    });

    expect(outcome.type).toBe("crash");
    expect(validateCrashOutcome(outcome)).toBe(true);
    expect(outcome.crashPoint).toBeGreaterThan(1);
    expect(outcome.crashPoint).toBeLessThanOrEqual(100);
  });

  it("should handle successful cashout", () => {
    const outcome = simulateCrashGame({
      seed: "0123456789abcdef",
      betAmount: 100,
      playerCashout: 1.2,
    });

    if (outcome.wasCashedOut) {
      expect(outcome.profitLoss).toBeGreaterThanOrEqual(0);
    }
  });

  it("should handle crash before cashout", () => {
    const outcome = simulateCrashGame({
      seed: "0123456789abcdef",
      betAmount: 100,
      playerCashout: 200, // Very high cashout target (likely crash)
    });

    if (!outcome.wasCashedOut) {
      expect(outcome.profitLoss).toBeLessThan(0);
    }
  });

  it("should calculate crash statistics", () => {
    const outcomes = Array.from({ length: 100 }, (_, i) =>
      simulateCrashGame({
        seed: i.toString(16).padStart(16, "0"),
        betAmount: 100,
        playerCashout: 1.5,
      }),
    );

    const avgCrash = calculateAverageCrashPoint(outcomes);
    const winRate = calculateCrashWinRate(outcomes);

    expect(avgCrash).toBeGreaterThan(1);
    expect(avgCrash).toBeLessThan(50);
    expect(winRate).toBeGreaterThanOrEqual(0);
    expect(winRate).toBeLessThanOrEqual(100);
  });
});
