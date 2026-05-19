# ApexForge Phase 2 — Games + Sportsbook + Community + Polish

기존 ApexForge 7-Tab Hybrid Overlay (`/apex/*`) 위에 **Stake.com 압살용 미니게임 5종 + Sportsbook(PHON+USDT) + Community + 최고급 시각/모션 폴리시**를 추가한다. 머니플로 8경로 git diff = 0, Phonara 기존 RPC 시그니처 변경 금지.

## 스택 제한 (엄수)
- Vite + React 18 + TS + Tailwind + shadcn/ui + Supabase only.
- Next.js / Nx / Rust / NestJS / Kafka / BullMQ 사용 금지.
- 신규 디자인 토큰 추가 금지 — 잠긴 `--apex-neon (#00FF9F)` / `--apex-magenta (#FF00FF)` / `--apex-black` 만 사용.
- Framer Motion은 페이지-레벨 lazy import 만 (App root MotionConfig 금지 — Layer 1 budget).

## 신규/확장 라우트

| 탭 | 라우트 | 핵심 |
|---|---|---|
| Games Hub | `/apex/games` | 5게임 카드 그리드 + LIVE multiplier 미리보기 |
| Dice | `/apex/games/dice` | Over/Under 슬라이더, 1.01x~9900x, **HE 1%** |
| Crash | `/apex/games/crash` | canvas 곡선 + auto-cashout, mock 1Hz tick, **HE 1%** |
| Plinko | `/apex/games/plinko` | 16-row, 3 risk tiers, canvas ball drop, **HE 1%** |
| Mines | `/apex/games/mines` | 5×5, 1~24 mines, multiplier preview, **HE 1%** |
| Slots Lite | `/apex/games/slots` | 3-reel mock, **HE 3%** (기존 `/casino/*` 풀 슬롯은 무변경) |
| Sportsbook | `/apex/sportsbook` | mock live odds, **PHON + USDT 베팅** 동시 지원 |
| Community | `/apex/community` | 글로벌 채팅(`chat_messages` 재사용) + 빅윈 피드 + 친구 추천 카드 |

ApexShell 하단탭: **7 → 9탭**. 모바일은 5 visible + "More" bottom sheet 그룹화.

## House Edge (Stake.com 동일)
서버 RPC `apex_play_mock_game` 내부 RNG 결과를 multiplier 분포에 매핑할 때 정확히 다음 RTP 적용:
- Dice / Crash / Plinko / Mines: **RTP 99.0% (HE 1%)**
- Slots Lite: **RTP 97.0% (HE 3%)**
- Sportsbook: mock odds 자체에 vig 4.5% 내장 (실제 정산은 즉시 무작위 mock, USDT는 mock 잔액에서 차감)

`docs/apex/house-edge.md` 에 게임별 공식·시뮬레이션 결과 문서화.

## 시각/모션 폴리시
- `<ApexBackdrop />` — 풀스크린 canvas 파티클 (60fps cap, `requestAnimationFrame` + visibilitychange pause). ApexShell 에만 마운트.
- `<ParticleBurst />` — 승리 시 canvas-confetti(lazy) + 1.2s 광채 링.
- `<NeonButton />` — `apex-pulse` + `apex-glow-neon` + hover magenta gradient sweep.
- `<GlowCard />` — `apex-glass` + 1px animated conic-gradient border (6s).
- 토스트: `notify.win()` 헬퍼 신설 (`@/lib/notify` 4-tier 룰 준수, sonner 직접 호출 금지).

## 데이터 변경 (마이그레이션 1건)

```text
apex_game_rolls(
  id uuid pk, user_id uuid not null,
  game_code text,           -- dice|crash|plinko|mines|slots_lite|sportsbook
  bet_phon numeric default 0, bet_usdt numeric default 0,
  payout_phon numeric default 0, payout_usdt numeric default 0,
  multiplier numeric,
  server_seed_hash text, client_seed text, nonce bigint,
  result_json jsonb, created_at timestamptz default now()
)
-- RLS: 본인 SELECT only, INSERT/UPDATE는 RPC(SECURITY DEFINER)만
-- USDT mock 잔액은 신규 apex_usdt_mock_balances(user_id pk, balance numeric) — 출금 경로 없음
```

신규 RPC (정확히 2개):
- `apex_play_mock_game(game_code text, bet_phon numeric, bet_usdt numeric, params jsonb) returns jsonb` — `phon_balances` / `apex_usdt_mock_balances` 차감 → RNG → payout 지급 → roll INSERT. Idempotency key, 일 50회 cap, 출금 화이트리스트 미등록 (KILLABLE 'apex_games' 카테고리).
- `get_apex_recent_rolls(_limit int) returns setof ...` — Community 빅윈 피드, 공개.

## 구현 위치 (정확히 이 구조)
```
src/packages/apex/
  games/
    DiceGame.tsx, CrashGame.tsx, PlinkoGame.tsx, MinesGame.tsx, SlotsLiteGame.tsx
    useApexGame.ts           -- RPC 래퍼 + optimistic PHON & USDT 잔액
    ProvablyFairBadge.tsx    -- @pkg/games/core/pf 재사용
  components/
    ApexBackdrop.tsx, ParticleBurst.tsx, NeonButton.tsx, GlowCard.tsx
src/pages/apex/
  Games.tsx, Sportsbook.tsx, Community.tsx
  games/{Dice,Crash,Plinko,Mines,Slots}.tsx
```
`src/App.tsx` 에 lazy 라우트 8개 추가. `ApexShell.tsx` TABS 확장 + "More" sheet.

## QA 게이트 (배포 전 필수)
1. `scripts/check-money-flow-freeze.mjs` — 8경로 git diff = 0.
2. `scripts/check-operator-isolation.mjs` — apex 청크 ↔ admin 청크 완전 분리.
3. `scripts/bundle-budget.mjs` — `/apex/*` 각 페이지 ≤ 90KB gz.
4. Phonara 기존 페이지 스모크 (Dashboard / Wallet / Casino / Duel) 정상.
5. `apex_play_mock_game` 5만 spin Monte-Carlo → 실측 RTP가 목표 ±0.3%p 이내.

## 비범위 (안 함)
실 Solana cNFT, Rust gRPC, Three.js, 신규 출금 경로, Phonara 기존 RPC 시그니처 변경, Imperial Duel / Casino slots 본문 수정, MotionConfig 글로벌 도입, 신규 디자인 토큰.
단, git diff=0 / money-flow 안전 / 토큰 무변경을 모두 만족하는 UX·성능·접근성 미세 개선은 Lovable 판단 하 적용.

## 작업 순서
1. DB 마이그레이션 (`apex_game_rolls` + `apex_usdt_mock_balances` + 2 RPC + RLS).
2. `@pkg/apex/games` 5종 + `useApexGame` + `ProvablyFairBadge` (HE 정확).
3. `/apex/games` 허브 + 5 게임 페이지 + `Sportsbook.tsx` + 라우트.
4. `Community.tsx` (글로벌 채팅 + 빅윈 피드 + 추천 카드).
5. `ApexBackdrop` + `ParticleBurst` + `NeonButton` + `GlowCard`.
6. ApexShell 9-tab + "More" bottom sheet.
7. QA 5종 통과 확인 + `docs/apex/house-edge.md`.
