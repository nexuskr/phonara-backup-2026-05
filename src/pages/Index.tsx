import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, TrendingUp, Globe, Cpu, Users, Heart } from "lucide-react";
import Particles from "@/components/Particles";
import PayoutTicker from "@/components/PayoutTicker";
import { useOnline, useTotalPayout, useTodayPayout, useMembers } from "@/components/LiveStats";

export default function Index() {
  const online = useOnline();
  const total = useTotalPayout();
  const today = useTodayPayout();
  const members = useMembers();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <Particles density={70} />

      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/60">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-2 font-bold">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white">
              폰
            </div>
            PHONEMISSION
          </div>

          <div className="flex gap-3">
            <Link to="/auth">로그인</Link>
            <Link to="/auth?signup=1" className="px-4 py-2 bg-gradient-primary text-white rounded-full">
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="container text-center pt-16 pb-24">
        <h1 className="text-4xl sm:text-6xl font-black">스마트 리워드 적립</h1>

        <p className="mt-4 text-muted-foreground">간단한 활동으로 포인트를 적립하세요</p>

        {/* STATS */}
        <div className="mt-10 glass p-6 rounded-2xl max-w-md mx-auto">
          <div className="text-xs">누적 지급액</div>
          <div className="text-3xl font-bold">₩ {total?.toLocaleString() ?? 0}</div>
          <div className="text-xs mt-2">오늘 지급: ₩ {today?.toLocaleString() ?? 0}</div>
          <div className="text-xs mt-1">현재 {online?.toLocaleString() ?? 0}명 이용 중</div>
        </div>

        {/* CTA */}
        <Link
          to="/auth?signup=1"
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-xl font-bold"
        >
          <Sparkles className="w-4 h-4" />
          무료로 시작하기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* LIVE CHAT */}
      <section className="container py-10">
        <div className="glass p-5 rounded-2xl max-w-md mx-auto">
          <div className="text-xs mb-3">💬 실시간 채팅</div>

          <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
            {["방금 3,200P 적립됨", "출금 바로 되네요", "오늘 미션 쉬움", "이거 쏠쏠함"].map((msg, i) => (
              <div key={i}>
                <b>익명{i}</b>: {msg}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="container py-10">
        <div className="glass p-5 rounded-2xl max-w-md mx-auto">
          <div className="text-xs mb-2">🔥 실시간 활동</div>

          {["김** 2000P 적립", "이** 미션 완료", "박** 출금 신청"].map((a, i) => (
            <div key={i} className="text-sm">
              {a}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-12 grid md:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-xl">
          <Cpu />
          <h3>맞춤 미션</h3>
        </div>

        <div className="glass p-5 rounded-xl">
          <TrendingUp />
          <h3>추가 보상</h3>
        </div>

        <div className="glass p-5 rounded-xl">
          <Globe />
          <h3>실시간 지급</h3>
        </div>
      </section>

      {/* FOOTER */}
      <section className="text-center pb-20">
        <Link to="/auth?signup=1" className="px-8 py-4 bg-gradient-primary text-white rounded-xl">
          무료 시작
        </Link>

        <div className="text-xs mt-4 text-muted-foreground">© 2026 PhoneMission</div>
      </section>
    </div>
  );
}
