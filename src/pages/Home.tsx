// src/pages/home/HomePage.tsx
import { motion } from "framer-motion";
import {
  Bell, Wallet, ArrowDownToLine, History, Gift,
  Flame, Play, Users, Gamepad2, Trophy, Home as HomeIcon,
  Rocket, Dice5, Target, Zap, Star
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
      <div className="absolute top-[-220px] left-1/2 h-[620px] w-[620px] -translate-x/2 bg-gradient-to-br from-fuchsia-500 via-violet-600 to-transparent blur-[160px] opacity-50" />
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
            <MissionCard 
              title="출석체크" 
              reward="+1,000" 
              color="from-fuchsia-600 to-violet-700" 
              onClick={() => goTo("/missions")} 
            />
            <MissionCard 
              title="미니게임" 
              reward="+3,000" 
              color="from-orange-500 to-amber-600" 
              onClick={() => goTo("/missions")} 
            />
            <MissionCard 
              title="광고 시청" 
              reward="+2,000" 
              color="from-blue-500 to-cyan-600" 
              onClick={() => goTo("/missions")} 
            />
            <MissionCard 
              title="친구 초대" 
              reward="+15,000" 
              color="from-emerald-500 to-teal-600" 
              onClick={() => goTo("/referral")} 
            />
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
              icon={<Rocket size={42} />} 
              color="from-fuchsia-500 via-purple-600 to-violet-700" 
              onClick={() => showComingSoon("네온 슬롯")}
            />
            <GameCard 
              title="킵업 축구" 
              desc="터치 한 번으로 골" 
              reward="+800~4,000" 
              icon={<Play size={42} />} 
              color="from-emerald-500 to-cyan-600" 
              onClick={() => showComingSoon("킵업 축구")}
            />
            <GameCard 
              title="럭키 다이스" 
              desc="운이 좋으면 대박" 
              reward="+500~12,000" 
              icon={<Dice5 size={42} />} 
              color="from-amber-500 to-red-600" 
              onClick={() => showComingSoon("럭키 다이스")}
            />
            <GameCard 
              title="타겟 마스터" 
              desc="정확도가 돈이 된다" 
              reward="+600~5,000" 
              icon={<Target size={42} />} 
              color="from-sky-500 to-blue-600" 
              onClick={() => showComingSoon("타겟 마스터")}
            />
            <GameCard 
              title="퀴즈 제국" 
              desc="지식으로 부자되기" 
              reward="+1,000~8,000" 
              icon={<Star size={42} />} 
              color="from-violet-500 to-fuchsia-600" 
              onClick={() => showComingSoon("퀴즈 제국")}
            />
            <GameCard 
              title="초고속 클릭" 
              desc="0.1초 승부" 
              reward="+300~2,500" 
              icon={<Zap size={42} />} 
              color="from-rose-500 to-pink-600" 
              onClick={() => showComingSoon("초고속 클릭")}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM NAV - 연결 완료 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#02030a]/95 backdrop-blur-3xl">
        <div className="max-w-md mx-auto grid grid-cols-5 py-4">
          <BottomNav icon={<HomeIcon size={26} />} label="홈" active onClick={() => goTo("/home")} />
          <BottomNav icon={<Gift size={26} />} label="미션" onClick={() => goTo("/missions")} />
          <BottomNav icon={<Gamepad2 size={26} />} label="게임" onClick={() => goTo("/games")} />
          <BottomNav icon={<History size={26} />} label="거래" onClick={() => goTo("/wallet")} />
          <BottomNav icon={<Trophy size={26} />} label="랭킹" onClick={() => goTo("/earn")} />
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

function GameCard({ title, desc, reward, icon, color, onClick }: { 
  title: string; desc: string; reward: string; icon: React.ReactNode; color: string; onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-[28px] p-[1.5px] bg-gradient-to-br ${color} cursor-pointer active:scale-[0.985] transition-transform`}
    >
      <div className="bg-[#0a0c1f] rounded-[26px] p-5 h-full flex flex-col min-h-[218px]">
        <div className="h-20 flex items-center justify-center text-[42px] text-white/90 mb-3">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[21px] font-black tracking-[-0.5px] leading-[1.1] mb-1.5">{title}</div>
          <div className="text-[13px] text-white/60 leading-snug line-clamp-2">{desc}</div>
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-white/50 tracking-[0.5px] mb-0.5">보상</div>
            <div className="text-fuchsia-300 font-bold text-[17px] leading-none tracking-tight">{reward}</div>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="flex-shrink-0 px-6 py-[10px] rounded-2xl bg-white/10 active:bg-white/20 text-sm font-bold tracking-wider border border-white/10 whitespace-nowrap"
          >
            PLAY
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function BottomNav({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 py-1 active:opacity-80 transition-opacity"
    >
      <div className={active ? "text-fuchsia-400 scale-110" : "text-white/40"}>{icon}</div>
      <div className={`text-[11px] tracking-wider font-medium ${active ? "text-fuchsia-300" : "text-white/40"}`}>
        {label}
      </div>
    </button>
  );
}