# ApexForge Phase 3 — 끝판왕 마스터 플랜

승인된 6개 슬라이스(P3-A~F)를 순서대로 실행. 가드레일(머니플로 8경로 git diff=0, House Edge 0 터치, Layer 1 gz ≤180KB, operator 격리, notify 4-tier, use*Channel) Phase 3 내내 유지. 모든 신규 코드는 `@pkg/apex/*` 또는 `supabase/functions/apex-*`.

이번 턴은 **P3-A Live Crash V2** 압살 완성에 집중. P3-B~F는 본 문서 하단에 시퀀스/스코프만 동결, 각 슬라이스 시작 시 별도 plan으로 상세화.

---

## P3-A — Live Crash V2 (이번 턴)

### 목표
- 서버 권위 100ms tick 멀티플라이어 + WebSocket fan-out
- Provably-Fair v2: Ed25519 서명 + 공개 검증 페이지(`/apex/verify/:roundId`)
- tick jitter p99 < 50ms, 동시 5k 사용자
- 기존 `apex_play_mock_game` 머니 경로 0 터치 (베팅/정산 RPC 비변경)

### 구성요소

**DB (migration)**
- `apex_crash_rounds`: id / round_no / server_seed (hash 공개, reveal 후 평문) / server_seed_hash / public_seed / nonce / crash_x numeric(10,4) / started_at / busted_at / status('pending'|'running'|'busted'|'revealed') / ed25519_pubkey_id / ed25519_signature
- `apex_crash_bets`: round_id / user_id / stake_phon / auto_cashout_x / cashout_x / payout_phon / status / idempotency_key UNIQUE(user_id, idempotency_key)
- `apex_signing_keys`: id / alg('Ed25519') / public_key_b64 / created_at / rotated_at (서명 키 회전 추적)
- RLS: rounds SELECT=public, bets SELECT=self+admin
- RPC `apex_crash_place_bet(round_id, stake, auto_cashout, idem_key)` → 라운드 status='pending'만 허용, FOR UPDATE
- RPC `apex_crash_cashout(round_id, idem_key)` → 현재 tick × stake로 정산 (server-side)
- RPC `apex_crash_get_round(round_no)` → 라운드 + 평문 server_seed (status='revealed'일 때만)

**Edge functions (`supabase/functions/apex-crash-*`)**
- `apex-crash-engine` (Deno, persistent loop): 100ms `setInterval`로 멀티플라이어 진화 `m(t)=1.0024^(t/100ms)`, crash point는 `crash_x = max(1.00, 0.99 / U)` (U=hash(server_seed||public_seed||nonce)→[0,1]). Realtime broadcast on `market:apex_crash` 채널. round 종료 시 Ed25519 서명 후 DB write + reveal.
- `apex-crash-verify` (POST roundId): Ed25519 서명 검증 + crash_x 재계산. 공개 응답 JSON.
- `_shared/ed25519.ts`: WebCrypto SubtleCrypto 기반 sign/verify (Ed25519 = `Ed25519` 알고리즘 표준).

**Frontend (`@pkg/apex/*`)**
- `@pkg/apex/crash/useCrashTick.ts`: `useMarketChannel('apex_crash')` 구독 → tick state, RTT 측정.
- `@pkg/apex/crash/LiveCrashV2.tsx`: 기존 CrashGame 비침습. HybridRenderer로 곡선 렌더(WebGPU→WASM→CPU). Auto-cashout UI, 라이브 betters 리스트.
- `src/pages/apex/Verify.tsx` (라우트 `/apex/verify/:roundId`): seed reveal + Ed25519 서명 + 시드→crash_x 재계산을 브라우저에서 그대로 표시.

**Telemetry**
- Engine이 매 tick `imperial_log_observability(kind='apex_crash_tick', latency_ms)` 1/50 샘플링.
- Health Dock Perf 탭에 "Crash V2 jitter p99" 카드 추가.

### 가드레일
- `apex_play_mock_game` / 머니플로 8경로: **수정 금지**. 새 RPC `apex_crash_place_bet` 는 별도 테이블 `apex_crash_bets`에만 기록.
- bet/cashout RPC는 모두 FOR UPDATE + idempotency_key UNIQUE.
- 음수 잔액 트리거 재사용 (`phon_balances` 차감은 기존 가드 통과).
- bundle: LiveCrashV2 chunk ≤ 80KB gz, Layer 1 영향 0 (lazy route).

### 검증 체크리스트
- 100ms tick × 60s × 5 클라이언트 부하 시 jitter p99 < 50ms
- Ed25519 sign/verify round-trip PASS (Deno + 브라우저 양쪽)
- `scripts/check-money-flow-freeze.mjs` 8/8 PASS
- `depcruise` apex-no-* 룰 PASS
- `reports/apex-p3a-crashv2.2026-05-20.json` 산출

### 산출물
- migration 1개 (apex_crash_*)
- edge functions 2개 (apex-crash-engine, apex-crash-verify) + `_shared/ed25519.ts`
- `@pkg/apex/crash/*` 3 파일 + `src/pages/apex/Verify.tsx` + route 등록
- house-edge.md §2.2 Crash V2 보강 + Provably-Fair v2 절 추가

---

## P3-B~F — 시퀀스 동결 (각 슬라이스 시작 시 상세 plan)

```text
P3-A  Live Crash V2          ← 이번 턴
 ↓
P3-B  Tier S 5게임 (Pump/Wheel/Limbo/Keno/HiLo)
 ↓
P3-F  Provably-Fair Verifier UI 고도화 (P3-A에서 MVP 후 분리)
 ↓
P3-D  Race & Rakeback (재무 cron)
 ↓
P3-C  Cross-Chain Cashout (보안 무게)
 ↓
P3-E  Apex Mobile Shell (Capacitor)
```

순서 근거:
- Verifier(F)는 Crash V2 서명 인프라 위에서 바로 확장 가능 → A 직후 배치
- Race/Rakeback(D)은 Tier S 게임 출시 후 베팅량 확보 시점에 효과 극대화
- Cross-Chain(C)은 가장 큰 컴플라이언스/감사 비용 → 별도 보안 sprint
- Mobile(E)은 모든 웹 슬라이스 안정화 후 래핑

---

## 보고 형식 (Phase 3 모든 슬라이스 공통)

```text
✅ P3-[X] [작업명] 지구상 1개뿐인 최고사양 완료
- 변경 파일 목록
- git diff 요약 (머니플로 diff=0 강조)
- 실측 지표 (FPS, latency, bundle, p95)
- 다음 슬라이스 계획
```
