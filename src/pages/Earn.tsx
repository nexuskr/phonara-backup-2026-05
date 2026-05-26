import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarRange, Sparkles, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PlatformShell } from "@/shared/ui/platform-shell";
import { APP_ROUTES } from "@/shared/constants/routes";
import { notify } from "@/lib/notify";

const dailyTasks = [
  { title: "출석 체크", reward: "+800 PHON", note: "하루 한 번 빠르게 클리어" },
  {
    title: "퀵 미션",
    reward: "+1,200 PHON",
    note: "간단한 행동으로 보상 누적",
  },
  { title: "추천 참여", reward: "+2,500 PHON", note: "친구 초대와 연결" },
];

export default function Earn() {
  const navigate = useNavigate();
  const [earned] = useState(12450);
  const [livePlayers] = useState(11284);
  const [streakClaimed, setStreakClaimed] = useState(false);
  const [playClaimed, setPlayClaimed] = useState(false);

  const handleClaimStreak = () => {
    if (streakClaimed) return;
    setStreakClaimed(true);
    notify.success("출석 보상 수령 완료", { description: "+800 PHON" });
  };

  const handleClaimPlay = () => {
    if (playClaimed) return;
    setPlayClaimed(true);
    notify.success("Play to Earn 보상 수령 완료", {
      description: "+1,200 PHON",
    });
  };

  return (
    <PlatformShell>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-5 pb-4"
      >
        <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                FREE EARN HUB
              </div>
              <h1 className="mt-3 text-[2.2rem] font-black tracking-[-0.06em] text-white sm:text-[2.8rem]">
                하루의 흐름을
                <span className="block bg-linear-to-r from-amber-100 via-fuchsia-100 to-cyan-100 bg-clip-text text-transparent">
                  보상으로 연결합니다.
                </span>
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                출석, 추천, 트레이딩까지 하나의 루프에 묶여 있고, 모바일에서 한
                손으로 쉽게 따라갈 수 있습니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  오늘 수익
                </div>
                <div className="mt-3 text-3xl font-black text-white">
                  {earned.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-white/70">PHON</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  실시간 참여자
                </div>
                <div className="mt-3 text-3xl font-black text-white">
                  {livePlayers.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-white/70">명</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-2 text-white font-black">
              <CalendarRange className="h-4 w-4 text-cyan-200" />
              데일리 루틴
            </div>
            <div className="mt-4 space-y-3">
              {dailyTasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-white">
                        {task.title}
                      </div>
                      <div className="mt-1 text-sm text-white/70">
                        {task.note}
                      </div>
                    </div>
                    <div className="text-sm font-black text-emerald-200">
                      {task.reward}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-2 text-white font-black">
                <Trophy className="h-4 w-4 text-amber-200" />
                즉시 수령
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-white">
                        7일 연속 출석
                      </div>
                      <div className="mt-1 text-sm text-white/70">
                        오늘 보상 +800 PHON
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClaimStreak}
                      disabled={streakClaimed}
                      className="rounded-[18px] bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                      {streakClaimed ? "수령 완료" : "보상 받기"}
                    </button>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-white">
                        Play to Earn
                      </div>
                      <div className="mt-1 text-sm text-white/70">
                        오늘 보상 +1,200 PHON
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClaimPlay}
                      disabled={playClaimed}
                      className="rounded-[18px] bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                      {playClaimed ? "수령 완료" : "보상 받기"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-2 text-white font-black">
                <Users className="h-4 w-4 text-fuchsia-200" />
                추천 보상
              </div>
              <div className="mt-4 rounded-3xl border border-dashed border-fuchsia-300/40 bg-fuchsia-500/10 px-4 py-4">
                <div className="text-sm text-fuchsia-100">
                  친구 12명 초대 · 총 45,000 PHON 획득
                </div>
                <button
                  type="button"
                  onClick={() => navigate(APP_ROUTES.referral)}
                  className="mt-3 rounded-[18px] bg-white px-4 py-2 text-sm font-black text-black"
                >
                  추천 보상 보기
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-amber-300/30 bg-linear-to-br from-amber-500/10 via-transparent to-fuchsia-500/10 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-amber-100">
                VIP BOOST
              </div>
              <div className="mt-2 text-2xl font-black text-white">
                모든 보상 1.5배가 활성화된 상태입니다.
              </div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-2 text-lg font-black text-amber-100">
              1.5x
            </div>
          </div>
        </section>
      </motion.div>
    </PlatformShell>
  );
}
