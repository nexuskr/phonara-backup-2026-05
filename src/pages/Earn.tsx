// src/pages/Earn.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Earn() {
  const navigate = useNavigate();
  const [earned] = useState(12450);
  const [livePlayers] = useState(11284);

  const [streakClaimed, setStreakClaimed] = useState(false);
  const [playClaimed, setPlayClaimed] = useState(false);

  const handleClaimStreak = () => {
    if (streakClaimed) return;
    setStreakClaimed(true);
    toast.success("출석 보상 수령 완료!", {
      description: "+800 PHON",
    });
  };

  const handleClaimPlay = () => {
    if (playClaimed) return;
    setPlayClaimed(true);
    toast.success("Play to Earn 보상 수령 완료!", {
      description: "+1,200 PHON",
    });
  };

  return (
    <div className="min-h-screen bg-[#02030a] text-white">
      <div className="max-w-md mx-auto px-5 pt-6 pb-10">
        
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/30 bg-zinc-900/80 p-6 mb-6"
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs tracking-[2px] text-primary font-bold">매일 무료 수익</div>
              <h1 className="text-3xl font-black mt-1">부수입 허브</h1>
              <p className="text-sm text-white/60 mt-1">매일 참여하고 돈을 벌어보세요</p>
            </div>
            <button
              onClick={() => navigate("/events")}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary/30 text-sm font-bold text-primary"
            >
              <Gift className="w-4 h-4" /> 이벤트
            </button>
          </div>

          <div className="mt-6">
            <div className="text-6xl font-black tabular-nums tracking-[-2px]">{earned.toLocaleString()}</div>
            <div className="text-lg text-white/70 -mt-1">PHON</div>
            <div className="text-sm text-white/60 mt-1">
              오늘 수익 · {livePlayers.toLocaleString()}명이 함께하고 있습니다
            </div>
          </div>
        </motion.div>

        {/* 출석 보상 */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-xl">7일 연속 출석</div>
              <div className="text-sm text-white/60">오늘 보상: +800 PHON</div>
            </div>
            <button
              onClick={handleClaimStreak}
              disabled={streakClaimed}
              className="px-6 py-2.5 rounded-2xl bg-white text-black font-bold text-sm disabled:opacity-50 active:bg-white/90"
            >
              {streakClaimed ? "수령 완료" : "보상 받기"}
            </button>
          </div>
        </div>

        {/* Play to Earn */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-xl">Play to Earn</div>
              <div className="text-sm text-white/60">오늘 보상: +1,200 PHON</div>
            </div>
            <button
              onClick={handleClaimPlay}
              disabled={playClaimed}
              className="px-6 py-2.5 rounded-2xl bg-white text-black font-bold text-sm disabled:opacity-50 active:bg-white/90"
            >
              {playClaimed ? "수령 완료" : "보상 받기"}
            </button>
          </div>
        </div>

        {/* 레퍼럴 */}
        <div 
          onClick={() => navigate("/referral")}
          className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 mb-4 cursor-pointer active:bg-zinc-800"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-xl">레퍼럴 보상</div>
              <div className="text-sm text-white/60">친구 12명 초대 · 총 45,000 PHON 획득</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold">+15,000</div>
              <div className="text-xs text-white/50">이번 달</div>
            </div>
          </div>
        </div>

        {/* VIP 부스트 안내 */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">VIP 부스트 활성화 중</div>
              <div className="text-sm text-white/70">모든 보상 1.5배 적용 중</div>
            </div>
            <div className="text-yellow-400 font-black text-xl">1.5x</div>
          </div>
        </div>
      </div>
    </div>
  );
}