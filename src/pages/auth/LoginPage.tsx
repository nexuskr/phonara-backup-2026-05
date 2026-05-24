// src/pages/auth/LoginPage.tsx
import { motion, animate } from "framer-motion";
import { 
  Flame, ShieldCheck, Zap, Users, Headphones, Gift, Sparkles, Loader2 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // 실시간 카운터 (부드러운 애니메이션 적용)
  const [todaySignups, setTodaySignups] = useState(32450);
  const [liveUsers, setLiveUsers] = useState(8765);

  // ====================== 부드러운 숫자 애니메이션 ======================
  const animateNumber = (start: number, end: number, setter: (val: number) => void, duration = 800) => {
    const controls = animate(start, end, {
      duration: duration / 1000,
      ease: "easeOut",
      onUpdate: (latest) => {
        setter(Math.floor(latest));
      },
    });
    return controls;
  };

  // 실시간으로 숫자 증가 (부드럽게)
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

  // ====================== 로그인 처리 ======================
  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const { error } = await signIn("test@phonara.com", "12345678");

      if (error) {
        toast.error("앗, 로그인에 실패했어요 😢", {
          description: "이메일이나 비밀번호를 다시 확인해 주세요!",
          duration: 4000,
        });
      } else {
        toast.success("환영합니다! 🎉", {
          description: "PHONARA에 오신 걸 환영해요. 이제 부수입을 시작해볼까요?",
          duration: 3000,
        });

        setTimeout(() => {
          navigate("/home");
        }, 800);
      }
    } catch (err) {
      toast.error("오류가 발생했어요", {
        description: "잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ====================== Google 로그인 ======================
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.loading("Google로 로그인 중이에요...", { id: "google-login" });
    } catch (err) {
      toast.error("Google 로그인에 실패했어요 😢");
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonLoading = isLoading || authLoading;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03050f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(at_top,#4c1d95_0%,#02040d_60%,#000000_100%)]" />
      <div className="absolute top-[-140px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-[100px] opacity-40" />
      <div className="absolute bottom-[-100px] right-[-60px] h-[320px] w-[320px] rounded-full bg-cyan-400/20 blur-[90px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 pb-12 pt-6">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
            🇰🇷 한국어 <span className="text-xs">▼</span>
          </button>
          <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm backdrop-blur-xl hover:bg-white/10 transition-all">
            <Headphones size={17} />
            고객센터
          </button>
        </div>

        {/* Hero */}
        <div className="mt-10">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[56px] font-black tracking-[-3px] leading-none"
          >
            PHONARA
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4"
          >
            <h2 className="text-[40px] font-black leading-tight tracking-[-1.5px]">
              무료로 시작하는<br />
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                부수입 혁명
              </span>
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/70">
              20대부터 70대까지<br />누구나 매일 돈 버는 플랫폼
            </p>
          </motion.div>
        </div>

        {/* Live Stats - 부드러운 카운팅 */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <LiveCard icon={<Users size={19} />} title="오늘 가입" value={todaySignups} />
          <LiveCard icon={<Flame size={19} />} title="실시간 참여" value={liveUsers} />
        </div>

        {/* Phone Visual */}
        <div className="relative mt-8 flex justify-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative"
          >
            <div className="relative h-[360px] w-[210px] rounded-[46px] border border-white/10 bg-[#0a0f1c] shadow-[0_0_60px_rgba(168,85,247,0.4)] overflow-hidden">
              <div className="flex h-full items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-full bg-fuchsia-500 blur-[35px] opacity-50" />
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-6xl font-black">
                    P
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <FloatingCard className="absolute -right-3 top-10" title="지금도 earning 중" value="8,765명" color="fuchsia" />
          <FloatingCard className="absolute -right-2 bottom-14" title="🔥 HOT MISSION" value="+77,777 PHON" color="orange" />
        </div>

        {/* Welcome Bonus */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="mt-8 rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-[#1a1328] to-[#0c0a1f] p-6 backdrop-blur-2xl"
        >
          <div className="flex gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-5xl shadow-lg">
              <Gift />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-400">
                <Sparkles size={18} /> WELCOME BONUS
              </div>
              <div className="mt-2 text-[28px] font-black leading-tight">
                가입만 해도 <span className="text-yellow-300">10,000 PHON</span>
              </div>
              <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 py-4 text-base font-bold text-black">
                지금 바로 받기 →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Login Button */}
        <motion.button
          whileTap={!isButtonLoading ? { scale: 0.97 } : {}}
          onClick={handleLogin}
          disabled={isButtonLoading}
          className="mt-8 h-[70px] w-full rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-600 to-blue-600 text-xl font-black shadow-[0_0_50px_rgba(139,92,246,0.5)] flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {isButtonLoading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              처리중...
            </>
          ) : (
            "간편 로그인 / 회원가입"
          )}
        </motion.button>

        {/* Social Login - Google */}
        <div className="mt-6 text-center text-sm text-white/40">
          또는 다른 방법으로 계속하기
        </div>
        <div className="mt-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleLogin}
            disabled={isButtonLoading}
            className="w-full h-[58px] flex items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white text-sm font-semibold text-black backdrop-blur-xl hover:bg-white/90 transition-all disabled:opacity-70"
          >
            <img 
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
              alt="Google" 
              className="w-5 h-5" 
            />
            Google로 계속하기
          </motion.button>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <FeatureCard icon={<ShieldCheck size={22} />} title="안전한 보안" desc="최고 등급 시스템" />
          <FeatureCard icon={<Zap size={22} />} title="즉시 지급" desc="미션 완료 즉시" />
          <FeatureCard icon={<Users size={22} />} title="100% 무료" desc="숨겨진 비용 없음" />
        </div>

        <div className="mt-auto pt-10 text-center text-xs text-white/40">
          © 2026 PHONARA. All rights reserved.
        </div>
      </div>
    </div>
  );
}

/* ====================== 서브 컴포넌트 ====================== */
function LiveCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <div className="flex items-center gap-2.5 text-sm text-white/70">{icon}{title}</div>
      <div className="mt-2 text-3xl font-black tracking-[-1px] text-white tabular-nums">
        {value.toLocaleString()}
      </div>
    </motion.div>
  );
}

function FloatingCard({ className, title, value, color }: { className?: string; title: string; value: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`absolute rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-2xl ${className}`}>
      <div className="text-xs text-white/60">{title}</div>
      <div className={`mt-1 text-lg font-bold ${color === 'orange' ? 'text-orange-300' : 'text-fuchsia-300'}`}>{value}</div>
    </motion.div>
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