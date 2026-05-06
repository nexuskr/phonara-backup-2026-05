import { Link } from "react-router-dom";
import { ShieldCheck, Zap, Lock, Sparkles, ArrowRight, TrendingUp, Globe, Cpu, Users, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import Particles from "@/components/Particles";
import PayoutTicker from "@/components/PayoutTicker";
import { useOnline, useTotalPayout, useTodayPayout, useMembers } from "@/components/LiveStats";

export default function Index() {
  const online = useOnline();
  const total = useTotalPayout();
  const today = useTodayPayout();
  const members = useMembers();

  const [messages, setMessages] = useState<string[]>([]);

  // 🔥 랜덤 데이터
  const names = ["민수", "지훈", "서연", "유진", "태현", "지우", "하준", "도윤"];
  const actions = ["출금 완료", "미션 완료", "포인트 적립", "VIP 전환"];
  const reactions = [
    "이거 진짜 되네",
    "생각보다 빠르다",
    "이거 계속 해야겠다",
    "처음인데 신기함",
    "이거 꾸준히 하면 쏠쏠",
  ];

  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const generateMessage = () => {
    const name = getRandom(names);
    const type = Math.floor(Math.random() * 5);
    const amount = Math.floor(Math.random() * 50000) + 1000;

    switch (type) {
      case 0:
        return `${name}님 미션 완료 (+₩${amount.toLocaleString()})`;
      case 1:
        return `${name}님 출금 완료 (+₩${amount.toLocaleString()})`;
      case 2:
        return `${name}: "${getRandom(reactions)}"`;
      case 3:
        return `🔥 ${name}님 VIP 달성`;
      default:
        return `${name}님 포인트 적립 (+₩${amount.toLocaleString()})`;
    }
  };

  // 🔥 실시간 채팅 (랜덤 타이밍)
  useEffect(() => {
    const interval = setInterval(
      () => {
        setMessages((prev) => [generateMessage(), ...prev.slice(0, 6)]);
      },
      Math.random() * 3000 + 1500,
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/30 blur-3xl" />
      <Particles density={70} />

      {/* 헤더 */}
      <header className="relative z-20">
        <div className="container flex justify-between h-20 items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
              폰
            </div>
            <span className="font-bold text-xl">PHONEMISSION</span>
          </div>

          <div className="flex gap-3">
            <Link to="/auth">로그인</Link>
            <Link to="/auth?signup=1" className="px-4 py-2 bg-primary text-white rounded-full">
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="container text-center pt-20">
        <h1 className="text-5xl font-bold">
          폰 하나로 시작하는
          <br />
          <span className="text-primary">스마트 수익 시스템</span>
        </h1>

        <p className="mt-4 text-gray-400">자동 미션 + 실시간 정산으로 수익을 만들어보세요</p>

        {/* 수익 카드 */}
        <div className="mt-10 p-6 bg-black/40 rounded-2xl max-w-md mx-auto border border-primary/30">
          <div className="text-sm text-gray-400">누적 지급액</div>
          <div className="text-3xl font-bold text-primary">₩ {total.toLocaleString()}</div>

          <div className="text-xs text-green-400 mt-2">+₩ {today.toLocaleString()} 오늘 지급</div>

          <div className="text-xs mt-2 text-gray-400">{online.toLocaleString()}명 접속 중</div>
        </div>

        {/* CTA */}
        <Link to="/auth?signup=1" className="mt-8 inline-block px-8 py-4 bg-primary text-white rounded-xl text-lg">
          시작하기 →
        </Link>
      </section>

      {/* 🔥 실시간 채팅 */}
      <section className="container mt-20 max-w-md mx-auto">
        <div className="bg-black/40 border border-primary/30 rounded-2xl p-5">
          <div className="text-sm text-gray-400 mb-3">실시간 채팅</div>

          <div className="space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div key={i} className="bg-white/5 px-3 py-2 rounded-lg animate-fade-in">
                {msg}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 */}
      <section className="container mt-20 grid md:grid-cols-3 gap-5">
        {[
          { icon: Cpu, title: "AI 자동 미션" },
          { icon: TrendingUp, title: "수익 증가 시스템" },
          { icon: Globe, title: "실시간 글로벌 정산" },
        ].map((f, i) => (
          <div key={i} className="p-6 bg-black/40 rounded-2xl border border-primary/30">
            <f.icon className="w-8 h-8 text-primary" />
            <div className="mt-3 font-bold">{f.title}</div>
          </div>
        ))}
      </section>

      {/* 통계 */}
      <section className="container mt-20 text-center">
        <div className="text-3xl font-bold text-primary">{members.toLocaleString()}</div>
        <div className="text-gray-400">활성 사용자</div>
      </section>

      {/* CTA */}
      <section className="container mt-20 text-center pb-20">
        <h2 className="text-3xl font-bold">지금 시작하세요</h2>

        <Link to="/auth?signup=1" className="mt-6 inline-block px-10 py-4 bg-primary text-white rounded-xl">
          무료 시작
        </Link>
      </section>
    </div>
  );
}
