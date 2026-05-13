import { useEffect, useState } from "react";
import { usePaperStore } from "@/lib/paper-trading/store";

const KEY = "phonara_win_streak_v1";
const TTL_MS = 24 * 60 * 60 * 1000;

interface Persisted { streak: number; best: number; ts: number }

function load(): Persisted {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (!raw || typeof raw.streak !== "number") return { streak: 0, best: 0, ts: Date.now() };
    if (Date.now() - (raw.ts || 0) > TTL_MS) return { streak: 0, best: raw.best ?? 0, ts: Date.now() };
    return raw;
  } catch { return { streak: 0, best: 0, ts: Date.now() }; }
}

/**
 * useWinStreak — paper-store comboWins를 기반으로 한 연승 카운터.
 * 24h 무활동 시 자동 리셋, best 기록 보존.
 */
export function useWinStreak() {
  const combo = usePaperStore((s) => s.comboWins);
  const [state, setState] = useState<Persisted>(load);

  useEffect(() => {
    setState((prev) => {
      const next: Persisted = { streak: combo, best: Math.max(prev.best, combo), ts: Date.now() };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [combo]);

  return state;
}
