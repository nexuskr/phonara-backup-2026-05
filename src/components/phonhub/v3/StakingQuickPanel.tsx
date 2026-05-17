import { Link } from "react-router-dom";
import { Coins, ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PhonHubSummary } from "@/hooks/use-phon-hub-summary";
import AnimatedCounter from "./AnimatedCounter";

function fmtCountdown(targetIso: string | null): string {
  if (!targetIso) return "—";
  const ms = new Date(targetIso).getTime() - Date.now();
  if (ms <= 0) return "곧 정산";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}시간 ${m}분 후`;
}

export default function StakingQuickPanel({ data }: { data: PhonHubSummary }) {
  return (
    <Card className="rounded-2xl border-primary/30 bg-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] tracking-[0.3em] font-black text-primary uppercase flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" /> 스테이킹
        </div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> {fmtCountdown(data.next_yield_at)}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <AnimatedCounter
          value={data.active_stake_total}
          className="font-imperial text-2xl text-primary"
        />
        <span className="text-[11px] text-muted-foreground">PHON 스테이킹 중</span>
      </div>
      <div className="text-[11px] text-money-strong mt-1">
        오늘 +<AnimatedCounter value={data.today_yield} className="font-bold" /> PHON 배당 누적
      </div>
      <div className="text-[11px] text-muted-foreground/80 mt-2">
        지금 스테이킹하면 내일 00:10부터 매일 배당이 입금됩니다.
      </div>
      <div className="mt-3 flex gap-2">
        <Button asChild size="sm" className="bg-gradient-imperial text-primary-foreground flex-1">
          <Link to="/phon#staking">
            스테이크 추가 <ArrowRight className="ml-1 w-3 h-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
