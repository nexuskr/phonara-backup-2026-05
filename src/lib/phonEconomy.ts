/**
 * PHON 경제 상수 — 표시·교육 전용.
 *
 * 주의: 이 상수들은 마케팅 카피와 UI 시각화에 사용됩니다.
 * 실제 정산·잔액 mutation 로직은 머니플로 8경로 동결 영역이며,
 * 별도 Pass 2 PR에서 RPC 단위로 구현됩니다.
 */

/** PHON 베팅 시 적용 예정인 하우스 에지 할인율 (Pass 2 활성화) */
export const HOUSE_EDGE_DISCOUNT_RATE = 0.20;

/** PHON 스테이킹 예상 APY 범위 — 실제 정책은 Pass 2 cron 도입 후 확정 */
export const PHON_STAKING_APY_RANGE = { min: 0.12, max: 0.20 } as const;

/** PHON 일배당 모델 예상 일률 (참고용, APY/365 환산) */
export const PHON_STAKING_DAILY_YIELD_PREVIEW = 0.008;

/** 서버 트리거(trg_enforce_leverage_gate)와 미러된 PHON 보유량별 베이스 레버리지 */
export const PHON_LEVERAGE_TIERS = [
  { minPhon: 5000, baseLev: 100, label: "Emperor" },
  { minPhon: 1200, baseLev: 50,  label: "Baron" },
  { minPhon: 500,  baseLev: 25,  label: "Knight" },
  { minPhon: 0,    baseLev: 10,  label: "Citizen" },
] as const;

/**
 * PHON 베팅 시 절감되는 수수료 예시 계산 (표시용).
 * 실제 정산이 아니라 “이만큼 아낄 수 있어요” 마케팅 라벨용.
 */
export function previewSavingsPhon(betPhon: number): number {
  if (!Number.isFinite(betPhon) || betPhon <= 0) return 0;
  return Math.floor(betPhon * HOUSE_EDGE_DISCOUNT_RATE * 0.01); // 1% 베이스 에지 가정
}

/** 스테이킹 예상 일배당 PHON */
export function previewDailyYieldPhon(stakePhon: number): number {
  if (!Number.isFinite(stakePhon) || stakePhon <= 0) return 0;
  return Math.floor(stakePhon * PHON_STAKING_DAILY_YIELD_PREVIEW);
}
