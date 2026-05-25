// src/pages/home/HomePage.tsx
import { motion } from "framer-motion";
import {
  Bell, Wallet, ArrowDownToLine, History, Gift,
  Flame, Users, Trophy, Home as HomeIcon,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function HomePage() {
  const navigate = useNavigate();

  const goTo = (path: string) => {
    navigate(path);
  };

  const showComingSoon = (gameName: string) => {
    toast.info(`${gameName}은(는) 준비 중입니다`, {
      description: "조금만 기다려주세요!",
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-[#02030a] text-white overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(at_top,#4c1d95_0%,#0a051f_40%,#000000_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#7c3aed10_0%,transparent_50%)]" />
      <div className="absolute top-[-220px] left-1/2 h-[620px] w-[620px] -translate-x-1/2 bg-gradient-to-br from-fuchsia-500 via-violet-600 to-transparent blur-[160px] opacity-50" />
      <div className="absolute bottom-[-180px] right-[-100px] h-[480px] w-[480px] bg-cyan-400/30 blur-[140px] rounded-full" />

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-32">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-5xl">👑</div>
            <h1 className="text-[46px] font-black tracking-[-4px] bg-gradient-to-r from-fuchsia-300 via-white to-cyan-300 bg-clip-text text-transparent">
              PHONARA
            </h1>
          </div>
          <button className="relative p-3 rounded-full hover:bg-white/5 transition-all">
            <Bell size={27} className="text-white/80" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-[#02030a] animate-pulse" />
          </button>
        </div>

        {/* WALLET */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-7 rounded-[36px] border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-3xl p-7 relative overflow-hidden shadow-2xl shadow-fuchsia-500/20"
        >
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-fuchsia-500/40 blur-[100px]" />
          
          <div className="flex justify-between items-start">
            <div>
              <div className="text-white/60 text-sm flex items-center gap-2">
                총 자산
              </div>
              <div className="mt-3 text-[56px] font-black tracking-[-3.5px] leading-none">1,234,567</div>
              <div className="text-2xl text-fuchsia-300 -mt-1">PHON</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 text-xl font-bold">+12.8%</div>
              <div className="text-white/50 text-sm">24시간</div>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-4 gap-3">
            <QuickButton icon={<Wallet size={23} />} label="입금" onClick={() => goTo("/wallet")} />
            <QuickButton icon={<ArrowDownToLine size={23} />} label="출금" onClick={() => goTo("/wallet")} />
            <QuickButton icon={<History size={23} />} label="내역" onClick={() => goTo("/wallet")} />
            <QuickButton icon={<Gift size={23} />} label="선물" onClick={() => goTo("/referral")} />
          </div>
        </motion.div>

        {/* ==================== 대형 트레이딩 유도 카드 ==================== */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => goTo("/trading")}
          className="mt-6 cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 p-[1px]">
            <div className="bg-[#0a0c1f] rounded-[31px] p-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-widest">LIVE TRADING</div>
                  </div>
                  <h2 className="text-[32px] font-black tracking-[-1.5px] leading-[1.1] text-white">
                    지금 트레이딩으로<br />수익을 만들어보세요
                  </h2>
                  <p className="mt-3 text-white/80 text-[15px]">
                    레버리지 1x~100x • 실시간 청산 계산
                  </p>
                </div>
                <TrendingUp className="w-14 h-14 text-white/90 mt-1" />
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  goTo("/trading");
                }}
                className="mt-8 w-full h-14 bg-white text-black font-bold text-[17px] rounded-2xl active:bg-white/90 transition-all"
              >
                트레이딩 시작하기 →
              </button>
            </div>
          </div>
        </motion.div>

        {/* LIVE FEED */}
        <motion.div
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-5 rounded-3xl border border-red-500/30 bg-[#0a0c1f]/90 backdrop-blur-3xl p-5 flex items-center gap-4"
        >
          <div className="px-4 py-1.5 bg-red-500 rounded-full text-xs font-black tracking-widest">● LIVE</div>
          <div className="text-[15px] leading-tight">
            지금 이 순간 <span className="text-fuchsia-400 font-bold">11,284명</span>이<br />
            <span className="text-white/90">PHONARA에서 돈을 벌고 있습니다</span>
          </div>
          <Users className="ml-auto text-fuchsia-400" size={28} />
        </motion.div>

        {/* MISSIONS */}
        <div className="mt-10">
          <div className="flex justify-between items-end mb-5">
            <h2 className="text-[34px] font-black tracking-[-2.5px]">오늘의 미션</h2>
            <button 
              onClick={() => goTo("/missions")}
              className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm"
            >
              <Flame size={20} /> 전체 미션 보기
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MissionCard title="출석체크" reward="+1,000" color="from-fuchsia-600 to-violet-700" onClick={() => goTo("/missions")} />
            <MissionCard title="미니게임" reward="+3,000" color="from-orange-500 to-amber-600" onClick={() => goTo("/missions")} />
            <MissionCard title="광고 시청" reward="+2,000" color="from-blue-500 to-cyan-600" onClick={() => goTo("/missions")} />
            <MissionCard title="친구 초대" reward="+15,000" color="from-emerald-500 to-teal-600" onClick={() => goTo("/referral")} />
          </div>
        </div>

        {/* GAME SECTION */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[34px] font-black tracking-[-2.5px] flex items-center gap-3">
              빠른 게임 <span className="text-2xl">⚡</span>
            </h2>
            <button 
              onClick={() => goTo("/games")}
              className="text-sm text-white/60 hover:text-white/80 transition-colors"
            >
              전체 게임장 →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GameCard 
              title="네온 슬롯" 
              desc="한 판에 인생 역전" 
              reward="최대 500,000" 
              icon="🚀" 
              color="from-fuchsia-500 via-purple-600 to-violet-700" 
              onClick={() => showComingSoon("네온 슬롯")}
            />
            <GameCard 
              title="킵업 축구" 
              desc="터치 한 번으로 골" 
              reward="+800~4,000" 
              icon="⚽" 
              color="from-emerald-500 to-cyan-600" 
              onClick={() => showComingSoon("킵업 축구")}
            />
          </div>
        </div>
      </div>

      {/* ==================== 네온 효과 적용된 Bottom Navigation ==================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#02030a]/95 backdrop-blur-3xl">
        <div className="max-w-md mx-auto grid grid-cols-5 items-end px-2 pb-2 pt-3">
          {/* 홈 */}
          <button onClick={() => goTo("/home")} className="flex flex-col items-center justify-center gap-1.5 py-1 active:opacity-80">
            <div className="text-white/40"><HomeIcon size={24} /></div>
            <div className="text-[10.5px] tracking-wider text-white/40 font-medium">홈</div>
          </button>

          {/* 미션 */}
          <button onClick={() => goTo("/missions")} className="flex flex-col items-center justify-center gap-1.5 py-1 active:opacity-80">
            <div className="text-white/40"><Gift size={24} /></div>
            <div className="text-[10.5px] tracking-wider text-white/40 font-medium">미션</div>
          </button>

          {/* ==================== 트레이딩 (네온 강조) ==================== */}
          <button onClick={() => goTo("/trading")} className="flex flex-col items-center justify-center -mt-3 active:opacity-90">
            <div className="relative flex flex-col items-center">
              {/* 네온 Glow */}
              <div className="absolute -inset-3 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 rounded-full blur-[18px] opacity-60" />
              
              {/* 메인 버튼 */}
              <div className="relative w-[68px] h-[68px] rounded-3xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-fuchsia-500/50 border-[3.5px] border-white/90">
                <div className="text-white">
                  <TrendingUp size={28} />
                </div>
              </div>

              {/* 라벨 */}
              <div className="mt-1.5 text-[11px] font-bold tracking-[0.5px] text-fuchsia-300">
                트레이딩
              </div>

              {/* 펄스 효과 */}
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-1 rounded-3xl border border-fuchsia-400/50"
              />
            </div>
          </button>

          {/* 랭킹 */}
          <button onClick={() => goTo("/earn")} className="flex flex-col items-center justify-center gap-1.5 py-1 active:opacity-80">
            <div className="text-white/40"><Trophy size={24} /></div>
            <div className="text-[10.5px] tracking-wider text-white/40 font-medium">랭킹</div>
          </button>

          {/* 친구 */}
          <button onClick={() => goTo("/referral")} className="flex flex-col items-center justify-center gap-1.5 py-1 active:opacity-80">
            <div className="text-white/40"><Users size={24} /></div>
            <div className="text-[10.5px] tracking-wider text-white/40 font-medium">친구</div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====================== 서브 컴포넌트 ====================== */
function QuickButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="h-[88px] rounded-3xl bg-white/5 border border-white/10 hover:border-fuchsia-400/50 flex flex-col items-center justify-center gap-2 transition-all active:bg-white/10"
    >
      <div className="text-fuchsia-400">{icon}</div>
      <div className="text-[13px] font-medium text-white/90 tracking-tight">{label}</div>
    </motion.button>
  );
}

function MissionCard({ title, reward, color, onClick }: { title: string; reward: string; color: string; onClick?: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-[28px] p-[2px] bg-gradient-to-br ${color} cursor-pointer`}
    >
      <div className="bg-[#0a0c1f] rounded-[26px] p-6 h-full">
        <div className="font-black text-2xl">{title}</div>
        <div className="mt-8 text-3xl font-bold text-white">{reward} PHON</div>
      </div>
    </motion.div>
  );
}

function GameCard({ title, desc, reward, icon, color, onClick }: any) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-[28px] p-[1.5px] bg-gradient-to-br ${color} cursor-pointer`}
    >
      <div className="bg-[#0a0c1f] rounded-[26px] p-5 h-full flex flex-col min-h-[200px]">
        <div className="text-[42px] mb-4">{icon}</div>
        <div className="flex-1">
          <div className="text-[21px] font-black tracking-[-0.5px] leading-[1.1] mb-1.5">{title}</div>
          <div className="text-[13px] text-white/60 leading-snug line-clamp-2">{desc}</div>
        </div>
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/50">보상</div>
            <div className="text-fuchsia-300 font-bold text-[17px]">{reward}</div>
          </div>
          <button className="px-5 py-2 rounded-2xl bg-white/10 text-sm font-bold">PLAY</button>
        </div>
      </div>
    </motion.div>
  );
}