// src/components/onboarding/OnboardingV3.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Gift, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";
import { claimOnboardingReward } from "@/lib/onboarding";

const ONBOARDING_KEY = "phonara:onboarding_v3_done";

export default function OnboardingV3() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // 중복 노출 방지 (localStorage + DB 체크)
  useEffect(() => {
    const checkAndShow = async () => {
      if (localStorage.getItem(ONBOARDING_KEY) === "1") return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // DB에서 이미 완료했는지 확인
      const { data: progress } = await supabase
        .from("user_onboarding_progress")
        .select("completed_at")
        .eq("user_id", session.user.id)
        .eq("flow", "welcome_onboarding")
        .single();

      if (progress?.completed_at) {
        localStorage.setItem(ONBOARDING_KEY, "1");
        return;
      }

      setTimeout(() => setOpen(true), 1000);
    };

    checkAndShow();
  }, []);

  const close = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOpen(false);
  };

  const next = async () => {
    if (isProcessing) return;

    // Step 0에서 신규 가입 보너스 10,000 PHON 지급
    if (step === 0) {
      setIsProcessing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const result = await claimOnboardingReward(session.user.id, 10000);
          if (result.success) {
            notify.success(`가입 보너스 +10,000 PHON 지급 완료!`);
          }
        }
      } catch (error) {
        console.error("보상 지급 실패:", error);
      } finally {
        setIsProcessing(false);
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0c1f] overflow-hidden"
      >
        <button onClick={close} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
          <X size={20} />
        </button>

        {/* 진행 바 */}
        <div className="h-[3px] bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 transition-all"
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>

        <div className="p-7">
          <AnimatePresence mode="wait">
            {step === 0 && <StepWelcome />}
            {step === 1 && <StepDailyReward />}
            {step === 2 && <StepStreakInfo />}
            {step === 3 && <StepGames />}
            {step === 4 && <StepFinal />}
          </AnimatePresence>
        </div>

        <div className="px-7 pb-7 flex justify-between items-center">
          <button onClick={close} className="text-sm text-white/50">나중에</button>
          <button
            onClick={next}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-white text-black font-bold active:bg-white/90 disabled:opacity-70"
          >
            {step === 4 ? "시작하기" : "다음"} <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ==================== 스텝 컴포넌트 ==================== */

function StepWelcome() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center mb-5">
        <Gift className="w-7 h-7" />
      </div>
      <div className="text-fuchsia-400 text-xs tracking-[2px] font-bold mb-1">STEP 1 / 5</div>
      <h2 className="text-3xl font-black tracking-[-1px]">환영합니다</h2>
      <p className="mt-3 text-white/70">
        가입 보너스로 <span className="text-white font-bold">10,000 PHON</span>을 바로 드려요.
      </p>
    </div>
  );
}

function StepDailyReward() {
  return (
    <div>
      <div className="text-fuchsia-400 text-xs tracking-[2px] font-bold mb-1">STEP 2 / 5</div>
      <h2 className="text-3xl font-black tracking-[-1px]">매일 출석 보상</h2>
      <p className="mt-3 text-white/70">매일 출석만 해도 <span className="text-white font-bold">300 PHON</span>을 받습니다.</p>
    </div>
  );
}

function StepStreakInfo() {
  return (
    <div>
      <div className="text-fuchsia-400 text-xs tracking-[2px] font-bold mb-1">STEP 3 / 5</div>
      <h2 className="text-3xl font-black tracking-[-1px]">연속 출석하면 보상이 커집니다</h2>
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between p-3.5 rounded-xl bg-white/5">
          <span>3일 연속</span> <span className="font-bold text-fuchsia-400">+300 PHON</span>
        </div>
        <div className="flex justify-between p-3.5 rounded-xl bg-white/5">
          <span>7일 연속</span> <span className="font-bold text-fuchsia-400">+700 PHON</span>
        </div>
        <div className="flex justify-between p-3.5 rounded-xl bg-white/5">
          <span>14일 연속</span> <span className="font-bold text-fuchsia-400">+1,000 PHON</span>
        </div>
      </div>
    </div>
  );
}

function StepGames() {
  return (
    <div>
      <div className="text-fuchsia-400 text-xs tracking-[2px] font-bold mb-1">STEP 4 / 5</div>
      <h2 className="text-3xl font-black tracking-[-1px]">슬롯 · 미니게임</h2>
      <p className="mt-3 text-white/70">매일 무료 스핀과 미니게임으로 추가 수익을 만들 수 있습니다.</p>
    </div>
  );
}

function StepFinal() {
  return (
    <div>
      <div className="text-fuchsia-400 text-xs tracking-[2px] font-bold mb-1">STEP 5 / 5</div>
      <h2 className="text-3xl font-black tracking-[-1px]">이제 시작하세요</h2>
      <p className="mt-3 text-white/70">매일 들어와서 보상을 받고, 트레이딩으로 더 큰 기회를 잡아보세요.</p>
    </div>
  );
}