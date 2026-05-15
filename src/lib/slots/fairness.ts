// Provably-fair verification helper.
// For each completed spin we store: server_seed_hash (committed before spin),
// server_seed_revealed (revealed after), client_seed, nonce.
// The player can re-hash the revealed seed and confirm it matches the committed hash.

export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type FairnessVerdict =
  | { ok: true; recomputedHash: string }
  | { ok: false; reason: "hash_mismatch" | "missing_fields"; recomputedHash?: string };

export async function verifySpin(opts: {
  server_seed_revealed?: string | null;
  server_seed_hash?: string | null;
}): Promise<FairnessVerdict> {
  const seed = opts.server_seed_revealed?.trim();
  const expected = opts.server_seed_hash?.trim().toLowerCase();
  if (!seed || !expected) return { ok: false, reason: "missing_fields" };
  const recomputed = await sha256Hex(seed);
  if (recomputed.toLowerCase() !== expected) {
    return { ok: false, reason: "hash_mismatch", recomputedHash: recomputed };
  }
  return { ok: true, recomputedHash: recomputed };
}
