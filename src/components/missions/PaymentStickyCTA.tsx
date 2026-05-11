import { useNavigate } from "react-router-dom";
import { useDB } from "@/lib/store";
import { Gem, ArrowRight } from "lucide-react";

/**
 * 20~70대 모든 미션 화면 하단 고정 결제 유도 CTA.
 * - 비결제(잔액 0 + NORMAL 등급) 유저에게만 노출
 * - 1탭으로 입금 페이지 진입
 */
export default function PaymentStickyCTA() {
  const [db] = useDB();
  const nav = useNavigate();
  const user = db.user;
  // 이미 결제했거나 NORMAL이 아니면 숨김
  if (!user) return null;
  if (user.tier !== "NORMAL") return null;
  if ((user.balance ?? 0) > 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="container pb-4">
        <div
          className="pointer-events-auto glass-strong rounded-2xl border border-gold/40 p-3 sm:p-4 flex items-center gap-3 shadow-2xl"
          role="region"
          aria-label="패키지로 자동 보상 활성화"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-gold flex items-center justify-center glow-gold shrink-0">
            <Gem className="w-5 h-5 sm:w-6 sm:h-6 text-gold-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] sm:text-xs tracking-widest text-gold font-black">패키지 1회로 자동 활성화</div>
            <div className="text-sm sm:text-base font-display font-black break-keep leading-snug">
              매일 미션이 자동 완료됩니다
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground break-keep">50,000원부터 시작 · 입금 즉시 적용</div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => nav("/wallet?tab=deposit&intent=first-deposit&amount=50000")}
              className="press min-h-[44px] px-4 py-2 rounded-xl bg-gradient-gold text-gold-foreground text-xs sm:text-sm font-black glow-gold whitespace-nowrap flex items-center gap-1.5"
            >
              지금 입금 <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nav("/packages?focus=easy_starter")}
              className="press min-h-[36px] px-3 py-1.5 rounded-xl glass text-[10px] sm:text-xs font-bold border border-border/60 whitespace-nowrap"
            >
              패키지 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
