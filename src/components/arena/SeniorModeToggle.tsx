import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

const KEY = "phonara.seniorMode.v1";

function applyToDOM(on: boolean) {
  try {
    document.documentElement.classList.toggle("senior-mode", on);
  } catch { /* noop */ }
}

export default function SeniorModeToggle() {
  const [on, setOn] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  });

  useEffect(() => { applyToDOM(on); }, [on]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try { localStorage.setItem(KEY, next ? "1" : "0"); } catch { /* noop */ }
    // Lightweight voice cue when turning on
    if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance("큰 글씨 모드를 켰습니다. 위쪽 또는 아래쪽 버튼을 눌러 시작하세요.");
        u.lang = "ko-KR";
        u.rate = 1;
        window.speechSynthesis.speak(u);
      } catch { /* noop */ }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-xl text-[11px] font-black tracking-wide transition-colors border ${
        on ? "bg-gradient-imperial text-primary-foreground border-primary/60" : "glass border-border/40 text-muted-foreground"
      }`}
      title="큰 글씨 모드 · 시니어 모드"
    >
      <Eye className="w-3.5 h-3.5" aria-hidden />
      큰 글씨 {on ? "ON" : "OFF"}
    </button>
  );
}
