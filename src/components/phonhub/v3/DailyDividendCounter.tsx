import { Flame, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PhonHubSummary } from "@/hooks/use-phon-hub-summary";
import AnimatedCounter from "./AnimatedCounter";

export default function DailyDividendCounter({ data }: { data: PhonHubSummary }) {
  return (
    <Card className="rounded-2xl border-money-strong/30 bg-card/60 p-4">
      <div className="text-[11px] tracking-[0.3em] font-black text-money-strong uppercase mb-2 flex items-center gap-1.5">
        <Trophy className="w-3.5 h-3.5" /> 배당 · 소각
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">오늘 배당</div>
          <AnimatedCounter value={data.today_yield} className="font-imperial text-xl text-money-strong" suffix=" PHON" />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">누적 배당</div>
          <AnimatedCounter value={data.lifetime_yield} className="font-imperial text-xl text-primary" suffix=" PHON" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-pink/30 bg-pink/5 px-3 py-2">
        <Flame className="w-4 h-4 text-pink" />
        <div className="flex-1 text-[11px] text-foreground/90">누적 소각</div>
        <AnimatedCounter value={data.lifetime_burn} className="font-imperial text-pink" suffix=" PHON" />
      </div>
    </Card>
  );
}
