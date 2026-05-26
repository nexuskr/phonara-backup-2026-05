import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarRange,
  Flame,
  Gift,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnboardingV3 from "@/components/onboarding/OnboardingV3";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import { fmtKRW } from "@/lib/wallet";
import { APP_ROUTES } from "@/shared/constants/routes";
import { PlatformShell } from "@/shared/ui/platform-shell";

const liveEvents = [
  {
    text: "지금 12,841명이 무료 미션을 진행 중입니다",
    tone: "text-emerald-300",
  },
  { text: "오늘 312명이 출석 보상을 받았습니다", tone: "text-fuchsia-300" },
  { text: "추천 링크가 폭발적으로 공유되고 있습니다", tone: "text-cyan-300" },
];

const missions = [
  {
    title: "출석 체크",
    reward: "+300",
    note: "매일 3초로 시작",
    accent: "from-fuchsia-500 to-violet-600",
  },
  {
    title: "미니게임",
    reward: "+1,200",
    note: "Keepy-Uppy 한판",
    accent: "from-amber-400 to-orange-500",
  },
  {
    title: "추천 공유",
    reward: "+5,000",
    note: "친구 초대 1명",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "트레이딩",
    reward: "실전 시작",
    note: "모의/실전 전환",
    accent: "from-cyan-400 to-sky-500",
  },
];

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/4 px-3 py-3 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function QuickButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="rounded-3xl border border-white/10 bg-white/4 px-4 py-4 text-left backdrop-blur-sm"
    >
      <div className="text-fuchsia-200">{icon}</div>
      <div className="mt-3 text-sm font-black text-white">{label}</div>
    </motion.button>
  );
}

function MissionCard({
  title,
  reward,
  note,
  accent,
}: {
  title: string;
  reward: string;
  note: string;
  accent: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -2 }}
      className={`rounded-[26px] bg-linear-to-br ${accent} p-px text-left`}
    >
      <div className="rounded-[25px] bg-[#0a0d1e]/95 p-4">
        <div className="text-[10px] uppercase tracking-[0.28em] text-white/75">
          {title}
        </div>
        <div className="mt-3 text-2xl font-black text-white">
          {reward} {reward.includes("+") ? "PHON" : ""}
        </div>
        <div className="mt-2 text-sm text-white/70">{note}</div>
      </div>
    </motion.button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, loading } = useWallet(user?.id);

  return (
    <PlatformShell>
      <OnboardingV3 />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-5 pb-4"
      >
        <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-fuchsia-100">
                <Sparkles className="h-3.5 w-3.5" />
                PHONARA ELITE
              </div>
              <h1 className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-[-0.08em] text-white sm:text-[3.2rem]">
                모바일 OS급
                <span className="block bg-linear-to-r from-fuchsia-200 via-violet-100 to-cyan-100 bg-clip-text text-transparent">
                  금융 경험을 지금 시작합니다.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                출석, 보상, 추천, 트레이딩까지 하나의 흐름으로 연결된 고급형
                플랫폼에서 지갑·알림·추천·실전이 자연스럽게 연결됩니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  NOW
                </div>
                <div className="mt-3 text-2xl font-black text-white">LIVE</div>
                <div className="mt-2 text-sm text-emerald-200">
                  실시간 소셜 증거
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  필요한 순간
                </div>
                <div className="mt-3 text-2xl font-black text-white">1 tap</div>
                <div className="mt-2 text-sm text-cyan-200">
                  한 번의 터치로 모든 액션
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  현재 순자산
                </div>
                <div className="mt-3 text-4xl font-black text-white sm:text-5xl">
                  {loading ? "—" : fmtKRW(wallet?.total_balance ?? 0)}
                </div>
                <div className="mt-2 text-sm text-emerald-200">
                  실시간 반응형 수익 흐름
                </div>
              </div>
              <div className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-sm font-black text-emerald-100">
                +12.8%
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatPill
                label="오늘 수익"
                value={loading ? "—" : fmtKRW(wallet?.today_earned ?? 0)}
              />
              <StatPill
                label="가용 잔액"
                value={loading ? "—" : fmtKRW(wallet?.available_balance ?? 0)}
              />
              <StatPill label="연속 출석" value="7일" />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.wallet)}
                className="rounded-[18px] bg-white px-4 py-3 text-sm font-black text-black"
              >
                자금 확인
              </button>
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.referral)}
                className="rounded-[18px] border border-white/10 bg-white/4 px-4 py-3 text-sm font-black text-white"
              >
                친구 초대
              </button>
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.trading)}
                className="rounded-[18px] border border-white/10 bg-white/4 px-4 py-3 text-sm font-black text-white"
              >
                트레이딩 시작
              </button>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  LIVE FOMO
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  지금 이 순간, 사람들이 움직이고 있어요
                </div>
              </div>
              <div className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-100">
                ● live
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {liveEvents.map((event, index) => (
                <div
                  key={event.text}
                  className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                >
                  <span className={event.tone}>{`0${index + 1}.`}</span>{" "}
                  {event.text}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  FREE EARN LOOP
                </div>
                <h2 className="mt-2 text-2xl font-black text-white">
                  3초 컷의 보상 루프
                </h2>
              </div>
              <Flame className="h-5 w-5 text-amber-200" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {missions.map((mission) => (
                <MissionCard key={mission.title} {...mission} />
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
              QUICK ACTION
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuickButton
                label="지갑"
                icon={<Wallet className="h-5 w-5" />}
                onClick={() => navigate(APP_ROUTES.wallet)}
              />
              <QuickButton
                label="트레이딩"
                icon={<TrendingUp className="h-5 w-5" />}
                onClick={() => navigate(APP_ROUTES.trading)}
              />
              <QuickButton
                label="추천"
                icon={<Users className="h-5 w-5" />}
                onClick={() => navigate(APP_ROUTES.referral)}
              />
              <QuickButton
                label="보상"
                icon={<Gift className="h-5 w-5" />}
                onClick={() => navigate(APP_ROUTES.earn)}
              />
            </div>

            <div className="mt-5 rounded-3xl border border-amber-300/30 bg-linear-to-br from-amber-500/10 via-transparent to-fuchsia-500/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-amber-100">
                    TODAY ONLY
                  </div>
                  <div className="mt-2 text-lg font-black text-white">
                    추천 3명 달성 시 VIP 혜택
                  </div>
                  <div className="mt-2 text-sm leading-6 text-white/70">
                    친구를 초대하면 즉시 성장 루프가 열립니다.
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-100" />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                MOBILE-FIRST LOOP
              </div>
              <div className="mt-2 text-xl font-black text-white">
                한 손으로 끝나는 보상 경험
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                배지 기반 성장
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                실시간 카운트업
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                바이럴 미션
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
              <CalendarRange className="h-4 w-4 text-cyan-200" />
              <div className="mt-2 text-sm font-black text-white">
                출석 루프
              </div>
              <div className="mt-1 text-sm text-white/70">
                매일 3초로 습관화
              </div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
              <Trophy className="h-4 w-4 text-amber-200" />
              <div className="mt-2 text-sm font-black text-white">
                보상 체인
              </div>
              <div className="mt-1 text-sm text-white/70">실시간 누적 보상</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
              <Users className="h-4 w-4 text-fuchsia-200" />
              <div className="mt-2 text-sm font-black text-white">
                추천 성장
              </div>
              <div className="mt-1 text-sm text-white/70">
                바이럴 확산에 최적화
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </PlatformShell>
  );
}
