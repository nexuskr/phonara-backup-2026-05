import { Coins, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { LoadingList } from "@/components/ui/loading-state";
import { usePhonHubSummary } from "@/hooks/use-phon-hub-summary";
import AnimatedCounter from "./AnimatedCounter";

const StakingQuickPanel = lazy(() => import("./StakingQuickPanel"));
const LeverageBonusMeter = lazy(() => import("./LeverageBonusMeter"));
const SwapBridgeMini = lazy(() => import("./SwapBridgeMini"));
const DailyDividendCounter = lazy(() => import("./DailyDividendCounter"));
const PHONValueProjection = lazy(() => import("./PHONValueProjection"));

/**
 * PhonHubDashboard — Phase C 메인 허브.
 * 단일 RPC `phon_hub_summary` + 12s 폴링 + wallet 파티션 realtime.
 */
export default function PhonHubDashboard() {
  const { data, loading } = usePhonHubSummary();

  if (loading && !data) return <LoadingList rows={3} />;
  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* Hero — gold gradient + particle pulse */}
      <Card className="relative overflow-hidden rounded-2xl border-pink/30 bg-gradient-to-br from-primary/15 via-card/70 to-pink/15 p-6">
        {/* lightweight CSS particles */}
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -right-6 h-36 w-36 rounded-full bg-pink/20 blur-3xl animate-pulse" style={{ animationDelay: "600ms" }} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="text-[11px] tracking-[0.3em] font-black text-pink uppercase mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> 폐하의 PHON 제국
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter
              value={data.phon_balance}
              className="font-imperial text-4xl md:text-5xl text-gradient-imperial"
            />
            <span className="text-lg font-bold text-primary/80">PHON</span>
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            오늘도 폐하의 제국이 매일 자라고 있습니다
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl glass border border-border/40 p-3">
              <div className="text-[10px] tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                <Coins className="w-3 h-3" /> 활성 스테이크
              </div>
              <AnimatedCounter
                value={data.active_stake_total}
                className="font-imperial text-base text-primary"
              />
            </div>
            <div className="rounded-xl glass border border-border/40 p-3">
              <div className="text-[10px] tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 오늘 배당
              </div>
              <AnimatedCounter
                value={data.today_yield}
                className="font-imperial text-base text-money-strong"
              />
            </div>
            <div className="rounded-xl glass border border-border/40 p-3">
              <div className="text-[10px] tracking-widest text-muted-foreground mb-1">티어</div>
              <div className="font-imperial text-base text-pink">{data.phon_level_label}</div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full bg-gradient-to-r from-primary to-pink"
                  style={{ width: `${data.phon_level_progress_pct}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Suspense fallback={null}><StakingQuickPanel data={data} /></Suspense>
        <Suspense fallback={null}><LeverageBonusMeter data={data} /></Suspense>
        <Suspense fallback={null}><SwapBridgeMini data={data} /></Suspense>
        <Suspense fallback={null}><DailyDividendCounter data={data} /></Suspense>
      </div>

      <Suspense fallback={null}><PHONValueProjection data={data} /></Suspense>
    </div>
  );
}
