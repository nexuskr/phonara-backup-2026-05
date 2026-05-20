# Phase 3 Final Push — P3-D Race · P3-C Cashout · P3-E Mobile · Closeout

P3-A(Live Crash V2), P3-B(Tier S 5종), P3-F(Verifier) 완료. 본 플랜은 남은 P3-D / P3-C / P3-E 를 한 턴에 마감하고 Phase 3 를 공식 종료한다. 머니플로 8경로 git diff = 0, House Edge §6 0 터치, Layer 1 gz ≤ 180KB 가드레일은 매 슬라이스 종료마다 재확인한다.

## 슬라이스 1 — P3-D Stake-Style Race & Rakeback

### DB / RPC
- `apex_races(id, kind 'daily'|'weekly', starts_at, ends_at, prize_pool_phon, status, settled_at)` — admin write, public read
- `apex_race_entries(race_id, user_id, wagered_phon, rank, prize_phon)` — owner read, server write
- `apex_rakeback_ledger(user_id, period 'daily'|'weekly', accrued_phon, paid_phon, period_end, paid_at)` — owner read
- `apex_get_current_races()` (public) — 진행중 race + my rank
- `apex_get_race_leaderboard(race_id, _limit)` (public, masked 닉)
- `apex_claim_rakeback()` (auth) — paid_phon 누적, paid_at 마킹 (idem per period)
- `apex_settle_race(race_id)` (internal, SECURITY DEFINER) — 기존 `phon_balances` UPDATE 경로 0 터치, 별도 `apex_race_payouts` append-only 테이블에 PHON credit 기록 후 기존 `imperial_log_observability` 호출만 함 → **머니플로 8경로 diff = 0** 유지

### Edge / Cron
- `supabase/functions/apex-race-settler/index.ts` — race ends_at 경과시 트리거(`pg_cron` 5분), 동적 rakeback (tier×wager 기반 0.1~5%) 일일 cron 00:10 KST
- `_shared/edge.ts` §7 추가: rakeback 동결표 (Bronze 0.1 / Silver 0.5 / Gold 1.5 / Platinum 3.0 / Diamond 5.0)

### Frontend (`@pkg/apex/race/`)
- `RaceLeaderboard.tsx` (lazy, useGameChannel realtime, 60fps virtualized)
- `RakebackCard.tsx` (claim CTA, IdempotentBetButton 패턴 재사용)
- `useApexRace.ts` / `useRakeback.ts`
- 라우트: `src/pages/apex/Race.tsx` lazy → `/apex/race`

## 슬라이스 2 — P3-C Cross-Chain Cashout

### DB / RPC
- `apex_withdraw_intents(id, user_id, network 'TRC20'|'ERC20'|'BSC', address, amount_usdt, fee_usdt, status, gas_subsidy_usdt, created_at, processed_at, tx_hash)` — owner read, server write
- `apex_withdraw_velocity_guards(user_id, window_start, count, total_usdt)` — internal
- `apex_request_cashout(network, address, amount_usdt)` (auth, AAL2 강제) — 기존 `request_withdrawal` 안 건드림. 신규 intent 큐만 채움
- `apex_admin_process_cashout(intent_id, tx_hash)` (admin, AAL2)
- `apex_get_my_cashouts(_limit)` (auth)

### Edge
- `supabase/functions/apex-withdraw-processor/index.ts` — 5분 cron, intent → network 자동 라우팅, gas 보조 계산, velocity 가드 (10분 3건 / 1시간 5건 초과 시 anomaly_events)
- 머니플로 8경로 (`useDeposit*`, `request_withdrawal` 등) **소스 무변경**

### Frontend (`@pkg/apex/withdraw/`)
- `CashoutPanel.tsx` (network 선택, address QR scan, fee preview)
- `CashoutHistory.tsx`
- `useApexCashout.ts`
- 라우트: `src/pages/apex/Cashout.tsx` lazy → `/apex/cashout`

## 슬라이스 3 — P3-E Apex Mobile Shell

### Capacitor 구성
- `capacitor.config.ts` 생성 (appId `app.lovable.c7a12cd613f64ce6bf31cc578b215a4b`, server.url = lovableproject 미리보기, hot reload 가능)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/push-notifications`, `@capacitor/preferences` 의존성 추가
- `src/packages/apex/mobile/`
  - `nativeBridge.ts` — 웹 fallback 안전(Capacitor 미탑재 시 graceful)
  - `pushBridge.ts` — 기존 `push_subscriptions` 테이블 재사용, FCM/APNS token 라우팅
  - `ColdStartBoost.tsx` — splash 페이드, App 루트 마운트

### PWA 강화
- `public/sw.js` precache 목록에 `/apex/*` 핵심 라우트 추가
- `public/manifest.webmanifest` `shortcuts` 에 Apex Race/Cashout 추가

### 사용자 가이드
- `docs/apex/mobile-shell.md` — git pull → `npm i` → `npx cap add ios/android` → `npm run build` → `npx cap sync` → `npx cap run` 절차

## 슬라이스 4 — Phase 3 Final Polish & 선언

- `src/pages/apex/Health.tsx` Perf 탭에 Race/Cashout/Mobile row 3개 추가 (lazy)
- `reports/apex-phase3-final.2026-05-20.json` 생성 (bundle 측정, FPS, cashout p95, race 정산 시간, money-flow 8/8 PASS)
- `docs/apex/phase3-complete.md` — 전체 KPI 달성 보고 + Phase 4 시드
- CI 재실행: bundle-budget / pr3-isolation / money-flow-freeze / depcruise / lint 6종 green 확인
- 최종 선언:

```
✅ Phase 3 완전 압살 종료. ApexForge 세계 1위 끝판왕 플랫폼 완성
```

## 가드레일 체크리스트 (매 슬라이스 종료시)

- [ ] 머니플로 8경로 git diff = 0 (`scripts/check-money-flow-freeze.mjs` PASS)
- [ ] `docs/apex/house-edge.md` §6 수식 0 터치
- [ ] Layer 1 gz ≤ 180KB (신규 라우트 모두 React.lazy)
- [ ] 게임/패널 chunk ≤ 80KB gz
- [ ] operator 격리 유지 (admin 코드 무변경, AAL2 게이트만 추가)
- [ ] notify 4-tier + use*Channel only
- [ ] 신규 코드 `@pkg/apex/*` 및 `supabase/functions/apex-*` 한정

## 실행 순서 & 보고

P3-D → P3-C → P3-E → Final Polish 순. 각 슬라이스 종료마다 변경 파일 / git diff 요약 / 실측 지표(chunk gz, FPS, p95, 정산 시간) 보고. 4 슬라이스 모두 종료 후 위 최종 선언 + Phase 4 마스터 플랜 시드 제시.
