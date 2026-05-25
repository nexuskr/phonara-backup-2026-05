// src/pages/Referral.tsx
import { useState, useEffect, useMemo } from "react";
import { Copy, Share2, Rocket, Users, Sparkles, TrendingUp, Trophy, ChevronDown, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

// ==================== 최소 import 수정 ====================
const Layout = ({ children }: any) => <>{children}</>;
const HubTabs = (props: any) => <div className="h-12 bg-white/5 flex items-center px-5">Referral Hub</div>;

// toast stub
const toast = {
  success: (title: string) => console.log("[SUCCESS]", title),
  error: (title: string) => console.error("[ERROR]", title),
  info: (title: string) => console.log("[INFO]", title),
};

const useTranslation = (ns?: string) => ({
  t: (key: string, params?: any) => key,
  i18n: { language: "ko" }
});

const useRequireAuth = () => ({ id: "current-user" });
const supabase = {
  rpc: async () => ({ data: null }),
  from: () => ({
    select: () => ({ data: [], error: null }),
    eq: () => ({ order: () => ({ limit: () => ({ data: [] }) }) })
  }),
  auth: { getUser: async () => ({ user: { id: "current-user" } }) }
};

// Stub Components
const DMComposer = (props: any) => null;
const EmpireTreePreview = () => null;

type Stats = {
  code: string | null;
  invited: number;
  active_7d: number;
  total_commission: number;
  today_commission: number;
};

type Invitee = {
  invitee_id: string;
  created_at: string;
  signup_bonus_paid: boolean;
  first_deposit_bonus_paid: boolean;
  total_commission: number;
  nickname?: string | null;
};

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

const SHARE_TEMPLATES = [
  { id: "tiktok", icon: Sparkles, key: "tiktok" },
  { id: "instagram", icon: MessageCircle, key: "instagram" },
] as const;

export default function Referral() {
  const { t } = useTranslation("referralPage");
  const { t: tr } = useTranslation("referral");
  const [stats, setStats] = useState<Stats | null>(null);
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFAQ, setOpenFAQ] = useState<string | null>("q1");

  const load = async () => {
    setLoading(true);
    try {
      // 임시 데이터
      setStats({
        code: "PHONARA" + Math.floor(1000 + Math.random() * 9000),
        invited: 12,
        active_7d: 8,
        total_commission: 245000,
        today_commission: 45000,
      });
      setInvitees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const link = stats?.code ? `${window.location.origin}/?ref=${stats.code}` : "";

  const copy = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("초대코드가 복사되었습니다!");
    } catch {
      toast.error("복사 실패");
    }
  };

  const share = async () => {
    if (!link) return;
    const text = "PHONARA에 초대합니다! 부수입 함께 벌어요";
    await copy(`${text}\n${link}`);
  };

  const buildTemplate = (tplKey: string) => {
    if (!stats?.code) return "";
    return `PHONARA 초대코드: ${stats.code}\n링크: ${link}`;
  };

  const stages = useMemo(() => ([
    { key: "stage1", amount: 5000, color: "from-primary/30", border: "border-primary/40", text: "text-primary" },
    { key: "stage2", amount: 25000, color: "from-accent/30", border: "border-accent/40", text: "text-accent" },
    { key: "stage3", amount: 2000, color: "from-gold/30", border: "border-gold/40", text: "text-gold" },
  ] as const), []);

  return (
    <Layout>
      <HubTabs hub="legacy" />
      <div className="container pt-4 pb-12 animate-liquid-in space-y-6">

        {/* Slice 2: 50~70대 즉시 인지용 큰 카피 배너 */}
        <section className="rounded-3xl p-5 md:p-6 bg-gradient-to-br from-gold/20 via-primary/10 to-accent/15 border border-gold/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center font-black text-gold tabular-nums text-lg">1</div>
            <div className="text-base md:text-lg font-bold break-keep">아래 <span className="text-gold">내 코드</span>를 카톡으로 보냅니다</div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-black text-primary tabular-nums text-lg">2</div>
            <div className="text-base md:text-lg font-bold break-keep">친구가 가입하면 <span className="text-money-strong">₩5,000 즉시 지급</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent tabular-nums text-lg">3</div>
            <div className="text-base md:text-lg font-bold break-keep">친구가 충전하면 <span className="text-money-strong">최대 ₩25,000 추가</span></div>
          </div>
        </section>

        <EmpireTreePreview />

        {/* HERO */}
        <section className="relative glass-strong rounded-3xl p-6 md:p-8 neon-border overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-5 h-5 text-gold" />
              <span className="text-xs font-bold tracking-widest text-gold/90">초대 보상</span>
            </div>
            <h1 className="font-imperial text-2xl md:text-4xl text-gradient-imperial tracking-[0.12em] break-keep mb-2">
              친구 초대하고 돈 벌기
            </h1>
            <p className="text-sm md:text-base text-muted-foreground break-keep mb-5">
              친구 한 명 초대할 때마다 최대 30,000원 보상
            </p>

            <div className="rounded-2xl bg-gradient-to-br from-gold/15 via-primary/10 to-accent/10 border border-gold/30 p-5 mb-4">
              <div className="text-[11px] text-muted-foreground mb-1">나의 초대 코드</div>
              <div className="flex items-center justify-between bg-black/40 rounded-2xl p-4">
                <div className="font-mono text-2xl font-bold tracking-widest">
                  {loading ? "—" : (stats?.code ?? "—")}
                </div>
                <button
                  onClick={() => copy(stats?.code ?? "", "초대코드")}
                  className="w-12 h-12 rounded-xl glass hover:scale-105 transition flex items-center justify-center"
                >
                  <Copy className="w-5 h-5 text-gold" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copy(link)}
                className="min-h-[48px] py-3 rounded-xl glass text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition"
              >
                <Copy className="w-4 h-4" /> 링크 복사
              </button>
              <button
                onClick={share}
                className="min-h-[48px] py-3 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-black flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] transition"
              >
                <Share2 className="w-4 h-4" /> 공유하기
              </button>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section>
          <h2 className="font-display font-black text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> 초대 현황
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-5 text-center">
              <div className="text-4xl font-black text-fuchsia-400">{stats?.invited ?? 0}</div>
              <div className="text-sm text-white/60 mt-1">초대한 친구</div>
            </div>
            <div className="glass rounded-2xl p-5 text-center">
              <div className="text-4xl font-black text-emerald-400">₩{(stats?.total_commission ?? 0).toLocaleString()}</div>
              <div className="text-sm text-white/60 mt-1">총 보상</div>
            </div>
          </div>
        </section>

        <div className="text-center text-xs text-white/40 mt-8">
          더 많은 보상은 곧 업데이트됩니다
        </div>
      </div>
    </Layout>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className={`text-[10px] ${accent}`}>{label}</div>
      <div className="font-display font-black text-base mt-1 text-money-strong tabular-nums">{value}</div>
    </div>
  );
}