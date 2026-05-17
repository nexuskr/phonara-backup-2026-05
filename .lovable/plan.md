# Phase C — PhonHub v3 (스테이킹·배당·레버리지·스왑 중앙 허브)

`/phon` 라우트는 이미 존재(`src/pages/PhonHub.tsx`)하고 Bottom Nav FAB이 거기 연결되어 있습니다. Phase C 에서는 한 번의 RPC 호출로 모든 핵심 지표를 가져오는 `phon_hub_summary` 를 추가하고, 신규 `src/components/phonhub/v3/` 6종 컴포넌트로 허브 화면을 재구성합니다. 모든 신규 import 는 lazy.

## 1. DB — `phon_hub_summary` RPC

읽기 전용 SECURITY DEFINER 함수 1개. 한 번 호출로 허브 전체 지표를 JSON 으로 반환.

반환 컬럼:
- `phon_balance numeric` — `phon_balances.balance`
- `active_stake_total numeric` — `sum(amount) where status='active'`
- `today_yield numeric` — `sum(yield_phon) where settled_for_date = current_date (KST)`
- `lifetime_yield numeric` — `sum(yield_phon)` 전체
- `next_yield_at timestamptz` — 다음 cron 00:10 KST 추정값
- `leverage_max int` — `get_my_max_leverage()` 재사용
- `boost_pct int` — `get_my_total_boost_pct()` 재사용
- `swap_used_today numeric` / `swap_daily_cap numeric` — `swap_phon_krw` 일일 한도 추적 (`phon_transactions` kind='swap_out' 합산, cap=5_000_000)
- `lifetime_burn numeric` — 누적 소각량 (`phon_transactions` kind='burn' 합산)
- `phon_level_label text` / `phon_level_progress_pct int` — `get_my_phon_level()` 재사용

권한: `authenticated` GRANT EXECUTE, internal `auth.uid()` 가드, `function_permissions_baseline` 등록.

## 2. Frontend — `src/components/phonhub/v3/` (전부 lazy)

| 파일 | 역할 |
|---|---|
| `PhonHubDashboard.tsx` | 메인 컨테이너 — `usePhonHubSummary` 훅 + 12s SWR + 골드 그라디언트 hero |
| `StakingQuickPanel.tsx` | 활성 스테이킹 총량 + 오늘 배당 + 다음 정산 카운트다운 + Stake CTA |
| `LeverageBonusMeter.tsx` | 현재 maxLeverage + boost_pct 진행 바 + 다음 티어까지 PHON 표시 |
| `SwapBridgeMini.tsx` | 오늘 스왑 사용량/한도 게이지 + Swap CTA (`PhonSwapDialog` 재사용) |
| `DailyDividendCounter.tsx` | 오늘 / 누적 배당 + 누적 소각 카운터 (framer-motion 카운트업) |
| `PHONValueProjection.tsx` | 향후 30/90일 예상 배당 + 누적 소각 차트 (recharts lazy, 모바일 friendly) |

훅: `src/hooks/use-phon-hub-summary.ts` — `supabase.rpc("phon_hub_summary")` + 12s polling + `useWalletChannel("phon-hub", "phon_balances|phon_stakes")` 로 즉시 갱신.

## 3. `/phon` 라우트 교체

`src/pages/PhonHub.tsx` 의 기존 `PhonHero`/`NextTierProgress` 블록을 새 `<PhonHubDashboard />` 한 줄로 교체. 하단의 `<EmpireCollection />`/`<PhonEconomyExplainer />`/`<PhonStakingPanel />` 는 그대로 lazy 유지. Bottom Nav 변경 없음 (이미 `/phon` FAB).

## 4. Warm King 카피 (예시)

- "👑 폐하의 PHON 제국이 매일 자라고 있습니다"
- "오늘 {N} PHON 배당 지급 완료 — 내일 00:10에 다시 만나요"
- "지금 스테이킹하면 내일부터 매일 배당이 입금됩니다"
- "레버리지 {N}x — {phon_to_next} PHON 더 모으면 한 단계 올라갑니다"
- "오늘 스왑 한도 {used}/{cap} PHON 사용 중"

골드 그라디언트(`bg-gradient-imperial` / `text-gradient-imperial`), `<CrownAura>` 펄스, framer-motion 카운트업, 카드 hover shimmer. Particle 효과는 가벼운 CSS 펄스로 대체(번들 증가 0).

## 5. 메모 등재

- `mem://features/phonhub-v3` 신규 — RPC 컬럼, 컴포넌트 6종 위치, 훅 + 폴링 정책 기록
- `mem://index.md` 한 줄 추가

## 무손상 보장

- **money-flow 8경로**: 0줄 변경 (RPC 신설은 read-only, kernel/withdraw/deposit 미접근)
- **Operator Isolation**: admin 코드 무관
- **Bundle Budget**: 7개 신규 lazy 청크 → entry HTML preload 영향 0, recharts 는 `PHONValueProjection` 내에서만 lazy import
- **Realtime Partition**: `useWalletChannel` 만 사용 — raw `supabase.channel` 0건
- **Active Governor**: read-only 라 kill switch 가드 불필요

## 검증

- `node scripts/check-money-flow-freeze.mjs` PASS
- `node scripts/check-operator-isolation.mjs` PASS
- `npm run size:check` PASS
- `/phon` 진입 시 single RPC + 12s 갱신 + 스테이크 변동 시 realtime 즉시 반영

## 변경 파일 요약

신규(8):
1. `supabase/migrations/<ts>_phon_hub_summary.sql`
2. `src/hooks/use-phon-hub-summary.ts`
3~8. `src/components/phonhub/v3/{PhonHubDashboard,StakingQuickPanel,LeverageBonusMeter,SwapBridgeMini,DailyDividendCounter,PHONValueProjection}.tsx`

수정(2):
- `src/pages/PhonHub.tsx` (hero/progress 블록 → `<PhonHubDashboard />` 교체)
- `mem://index.md`

메모 신규(1): `mem://features/phonhub-v3`
