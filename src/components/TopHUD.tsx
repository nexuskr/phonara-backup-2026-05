import { Link } from "react-router-dom";
import { useDB, formatKRW } from "@/lib/store";
import { Wallet, Zap, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Phonara Top HUD — 항상 노출되는 3축 광고판
 *  · 좌: 잔고  → /treasury
 *  · 중: 활성 부스트 → /empire
 *  · 우: 오늘 순위 → /legacy
 *
 * Desktop full / Mobile compact (잔고만).
 */
export default function TopHUD() {
  const [db] = useDB();
  const user = db.user;
  const [boostCount, setBoostCount] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase.rpc("get_active_boost_count");
        if (alive && typeof data === "number") setBoostCount(data);
      } catch {
        /* silent */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Balance */}
      <Link
        to="/treasury"
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 hover:border-primary/50 transition"
      >
        <Wallet className="w-3.5 h-3.5 text-primary" />
        <span className="font-hud text-sm text-gradient-imperial font-bold tabular-nums">
          {formatKRW(user.balance ?? 0)}
        </span>
      </Link>

      {/* Active Boost */}
      <Link
        to="/empire"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-accent/20 hover:border-accent/50 transition"
      >
        <Zap className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-bold text-foreground/90 tabular-nums">
          {boostCount > 0 ? `${boostCount} BOOST` : "활성화"}
        </span>
      </Link>

      {/* Today's Rank (placeholder until /legacy live) */}
      <Link
        to="/legacy"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-secondary/20 hover:border-secondary/50 transition"
      >
        <Trophy className="w-3.5 h-3.5 text-secondary" />
        <span className="text-xs font-bold text-foreground/90 tabular-nums">
          Lv.{user.level ?? 1}
        </span>
      </Link>
    </div>
  );
}

/** 모바일 컴팩트 — 헤더에 배치 (잔고만) */
export function TopHUDCompact() {
  const [db] = useDB();
  const user = db.user;
  if (!user) return null;
  return (
    <Link
      to="/treasury"
      className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full glass border border-primary/30"
    >
      <Wallet className="w-3 h-3 text-primary" />
      <span className="font-hud text-xs text-gradient-imperial font-bold tabular-nums">
        {formatKRW(user.balance ?? 0)}
      </span>
    </Link>
  );
}
