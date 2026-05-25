// src/pages/auth/LoginPage.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowRight, Sparkles, Users, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import HeroScene from "../../components/HeroScene";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithMagicLink, loading: authLoading, user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [todaySignups, setTodaySignups] = useState(32450);
  const [liveUsers, setLiveUsers] = useState(8765);

  // 리다이렉트
  useEffect(() => {
    if (user && !location.pathname.startsWith('/auth')) {
      const from = (location.state as any)?.from || "/home";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // 실시간 숫자 변동 (FOMO)
  useEffect(() => {
    const interval = setInterval(() => {
      setTodaySignups(prev => prev + Math.floor(Math.random() * 4) + 2);
      setLiveUsers(prev => {
        const change = Math.floor(Math.random() * 13) - 6;
        return Math.max(8100, Math.min(9900, prev + change));
      });
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // ==================== 토스트 (귀엽고 친근하게) ====================
  const handleMagicLink = async () => {
    if (!magicEmail.trim()) {
      toast.error("이메일 입력해주세요! 😢");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signInWithMagicLink(magicEmail.trim());
      if (error) {
        toast.error("매직 링크 전송 실패했어요... 😭");
      } else {
        toast.success("매직 링크 보냈어요! 📩", {
          description: "이메일함 확인하고 링크 클릭해주세요~",
          duration: 6000,
        });
      }
    } catch {
      toast.error("앗! 오류가 발생했어요 😢");
    }
    setIsLoading(false);
  };

  const handlePasswordAuth = async () => {
    if (!email || !password) {
      toast.error("이메일이랑 비밀번호 모두 입력해주세요! 🥺");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (!error) {
        toast.success("환영합니다! 🎉", {
          description: "오늘도 좋은 하루 보내세요~",
        });
        return;
      }
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        toast.error("회원가입에 실패했어요... 😭");
        return;
      }
      toast.success("가입 완료! 축하해요~ 🎊", {
        description: "이제 PHONARA에서 부수입 시작해봐요!",
      });
    } catch (e: any) {
      toast.error("오류가 발생했어요... 😢");
    }
    setIsLoading(false);
  };

  const loading = isLoading || authLoading;

  return (
    <div className="min-h-screen bg-[#02030a] text-white overflow-hidden relative">
      {/* 배경 */}
      <div className="absolute inset-0 bg-[radial-gradient(at_top,#4c1d95_0%,#0a051f_40%,#000000_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#7c3aed10_0%,transparent_50%)]" />
      <div className="absolute top-[-220px] left-1/2 h-[620px] w-[620px] -translate-x-1/2 bg-gradient-to-br from-fuchsia-500 via-violet-600 to-transparent blur-[160px] opacity-50" />
      <div className="absolute bottom-[-180px] right-[-100px] h-[480px] w-[480px] bg-cyan-400/30 blur-[140px] rounded-full" />

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-16">
        
        {/* 3D Hero Scene */}
        <HeroScene />

        {/* ==================== 강력 FOMO 헤드라인 ==================== */}
        <div className="text-center -mt-4 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>2026년 가장 빠르게 성장하는 부수입 플랫폼</span>
          </div>

          <h1 className="text-[36px] font-black tracking-[-1.8px] leading-[1.15] mb-4">
            지금 시작하지 않으면,<br />
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              당신이 벌 수 있었던 돈을
            </span><br />
            다른 누군가가 가져갑니다.
          </h1>

          <p className="text-[17px] text-white/75 leading-snug">
            3초 만에 시작하는 부수입.<br />
            지금 안 하면 내일 또 미뤄요.
          </p>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <Users size={16} /> 오늘 가입자
            </div>
            <div className="text-4xl font-black tabular-nums">{todaySignups.toLocaleString()}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <Zap size={16} /> 현재 접속중
            </div>
            <div className="text-4xl font-black tabular-nums">{liveUsers.toLocaleString()}</div>
          </div>
        </div>

        {/* Magic Link */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-7 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xl">매직 링크로 시작</div>
              <div className="text-sm text-white/60">이메일만 입력하면 끝</div>
            </div>
          </div>

          <input
            type="email"
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 mb-4 outline-none focus:border-purple-500"
          />

          <button
            onClick={handleMagicLink}
            disabled={loading || !magicEmail}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 font-bold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.985] transition"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>지금 시작하기 <ArrowRight /></>}
          </button>
        </div>

        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full text-center text-sm text-white/60 py-2 mb-2"
        >
          {showPasswordForm ? "매직 링크로 돌아가기" : "비밀번호로 로그인 / 회원가입"}
        </button>

        {/* 비밀번호 폼 */}
        <AnimatePresence>
          {showPasswordForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일"
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5"
                />
                <button
                  onClick={handlePasswordAuth}
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-white text-black font-bold active:bg-white/90"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "로그인 / 회원가입"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}