import { memo } from "react";
import { Swords, ChevronDown, ChevronUp } from "lucide-react";
import { getPersona, PERSONA_COPY } from "@/lib/persona";

function ArmyHeroExplainInner() {
  const persona = getPersona();
  const copy = PERSONA_COPY[persona];

  return (
    <section
      className="glass-strong neon-border rounded-2xl p-4 sm:p-5 mb-3 relative overflow-hidden"
      aria-labelledby="army-hero-title"
    >
      <div className="flex items-start gap-3">
        <Swords className="w-7 h-7 sm:w-8 sm:h-8 text-gold shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <h2
            id="army-hero-title"
            className="font-imperial text-xl sm:text-2xl tracking-[0.14em] text-gradient-imperial leading-tight"
          >
            ⚔️ {copy.slogan}
          </h2>
          <p className="text-sm sm:text-base text-foreground/85 mt-1 leading-snug">
            {copy.sub}
          </p>
        </div>
      </div>

      {/* 비유 3줄 — 모든 연령대가 동일하게 이해 */}
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
        <li className="glass rounded-xl p-2.5 flex items-center gap-2">
          <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden />
          <span><b className="text-emerald-300">위쪽 베팅</b> · 가격이 오르면 내 군대 승리</span>
        </li>
        <li className="glass rounded-xl p-2.5 flex items-center gap-2">
          <ChevronDown className="w-4 h-4 text-rose-400 shrink-0" aria-hidden />
          <span><b className="text-rose-300">아래쪽 베팅</b> · 가격이 내리면 내 군대 승리</span>
        </li>
        <li className="glass rounded-xl p-2.5 flex items-center gap-2">
          <span className="text-gold font-black shrink-0">⏱</span>
          <span><b className="text-gold">60초~24시간</b> 안에 결과. 베팅한 금액만 손실.</span>
        </li>
      </ul>
    </section>
  );
}

export default memo(ArmyHeroExplainInner);
