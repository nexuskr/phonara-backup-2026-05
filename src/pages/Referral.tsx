// src/pages/Referral.tsx
import React, { useState, useEffect } from "react";
import { Copy, Share2, TrendingUp, Gift } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import SlimShell from "../components/layout/SlimShell";

// HubTabs Stub (임시)
const HubTabs = ({ currentPage }: { currentPage?: string }) => (
  <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 sticky top-0 z-50">
    <div className="flex-1 text-center">
      <span className="font-semibold text-white">추천</span>
    </div>
  </div>
);

const Referral = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    code: "",
    invited: 0,
    total_commission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      setStats({
        code: "PHN" + Math.floor(100000 + Math.random() * 900000),
        invited: 12,
        total_commission: 245000,
      });
    } catch (error) {
      console.error("Referral data load error:", error);
      toast({
        title: "❌ 데이터 불러오기 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const link = stats.code 
    ? `${window.location.origin}/?ref=${stats.code}` 
    : "";

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✅ 복사 완료!",
        description: `${label}이(가) 클립보드에 저장되었어요.`,
      });
    } catch {
      toast({
        title: "❌ 복사 실패",
        description: "다시 한 번 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (!link) return;
    const text = `PHONARA에 초대합니다! 함께 부수입 만들어요 🔥\n${link}`;
    await copyToClipboard(text, "초대 링크");
  };

  return (
    <SlimShell>
      <div className="min-h-screen bg-zinc-950 pb-24">
        <HubTabs currentPage="referral" />

        <div className="p-4 space-y-6 max-w-xl mx-auto">
          
          {/* 메인 바이럴 섹션 */}
          <section className="rounded-3xl p-6 bg-gradient-to-br from-purple-950/60 via-zinc-900 to-black border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-8 h-8 text-purple-400" />
              <span className="text-xs font-bold tracking-widest text-purple-400">FRIEND REFERRAL</span>
            </div>
            
            <h1 className="text-3xl font-bold leading-tight text-white mb-3">
              친구 초대하고<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">함께 돈 벌기</span>
            </h1>

            <div className="bg-zinc-900/80 rounded-2xl p-5 mb-5 border border-purple-500/20">
              <div className="text-xs text-zinc-500 mb-2">나의 초대 코드</div>
              <div className="flex items-center justify-between bg-black/50 rounded-xl p-4">
                <div className="font-mono text-3xl font-bold tracking-[0.1em] text-purple-300">
                  {loading ? "••••••" : stats.code}
                </div>
                <button
                  onClick={() => copyToClipboard(stats.code, "초대코드")}
                  className="w-11 h-11 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center transition"
                >
                  <Copy className="w-5 h-5 text-purple-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => copyToClipboard(link, "초대 링크")}
                className="h-14 rounded-2xl border border-purple-500/40 hover:border-purple-400 text-sm font-medium transition-all active:scale-95"
              >
                🔗 링크 복사
              </button>
              <button
                onClick={shareLink}
                className="h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white active:scale-95 transition-all"
              >
                <Share2 className="inline mr-2 w-4 h-4" /> 공유하기
              </button>
            </div>
          </section>

          {/* 보상 단계 */}
          <div className="space-y-4">
            <div className="flex justify-between bg-zinc-900 rounded-2xl p-5 border-l-4 border-purple-500">
              <div>
                <div className="text-white">친구 가입 시</div>
                <div className="text-2xl font-bold text-emerald-400">+5,000원</div>
              </div>
              <div className="text-4xl">🎟️</div>
            </div>

            <div className="flex justify-between bg-zinc-900 rounded-2xl p-5 border-l-4 border-emerald-500">
              <div>
                <div className="text-white">친구 첫 충전 시</div>
                <div className="text-2xl font-bold text-emerald-400">+25,000원</div>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* 현황 */}
          <section className="bg-zinc-900 rounded-3xl p-6">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" /> 초대 현황
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-zinc-950 rounded-2xl py-6 border border-purple-500/20">
                <div className="text-5xl font-black text-purple-400">{stats.invited}</div>
                <div className="text-sm text-zinc-400 mt-1">초대한 친구</div>
              </div>
              <div className="text-center bg-zinc-950 rounded-2xl py-6 border border-emerald-500/20">
                <div className="text-5xl font-black text-emerald-400">
                  ₩{stats.total_commission.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-400 mt-1">총 받은 보상</div>
              </div>
            </div>
          </section>

          {/* 🔥 트레이딩 강력 유도 */}
          <section className="bg-gradient-to-br from-amber-950/40 to-transparent border border-amber-500/30 rounded-3xl p-8 text-center mt-8">
            <h3 className="text-xl font-bold text-white mb-2">미션 완료하셨나요?</h3>
            <p className="text-zinc-400 mb-6">친구도 초대했으니<br />이제 본격 트레이딩으로 업그레이드 해보세요</p>
            <button
              onClick={() => window.location.href = "/trading"}
              className="w-full h-16 bg-white hover:bg-white/90 text-black font-bold text-xl rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              바로 트레이딩 시작하기 →
            </button>
          </section>
        </div>
      </div>
    </SlimShell>
  );
};

export default Referral;