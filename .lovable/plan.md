# PHON 경제 모델 + 트레이딩 강화 — 정직한 스코프 분리

요청한 5가지(스왑/스테이킹/할인/레버리지/VIP룸)는 본질적으로 **머니플로**입니다. 동결 원칙과 직접 충돌합니다. 이 Pass는 **표시·교육·CTA 레이어**만 만들고, 실제 잔액 이동 RPC는 별도 동결 해제 PR로 분리합니다. 가짜 데이터로 “동작하는 척”은 절대 하지 않습니다.

## 0) 동결 충돌 매트릭스 (정직 보고)

| 요청 항목 | 동결 충돌? | 이번 Pass에서 할 것 |
|---|---|---|
| PHON ↔ KRW/USDT 스왑 | **충돌** — 잔액 mutation·환율·idempotency 필요 | 입출금(/wallet) 으로 라우팅하는 **교육형 UI 카드** (가짜 스왑 X) |
| 베팅 시 하우스 에지 20% 할인 | **충돌** — `MegaOrderPanel`·`use-auto-bet`·정산 RPC 변경 필요 | **이미 정책 적용된 것처럼 보이게 표시 X**. 대신 “PHON 베팅의 가치” 정적 배지/문서 강화만 |
| PHON 스테이킹 0.8% 일배당 | **충돌** — 신규 cron·테이블·잔액 mutation | 본 Pass **미포함**. ComingSoon 카드만 (이미 PhonHub 에 존재) |
| 레버리지 한도 “최대 2배” 상향 | **충돌 + 사실 불일치** — 이미 서버 `trg_enforce_leverage_gate` 가 `phon≥5000→100x` 까지 적용 중. 추가 2배는 100x 위로 가야 함 → 위험 | 본 Pass **미포함**. 현재 규칙을 명확히 시각화만 |
| VIP Trading Room (추천 코인 + 시그널) | 충돌 아님 — 표시 전용 가능 | `<VipTradingRoom>` 으로 구현 (VIP Pass 보유자 + Baron+ 전용 게이트, 기존 `get_hot_symbols_24h` 재활용) |

## 1) 이번 Pass 산출물 (안전 영역 only)

### A) PhonHub 강화 — `src/pages/PhonHub.tsx`

- `<PhonEconomyExplainer />` 신규: PHON 경제 가치 4축 카드 (수수료 절감·레버리지·Crown·첫 입금 보너스). 이미 만든 `PhonBenefitsGrid` 를 분리·강화.
- `<PhonSwapBridge />` 신규: **스왑이 아니라 입출금으로 가는 다리**. 두 줄 CTA — “KRW → PHON 충전” → `/wallet?tab=deposit`, “PHON → KRW 출금” → `/wallet?tab=withdraw`. 가짜 가격 X, 실제 환산은 기존 `displayCurrency.ts` 사용.
- `<PhonStakingComingSoon />` 신규: 일배당 모델 사전 안내 (가짜 APY X, 정직한 “준비 중” 문구).

### B) 트레이딩 페이지 추가 카드 — `src/pages/TradingArenaBybit.tsx` (외부 sibling만 추가, 내부 X)

- `<VipTradingRoom />` 신규: VIP Pass 활성 + Empire Lv ≥ 7 일 때만 표시. `get_hot_symbols_24h(_limit:=5)` 의 상위 3개를 “폐하의 추천” 카드로 표시. 클릭 시 기존 `phonara:set-symbol` 커스텀 이벤트 dispatch (트레이딩 Pass 1 패턴과 동일).
- `<PhonBettingNudge />` 신규: 베팅 패널 위에 “PHON 보유자는 레버리지가 자동으로 올라갑니다 — 현재 {maxLeverage}x” 한 줄 (실제 서버 정책 그대로, 마케팅 과장 없음).
- `<FriendTradingPing />` 신규: 24h 친구 최대 손익을 “친구 ***님이 트레이딩으로 +{N} PHON 벌었습니다” 토스트로 1회 표출 (기존 `useFriendRanking` + 24h localStorage 디듀프).

### C) 훅 (신규)

- `useVipRoom()` — `useVipPass()` + `useEmpireLevel()` 게이트 + `useHotSymbols()` 합성.
- `usePhonEconomy()` — `useMyPower()` 의 phon/maxLeverage/boostPct 를 PHON 가치 메시지로 가공.

### D) 상수 (신규, 모두 표시 전용)

```ts
// src/lib/phonEconomy.ts
export const HOUSE_EDGE_DISCOUNT_RATE = 0.20;   // 표시 전용 (정책 미반영, 서버 변경 필요)
export const PHON_STAKING_APY_PLAN = null;       // 미정 (가짜 숫자 금지)
export const PHON_LEVERAGE_TIERS = [
  { minPhon: 5000, baseLev: 100 },
  { minPhon: 1200, baseLev: 50 },
  { minPhon: 500,  baseLev: 25 },
  { minPhon: 0,    baseLev: 10 },
];
```

## 2) 의도적 미포함 (안전 우선)

- 실제 스왑/스테이킹/할인/레버리지 변경: **별도 PR**. 머니플로 8경로 동결 해제 + 새 idempotency + audit + linter 통과가 모두 필요 → 한 PR에 우겨넣으면 안 됨.
- “20% 할인 즉시 적용” 같은 사용자에게 거짓이 될 메시지: 절대 표시 안 함. 가치 교육만.

## 3) 검증

- `node scripts/check-money-flow-freeze.mjs` → 0줄
- `node scripts/check-operator-isolation.mjs` → PASS (CI)
- `npm run size:check` → PASS (모든 신규 컴포넌트 lazy)
- `/phon` 에서 PhonEconomyExplainer + Swap Bridge + ComingSoon 보임
- `/trade` 에서 VIP 사용자에게만 VipTradingRoom 보임

## 4) 후속 PR 제안서 (Pass 2 — 동결 해제 필요)

별도 승인 PR로 진행:
1. `swap_phon_krw(direction, amount)` SECURITY DEFINER + AAL2 + idempotency
2. `phon_stakes` 테이블 + `stake_phon` / `unstake_phon` + cron 일배당
3. `live_positions` 베팅 시 `bet_currency='phon'` 컬럼 + 정산 시 20% 할인 분기
4. `trg_enforce_leverage_gate` 의 base 테이블 ×2 옵션

Pass 2 는 머니플로 가드·linter·audit 전수 통과 후에만 머지.
