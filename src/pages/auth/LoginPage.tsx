// src/pages/auth/LoginPage.tsx
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import HeroScene from "../../components/HeroScene";
import { useAuth } from "../../context/AuthContext";

const trustBadges = [
  { label: "실시간 알림", icon: BellRing },
  { label: "안전한 로그인", icon: ShieldCheck },
  { label: "초고속 대응", icon: Zap },
];

const valueCards = [
  {
    title: "즉시 수익 루프",
    copy: "실시간 자금 흐름과 알림으로 매 순간 움직이는 흐름을 따라가요.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "지능형 추천",
    copy: "사용 패턴을 읽어 나에게 맞는 루틴과 퀵 액션을 제안해요.",
    icon: BrainCircuit,
  },
  {
    title: "보안 중심 UX",
    copy: "모든 진입점이 안전하게 보호되고, 인증 과정도 한 번에 끝나요.",
    icon: LockKeyhole,
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signIn,
    signUp,
    signInWithMagicLink,
    loading: authLoading,
    user,
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<"magic" | "password">("magic");
  const [magicEmail, setMagicEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [todaySignups, setTodaySignups] = useState(32450);
  const [liveUsers, setLiveUsers] = useState(8765);

  const loading = isLoading || authLoading;

  useEffect(() => {
    if (user && !location.pathname.startsWith("/auth")) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTodaySignups((prev) => prev + Math.floor(Math.random() * 4) + 2);
      setLiveUsers((prev) => {
        const change = Math.floor(Math.random() * 13) - 6;
        return Math.max(8100, Math.min(9900, prev + change));
      });
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const heroStats = useMemo(
    () => [
      {
        label: "오늘 가입자",
        value: `${todaySignups.toLocaleString()}+`,
        icon: Users,
      },
      {
        label: "현재 접속중",
        value: `${liveUsers.toLocaleString()}명`,
        icon: Zap,
      },
    ],
    [liveUsers, todaySignups],
  );

  const handleMagicLink = async () => {
    if (loading) return;
    if (!magicEmail.trim()) {
      toast.error("이메일을 입력해주세요 ✍️");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signInWithMagicLink(magicEmail.trim());
      if (error) {
        toast.error(
          "매직 링크 전송에 실패했어요. 잠시 후 다시 시도해주세요. 😅",
        );
      } else {
        toast.success("매직 링크를 보냈어요 ✨", {
          description: "이메일함을 확인하고 링크를 눌러 바로 시작하세요.",
          duration: 6000,
        });
      }
    } catch {
      toast.error("문제가 발생했어요. 잠시 후 다시 시도해주세요. 😢");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (loading) return;
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 모두 입력해주세요 🔐");
      return;
    }

    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (!signInError) {
        toast.success("환영합니다! 준비된 플랫폼으로 바로 이동합니다. 🚀");
        navigate("/home");
        return;
      }

      const { error: signUpError } = await signUp(email, password);

      if (signUpError) {
        const errorMsg = signUpError.message?.toLowerCase() || "";
        if (errorMsg.includes("already registered")) {
          toast.error(
            "이미 가입된 계정입니다. 다른 이메일을 사용해 주세요. 🛡️",
          );
        } else {
          toast.error(
            "회원가입에 실패했어요. 입력 정보를 다시 확인해 주세요. 😥",
          );
        }
        return;
      }

      toast.success("가입이 완료됐어요. 곧바로 시작할 수 있어요. 🎉");
      navigate("/home");
    } catch {
      toast.error("로그인 중 문제가 발생했어요. 잠시 후 다시 시도해주세요. 😢");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#02030a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4c1d95_0%,#090511_42%,#02030a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(139,92,246,0.12),transparent_34%,rgba(34,211,238,0.08)_100%)]" />
      <div className="absolute left-1/2 -top-35 h-80 w-80 -translate-x-1/2 rounded-full bg-fuchsia-500/25 blur-[180px]" />
      <div className="absolute -bottom-22.5 -right-15 h-60 w-60 rounded-full bg-cyan-400/20 blur-[160px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pt-2"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-fuchsia-300" />
            2026년 가장 빠르게 성장하는 모바일OS급 플랫폼
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200/80">
                premium access / 모바일 최적화
              </p>
              <h1 className="text-[clamp(2.5rem,5vw,3.4rem)] font-black leading-[0.98] tracking-[-0.08em] text-white">
                지금 로그인하면
                <span className="block bg-linear-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  다음 24시간을 선점합니다.
                </span>
              </h1>
            </div>

            <p className="max-w-xl text-[1.02rem] leading-7 text-white/75 sm:text-lg">
              한 번의 터치로 시작하는 디지털 자산 생태계. 알림, 흐름, 추천과
              보안이 함께 움직여 모바일에서 가장 자연스럽고 빠른 경험을
              제공합니다.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {heroStats.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/4.5 px-4 py-4 backdrop-blur"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm text-white/60">
                    <Icon className="h-4 w-4 text-cyan-200" />
                    {label}
                  </div>
                  <div className="text-2xl font-black tracking-tighter text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {trustBadges.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/4 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
                    <Icon className="h-4 w-4 text-fuchsia-200" />
                  </div>
                  <span className="text-sm text-white/80">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.07, ease: "easeOut" }}
          className="lg:pt-8"
        >
          <div className="rounded-[30px] border border-white/10 bg-white/4.5 p-4 shadow-[0_20px_80px_rgba(76,29,149,0.35)] backdrop-blur-xl sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-cyan-100/90">지금 바로 시작</p>
                <p className="text-xs text-white/60">
                  모바일 퍼포먼스 최적화된 인증 레이어
                </p>
              </div>
              <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                live
              </div>
            </div>

            <div className="mb-4 rounded-3xl border border-white/10 bg-linear-to-br from-white/8 via-white/3 to-transparent p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/55">
                    os shell
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    인사이트 카드
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/70">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  secure
                </div>
              </div>

              <div className="space-y-3">
                {valueCards.map(({ title, copy, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-[20px] border border-white/10 bg-black/20 px-3 py-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                        <Icon className="h-4 w-4 text-fuchsia-200" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {title}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-white/70">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveMode("magic")}
                className={`rounded-[22px] px-4 py-3 text-sm font-semibold transition ${
                  activeMode === "magic"
                    ? "bg-linear-to-r from-fuchsia-500 to-violet-500 text-white"
                    : "border border-white/10 bg-white/3 text-white/80"
                }`}
              >
                매직 링크
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("password")}
                className={`rounded-[22px] px-4 py-3 text-sm font-semibold transition ${
                  activeMode === "password"
                    ? "bg-linear-to-r from-cyan-400 to-blue-500 text-slate-950"
                    : "border border-white/10 bg-white/3 text-white/80"
                }`}
              >
                비밀번호 로그인
              </button>
            </div>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                {activeMode === "magic" ? (
                  <motion.div
                    key="magic"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="space-y-4"
                  >
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-fuchsia-500 to-violet-600">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-white">
                            매직 링크로 시작
                          </p>
                          <p className="text-sm text-white/65">
                            이메일만 입력하면 바로 진입
                          </p>
                        </div>
                      </div>

                      <label className="block text-sm text-white/70">
                        이메일 주소
                        <input
                          type="email"
                          autoComplete="email"
                          value={magicEmail}
                          onChange={(event) =>
                            setMagicEmail(event.target.value)
                          }
                          placeholder="your@email.com"
                          className="mt-2 h-13 w-full rounded-[18px] border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-fuchsia-300/70"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleMagicLink}
                        disabled={loading || !magicEmail}
                        className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-linear-to-r from-fuchsia-500 to-violet-500 font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <>
                            시작하기
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="space-y-4"
                  >
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 to-blue-500">
                          <LockKeyhole className="h-5 w-5 text-slate-950" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-white">
                            비밀번호 로그인
                          </p>
                          <p className="text-sm text-white/65">
                            기존 계정으로 즉시 입장
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm text-white/70">
                          이메일 주소
                          <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="name@company.com"
                            className="mt-2 h-13 w-full rounded-[18px] border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-cyan-300/70"
                          />
                        </label>

                        <label className="block text-sm text-white/70">
                          비밀번호
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                            placeholder="••••••••"
                            className="mt-2 h-13 w-full rounded-[18px] border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-cyan-300/70"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handlePasswordAuth}
                        disabled={loading}
                        className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-white font-bold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin text-slate-950" />
                        ) : (
                          "로그인 / 회원가입"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                개인정보와 결제 정보는 이중 보호 체계 아래에서 안전하게
                관리됩니다.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
