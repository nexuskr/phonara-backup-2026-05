import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useEffect, useState } from 'react';

// Extreme FOMO Landing - Premium 2026 Futuristic Background
export default function Landing() {
  const navigate = useNavigate();
  const [liveUsers, setLiveUsers] = useState(12847);
  const [todaySignups, setTodaySignups] = useState(47892);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 4) + 2);
      if (Math.random() > 0.65) setTodaySignups(prev => prev + 1);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* Futuristic Background Layer */}
      <div className="fixed inset-0 -z-10">
        {/* Deep navy base */}
        <div className="absolute inset-0 bg-[#0A0F1E]" />
        
        {/* Elegant gradient glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#EAB308]/[0.06] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[50%] h-[70%] bg-[#22D3EE]/[0.05] blur-[140px] rounded-full" />
        
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="text-2xl font-bold tracking-tighter">PHONARA</div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>로그인</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>무료로 시작하기</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-24 pb-16 px-6 text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/20 text-sm mb-6">
            지금 이 순간에도 수익이 쌓이고 있습니다
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
            복잡한 건 다 빼고.<br />
            <span className="text-[#EAB308]">진짜 돈</span>만 남겼습니다.
          </h1>

          <p className="text-2xl text-[#A1A1AA] max-w-2xl mx-auto mb-10">
            하루 10분. 미션만 해도 PHON이 쌓입니다.<br />
            한국인들이 지금 가장 많이 하는 무료 부수입.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-xl h-16 px-14" onClick={() => navigate('/signup')}>
              지금 바로 무료로 시작하기
            </Button>
            <Button size="lg" variant="outline" className="text-xl h-16 px-10" onClick={() => navigate('/login')}>
              로그인
            </Button>
          </div>
          <p className="mt-4 text-sm text-[#71717A]">가입 즉시 웰컴 PHON 지급 • 신용카드 필요 없음</p>
        </div>
      </div>

      {/* Live FOMO Stats */}
      <div className="border-y border-white/10 bg-black/40 py-10 backdrop-blur">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-8 px-6 text-center">
          <div>
            <div className="text-6xl font-bold text-[#EAB308] tabular-nums">{todaySignups.toLocaleString()}</div>
            <div className="text-[#A1A1AA] mt-2">오늘 가입한 사람</div>
          </div>
          <div>
            <div className="text-6xl font-bold tabular-nums">{liveUsers.toLocaleString()}</div>
            <div className="text-[#A1A1AA] mt-2">지금 활동 중</div>
          </div>
          <div>
            <div className="text-6xl font-bold">94</div>
            <div className="text-[#A1A1AA] mt-2">국가에서 접속 중</div>
          </div>
          <div>
            <div className="text-6xl font-bold text-emerald-400">+₩3.1억</div>
            <div className="text-[#A1A1AA] mt-2">오늘 지급된 PHON</div>
          </div>
        </div>
      </div>

      {/* 3 Steps */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-[#EAB308] text-sm tracking-[3px]">3 STEPS</div>
          <h2 className="text-4xl font-bold mt-2">생각보다 훨씬 간단합니다</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: "01", title: "가입하고 미션하기", desc: "출석, 미션, 퀘스트만 해도 PHON이 즉시 쌓입니다." },
            { num: "02", title: "PHON으로 수익 만들기", desc: "트레이딩과 슬롯으로 재미 + 수익을 동시에." },
            { num: "03", title: "수익 현금화", desc: "PHON을 USDT로 바꾸거나 재투자하세요." }
          ].map((step, i) => (
            <Card key={i} variant="elevated" className="p-8">
              <div className="text-[#EAB308] text-6xl font-bold mb-4">{step.num}</div>
              <div className="text-2xl font-semibold mb-3">{step.title}</div>
              <p className="text-[#A1A1AA]">{step.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* FOMO Activity */}
      <div className="bg-[#0F1424] border-y border-white/10 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-3">지금 이 순간에도 누군가는 돈을 벌고 있습니다</h3>
          <p className="text-[#A1A1AA] mb-10">실시간으로 미션을 완료하고, 트레이딩으로 수익을 만드는 사람들.</p>

          <div className="space-y-4 text-left max-w-2xl mx-auto">
            {[
              "서울 • 방금 — 김**님이 미션 완료하고 PHON 180 받음",
              "부산 • 1분 전 — 박**님이 BTC Long으로 +₩217,000 수익",
              "대구 • 2분 전 — 이**님이 슬롯에서 대박! PHON 920 획득"
            ].map((text, i) => (
              <div key={i} className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-[#EAB308]">
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold tracking-tighter mb-4">지금 시작하면<br />당신도 오늘부터 수익이 생깁니다.</h2>
        <p className="text-xl text-[#A1A1AA] mb-8">가입은 30초. 첫 미션은 1분이면 끝납니다.</p>

        <Button size="lg" className="text-2xl h-16 px-16" onClick={() => navigate('/signup')}>
          지금 바로 무료로 시작하기
        </Button>
        <p className="mt-5 text-sm text-[#71717A]">가입 즉시 웰컴 PHON 지급 • 언제든 탈퇴 가능</p>
      </div>
    </div>
  );
}
