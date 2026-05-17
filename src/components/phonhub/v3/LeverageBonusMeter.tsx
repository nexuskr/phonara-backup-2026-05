import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PhonHubSummary } from "@/hooks/use-phon-hub-summary";

const TIER_THRESHOLDS = [
  { phon: 500, lev: 25 },
  { phon: 1200, lev: 50 },
  { phon: 5000, lev: 100 },
];

function nextTier(phon: number) {
  for (const t of TIER_THRESHOLDS) {
    if (phon < t.phon) return { needPhon: t.phon - phon, nextLev: t.lev };
  }
  return null;
}

export default function LeverageBonusMeter({ data }: { data: PhonHubSummary }) {
  const next = nextTier(data.phon_balance);
  const boostPct = data.boost_pct;
  const boostBar = Math.min(100, boostPct);
  return (
    <Card className="rounded-2xl border-pink/30 bg-card/60 p-4">
      <div className="text-[11px] tracking-[0.3em] font-black text-pink uppercase mb-2 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5" /> 레버리지 · 부스트
      </div>
      <div className="flex items-baseline gap-3">
        <div className="font-imperial text-3xl text-pink tabular-nums">{data.leverage_max}x</div>
        <div className="text-[11px] text-muted-foreground">최대 레버리지</div>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline justify-between text-[11px] text-muted-foreground mb-1">
          <span>NFT 부스트</span>
          <span className="font-bold text-primary">+{boostPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
          <div
            className="h-full bg-gradient-to-r from-pink to-primary transition-all"
            style={{ width: `${boostBar}%` }}
          />
        </div>
      </div>
      {next ? (
        <div className="text-[11px] text-foreground/80 mt-2">
          {next.needPhon.toLocaleString("ko-KR")} PHON 더 모으면{" "}
          <span className="font-bold text-pink">{next.nextLev}x</span>로 승급합니다.
        </div>
      ) : (
        <div className="text-[11px] text-primary mt-2">최고 레버리지 등급 — 폐하의 자리가 굳건합니다.</div>
      )}
      <div className="mt-3">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/arena">
            트레이딩으로 가기 <ArrowRight className="ml-1 w-3 h-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
