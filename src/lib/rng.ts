/**
 * SeededRandom - Deterministic RNG Engine
 *
 * Features:
 * - Reproducible results via seed (enables fairness verification)
 * - Xorshift128+ algorithm for speed & quality
 * - Distribution utilities for gaming (uniform, weighted, shuffled)
 *
 * Usage:
 *   const rng = new SeededRandom('hex-seed');
 *   const spin = rng.integer(0, 32); // Random symbol index
 *   const crashMult = rng.float(1.0, 100.0); // Crash multiplier
 */

export class SeededRandom {
  // Xorshift128+ state
  private x: number;
  private y: number;

  constructor(seed: string) {
    // Parse hex seed into two 32-bit integers
    const seedNum = parseInt(seed.substring(0, 16), 16) || 0;
    this.x = seedNum ^ 0x12345678;
    this.y = (seedNum >> 16) ^ 0x87654321;

    // Ensure non-zero state
    if (this.x === 0 && this.y === 0) {
      this.x = 1;
      this.y = 1;
    }
  }

  /**
   * Next 32-bit random number [0, 2^32)
   */
  private next32(): number {
    let x = this.x;
    const y = this.y;
    this.x = y;
    x ^= (x << 23) >>> 0; // left shift by 23, convert to unsigned
    this.y = (x ^ y ^ (x >>> 17) ^ (y >>> 26)) >>> 0;
    return (this.y + y) >>> 0; // Convert to unsigned 32-bit
  }

  /**
   * Random integer [min, max] inclusive
   */
  public integer(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    const range = max - min + 1;
    return min + (Math.abs(this.next32()) % range);
  }

  /**
   * Random float [min, max)
   */
  public float(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    // Generate 53-bit precision float [0, 1)
    const a = (this.next32() >>> 5) * (1.0 / 67108864.0); // 2^26
    const b = (this.next32() >>> 6) * (1.0 / 67108864.0); // 2^26
    const random = a * 67108864.0 + b;
    return min + random * (1.0 / 9007199254740992.0) * (max - min);
  }

  /**
   * Random boolean with given probability (0.0 to 1.0)
   */
  public boolean(probability: number = 0.5): boolean {
    return this.float(0, 1) < probability;
  }

  /**
   * Weighted choice from array of [value, weight] tuples
   */
  public weighted<T>(items: ReadonlyArray<readonly [T, number]>): T {
    const totalWeight = items.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.float(0, totalWeight);

    for (const [value, weight] of items) {
      roll -= weight;
      if (roll <= 0) return value;
    }

    // Fallback (shouldn't happen with valid weights)
    return items[items.length - 1][0];
  }

  /**
   * Random choice from array
   */
  public choice<T>(items: ReadonlyArray<T>): T {
    if (items.length === 0) throw new Error("Cannot choose from empty array");
    return items[this.integer(0, items.length - 1)];
  }

  /**
   * Fisher-Yates shuffle (destructive on input array)
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.integer(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate random hex string of given length
   */
  public hex(length: number = 16): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += ((this.next32() >>> ((i % 4) * 8)) & 0xf).toString(16);
    }
    return result.substring(0, length);
  }
}

/**
 * Generate a new random seed (hex string)
 */
export function generateSeed(): string {
  // Use crypto if available, fallback to Date-based
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const arr = new Uint32Array(4);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((x) => x.toString(16).padStart(8, "0"))
      .join("");
  }

  // Fallback for Node/test environments
  const time = Date.now();
  const random = Math.random() * 0xffffffff;
  return (time.toString(16) + random.toString(16)).substring(0, 16);
}

/**
 * Verify RNG reproducibility
 * Usage: Verify that same seed produces same sequence
 */
export function verifyRngReproducibility(
  seed: string,
  count: number = 100,
): boolean {
  const rng1 = new SeededRandom(seed);
  const rng2 = new SeededRandom(seed);

  for (let i = 0; i < count; i++) {
    if (rng1.integer(0, 1000000) !== rng2.integer(0, 1000000)) {
      return false;
    }
  }
  return true;
}
