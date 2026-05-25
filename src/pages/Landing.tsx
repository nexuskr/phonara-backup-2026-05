import React from "react";
import { useNavigate } from "react-router-dom";

import {
  formatNumber,
  useLiveCounter,
} from "../hooks/use-live-fomo-counters";

function Landing() {
  const navigate = useNavigate();

  const totalRewards = useLiveCounter(2453892123, {
    minIncrease: 50,
    maxIncrease: 300,
    interval: 1200,
  });

  const activeUsers = useLiveCounter(128392, {
    minIncrease: 1,
    maxIncrease: 7,
    interval: 1800,
  });

  const totalMembers = useLiveCounter(5248932, {
    minIncrease: 1,
    maxIncrease: 5,
    interval: 2500,
  });

  const missionCompleted = useLiveCounter(1238928, {
    minIncrease: 5,
    maxIncrease: 30,
    interval: 1500,
  });

  // /auth 페이지로 이동
  const goToAuth = () => {
    navigate("/auth");
  };

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        {/* BADGE */}
        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70 backdrop-blur-xl">
          PHONARA • NEXT MOBILE PLATFORM
        </div>

        {/* TITLE */}
        <h1 className="max-w-5xl bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-5xl font-black leading-tight text-transparent md:text-7xl">
          차세대 모바일
          <br />
          리워드 플랫폼
        </h1>

        {/* DESC */}
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/60 md:text-xl">
          실시간 리워드 · 미션 · 게임 · 커뮤니티
          <br />
          모든 경험이 하나의 모바일 플랫폼 안에서.
        </p>

        {/* BUTTONS */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {/* 지금 시작하기 */}
          <button
            onClick={goToAuth}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-8 py-4 text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-105"
          >
            지금 시작하기
          </button>

          {/* 플랫폼 둘러보기 */}
          <button
            onClick={goToAuth}
            className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-bold backdrop-blur-xl transition-all duration-300 hover:bg-white/10"
          >
            플랫폼 둘러보기
          </button>
        </div>

        {/* STATS */}
        <div className="mt-20 grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
            <div className="text-sm text-white/50">누적 지급 보상</div>
            <div className="mt-3 text-3xl font-black text-cyan-300">
              {formatNumber(totalRewards)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
            <div className="text-sm text-white/50">실시간 참여자</div>
            <div className="mt-3 text-3xl font-black text-purple-300">
              {formatNumber(activeUsers)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
            <div className="text-sm text-white/50">오늘 완료된 미션</div>
            <div className="mt-3 text-3xl font-black text-pink-300">
              {formatNumber(missionCompleted)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
            <div className="text-sm text-white/50">전체 회원 수</div>
            <div className="mt-3 text-3xl font-black text-yellow-300">
              {formatNumber(totalMembers)}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Landing;