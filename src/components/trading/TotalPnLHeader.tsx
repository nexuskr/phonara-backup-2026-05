import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { LivePosition } from "@/lib/trading/types";
import { computePnl } from "@/lib/trading/engine";
import { KRW_PER_USDT, type Unit } from "@/lib/trading/currency";

interface Props {
  positions: LivePosition[];
  prices: Record<string, number>;
  unit: Unit;
}

/**
 * Real-time Total Unrealized PnL header — USDT + KRW dual display.
 * Color: emerald for positive, rose for negative.
 */
function TotalPnLHeaderImpl({ positions, prices, unit }: Props) {
  const { pnlUSDT, totalMargin } = useMemo(() => {
    let pnl = 0;
    let mg = 0;
    for (const p of positions) {
      const mark = prices[p.symbol] ?? p.entry;
      pnl += computePnl(p.side, p.entry, mark, p.size);
      mg += p.margin;
    }
    // In real mode, margin is already in KRW credits (per Mode unit conventions).
    // For display we surface USDT-equivalent: if unit=KRW, divide by reference rate.
    return { pnlUSDT: unit === "KRW" ? pnl / KRW_PER_USDT : pnl, totalMargin: mg };
  }, [positions, prices, unit]);

  const pnlKRW = pnlUSDT * KRW_PER_USDT;
  const pct = totalMargin > 0 ? (pnlUSDT / (unit === "KRW" ? totalMargin / KRW_PER_USDT : totalMargin)) * 100 : 0;
  const positive = pnlUSDT >= 0;
  const has = positions.length > 0;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition ${
        !has
          ? "border-border/40 bg-background/40"
          : positive
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background/40 to-background/40 shadow-[0_0_60px_rgba(52,211,153,0.18)]"
            : "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-background/40 to-background/40 shadow-[0_0_60px_rgba(244,63,94,0.18)]"
      }`}
      aria-label="Total unrealized PnL"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${positive ? "text-emerald-300" : "text-rose-300"}`} />
          <span className="text-[11px] uppercase tracking-[0.18em] font-black text-muted-foreground">
            Unrealized PnL
          </span>
          {has && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-background/60 border border-border/50">
              {positions.length} open
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground/80">실시간 · ≈ ₩{KRW_PER_USDT.toLocaleString()}/USDT</div>
      </div>

      <div className="mt-2 flex items-end flex-wrap gap-x-6 gap-y-1">
        <div
          className={`font-display font-black text-3xl sm:text-4xl tabular-nums tracking-tight ${
            positive ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {positive ? "+" : ""}{pnlUSDT.toFixed(2)} <span className="text-base font-bold opacity-70">USDT</span>
        </div>
        <div className={`text-base sm:text-lg font-mono tabular-nums font-black ${positive ? "text-emerald-400" : "text-rose-400"}`}>
          ≈ {pnlKRW < 0 ? "-" : positive && pnlKRW > 0 ? "+" : ""}₩{Math.abs(Math.floor(pnlKRW)).toLocaleString()}
        </div>
        {has && (
          <div className={`inline-flex items-center gap-1 text-sm font-black ${positive ? "text-emerald-400" : "text-rose-400"}`}>
            {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {positive ? "+" : ""}{pct.toFixed(2)}%
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TotalPnLHeaderImpl);
