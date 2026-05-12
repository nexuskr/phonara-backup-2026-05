import { useEffect, useMemo, useState } from "react";
import { Crown, Flame, Zap, ArrowDownToLine } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Strike = {
  kind: "crown" | "baron" | "withdraw";
  created_at: string;
  amount: number;
  label: string;
  nick: string;
};

const fmtKRW = (n: number) =>
  n >= 1_0000_0000 ? `₩${(n / 1_0000_0000).toFixed(2)}억`
  : n >= 1_0000 ? `₩${Math.round(n / 1_0000).toLocaleString("ko-KR")}만`
  : `₩${n.toLocaleString("ko-KR")}`;

const KIND_META: Record<Strike["kind"], { icon: React.ComponentType<{ className?: string }>; tone: string; verb: string }> = {
  crown:    { icon: Crown,           tone: "text-secondary",     verb: "Crown 폭발" },
  baron:    { icon: Flame,           tone: "text-primary",       verb: "Baron 합류" },
  withdraw: { icon: ArrowDownToLine, tone: "text-money-strong",  verb: "출금 완료" },
};

/**
 * 화이트 스트라이크 라이브 피드 — 24h 동안의 고임팩트 이벤트를 마스킹된 닉네임으로 노출.
 * 가용 데이터가 충분하면 자동 좌→우 무한 스크롤. 60s 간격으로 갱신.
 */
export function WhaleStrikeRail() {
  const [items, setItems] = useState<Strike[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data, error } = await supabase.rpc("get_whale_strikes_24h", { _limit: 24 });
      if (!alive) return;
      if (!error && Array.isArray(data)) setItems(data as unknown as Strike[]);
      setLoaded(true);
    }
    void load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // 끊김 없는 마키 효과를 위해 두 번 펼쳐 렌더
  const doubled = useMemo(() => (items.length ? [...items, ...items] : []), [items]);

  if (!loaded || items.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-secondary/30 bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 backdrop-blur-md">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-imperial text-secondary">
        <Zap className="w-3 h-3 animate-pulse" /> Whale Strikes · 24h
      </div>
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-3 py-7 pl-3 will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: Math.max(20, items.length * 4), ease: "linear", repeat: Infinity }}
      >
        {doubled.map((s, i) => {
          const meta = KIND_META[s.kind] ?? KIND_META.crown;
          const Icon = meta.icon;
          return (
            <div
              key={`${s.kind}-${s.created_at}-${i}`}
              className="shrink-0 glass rounded-xl px-3 py-2 flex items-center gap-2 min-w-[200px]"
            >
              <Icon className={`w-4 h-4 ${meta.tone}`} />
              <div className="text-xs">
                <div className="font-bold tracking-wide">
                  <span className="text-foreground/80">{s.nick}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className={meta.tone}>{meta.verb}</span>
                </div>
                {s.amount > 0 && (
                  <div className={`text-[11px] tabular-nums font-imperial ${meta.tone}`}>
                    {fmtKRW(s.amount)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default WhaleStrikeRail;
