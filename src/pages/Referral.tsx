import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Copy,
  Gift,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { PlatformShell } from "@/shared/ui/platform-shell";
import ShareBar from "@/components/share/ShareBar";
import { useAuth } from "@/context/AuthContext";
import { APP_ROUTES } from "@/shared/constants/routes";
import { notify } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";

interface ReferralStats {
  code: string;
  invited: number;
  active_7d: number;
  total_commission: number;
  today_commission: number;
}

interface WeeklyRank {
  rank: number | null;
  invited_7d: number;
  commission_7d: number;
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
        {label}
      </div>
      <div className={`mt-3 text-2xl font-black sm:text-[1.75rem] ${accent}`}>
        {value}
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return `₩${Math.max(0, Math.round(value)).toLocaleString()}`;
}

export default function Referral() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [rank, setRank] = useState<WeeklyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setStats(null);
      setRank(null);
      return;
    }

    let live = true;

    const loadReferral = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsResult, rankResult] = await Promise.all([
          supabase.rpc("get_referral_stats"),
          supabase.rpc("get_my_weekly_referral_rank"),
        ]);

        if (statsResult.error) {
          throw statsResult.error;
        }

        const rawStats = (statsResult.data ?? {}) as Partial<ReferralStats>;
        const nextStats: ReferralStats = {
          code: typeof rawStats.code === "string" ? rawStats.code : "",
          invited: Number(rawStats.invited ?? 0),
          active_7d: Number(rawStats.active_7d ?? 0),
          total_commission: Number(rawStats.total_commission ?? 0),
          today_commission: Number(rawStats.today_commission ?? 0),
        };

        if (!nextStats.code) {
          const codeResult = await supabase.rpc("gen_referral_code");
          const generated =
            typeof codeResult.data === "string" ? codeResult.data : "";
          if (generated) {
            nextStats.code = generated;
            const updateResult = await supabase
              .from("profiles")
              .update({ referral_code: generated })
              .eq("id", user.id);
            if (updateResult.error) {
              throw updateResult.error;
            }
          }
        }

        const nextRank = rankResult.error
          ? ({} as Partial<WeeklyRank>)
          : ((rankResult.data ?? {}) as Partial<WeeklyRank>);
        const normalizedRank: WeeklyRank = {
          rank: typeof nextRank.rank === "number" ? nextRank.rank : null,
          invited_7d: Number(nextRank.invited_7d ?? 0),
          commission_7d: Number(nextRank.commission_7d ?? 0),
        };

        if (!live) return;

        setStats(nextStats);
        setRank(normalizedRank);
      } catch (err) {
        if (!live) return;
        setError("추천 정보를 불러오지 못했습니다.");
        notify.fail("추천 정보 로딩 실패", err);
      } finally {
        if (live) {
          setLoading(false);
        }
      }
    };

    void loadReferral();

    return () => {
      live = false;
    };
  }, [user?.id]);

  const inviteLink = useMemo(() => {
    if (!stats?.code) return "";
    return `${window.location.origin}/?ref=${stats.code}`;
  }, [stats?.code]);

  const shareText = useMemo(() => {
    if (!stats?.code)
      return "PHONARA에 초대합니다! 함께 트레이딩을 시작해 보세요.";
    return `PHONARA 초대 코드 ${stats.code}를 확인해 보세요. 지금 바로 함께 시작해요!\n${inviteLink}`;
  }, [inviteLink, stats?.code]);

  const copyText = async (text: string, label: string) => {
    if (!text) {
      notify.warning("공유할 링크가 아직 준비되지 않았습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      notify.success(`${label} 복사 완료`, {
        description: "공유 채널에서 바로 활용해 보세요.",
      });
    } catch {
      notify.error("복사 실패");
    }
  };

  const currentCode = stats?.code || "설정 중";

  return (
    <PlatformShell>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-5 pb-4"
      >
        <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-fuchsia-100">
                <Sparkles className="h-3.5 w-3.5" />
                PHONARA REFERRAL
              </div>
              <h1 className="mt-3 text-[2.2rem] font-black tracking-[-0.06em] text-white sm:text-[2.8rem]">
                친구를 초대하면
                <span className="block bg-linear-to-r from-fuchsia-100 via-violet-100 to-cyan-100 bg-clip-text text-transparent">
                  추천 성장 루프가 바로 열립니다.
                </span>
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                추천 코드와 링크를 공유해 초대 흐름을 만들고, 실시간 보상과 랭킹
                지표를 함께 확인해 보세요.
              </p>
            </div>

            <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                    내 초대 코드
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {loading ? "••••••" : currentCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(stats?.code ?? "", "초대 코드")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 text-white"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-[22px] border border-dashed border-fuchsia-300/40 bg-fuchsia-500/10 px-3 py-2 text-sm text-fuchsia-100">
                추천 링크를 공유하면 신규 유저의 첫 성장까지 연결됩니다.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
                REAL-TIME REFERRAL DIGEST
              </div>
              <div className="mt-2 text-xl font-black text-white">
                추천 성과를 즉시 확인하고 공유하세요.
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              live sync
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="초대한 친구"
              value={loading ? "-" : String(stats?.invited ?? 0)}
              accent="text-fuchsia-200"
            />
            <StatTile
              label="7일 활성 친구"
              value={loading ? "-" : String(stats?.active_7d ?? 0)}
              accent="text-cyan-200"
            />
            <StatTile
              label="총 보상"
              value={loading ? "-" : formatMoney(stats?.total_commission ?? 0)}
              accent="text-emerald-200"
            />
            <StatTile
              label="오늘 보상"
              value={loading ? "-" : formatMoney(stats?.today_commission ?? 0)}
              accent="text-amber-200"
            />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Gift className="h-4 w-4 text-fuchsia-200" />
                추천 보상 흐름
              </div>
              <div className="mt-3 space-y-3 text-sm text-white/75">
                <div className="rounded-[20px] border border-white/10 px-3 py-3">
                  친구가 가입하면{" "}
                  <span className="font-black text-white">5,000 PHON</span>을
                  즉시 지급받습니다.
                </div>
                <div className="rounded-[20px] border border-white/10 px-3 py-3">
                  첫 충전/거래가 발생하면 추천 보상이 추가로 누적됩니다.
                </div>
                <div className="rounded-[20px] border border-white/10 px-3 py-3">
                  <span className="font-black text-white">7일 내 활동</span>이
                  활발할수록 추천 지표가 더 빠르게 상승합니다.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <TrendingUp className="h-4 w-4 text-amber-200" />
                주간 랭킹
              </div>
              <div className="mt-3 rounded-[20px] border border-amber-300/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-50">
                {loading
                  ? "주간 랭킹을 불러오는 중입니다."
                  : rank?.rank
                    ? `현재 ${rank.rank}위 · ${rank.invited_7d}명 활성 추천`
                    : "이번 주 랭킹 데이터가 아직 없습니다."}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/10 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                    주간 추천 수
                  </div>
                  <div className="mt-2 text-xl font-black text-white">
                    {loading ? "-" : String(rank?.invited_7d ?? 0)}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/10 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                    주간 보상
                  </div>
                  <div className="mt-2 text-xl font-black text-white">
                    {loading ? "-" : formatMoney(rank?.commission_7d ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-2 text-white font-black">
              <Rocket className="h-4 w-4 text-cyan-200" />
              성장 가속기
            </div>
            <div className="mt-4 space-y-3 text-sm text-white/75">
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                추천 코드는 언제든 재복사할 수 있어, 실시간 캠페인 공유에
                최적화되어 있습니다.
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                활성 친구가 늘면 추천 보상이 자연스럽게 확대되고, 주간 랭킹도
                함께 상승합니다.
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3">
                공유한 링크는 모바일에서 즉시 복사 및 전송이 가능하도록 구성되어
                있습니다.
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-2 text-white font-black">
              <Users className="h-4 w-4 text-fuchsia-200" />
              공유 & 전환
            </div>
            <div className="mt-4 rounded-3xl border border-dashed border-fuchsia-300/40 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-50">
              <div className="font-black text-white">
                한 번의 공유로 추천 흐름을 시작하세요.
              </div>
              <p className="mt-2 leading-6 text-fuchsia-50/90">
                링크 복사, 네이티브 공유, SNS 공유를 모두 지원해 모바일에서
                빠르게 전환할 수 있습니다.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyText(inviteLink, "초대 링크")}
                className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
              >
                <Copy className="mr-2 inline h-4 w-4" />
                링크 복사
              </button>
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.trading)}
                className="rounded-[20px] bg-white px-4 py-3 text-sm font-black text-black"
              >
                트레이딩 시작하기
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <ShareBar
                url={inviteLink || undefined}
                text={shareText}
                className="flex-wrap"
              />
            </div>
          </section>
        </div>

        <section className="rounded-[30px] border border-amber-300/30 bg-linear-to-br from-amber-500/10 via-transparent to-fuchsia-500/10 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-amber-100">
                READY TO SCALE
              </div>
              <h2 className="mt-2 text-2xl font-black text-white">
                추천으로 트레이딩을 더 깊게 확장해 보세요.
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                지금 바로 트레이딩 화면으로 이동해 추천 성과를 연결해 보세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.trading)}
              className="rounded-[20px] bg-white px-5 py-3 text-sm font-black text-black"
            >
              트레이딩 시작하기
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </motion.div>
    </PlatformShell>
  );
}
