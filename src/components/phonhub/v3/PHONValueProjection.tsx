import { lazy, Suspense, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PhonHubSummary } from "@/hooks/use-phon-hub-summary";

// recharts lazy-loaded only inside this component
const Chart = lazy(() => import("./_ProjectionChart"));

const APY = 0.15; // PHON staking APY (15%)

export default function PHONValueProjection({ data }: { data: PhonHubSummary }) {
  const series = useMemo(() => {
    const daily = (data.active_stake_total * APY) / 365;
    let cumYield = data.lifetime_yield;
    let cumBurn = data.lifetime_burn;
    const burnPerDay = cumBurn > 0 ? cumBurn / Math.max(30, 30) : daily * 0.1;
    const out = [] as Array<{ day: number; yield_phon: number; burn_phon: number }>;
    for (let d = 0; d <= 90; d += 5) {
      cumYield += daily * 5;
      cumBurn += burnPerDay * 5;
      out.push({ day: d, yield_phon: Math.round(cumYield), burn_phon: Math.round(cumBurn) });
    }
    return out;
  }, [data.active_stake_total, data.lifetime_yield, data.lifetime_burn]);

  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 p-4">
      <div className="text-[11px] tracking-[0.3em] font-black text-primary uppercase mb-1 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5" /> 향후 90일 예상 배당 · 소각
      </div>
      <div className="text-[11px] text-muted-foreground mb-2">
        활성 스테이크 {Math.floor(data.active_stake_total).toLocaleString("ko-KR")} PHON · 15% APY 가정
      </div>
      <div className="h-48">
        <Suspense fallback={<div className="h-full w-full animate-pulse rounded-lg bg-border/30" />}>
          <Chart series={series} />
        </Suspense>
      </div>
    </Card>
  );
}
