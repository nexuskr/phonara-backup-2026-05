// CosmicPaytableSheet — 모바일 친화 배당표 (Cosmic 보라/시안/골드 톤).
// shadcn Sheet, 우측에서 슬라이드. 디자인 토큰 + cosmic 전용 hsla 만 사용.
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";

interface SymRow {
  emoji: string;
  name: string;
  pay: string; // "5x:50 / 4x:15 / 3x:5"
}

const HIGH_SYMBOLS: SymRow[] = [
  { emoji: "👑", name: "Cosmic Emperor", pay: "5x: ×500 · 4x: ×150 · 3x: ×40" },
  { emoji: "🌌", name: "Galaxy Goddess", pay: "5x: ×200 · 4x: ×80 · 3x: ×20" },
  { emoji: "🪐", name: "Forge Planet", pay: "5x: ×120 · 4x: ×40 · 3x: ×12" },
  { emoji: "⚡", name: "Plasma Core", pay: "5x: ×80 · 4x: ×25 · 3x: ×8" },
];

const LOW_SYMBOLS: SymRow[] = [
  { emoji: "A", name: "A", pay: "5x: ×30 · 4x: ×10 · 3x: ×4" },
  { emoji: "K", name: "K", pay: "5x: ×25 · 4x: ×8 · 3x: ×3" },
  { emoji: "Q", name: "Q", pay: "5x: ×20 · 4x: ×6 · 3x: ×2" },
  { emoji: "J", name: "J", pay: "5x: ×15 · 4x: ×5 · 3x: ×2" },
];

export default function CosmicPaytableSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-violet-400/60 bg-indigo-950/40 text-violet-100 hover:bg-violet-900/50 hover:text-violet-50 backdrop-blur-sm"
        >
          <BookOpen className="h-4 w-4 mr-1.5" />
          배당표
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-gradient-to-b from-indigo-950 via-violet-950 to-slate-950 border-l border-violet-400/40 text-violet-50"
      >
        <SheetHeader>
          <SheetTitle className="text-violet-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            Cosmic Forge 5000 — 배당표
          </SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <Section title="고배당 심볼" tone="gold">
            {HIGH_SYMBOLS.map((s) => (
              <Row key={s.name} {...s} />
            ))}
          </Section>

          <Section title="저배당 심볼" tone="cyan">
            {LOW_SYMBOLS.map((s) => (
              <Row key={s.name} {...s} />
            ))}
          </Section>

          <Section title="특수 심볼" tone="purple">
            <Row emoji="✨" name="WILD (Cosmic)" pay="모든 일반 심볼 대체. 보너스 트리거 외 모두 적용." />
            <Row emoji="💫" name="SCATTER" pay="3개 이상 등장 시 Cosmic Forge 보너스 발동." />
          </Section>

          <Section title="보너스 & 잭팟" tone="legendary">
            <p className="text-sm text-violet-200/90 leading-relaxed">
              <b className="text-yellow-300">MAX WIN ×5,000</b> — 단일 스핀 최대 배율 도달 시{" "}
              <b className="text-cyan-300">Galaxy Explosion</b> + <b>Emperor 칭호</b> 시네마틱 발동.
            </p>
            <p className="text-xs text-violet-300/80 mt-2">
              RTP 96.0% (Real) · Demo 모드는 학습용으로 RTP가 다를 수 있습니다.
            </p>
          </Section>

          <p className="text-[11px] text-violet-300/60 text-center pt-2 pb-4">
            결과는 RNG로 결정되며, 실시간 통계는 서버 RPC가 권한합니다.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "gold" | "cyan" | "purple" | "legendary";
  children: React.ReactNode;
}) {
  const toneClass: Record<typeof tone, string> = {
    gold: "from-amber-400/30 to-transparent border-amber-400/40",
    cyan: "from-cyan-400/25 to-transparent border-cyan-400/40",
    purple: "from-violet-400/30 to-transparent border-violet-400/50",
    legendary: "from-fuchsia-400/30 to-transparent border-fuchsia-400/50",
  } as const;
  return (
    <section className={`rounded-xl border bg-gradient-to-b ${toneClass[tone]} p-3`}>
      <h3 className="text-sm font-semibold text-violet-50 mb-2 tracking-wide">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ emoji, name, pay }: SymRow) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-indigo-950/40 px-2.5 py-2">
      <div className="w-8 h-8 shrink-0 rounded-md bg-violet-900/50 flex items-center justify-center text-lg font-bold text-violet-50">
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-violet-50 truncate">{name}</div>
        <div className="text-[11px] text-violet-200/80 leading-snug">{pay}</div>
      </div>
    </div>
  );
}
