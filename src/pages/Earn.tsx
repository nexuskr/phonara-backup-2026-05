// src/pages/Earn.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { Link } from "react-router-dom";

// ==================== 최소 수정 ====================
const SlimShell = ({ children }: any) => <>{children}</>;

const useRequireAuth = () => ({ id: "current-user" });

const useEarnHub = () => ({
  state: {
    today_earned: 12450,
    streak: { days: 7, claimed_today: false, next_reward: 800 },
    missions: [],
    referral: { code: "PHONARA123", invited: 12, earned_total: 45000 },
    play_today: { claimed: false, amount: 1200 },
    share_today: { channels: 0, amount_each: 500 },
    roulette: { spun_today: false, last_amount: 0, multiplier: 1 },
    vip_boost: { active: true, multiplier: 1.5, ends_at: null },
  },
  loading: false,
  claim: async (type?: string) => { console.log("Claim called:", type); },   // ← 인자 받을 수 있게 수정
  claimAttendance: async () => { console.log("Attendance claimed"); },
  refresh: async () => { console.log("Refreshed"); },
});

// Stub Components
const StreakCard = (props: any) => <div className="h-56 bg-white/5 rounded-2xl p-6 flex items-center justify-center">Streak Card</div>;
const MissionsCard = (props: any) => <div className="h-56 bg-white/5 rounded-2xl p-6 flex items-center justify-center">Missions Card</div>;
const ReferralCard = (props: any) => <div className="h-56 bg-white/5 rounded-2xl p-6 flex items-center justify-center">Referral Card</div>;
const PlayToEarnCard = (props: any) => <div className="h-56 bg-white/5 rounded-2xl p-6 flex items-center justify-center">Play To Earn</div>;
const ShareRewardCard = (props: any) => <div className="h-56 bg-white/5 rounded-2xl p-6 flex items-center justify-center">Share Reward</div>;
const RouletteCard = (props: any) => <div className="h-56 bg-white/5 rounded-2xl p-6 flex items-center justify-center">Roulette</div>;
const VipBoostCard = (props: any) => <div className="h-56 bg-white/5 rounded-2xl p-6 flex items-center justify-center">VIP Boost</div>;
const ShareChannelsSheet = (props: any) => null;

function useLiveEarners(min = 1100, max = 1450) {
  const [n, setN] = useState(min + Math.floor(Math.random() * (max - min)));
  useEffect(() => {
    const interval = setInterval(() => {
      setN((p) => Math.max(min, Math.min(max, p + (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 7))));
    }, 60000);
    return () => clearInterval(interval);
  }, [min, max]);
  return n;
}

function useCountUp(target: number) {
  const [n, setN] = useState(target);
  return n;
}

export default function Earn() {
  const user = useRequireAuth();
  const { state, loading, claim, claimAttendance, refresh } = useEarnHub();
  const earned = useCountUp(state.today_earned);
  const livePlayers = useLiveEarners();
  const [shareOpen, setShareOpen] = useState(false);

  if (!user) return null;

  const roul = state.roulette ?? { spun_today: false, last_amount: 0, multiplier: 1 };
  const vip = state.vip_boost ?? { active: false, multiplier: 1, ends_at: null };

  return (
    <SlimShell>
      <div className="container py-5 space-y-5 max-w-3xl">
        <motion.header
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-primary/30 bg-card p-6 relative overflow-hidden"
        >
          <div className="flex items-end justify-between gap-3 relative">
            <div>
              <div className="text-[10px] tracking-[0.3em] font-black text-primary uppercase">매일 무료 수익</div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground mt-1">부수입 허브</h1>
              <p className="text-xs text-muted-foreground mt-1">매일 참여하고 돈을 벌어보세요</p>
            </div>
            <Link
              to="/events"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 bg-background/40 text-xs font-bold text-primary"
            >
              <Gift className="w-3.5 h-3.5" /> 이벤트
            </Link>
          </div>

          <div className="mt-5 flex items-end gap-2 relative">
            <div className="text-5xl md:text-6xl font-black text-primary tabular-nums leading-none">
              {earned.toLocaleString()}
            </div>
            <div className="text-lg font-bold text-foreground/70 pb-1">PHON</div>
          </div>
          <div className="text-sm text-muted-foreground mt-1 font-medium">
            오늘 수익 · {livePlayers.toLocaleString()}명이 함께하고 있습니다
          </div>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <StreakCard
            days={state.streak.days}
            claimedToday={state.streak.claimed_today}
            nextReward={state.streak.next_reward}
            onClaim={claimAttendance}
          />
          <MissionsCard missions={state.missions} onClaim={claim} />
          <RouletteCard
            spunToday={roul.spun_today}
            lastAmount={roul.last_amount}
            multiplier={roul.multiplier}
            onSpun={() => refresh()}
          />
          <ReferralCard
            code={state.referral.code}
            invited={state.referral.invited}
            earnedTotal={state.referral.earned_total}
          />
          <PlayToEarnCard
            claimed={state.play_today.claimed}
            amount={state.play_today.amount}
            onClaim={() => claim("play_today")}
          />
          <VipBoostCard active={vip.active} multiplier={vip.multiplier} endsAt={vip.ends_at} />
          <div onClick={() => setShareOpen(true)} className="cursor-pointer">
            <ShareRewardCard
              claimedChannels={state.share_today.channels}
              amountEach={state.share_today.amount_each}
            />
          </div>
        </div>
      </div>

      <ShareChannelsSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        kind="bigwin"
        amount={state.today_earned}
        referralCode={state.referral.code}
        onClaimed={() => refresh()}
      />
    </SlimShell>
  );
}