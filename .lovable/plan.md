# Full System Consolidation — Phased Rebuild

목표: 134 페이지 / 585 컴포넌트 → **3 코어 플로우(HOME / PLAY / ARENA)** + 운영자(Operator) 격리. 단, **머니플로 8경로·@pkg/realtime·Empire/Crown 백엔드·AAL2** 는 절대 미터치(메모리 락).

현재 preview 는 radix `useMemo null` 런타임 에러로 죽음 → **Phase 0 에서 우선 복구** 후 Phase 1부터 합의 단위로 진행.

---

## Phase 0 — Preview 복구 (즉시, 본 턴)
- React duplicate instance 의심 (radix `AlertDialog` useScope null).
  - `package.json` 의존성 중복 / Vite optimizeDeps 캐시 / 최근 추가된 lazy 청크 검사.
  - dedupe 적용 + dev server restart.
- **삭제·재구성 없음.** 빨간 화면만 끈다.

## Phase 1 — Routing Single Source of Truth (다음 턴)
산출물: `src/routes.tsx` 1개 파일 + 결정 테이블.
- 134 페이지 → 3 그룹으로 라벨링 (HOME / PLAY / ARENA / OPERATOR / DEAD).
- 중복 라우트(`/avatar`, `/guild` 등) 제거.
- legacy `<Navigate>` 14+ 개 → 정식 308 redirect 맵으로 1 회 압축.
- DEAD 라우트는 **삭제 PR 별도** (Phase 4).

승인 게이트: "라우트 결정 테이블" 확인 후 진행.

## Phase 2 — Layout Single Mount
- App 루트에서 마운트되는 셸 (`SlimShell`, `MobileShell`, `PhonaraNav`, `PhonaraTopBar`, `MobileBottomNav`) 의 **상호 중첩 그래프** 1장.
- 규칙: 한 라우트당 1 셸. 페이지 내부 추가 `<Layout>` 금지.
- 위반 페이지 목록만 산출 → Phase 4 에서 일괄 수정.

## Phase 3 — Duplicate Feature Merge (V1/V2/V3)
대상(이미 식별):
- `AchievementsV3.tsx` ↔ 기존 achievements
- `CockpitV2.tsx` ↔ Dashboard
- `OlympusLegacy5000.tsx` ↔ `Olympus1000.tsx`
- `LiveBetFeed` 1.8s 폴링 → `useGameChannel` 실시간 전환

각 항목: "Keep 버전 + 삭제 버전 + import 차단 ESLint rule" 3 종 PR.

## Phase 4 — Dead Code 일괄 삭제
Phase 1~3 라벨링이 끝난 항목만 삭제. 머니플로/Operator/Realtime/RLS 가드:
- `scripts/check-money-flow-freeze.mjs` PASS 필수
- `scripts/check-operator-isolation.mjs` PASS 필수
- `scripts/check-no-crown-ui.mjs` PASS 필수
- bundle-budget CI green

대상 후보(확정 전):
- `phonara-unicorn/` 미배포 스캐폴드
- 미연결 페이지 (라우트 테이블 없음으로 판정된 것만)
- `e2e/07-a11y-smoke.spec.disabled.ts`

## Phase 5 — Performance
- `LiveBetFeed` realtime 화 (Phase 3 산출물)
- `Missions.tsx` 1069 LOC 분리 (4 컴포넌트)
- `Wallet.tsx` 739 LOC → `@pkg/wallet` 위임 (이미 부분 이주됨)

---

## 절대 금지 (메모리 락)
- 머니플로 8 RPC 본문 수정
- `@pkg/realtime` 4-파티션 우회 / `supabase.channel` 직접 호출
- Operator chunk 격리 우회
- Crown 백엔드 / Empire / Founding / Flywheel / AAL2 변경
- Supabase 예약 스키마(`auth/storage/realtime/...`) 터치

## 산출물 (Phase 종료 시)
1. 새 폴더 구조 다이어그램
2. 삭제 모듈 리스트 (파일 경로)
3. 머지된 기능 매핑 (from → to)
4. 라우팅 맵 (HOME/PLAY/ARENA/OPERATOR)
5. 번들 사이즈 before/after
6. 잔여 리스크

## 요청
이 플랜의 **Phase 0 (preview 복구) 만 본 턴에 실행** 후, Phase 1 의 "라우트 결정 테이블" 부터 다음 턴에 작성할지 확인 부탁드립니다. 한 턴에 134 페이지를 일괄 정리하면 머니플로 가드/실시간/Operator 격리 CI 가 깨질 확률이 매우 높아 단계 분할이 필요합니다.
