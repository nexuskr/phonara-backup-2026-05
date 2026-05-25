// src/pages/auth/LoginPage.tsx
import { motion, AnimatePresence, animate } from "framer-motion";
import { 
  Flame, ShieldCheck, Zap, Users, Headphones, Gift, Sparkles, 
  Loader2, Mail, Lock, ArrowRight 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";   // ← useLocation 추가
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();                    // ← 추가
  const { signIn, signUp, signInWithMagicLink, loading: authLoading, user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [magicEmail, setMagicEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 실시간 카운터
  const [todaySignups, setTodaySignups] = useState(32450);
  const [liveUsers, setLiveUsers] = useState(8765);

  const animateNumber = (start: number, end: number, setter: (val: number) => void, duration = 800) => {
    const controls = animate(start, end, {
      duration: duration / 1000,
      ease: "easeOut",
      onUpdate: (latest) => setter(Math.floor(latest)),
    });
    return controls;
  };

  // ==================== 리다이렉트 로직 (가장 중요) ====================
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from || "/home";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  useEffect(() => {
    const interval1 = setInterval(() => {
      const newValue = todaySignups + Math.floor(Math.random() * 7) + 3;
      animateNumber(todaySignups, newValue, setTodaySignups, 900);
    }, 2800);

    const interval2 = setInterval(() => {
      const change = Math.floor(Math.random() * 9) - 3;
      const newValue = Math.max(8200, Math.min(9600, liveUsers + change));
      animateNumber(liveUsers, newValue, setLiveUsers, 700);
    }, 2400);

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [todaySignups, liveUsers]);

  // ==================== Magic Link ====================
  const handleMagicLink = async () => {
    if (!magicEmail.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signInWithMagicLink(magicEmail.trim());

      if (error) {
        toast.error("매직 링크 전송에 실패했어요 😢");
      } else {
        toast.success("매직 링크를 보냈어요! 📩", {
          description: "이메일함을 확인하고 링크를 클릭해주세요.",
          duration: 6000,
        });
      }
    } catch (err) {
      toast.error("앗, 문제가 생겼어요");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 비밀번호 로그인 + 자동 회원가입 ====================
  const handlePasswordAuth = async () => {
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 모두 입력해주세요");
      return;
    }

    setIsLoading(true);

    try {
      // 1. 로그인 시도
      let { error: signInError } = await signIn(email, password);

      if (!signInError) {
        toast.success("환영합니다! 🎉");
        return; // useEffect가 자동으로 리다이렉트 처리
      }

      // 2. 로그인 실패 → 회원가입 시도
      const { data: signUpData, error: signUpError } = await signUp(email, password);

      if (signUpError) {
        toast.error("회원가입 실패", { description: signUpError.message });
        return;
      }

      // 3. 회원가입 성공 → 자동 로그인
      if (signUpData?.user) {
        const { error: autoSignInError } = await signIn(email, password);
        if (!autoSignInError) {
          toast.success("회원가입 완료! 환영합니다 🎉");
          return; // useEffect가 리다이렉트
        }
      }

      toast.success("회원가입 신청 완료!", {
        description: "이메일 인증 후 로그인해주세요.",
      });

    } catch (err: any) {
      toast.error("오류가 발생했어요", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonLoading = isLoading || authLoading;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03050f] text-white pb-safe">
      {/* ... 기존 UI 코드 그대로 유지 ... */}
      {/* (Hero, Live Stats, Welcome Bonus, Magic Link, Password Form 등) */}

      {/* Magic Link 버튼 */}
      <motion.button
        whileTap={!isButtonLoading ? { scale: 0.985 } : {}}
        onClick={handleMagicLink}
        disabled={isButtonLoading || !magicEmail}
        className="flex h-[64px] w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-600 to-blue-600 text-[19px] font-black shadow-[0_0_50px_rgba(139,92,246,0.45)] active:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isButtonLoading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <>
            ✨ 매직 링크 보내기
            <ArrowRight size={22} />
          </>
        )}
      </motion.button>

      {/* 비밀번호 폼 */}
      {showPasswordForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 space-y-3 overflow-hidden"
        >
          {/* ... 기존 input들 ... */}
          <button
            onClick={handlePasswordAuth}
            disabled={isButtonLoading}
            className="mt-1 flex h-[54px] w-full items-center justify-center rounded-2xl bg-white/10 font-semibold text-white active:bg-white/15 disabled:opacity-60"
          >
            {isButtonLoading ? <Loader2 className="animate-spin" /> : "로그인 / 회원가입"}
          </button>
        </motion.div>
      )}

      {/* ... 나머지 Feature Cards 등 기존 코드 ... */}
    </div>
  );
}

/* ====================== 서브 컴포넌트 ====================== */
function LiveCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2.5 text-sm text-white/70">{icon}{title}</div>
      <div className="mt-2 text-3xl font-black tracking-[-1px] tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-xl">
      <div className="flex justify-center text-violet-300">{icon}</div>
      <div className="mt-3 text-sm font-bold">{title}</div>
      <div className="mt-1 text-xs text-white/50">{desc}</div>
    </div>
  );
}