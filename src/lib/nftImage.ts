/**
 * NFT image + rarity helpers.
 * 9 curated images: type (crown|emperor|founder) × level (bronze|gold|diamond).
 * Rarity glow tokens differentiate Bronze (copper) / Gold (warm) / Diamond (cyan-purple).
 */
import crownBronze from "@/assets/nft/crown_bronze.jpg";
import crownGold from "@/assets/nft/crown_gold.jpg";
import crownDiamond from "@/assets/nft/crown_diamond.jpg";
import emperorBronze from "@/assets/nft/emperor_bronze.jpg";
import emperorGold from "@/assets/nft/emperor_gold.jpg";
import emperorDiamond from "@/assets/nft/emperor_diamond.jpg";
import founderBronze from "@/assets/nft/founder_bronze.jpg";
import founderGold from "@/assets/nft/founder_gold.jpg";
import founderDiamond from "@/assets/nft/founder_diamond.jpg";

export type NftType = "crown" | "emperor" | "founder";
export type NftLevel = "bronze" | "gold" | "diamond";

const MAP: Record<string, string> = {
  "crown:bronze": crownBronze,
  "crown:gold": crownGold,
  "crown:diamond": crownDiamond,
  "emperor:bronze": emperorBronze,
  "emperor:gold": emperorGold,
  "emperor:diamond": emperorDiamond,
  "founder:bronze": founderBronze,
  "founder:gold": founderGold,
  "founder:diamond": founderDiamond,
};

export function getNftImage(
  type?: string | null,
  level?: string | null,
  externalUrl?: string | null,
): string | null {
  if (externalUrl) return externalUrl;
  if (!type || !level) return null;
  return MAP[`${type}:${level}`] ?? null;
}

/** Tailwind classes for rarity-based ring glow. */
export function getRarityRingClass(level?: string | null): string {
  switch (level) {
    case "diamond":
      // cyan -> violet diamond aurora
      return "ring-2 ring-[hsl(195_95%_60%)] shadow-[0_0_24px_-2px_hsl(265_90%_65%/0.7),0_0_12px_-2px_hsl(195_95%_60%/0.7)]";
    case "gold":
      // warm gold
      return "ring-2 ring-[hsl(45_95%_55%)] shadow-[0_0_22px_-2px_hsl(40_90%_55%/0.7)]";
    case "bronze":
      // copper / bronze
      return "ring-2 ring-[hsl(22_70%_50%)] shadow-[0_0_18px_-3px_hsl(22_75%_45%/0.65)]";
    default:
      // No NFT — subtle empire gradient with breathing glow (handled in component)
      return "ring-1 ring-primary/30 shadow-[0_0_10px_-3px_hsl(var(--primary)/0.4)]";
  }
}

export function getRarityLabel(level?: string | null): string {
  switch (level) {
    case "diamond":
      return "DIAMOND";
    case "gold":
      return "GOLD";
    case "bronze":
      return "BRONZE";
    default:
      return "";
  }
}

export function getNftTypeLabel(type?: string | null): string {
  switch (type) {
    case "crown":
      return "Crown";
    case "emperor":
      return "Emperor";
    case "founder":
      return "Founder";
    default:
      return "";
  }
}
