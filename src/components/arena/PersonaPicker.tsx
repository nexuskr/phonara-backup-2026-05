import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setPersona, hasChosenPersona, type Persona } from "@/lib/persona";

const OPTIONS: { id: Persona; label: string; hint: string }[] = [
  { id: "gen20",    label: "20대",        hint: "게임처럼 재미있게" },
  { id: "gen30_40", label: "30~40대",     hint: "퇴근 후 부수입" },
  { id: "gen50_60", label: "50~60대",     hint: "노후 자산 운영" },
  { id: "gen70",    label: "70대 이상",    hint: "큰 글씨 · 시니어 모드" },
];

export default function PersonaPicker({ onChosen }: { onChosen?: (p: Persona) => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasChosenPersona()) setOpen(true);
  }, []);

  const choose = (p: Persona) => {
    setPersona(p);
    setOpen(false);
    // Auto-enable senior mode for 70+
    if (p === "gen70") {
      try {
        localStorage.setItem("phonara.seniorMode.v1", "1");
        document.documentElement.classList.add("senior-mode");
      } catch { /* noop */ }
    }
    onChosen?.(p);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && hasChosenPersona()) setOpen(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient-imperial font-imperial tracking-[0.14em]">
            연령대를 알려주세요
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed pt-1">
            화면 안내와 글씨 크기를 맞춰드립니다. 한 번만 선택하면 됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {OPTIONS.map((o) => (
            <Button
              key={o.id}
              variant="outline"
              onClick={() => choose(o.id)}
              className="h-auto min-h-[68px] flex flex-col items-start gap-0.5 px-3 py-2 border-primary/30 hover:border-primary/60"
            >
              <span className="font-black text-base">{o.label}</span>
              <span className="text-[11px] text-muted-foreground font-normal">{o.hint}</span>
            </Button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => choose("general")}
          className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline mt-1"
        >
          건너뛰기
        </button>
      </DialogContent>
    </Dialog>
  );
}
