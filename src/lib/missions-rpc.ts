import { supabase } from "@/integrations/supabase/client";
import { loadDB, saveDB } from "@/lib/store";
import { fetchWallet } from "@/lib/wallet";

/**
 * Calls Supabase RPC `settle_mission` and syncs local wallet from the result.
 * Returns the server-authoritative final reward (KRW), or null on failure.
 */
export async function settleMission(missionId: string, isWin: boolean, baseReward: number) {
  const { data, error } = await supabase.rpc("settle_mission", {
    _mission_id: missionId,
    _is_win: isWin,
    _base_reward: baseReward,
  });
  if (error) {
    console.error("[settleMission]", error);
    return null;
  }
  const r = data as any;
  // Sync local DB cache so UI reflects server truth immediately
  const db = loadDB();
  if (db.user) {
    saveDB({
      ...db,
      user: {
        ...db.user,
        balance: Number(r.available_balance ?? db.user.balance),
        todayEarnings: Number(r.today_earned ?? db.user.todayEarnings),
      },
    });
  }
  return {
    finalReward: Number(r.final_reward ?? 0),
    streak: Number(r.streak ?? 0),
    multiplier: Number(r.multiplier ?? 1),
    capRemaining: Number(r.cap_remaining ?? 0),
    availableBalance: Number(r.available_balance ?? 0),
  };
}

/** Refresh wallet balance from server (post-RPC reconciliation). */
export async function refreshWallet() {
  // Trigger useWallet hook reload immediately (closes realtime postgres_changes lag).
  if (typeof window !== "undefined") window.dispatchEvent(new Event("wallet:refresh"));

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  // SSOT 존중: 직접 .from() 대신 src/lib/wallet.ts의 fetchWallet() 사용
  let wallet: Awaited<ReturnType<typeof fetchWallet>> = null;
  try {
    wallet = await fetchWallet(session.user.id);
  } catch (e) {
    console.warn("[missions-rpc] fetchWallet failed in refreshWallet", e);
    return; // 기존 silent-fail 동작 유지
  }
  if (!wallet) return;

  const db = loadDB();
  if (!db.user) return;
  saveDB({
    ...db,
    user: {
      ...db.user,
      balance: Number(wallet.available_balance ?? 0),
      todayEarnings: Number(wallet.today_earned ?? 0),
    },
  });
}
