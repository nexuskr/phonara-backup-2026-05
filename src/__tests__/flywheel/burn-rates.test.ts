// IMPERIAL-SINGULARITY v3.5-H: burn rate + NFT tier mirror tests.
import { describe, it, expect } from "vitest";
import { BURN, houseEdgeBurnRate, nearMissBurnRate, expectedBurnAmount } from "@/lib/imperialBurn";
import { tierFor, nextThreshold, NFT_TIERS } from "@/lib/imperialNft";

describe("imperial burn rates", () => {
  it("house edge base = 26%", () => {
    expect(houseEdgeBurnRate()).toBeCloseTo(0.26, 6);
  });
  it("volatility extra per tier", () => {
    expect(houseEdgeBurnRate("calm")).toBeCloseTo(0.268, 4);
    expect(houseEdgeBurnRate("warm")).toBeCloseTo(0.272, 4);
    expect(houseEdgeBurnRate("hot")).toBeCloseTo(0.278, 4);
    expect(houseEdgeBurnRate("surge")).toBeCloseTo(0.284, 4);
    expect(houseEdgeBurnRate("extreme")).toBeCloseTo(0.292, 4);
  });
  it("near miss bounded 12..22%", () => {
    expect(nearMissBurnRate(0)).toBeCloseTo(BURN.NEAR_MISS_STRONG.min, 4);
    expect(nearMissBurnRate(1)).toBeCloseTo(BURN.NEAR_MISS_STRONG.max, 4);
    for (let i = 0; i <= 100; i++) {
      const r = nearMissBurnRate(i / 100);
      expect(r).toBeGreaterThanOrEqual(BURN.NEAR_MISS_STRONG.min);
      expect(r).toBeLessThanOrEqual(BURN.NEAR_MISS_STRONG.max);
    }
  });
  it("expected burn amount handles invalid inputs", () => {
    expect(expectedBurnAmount(0)).toBe(0);
    expect(expectedBurnAmount(-100)).toBe(0);
    expect(expectedBurnAmount(NaN)).toBe(0);
    expect(expectedBurnAmount(1000)).toBeCloseTo(260, 6);
  });
});

describe("imperial NFT tiers", () => {
  it("threshold mapping", () => {
    expect(tierFor(0)).toBe(0);
    expect(tierFor(999)).toBe(0);
    expect(tierFor(1000)).toBe(1);
    expect(tierFor(25_000)).toBe(2);
    expect(tierFor(250_000)).toBe(3);
    expect(tierFor(2_500_000)).toBe(4);
    expect(tierFor(25_000_000)).toBe(5);
    expect(tierFor(999_999_999)).toBe(5);
  });
  it("next threshold remaining", () => {
    expect(nextThreshold(500)?.remaining).toBe(500);
    expect(nextThreshold(25_000_000)).toBeNull();
  });
  it("monotonic perks", () => {
    for (let i = 1; i < NFT_TIERS.length; i++) {
      expect(NFT_TIERS[i].revShareBps).toBeGreaterThanOrEqual(NFT_TIERS[i-1].revShareBps);
      expect(NFT_TIERS[i].yieldBoostBps).toBeGreaterThanOrEqual(NFT_TIERS[i-1].yieldBoostBps);
      expect(NFT_TIERS[i].govWeight).toBeGreaterThanOrEqual(NFT_TIERS[i-1].govWeight);
    }
  });
});
