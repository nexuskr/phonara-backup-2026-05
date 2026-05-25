// src/pages/Missions.tsx
import { useState } from "react";
import { Gem, CheckCircle2, Sparkles, Lock, Gamepad2, X, Zap, Flame, Trophy, Heart } from "lucide-react";

// ==================== Stub Components ====================
const Layout = ({ children }: any) => <>{children}</>;
const HubTabs = (props: any) => <div className="h-12 bg-white/5 flex items-center px-5">Missions Hub</div>;
const JackpotBanner = () => <div className="h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl mb-6 flex items-center justify-center font-bold">🎰 JACKPOT</div>;
const AIBotCards = () => <div className="h-40 bg-white/5 rounded-2xl p-6">AI Bot Cards</div>;
const MissionDailyCapCard = (props: any) => <div className="h-40 bg-white/5 rounded-2xl p-6">Daily Cap Card</div>;
const BoosterPill = () => <div className="px-4 py-1 bg-gradient-gold text-gold-foreground rounded-full text-xs font-bold inline-block">BOOSTER</div>;

// ==================== Stub Hooks ====================
const useDB = () => {
  const [db, setDb] = useState({
    completedMissions: [],
    customMissions: [],
    momentum: 3,
    recoveryMission: null,
    user: { 
      tier: "NORMAL", 
      balance: 50000, 
      todayEarnings: 12450, 
      xp: 450, 
      playsUsed: 5, 
      playDate: "2026-05-25" 
    }
  });
  return [db, setDb] as const;
};

const useRequireAuth = () => null; // Missions에서는 db.user를 주로 사용

const formatKRW = (num: number) => num.toLocaleString() + "원";

const toast = {
  success: (title: string) => console.log("[SUCCESS]", title),
  error: (title: string) => console.error("[ERROR]", title),
};

export default function Missions() {
  const [db, setDb] = useDB();
  const user = db.user;                    // ← db.user를 직접 사용 (안전)
  const [tierTab, setTierTab] = useState("NORMAL");
  const [catTab, setCatTab] = useState<"daily" | "battle" | "rewards" | "senior">("battle");
  const [completing, setCompleting] = useState<string | null>(null);

  const userTier = user.tier || "NORMAL";
  const playsUsed = 5;
  const playLimit = 10;
  const playsLeft = Math.max(0, playLimit - playsUsed);
  const limitReached = playsLeft <= 0;

  const missions: any[] = [];
  const list = missions.filter((m) => m.tier === tierTab);

  function complete(m: any) {
    console.log("Mission completed:", m.title);
    setCompleting(m.id);
    setTimeout(() => {
      setCompleting(null);
      toast.success(`+${formatKRW(m.reward || 1000)} PHON`);
    }, 800);
  }

  return (
    <Layout>
      <HubTabs hub="earn" />
      <div className="container pt-6 pb-10 animate-liquid-in">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-imperial text-2xl sm:text-3xl tracking-[0.18em] text-gradient-imperial flex items-center gap-2 break-keep">
              <Sparkles className="w-5 h-5 text-primary" /> 오늘의 미션
            </h1>
          </div>
          <BoosterPill />
        </div>

        <MissionDailyCapCard playsUsed={playsUsed} playLimit={playLimit} tier={userTier} />

        <JackpotBanner />

        <AIBotCards />

        <div className="grid sm:grid-cols-2 gap-3 mt-8">
          {list.length > 0 ? (
            list.map((m: any) => (
              <div
                key={m.id}
                className="glass-strong rounded-2xl p-4 neon-border relative overflow-hidden"
              >
                <h3 className="font-bold text-sm leading-snug break-keep">{m.title || "미션"}</h3>
                <p className="text-[11px] text-muted-foreground mt-1 break-keep">{m.desc || "설명"}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="font-display font-black text-xl text-money-strong tabular-nums">
                    +{formatKRW(m.reward || 1000)}
                  </div>
                  <button
                    onClick={() => complete(m)}
                    disabled={completing === m.id}
                    className="press min-h-[44px] px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold glow-primary disabled:opacity-50 transition"
                  >
                    {completing === m.id ? "진행중..." : "시작하기"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
              현재 미션이 없습니다. 곧 업데이트됩니다.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}