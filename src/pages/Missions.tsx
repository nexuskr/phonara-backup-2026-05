// src/pages/Missions.tsx
import { useState } from "react";
import { Sparkles, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Mission {
  id: string;
  title: string;
  desc: string;
  reward: number;
  tier: string;
  category: string;
}

export default function Missions() {
  const navigate = useNavigate();
  const [tierTab, setTierTab] = useState<"NORMAL" | "VIP" | "ELITE">("NORMAL");
  const [catTab, setCatTab] = useState<"daily" | "battle" | "rewards" | "senior">("battle");
  const [completing, setCompleting] = useState<string | null>(null);

  // 예시 미션 데이터
  const missions: Mission[] = [
    {
      id: "m1",
      title: "오늘 첫 로그인",
      desc: "PHONARA에 접속하기",
      reward: 1000,
      tier: "NORMAL",
      category: "daily",
    },
    {
      id: "m2",
      title: "미션 3개 완료하기",
      desc: "오늘 미션 3개 이상 완료",
      reward: 3000,
      tier: "NORMAL",
      category: "battle",
    },
    {
      id: "m3",
      title: "트레이딩 1회 진행",
      desc: "트레이딩 페이지에서 포지션 열기",
      reward: 5000,
      tier: "NORMAL",
      category: "battle",
    },
    {
      id: "m4",
      title: "친구 1명 초대하기",
      desc: "레퍼럴 링크로 친구 초대",
      reward: 15000,
      tier: "NORMAL",
      category: "rewards",
    },
  ];

  const filteredMissions = missions.filter(
    (m) => m.tier === tierTab && m.category === catTab
  );

  const handleComplete = (mission: Mission) => {
    setCompleting(mission.id);

    setTimeout(() => {
      setCompleting(null);
      toast.success(`미션 완료! +${mission.reward.toLocaleString()} PHON`, {
        description: mission.title,
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#02030a] text-white">
      <div className="max-w-md mx-auto px-5 pt-6 pb-10">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-1.5px] flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary" />
              오늘의 미션
            </h1>
            <p className="text-white/60 text-sm mt-1">미션을 완료하고 보상을 받으세요</p>
          </div>
          <button
            onClick={() => navigate("/earn")}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300"
          >
            <Flame size={18} /> 전체 보기
          </button>
        </div>

        {/* 티어 탭 */}
        <div className="flex gap-2 mb-6">
          {(["NORMAL", "VIP", "ELITE"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierTab(tier)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                tierTab === tier
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* 미션 리스트 */}
        {filteredMissions.length > 0 ? (
          <div className="space-y-4">
            {filteredMissions.map((mission) => (
              <div
                key={mission.id}
                className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">{mission.title}</h3>
                    <p className="text-white/60 text-sm mt-1.5">{mission.desc}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-black text-2xl tabular-nums">
                      +{mission.reward.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/50 -mt-1">PHON</div>
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(mission)}
                  disabled={completing === mission.id}
                  className="mt-6 w-full h-12 rounded-2xl bg-white text-black font-bold text-sm active:bg-white/90 disabled:opacity-60 transition-all"
                >
                  {completing === mission.id ? "진행 중..." : "미션 완료하기"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-10 text-center">
            <p className="text-white/60">현재 해당 티어의 미션이 없습니다.</p>
            <p className="text-sm text-white/40 mt-1">조금만 기다려주세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}