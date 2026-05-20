# Realtime / Cache Stabilization (P0-5)

머니플로 8경로 무영향. realtime 구독·SWR 캐시 안정화 레이어.

## 1. Realtime 채널 라이프사이클

### Teardown grace (50ms)
- 마지막 consumer가 detach 해도 즉시 `removeChannel` 하지 않고 50ms 대기.
- 라우트 바운스 / React StrictMode 더블 마운트가 그 안에 새 consumer 를 붙이면 채널 유지.
- 그렇지 않으면 정상 제거.

### Idle visibility pause (5분)
- `document.visibilityState === "hidden"` 가 5분 누적 지속 시 채널을 `idle-paused` 로 전환 + `removeChannel`.
- Listener 는 메모리 유지 — 가시 복귀 시 `bindAndSubscribe` 로 자동 재구독.
- 백그라운드 탭의 불필요 fan-out 제거.

### 자동 재연결 + 통계
- `CHANNEL_ERROR | TIMED_OUT | CLOSED` → 지수 백오프(최대 30s) 재시도.
- 매 재시도가 `totalReconnects` 카운터에 누적되어 admin Card 에서 가시화.

## 2. Region Silent Failover

`@pkg/realtime/regions.ts` 의 `failoverNext()`:
- 순서: `ap → us → eu → ap`.
- 30s cooldown — 동일 region 폭주 회전 방지.
- 호출 시 `setRegion()` → 신규 채널부터 새 prefix 사용. 기존 채널은 자연 정리.

`@pkg/realtime/index.ts` 의 `withFailover` 데코레이터:
- 4 wrapper (`useWalletChannel` / `useGameChannel` / `useChatChannel` / `useMarketChannel`) 모두에 자동 적용.
- onStatus 가 `down` 5연속 시 자동 `failoverNext()` 호출. `live` 1회 도달 시 카운터 리셋.

## 3. SWR Cache (`@pkg/core/swr.ts`)

| 옵션 | 기본값 | 효과 |
|------|--------|------|
| `ttl` | 60s | fresh 윈도우 |
| `swr` | 5min | stale 허용 윈도우 |
| `focusThrottle` | 30s | visibilitychange visible 시 마지막 fetch 후 30s 이내면 skip |
| `keepPrevious` | true | 백그라운드 refresh 동안 이전 데이터 유지 (UI flicker 0) |

- `INFLIGHT` 단일 비행 dedup — 같은 키 동시 fetch 최대 1.
- stale → fresh 전환은 INFLIGHT promise 를 직접 then 으로 받아 한 번에 setState. 800ms 폴 제거.
- `mutateSwr(key, value | (prev) => next)` — 옵티미스틱 캐시 갱신.

## 4. 관리자 가시화

`/admin/ops/region-health` 상단에 `<RealtimeStatusCard />` 마운트:
- 활성 채널 / idle paused 채널 / 누적 재구독 / 마지막 재구독 시각.
- 현재 region / failover 횟수 / 마지막 failover 시각.
- 15s 자동 갱신.

## 5. 가드레일

- money-flow 8경로 RPC (`request_withdrawal` / `apex_request_cashout` / `imperial_place_phon_bet` / `apex_place_bet_v2` / `_apply_house_edge_split` / `_settle` / `stake_phon` / `phon_swap_*`) 본문 무수정.
- realtime 진입점은 4-파티션 wrapper만 사용 (raw `supabase.channel` 금지 — ESLint enforced).
- `useWalletChannel` public API 시그니처 무변경. `swrFetch` / `useSwr` 시그니처 후방호환 (옵션 추가만).
