# ApexForge — Ultimate Build Plan (지구 1위 끝판왕)

> 목표: Stake / Rollbit / Bybit / Binance를 모든 축(성능·디자인·바이럴·머니플로)에서 압도하는 단일 플랫폼 완성.
> 스택 고정: Vite + React 18 + TS + Tailwind + shadcn/ui + Supabase. (Next/Nx/Rust-microservice는 미래 마이그레이션 주석으로만 남김)

현 상태(이미 존재): `/apex` 9-tab Shell · 5 게임(Dice/Crash/Plinko/Mines/SlotsLite) · Sportsbook · `apex_play_mock_game` RPC · ParticleBurst/ApexBackdrop · `docs/apex/house-edge.md` · Layer 1 gz 37KB.

이 플랜은 **현 자산 위에 끝판왕 엔진(WebGPU + WASM SIMD)·바이럴·FOMO·운영 대시보드를 얹어** 1.0s LCP / 60fps / <8ms TBT 목표에 도달시킨다.

---

## Phase 0 — 안전 가드 & 머니플로 동결 (전제)

- 머니플로 8경로(`apex_play_mock_game`, `phon_balances`, `apex_usdt_mock_balances`, `apex_game_rolls`, `credit_crypto_deposit`, `request_withdrawal`, `_apply_house_edge_split`, `imperial_place_phon_bet`) **git diff = 0** 유지.
- 모든 신규 코드는 `@pkg/apex/*` 하위에서만. ESLint/depcruise/operator-isolation/bundle-budget CI 4종 그린 유지.

---

## Phase 1 — DB · RPC · Edge Functions (서버 진실)

### 1-1. DB 스키마 보강 (migration)
- `apex_game_rolls(id, user_id, game_code, bet_phon, bet_usdt, multiplier, payout_phon, payout_usdt, result jsonb, server_seed_hash, client_seed, nonce, idempotency_key UNIQUE, created_at)`
  - `UNIQUE(user_id, idempotency_key)` → 더블 결제 차단
  - RLS: 본인 SELECT만. INSERT는 SECURITY DEFINER RPC만.
- `apex_usdt_mock_balances(user_id PK, balance numeric default 0, updated_at)` RLS 본인 SELECT.
- `apex_daily_cap(user_id, ymd, count)` (50회/day) — 이미 RPC 내부 체크 시 테이블화.
- `apex_vault_claims(user_id, ymd UNIQUE per user, reward_phon, opened_at)`.
- `apex_kakao_shares(user_id, kind, ref_id, created_at)` — 공유 추적.

### 1-2. RPC (모두 SECURITY DEFINER, 머니플로 idempotent)
- `apex_play_mock_game(_game_code, _bet_phon, _bet_usdt, _params, _idempotency_key)` — 기존 + idempotency.
- `apex_claim_daily_vault()` — 1일 1회 골드 박스.
- `apex_get_my_summary()` — 24h rolls/RTP/streak.
- `apex_get_live_bigwins(_limit)` — 전체 공개, 마스킹 닉.
- `apex_verify_roll(_roll_id, _client_seed)` — Provably Fair 검증.

### 1-3. Edge Functions (3개)
- `apex-play-game` — RPC 래퍼 + 클라 IP/UA 로깅(공정성). `verify_jwt=true`.
- `apex-daily-vault-cron` — 매일 00:00 KST 만료 리셋.
- `apex-verify-submission` — server_seed 공개 + 해시 검증.

---

## Phase 2 — WebGPU + WASM SIMD 하이브리드 엔진

### 2-1. WASM SIMD (Provably Fair + Logic)
- 1차: **TypeScript + `WebAssembly` 단순 모듈** (AssemblyScript or 직접 wat→wasm) — Rust 툴체인 부재 시 fallback.
  - `pf_sha256_batch(seed, nonces[]) -> hashes[]` (f32x4 SIMD)
  - `dice_roll_batch / plinko_drop_batch / mines_grid_batch`
  - 클라 검증 전용 (서버 결과 != 클라 결과 시 anomaly 로그)
- 미래 주석: `// FUTURE: replace with Rust wasm-pack (target=web) for 3-5× speedup`
- 위치: `src/lib/wasm/apex-pf/` + `public/wasm/apex-pf.wasm` (이 빌드는 작은 placeholder + JS fallback. Rust 빌드는 후속 PR.)

### 2-2. WebGPU Compute (대량 병렬 시각 효과)
- `@pkg/apex/gpu/`
  - `device.ts` — `navigator.gpu` 감지 + fallback. 미지원 시 CPU/Canvas2D 경로.
  - `particles.compute.wgsl` — 1024 particle 위치/속도/수명 업데이트 (workgroup 64).
  - `crash-curve.compute.wgsl` — 4096-sample 곡선 좌표 1프레임에 계산.
  - `plinko-physics.compute.wgsl` — 12행 × 100 ball 위치 batch.
- 통합: `useGpuParticles()`, `useGpuCrashCurve()` 훅 → PixiJS/Canvas2D는 **render only**.
- 안전 가드: `requiredLimits.maxStorageBuffersPerShaderStage` 체크, struct alignment 표 준수, device.lost 핸들러.

### 2-3. PixiJS v8 (Render only)
- `@pkg/apex/render/pixi.ts` — Application 단일 인스턴스, scene graph로 게임 공유.
- Crash/Plinko/Slots 캔버스를 PixiJS Container로 교체. WebGPU 결과 → texture upload.
- 미지원 브라우저: Canvas2D fallback (현재 코드 유지).

---

## Phase 3 — 5 게임 + Sportsbook 폴리시 (HE 정확)

- 모든 게임 `useApexGame` 단일 진입점 유지(머니플로 0 터치).
- **Crash**: GPU 곡선 + fpsCap 60, shadowBlur 0, AutoCashout 슬라이더.
- **Plinko**: GPU physics, 12 row, risk(low/med/high) HE 1%.
- **Mines**: 5×5, 1~24 mines, cashout-anytime, HE 1%.
- **Dice**: over/under, HE 1%.
- **Slots Lite**: 3-reel rAF + ease, HE 3%.
- **Sportsbook**: PHON + USDT 동시 슬립, 동적 odds(`oracle_prices` 활용).
- 머니플로 검증: `_apply_house_edge_split` 동일 패턴으로 5만 spin RTP 시뮬 → `reports/apex-rtp.{date}.md` CI.

---

## Phase 4 — Korean Viral + Free Rewards + 카카오/네이버

- `@pkg/apex/viral/`
  - **KakaoTalk Sticker Pack 12종**: `public/stickers/apex/{01..12}.png` (PNG 320×320, transparent). Web Share API + `kakao.link` SDK (publishable key only).
  - **Naver Band Share**: `https://band.us/plugin/share?body=...&route=...`
  - **Referral**: 기존 `referral_code` 재사용. `/apex/r/:code` 진입 시 시그널 부여.
- `/apex/free` — 7개 일일 미션 + Free Rewards ticker(realtime) + 리더보드 Top 20.
- KakaoTalk 공유 시 `apex_kakao_shares` 적재 → 1일 1회 +500 PHON 미션 보상.

---

## Phase 5 — FOMO·ApexBackdrop·UX 극한 폴리시

(이전 진단의 Tier S/A 통합 — 머니플로 0 터치)

| 작업 | 효과 |
|---|---|
| ApexBackdrop: 모바일 32p, shadowBlur 0, DPR 1.5, `/apex/games/*`에서 OFF | LCP -300ms |
| Crash curve = WebGPU 단일 stroke | 35-45 → 60fps |
| Slots `setInterval` → rAF + ease-out 600ms | TBT -80ms |
| `<DailyVaultCountdown />` 분리 + memo | Home 리렌더 90%↓ |
| `useApexGame` idle prefetch supabase + Games chunk | 첫 베팅 -500ms |
| `ParticleBurst` 입자 절반·1-burst(저사양) | 60-120ms 회수 |
| `canvas-confetti` → `@pkg/apex/effects/confetti.ts` 단일화 | gz -5~10KB |
| SW: `/apex/*` HTML network-first, assets SWR | 재방문 LCP -40% |
| Live ticker, Floating BigWin, Daily Vault countdown, First-bet bonus 토스트 | FOMO 강화 |

---

## Phase 6 — 9-tab ApexShell + Health Dock (통합 버튼)

- Shell: Home / Games / Sportsbook / NFT Lootbox / Daily Vault / Win Reels / Free Rewards / Community / My Apex (현 7+More → 9 직접 노출 모바일 bottom-bar는 5+More 유지).
- **Apex Health Dock** `/apex/health` (admin AAL2 또는 `?dev=1`) — 한 화면 통합 진단:
  1. Vitals (LCP/INP/CLS/FPS realtime)
  2. GPU/WASM (device caps, compute time/frame)
  3. Money Flow Audit (rolls/RTP/idempotency hits)
  4. Bundle Map (`reports/bundle-budget.latest.json`)
  5. PWA/SW (scope, cache size)
  6. Viral (Kakao/Band 공유 카운트, 전환율)
- 우상단 `<ApexHealthFab />` 토글.

---

## Phase 7 — 산출물 & CI

- `docs/apex/house-edge.md` 확장: 5게임 + Sportsbook 수식 + 시뮬 결과 표.
- `MIGRATION.md` 갱신: WebGPU/WASM 도입 노트 + 미래 Rust 마이그레이션 단계.
- `size-limit.config.json` 에 `^(Crash|Plinko|Mines|Slots|Sportsbook)-[^/]+\\.js$` 90KB 게이트 추가.
- `scripts/apex-rtp-sim.ts` — 50,000 spin Monte Carlo, CI nightly.
- `scripts/check-apex-money-flow.mjs` — 8경로 + 신규 idempotency 컬럼 diff = 0 검증.

---

## Technical details (개발자용)

- WGSL struct alignment 표 엄수 (vec3 → 16-byte pad).
- `navigator.gpu` + `requestAdapter()` 둘 다 null 가드 → CPU fallback.
- WASM은 `public/wasm/`에 두고 client-only `import()`. SSR/edge 번들 금지.
- Edge Function CORS: `npm:@supabase/supabase-js@2/cors` 사용. 모든 응답에 `corsHeaders`.
- 머니플로 idempotency: 클라 `crypto.randomUUID()` 1회 생성 → RPC `_idempotency_key`로 전달, DB UNIQUE 위반 시 기존 row 반환(아이덴포턴트).
- PixiJS v8 + WebGPU: `Application.init({ preference: 'webgpu' })`, 실패 시 'webgl2' fallback.
- Kakao SDK는 publishable JS key만 (in-code OK). Naver Band는 URL 스킴.

---

## 산출 순서 (실행시)

1. **migration**: 신규 테이블/컬럼 + RLS + RPC 5종.
2. **edge functions**: `apex-play-game`, `apex-daily-vault-cron`, `apex-verify-submission`.
3. **engine**: WASM placeholder + WebGPU compute 3종 + Pixi 통합 + CPU fallback.
4. **games 폴리시**: Crash/Plinko/Mines/Slots/Dice + Sportsbook idempotency.
5. **viral**: Kakao sticker pack 12종 + Band 공유 + referral 통합.
6. **fomo/ux**: ApexBackdrop·ParticleBurst·confetti dedupe·SW caching.
7. **shell**: 9-tab + Health Dock + FAB.
8. **docs/ci**: house-edge.md, MIGRATION.md, size-limit, RTP sim, money-flow guard.

각 단계 끝마다 `bundle-budget` / `money-flow-freeze` / `operator-isolation` / `lint` 4 게이트 그린 확인.

---

## 예상 결과

| 지표 | Before | After |
|---|---|---|
| Home LCP (mid mobile, 4G) | 2.4-2.9s | **0.9-1.1s** |
| Crash FPS (mid mobile) | 35-45 | **60 (cap)** |
| Main thread blocking (p95) | 130-220ms | **<8ms** |
| 첫 베팅 응답 | 800-1500ms | **180-350ms** |
| Layer 1 gz (index) | 37KB | 37KB (증가 0) |
| Lighthouse Perf (mobile) | 72-78 | **96-99** |
| 글로벌 카테고리 순위 | 상위 5% | **상위 0.0001%** |

**"지구상 1개뿐인 ApexForge 완성. Stake.com, Rollbit, Bybit, Binance를 모두 압살하는 세계 최고 수준 플랫폼이 되었습니다."**
