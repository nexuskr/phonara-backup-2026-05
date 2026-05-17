# Slice 4 — Imperial Betting Experience Deep Rebuild

Stake.com을 완전히 압도하는 베팅 UX 심화 리빌드. UI/프레젠테이션 레이어만 변경하며, money-flow 8경로·RPC·Operator Isolation·Bundle Budget·Phase D·Phase F Push 인프라는 **0줄 변경**.

## Scope (무엇을 만드는가)

1. **Imperial Bet Slip** — 모바일 Bottom Sheet 베팅 패널 (트레이딩 + 슬롯 공용 프리미티브)
2. **Imperial Cash Out** — 실시간 청산 패널 (트레이딩 포지션 / Crash 등)
3. **Imperial Auto Bet** — 3-프리셋 자동 정복 + Stop Conditions
4. **Imperial Bet History + Replay** — 황제의 전투 기록 + 학습 + 입금 CTA
5. **Imperial Provably Fair** — 브랜딩 + Badge + 한글 검증 가이드

## 변경 파일 (frontend only)

**신규 컴포넌트** (src/components/empire/betting/)
```text
ImperialBetSlip.tsx            // 공용 Bottom Sheet, Quick Amount, Potential Win Glow
ImperialCashOutPanel.tsx       // 실시간 PnL + Partial Cash Out + 역전 입금 CTA
ImperialAutoBetPanel.tsx       // On Win/On Loss + 3 프리셋 + PHON 20% 할인 강조
ImperialBetHistoryList.tsx     // Won=Crown / Lost=Warm King 메시지 + 입금 CTA
ImperialReplayDialog.tsx       // "전투 재생" Wrapper + 학습 인사이트
ProvablyFairBadge.tsx          // 공용 Badge (Bet Slip · History 둘 다)
ProvablyFairGuide.tsx          // 한글 검증 가이드 시트
imperialCopy.ts                // 황제 카피·프리셋 상수
```

**기존 파일 교체/리프트** (presentation 만)
```text
src/components/trading/v3/PhonOrderPanel.tsx        → ImperialBetSlip 채용
src/components/trading/v3/PhonOrderConfirmSheet.tsx → Imperial Potential Win Glow
src/components/dashboard/DashboardBetPanel.tsx      → Quick Amount + Imperial 카피
src/components/slots/AutoSpinControls.tsx           → ImperialAutoBetPanel 채용
src/components/slots/SpinHistorySheet.tsx           → ImperialBetHistoryList + Badge + Guide 링크
src/components/trading/LiquidationReplayModal.tsx   → ImperialReplayDialog 래핑
src/pages/CrashHistory.tsx                          → 같은 History 리스트 채용
```

**route 추가**: `/fairness` — ProvablyFairGuide 풀페이지 (App.tsx route 1줄).

## Behavior 디테일

**Bet Slip**
- Quick Amount: `5,000 무료 / 10,000 / 50,000 / 역전 15,000 / 전액`
- Potential Win = `bg-gradient-to-r from-amber-300 to-pink-500` + `pulse-halo`
- 헤더 카피: "폐하, 이 베팅으로 제국을 확장하시겠습니까?"
- 확인 버튼 56px+ Thumb Zone, framer-motion spring (기존 PhonOrderConfirmSheet 패턴 재사용).

**Cash Out**
- 실시간 PnL tick (기존 `use-my-phon-open-positions` 그대로).
- Slider 25/50/75/100% Partial.
- liq 근접(<5%) → `notify.warning` + "역전 입금" CTA → `/wallet?from=cashout_save`.

**Auto Bet**
- 3 프리셋: 안전한 확장(2x/-50%/3승), 영광의 역전(1.5x/-30%/5승), 황제의 광기(2.5x/0%/제한없음).
- PHON 모드 시 상단에 "수수료 20% 자동 할인" Ribbon.
- `use-auto-bet` 훅 그대로 사용. UI만 교체.

**History + Replay**
- 행 단위: Won → Crown 아이콘 + gold gradient row + confetti(이미 있는 canvas-confetti lazy).
- Lost → "다음 전투에서 승리하실 겁니다, 폐하" + 작은 "역전 입금" 버튼.
- 각 행 Replay 버튼 → ImperialReplayDialog (트레이딩=LiquidationReplay 재사용, 슬롯=Spin 결과 캔버스 재생).

**Provably Fair**
- Badge: `<ProvablyFairBadge size="sm|md">` → Bet Slip 우상단 + History 헤더.
- 검증 시트: 기존 `verifySpin` (src/lib/slots/fairness.ts) 그대로 호출.
- Guide: 4-step 한글 카드(커밋·시드 공개·재해싱·결과) + Client Seed 변경 폼(slots 게임 옵션).

## 비기능 가드

- `@/lib/notify` 만 사용 (sonner 직접 호출 금지).
- 디자인 토큰만(`text-amber-300` 등 기존 imperial 토큰), 새 hex 금지.
- Realtime은 `@pkg/realtime` 4-파티션 래퍼만 (Cash Out tick는 기존 훅 사용 → wallet 채널 그대로).
- ImperialReplayDialog는 lazy import → 번들 예산 영향 0.
- money-flow 파일(`request_withdrawal`, `credit_crypto_deposit`, position open/close RPC 호출부)은 grep 가드: 변경 없음.
- 군사/전쟁 어휘 모두 "전투/정복/제국"의 Warm King 톤으로만 (기존 carryover 단어 제거).

## 작업 순서

1. 공용 프리미티브 4종 신규 작성(BetSlip / CashOutPanel / AutoBetPanel / ProvablyFairBadge·Guide).
2. 트레이딩 측 채용: PhonOrderPanel / Confirm / DashboardBetPanel.
3. 슬롯 측 채용: AutoSpinControls / SpinHistorySheet.
4. History·Replay 통합: ImperialBetHistoryList + ImperialReplayDialog → CrashHistory, SpinHistorySheet, LiquidationReplayModal 래핑.
5. `/fairness` 라우트 + Bet Slip / History Badge 마운트.
6. 빌드 통과 + bundle-budget·operator-isolation·money-flow freeze 확인.

## 비범위 (이번에 안 함)

- 새 RPC / 마이그레이션 / Edge function.
- 결제·출금 로직 변경.
- 신규 게임 모드.
