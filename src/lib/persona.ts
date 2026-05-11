// Persona — localStorage-backed for now (DB migration is optional follow-up).
export type Persona = "gen20" | "gen30_40" | "gen50_60" | "gen70" | "general";

const KEY = "phonara.persona.v1";

export function getPersona(): Persona {
  try {
    const v = localStorage.getItem(KEY) as Persona | null;
    if (v && ["gen20", "gen30_40", "gen50_60", "gen70", "general"].includes(v)) return v;
  } catch { /* noop */ }
  return "general";
}

export function setPersona(p: Persona) {
  try { localStorage.setItem(KEY, p); } catch { /* noop */ }
}

export function hasChosenPersona(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export const PERSONA_COPY: Record<Persona, { slogan: string; sub: string; recommendedSize: number }> = {
  gen20:     { slogan: "캐릭터 키우듯 군대를 키우세요",         sub: "60초 한 판, 게임처럼 시작",          recommendedSize: 50 },
  gen30_40:  { slogan: "퇴근 후 60초로 부수입을 만드세요",      sub: "출퇴근 길에 한 판이면 충분합니다",    recommendedSize: 100 },
  gen50_60:  { slogan: "은행 이자보다 빠른 진짜 자산",          sub: "예금보다 빠르게, 안전 규칙으로 운영",  recommendedSize: 100 },
  gen70:     { slogan: "큰 글씨로 쉽게 · 손주 용돈 만들기",     sub: "버튼은 단 2개. 위 / 아래만 누르세요",  recommendedSize: 50 },
  general:   { slogan: "내 군대가 싸워서 돈을 번다",            sub: "비트코인이 오르면 내 군대 승리, 내리면 적 군대 승리", recommendedSize: 100 },
};
