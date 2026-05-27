import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadDB, saveDB, type Tier } from "@/lib/store";
import { registerCurrentDevice } from "@/lib/deviceFingerprint";
import {
  isInvalidSessionError,
  clearBrokenLocalSession,
} from "@/lib/auth-recovery";
import {
  verifySessionOnce,
  invalidateSessionCache,
} from "@/lib/auth/authSingleFlight";
import { useMultiTabAuthSync } from "@/hooks/auth/useMultiTabAuthSync";
import { fetchWallet } from "@/lib/wallet"; // ← SSOT 중앙화 추가

const RESETTABLE_SESSION_FLAGS = [
  "phonara_disable_dashboard_state_rpc",
  "phonara_disable_achievement_rpc",
  "phonara_disable_fomo_rpc",
  "phonara_disable_persona_rpc",
  "phonara_disable_persona_missions_rpc",
  "phonara_disable_register_device_rpc",
] as const;

const TIER_MAP: Record<string, Tier> = {
  normal: "NORMAL",
  vip: "VIP",
  god: "GOD",
  empire: "EMPIRE",
  NORMAL: "NORMAL",
  VIP: "VIP",
  GOD: "GOD",
  EMPIRE: "EMPIRE",
};

async function syncFromSession(session: any) {
  const db = loadDB();
  if (!session?.user) {
    if (db.user) saveDB({ ...db, user: null });
    return;
  }

  const uid = session.user.id;
  const email = session.user.email ?? "";

  const [{ data: profile }, { data: roles }, wallet] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", uid),
    // SSOT 준수: wallet_balances 직접 접근 제거 → fetchWallet 사용
    (async () => {
      try {
        return await fetchWallet(uid);
      } catch (e) {
        console.warn("[auth-bridge] fetchWallet failed in syncFromSession", e);
        return null;
      }
    })(),
  ]);

  const tier = TIER_MAP[(profile as any)?.tier ?? "normal"] ?? "NORMAL";
  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");

  const merged = {
    id: uid,
    email,
    nickname: (profile as any)?.nickname ?? email.split("@")[0] ?? "User",
    phone: (profile as any)?.phone ?? "",
    realName: (profile as any)?.real_name ?? "",
    birth: (profile as any)?.birth_date ?? "",
    balance: Number((wallet as any)?.available_balance ?? 0),
    coinBalance: 0,
    todayEarnings: Number((wallet as any)?.today_earned ?? 0),
    streak: Number((profile as any)?.attendance_streak ?? 0),
    level:
      tier === "EMPIRE" ? 60 : tier === "GOD" ? 30 : tier === "VIP" ? 10 : 1,
    xp: 0,
    tier,
    isAdmin,
    badges: db.user?.badges ?? [],
    lastAttendance: (profile as any)?.last_attendance ?? undefined,
    attendanceStreak: Number((profile as any)?.attendance_streak ?? 0),
  };

  saveDB({ ...db, user: merged as any });
}

function resetSessionCircuitBreakers() {
  try {
    RESETTABLE_SESSION_FLAGS.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // no-op
  }
}

async function assignPersonaSafely() {
  try {
    if (sessionStorage.getItem("phonara_disable_persona_rpc") === "1") return;
    const user = await verifySessionOnce();
    if (!user) return;
    const { error } = await supabase.rpc("assign_persona" as any);
    if (error) {
      sessionStorage.setItem("phonara_disable_persona_rpc", "1");
      console.warn(
        "[auth-bridge] assign_persona disabled:",
        error.message ?? error,
      );
    }
  } catch {
    // best-effort only
  }
}

async function ensureValidSession(session: any): Promise<boolean> {
  if (!session?.user) return false;
  const user = await verifySessionOnce();
  return !!user?.userId;
}

function isOnGuide(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/guide")
  );
}

export function useAuthBridge() {
  useMultiTabAuthSync();

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      invalidateSessionCache();

      setTimeout(() => {
        if (mounted && !isOnGuide()) syncFromSession(session);
      }, 0);

      if (
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION") &&
        session?.user &&
        !isOnGuide()
      ) {
        resetSessionCircuitBreakers();
        setTimeout(() => {
          if (mounted && !isOnGuide()) void registerCurrentDevice();
        }, 500);
        setTimeout(() => {
          if (mounted && !isOnGuide()) void assignPersonaSafely();
        }, 800);
      }

      if (event === "SIGNED_OUT") {
        syncFromSession(null);
      }
    });

    if (!isOnGuide()) {
      void (async () => {
        try {
          const user = await verifySessionOnce();
          if (!mounted || isOnGuide()) return;
          if (!user) {
            syncFromSession(null);
            return;
          }
          const { data } = await supabase.auth.getSession();
          if (!mounted) return;
          syncFromSession(data.session);
        } catch (e) {
          if (isInvalidSessionError(e)) await clearBrokenLocalSession();
        }
      })();
    }

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
}
