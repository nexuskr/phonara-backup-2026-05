import { supabase } from "@/integrations/supabase/client";

/**
 * WALLET SSOT LAYER (Phase 0 Foundation Reset)
 *
 * 이 파일은 wallet_balances 테이블에 대한 **유일한 직접 접근 지점**입니다.
 * 다른 모든 파일은 이 모듈의 함수만 사용해야 합니다.
 */

export type Tier = "normal" | "vip" | "god" | "empire";

export interface WalletBalance {
  user_id: string;
  total_balance: number;
  available_balance: number;
  pending_balance: number;
  locked_balance: number;
  profit_share_balance: number;
  today_earned: number;
  monthly_earned: number;
  last_reset_date: string;
}

export const TIER_CFG: Record<
  Tier,
  {
    win: [number, number];
    daily_cap: number;
    withdraw_min: number;
    process_h: number;
    daily_wd_limit?: number;
    profit_share?: boolean;
    label: string;
  }
> = {
  normal: {
    win: [0.58, 0.71],
    daily_cap: 25_000,
    withdraw_min: 5_000,
    process_h: 24,
    daily_wd_limit: 3,
    label: "NORMAL",
  },
  vip: {
    win: [0.82, 0.88],
    daily_cap: 120_000,
    withdraw_min: 1_000,
    process_h: 4,
    label: "VIP",
  },
  god: {
    win: [0.93, 0.965],
    daily_cap: 350_000,
    withdraw_min: 1_000,
    process_h: 2,
    label: "GOD",
  },
  empire: {
    win: [0.982, 0.997],
    daily_cap: 1_200_000,
    withdraw_min: 500,
    process_h: 0.5,
    profit_share: true,
    label: "EMPIRE",
  },
};

export function rollWin(tier: Tier): boolean {
  const [lo, hi] = TIER_CFG[tier].win;
  return Math.random() < lo + Math.random() * (hi - lo);
}

export function fmtKRW(n: number) {
  return "₩" + Math.max(0, Math.floor(n)).toLocaleString("ko-KR");
}

export async function settleMission(
  missionId: string,
  baseReward: number,
  isWin: boolean,
) {
  const { data, error } = await supabase.rpc("settle_mission", {
    _mission_id: missionId,
    _is_win: isWin,
    _base_reward: baseReward,
  });
  if (error) throw error;
  return data;
}

export async function requestWithdrawal(i: any) {
  const { data, error } = await supabase.rpc("request_withdrawal", i);
  if (error) throw error;
  return data;
}

export function humanizeError(e: any): string {
  const m = e?.message ?? String(e);
  if (m.includes("insufficient_funds")) return "잔고가 부족합니다";
  if (m.includes("below_min:"))
    return `최소 출금 금액 미만입니다 (${m.split(":")[1]}원)`;
  if (m.includes("daily_withdraw_limit"))
    return "오늘의 출금 횟수를 초과했습니다";
  if (m.includes("pin mismatch")) return "출금 비밀번호가 일치하지 않습니다";
  return m;
}

/** ★★★ SSOT 핵심 함수 ★★★ */
export async function fetchWallet(
  userId: string,
): Promise<WalletBalance | null> {
  const { data, error } = await supabase
    .from("wallet_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as WalletBalance | null;
}
