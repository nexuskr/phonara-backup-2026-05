# PR-P1-C — 성능 오버홀 + P2 UX 통합

P1-A/B 이후의 마무리 PR. 머니플로 8경로 / P0 인증·체결·슬롯 엔진 무변경.
범위가 큰 만큼 **"안전한 1차 패스"** 만 수행하고, 미완 항목은 출시 전 후속 PR로 명시한다.

---

## 1. 성능 오버홀 (Layer 1 우선)

이미 모든 라우트는 `lazy()` 처리되어 있음. 추가 작업:

- **App 루트에서 정적 import 되는 비-critical 컴포넌트 lazy 전환**
  - `AccountFrozenDialog`, `MaintenanceGate`, `DegradeModeBanner`, `DegradeModeBinder`,
    `DynamicIslandPill`, `ClientMetricsBinder`, `ReviewerMaskRoot`, `ReviewerBadge`,
    `MobileShell`, `StakeStyleSidebar` → `lazy()` + `<Suspense fallback={null}>`
  - 단, `ErrorBoundary` / `AuthErrorBoundary` / `BrowserRouter` / Toaster 는 유지 (critical)
- **Pretendard 폰트 async 로드**
  - `index.html` `<link rel="preload" as="font" crossorigin>` + `font-display: swap`
- **LCP preload**
  - Landing Hero 가 텍스트 기반이므로 이미지 preload는 생략. 대신 `index.html` `<meta name="theme-color">` + critical CSS 점검.
- **모바일 입력 최적화**
  - 전역 CSS `html { touch-action: manipulation; }` 추가
  - `visualViewport` resize listener 1개를 `MobileShell` 에 추가 → `--kb-inset` CSS var 갱신 → BottomNav `padding-bottom: var(--kb-inset)`
  - `safe-area-inset-bottom` 모든 fixed 하단 요소 (Nav/FAB) 에 fallback 적용 확인
- **TanStack Query staleTime 정리**
  - 전역 default 30s 유지. wallet/duel/live/trade 훅들은 이미 짧게 설정됨 — 변경 없음.
  - non-critical 정적 데이터 (legal_documents, world_domination_stats) 만 `staleTime: 5*60_000` 로 상향.

---

## 2. P2 UX 통합 (1차 패스, 머니플로 무변경)

### a. 잔액 한눈에 보기
- `<MultiCurrencyBalance />` 를 `PowerHeader` 우측에 inline 노출 (PHON / KRW / USDT 한 줄, 토글 가능).
- `/phon` 헤더 카드는 그대로 (이미 PhonHub v3).

### b. 등급 시스템 단일화
- 사용자 화면의 `tier` / `empire_level` / `vip` 3가지 라벨 → 표시 헬퍼 `src/lib/branding/tierLabel.ts` 신설.
- "VIP Level N" 단일 라벨로 통일. 내부 컬럼은 보존.

### c. PHON Collection 단일화
- `/achievements`, `/empire/collection`, `/profile` 의 배지·NFT 표시 → `<PhonCollectionPanel />` 한 컴포넌트로 묶고 각 페이지에서 재사용.
- 라우트는 유지 (`/empire/collection` = primary, 나머지는 임베드).

### d. 친구추천 UX
- `/referral` 상단: 1) 내 코드 큰 카피 버튼, 2) 카카오/링크 공유, 3) "지금까지 받은 PHON" 1줄. 그 외 카드 압축.

### e. 실시간 대결 즉시 인지 (50~70대)
- `<WhaleStrikeRail />` 카피 한국어화 + 폰트 크기 +2pt.
- `/dashboard` 5탭 카드의 "실시간 대결" 타일에 라이브 카운트 dot 추가.

### f. 패키지 중복 정리
- `/packages` 카드 3그룹 → 단일 grid + 추천 1장 highlight. (카드 컴포넌트만 압축, 가격/RPC 무변경)

### g. 슬롯 UI 정리
- `/casino` 로비 헤더 정리 + 로고 정렬. 슬롯 게임 내부 (`OlympusSlot` 등 8개)는 P0 보호 범위 → **변경 없음**.

### h. Admin IA 1인 운영 최적화
- `/admin` 사이드바 그룹화 (`_nav.ts`): 운영 / 자금 / 보안 / 데이터 / 시스템 4그룹으로 묶기. 라우트/AAL2 가드 무변경.

---

## 3. 작업 분할 — 본 PR은 **Slice 1만 수행**

| Slice | 내용 | 본 PR 포함 |
|---|---|---|
| 1 | 성능 오버홀 + 잔액(2a) + 등급(2b) + Admin IA(2h) | ✅ 포함 |
| 2 | PHON Collection(2c) + 친구추천(2d) + 패키지(2f) | 후속 PR |
| 3 | 실시간 대결 인지(2e) + 슬롯 로비 정리(2g) | 후속 PR |

후속 슬라이스는 각각 별도 PR 로 진행해 회귀 위험을 분산한다.

---

## 4. 절대 금지

- 머니플로 8경로 (`request_withdrawal` / `credit_crypto_deposit` / `imperial_place_phon_bet` / `_settle` / `_apply_house_edge_split` / 슬롯 스핀 RPC / `apply_token_burn` / 출금 OTP) 무변경.
- P0 슬롯 엔진 (`OlympusSlot` 등 8개 슬롯 파일) 무변경.
- 인증 / TOTP / OTP / 동결 / 베타 게이트 무변경.
- 신규 테이블/RPC/엣지 추가 금지 — 기존 자산 재배치만.

---

## 5. 검증

- `node scripts/check-no-crown-ui.mjs` → 0
- 머니플로 8경로 `git diff` → 0
- 빌드 통과 + 라우트 4개 (`/`, `/dashboard`, `/phon`, `/admin`) 수동 점검
- 모바일 viewport (390x844) 에서 BottomNav / FAB 키보드 가림 확인

---

## 6. 보고 (완료 시)

- lazy 처리 추가된 컴포넌트 목록
- LCP/FCP 변화 추정 (Layer 1 entry 감소량)
- Slice 1 UX 변경 요약
- 출시 전 남은 주요 항목 (Slice 2/3 + KYC / 점검 모드 / 푸시 가드)
