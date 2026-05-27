/**
 * PHON 사용처 RPC 클라이언트 래퍼.
 * - spendForFeeDiscount: 출금 수수료 50% 할인 (1~1000 PHON)
 * - spendForBooster: 5,000 PHON → 24h 부스터 (수수료 -30% / Boost ×1.5 / 레버리지 7x)
 * - spendForBoost: 1,000 PHON → 24h Booster ×1.5
 */
import { supabase } from "@/integrations/supabase/client";

export async function spendPhonForFeeDiscount(amount: number) {
  const { data, error } = await supabase.rpc("spend_phon_for_fee_discount", {
    _amount: amount,
  });
  if (error) throw error;
  return data as { ok: boolean; spent: number; discount_pct: number };
}

export async function spendPhonForBooster() {
  const { data, error } = await supabase.rpc("spend_phon_for_booster");
  if (error) throw error;
  return data as { ok: boolean; spent: number; expires_at: string };
}

export async function spendPhonForBoost() {
  const { data, error } = await supabase.rpc("spend_phon_for_crown_boost");
  if (error) throw error;
  return data as { ok: boolean; spent: number; expires_at: string };
}

export const PHON_COSTS = {
  feeDiscountMin: 1,
  feeDiscountMax: 1000,
  booster: 5000,
  boost: 1000,
} as const;
