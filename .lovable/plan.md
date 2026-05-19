# Phase 4 Slice 2 — Imperial Gold Empire 7-Game Suite 완성

Slice 1(Crash/Plinko/Roulette/Blackjack)에 이어 나머지 3종(Baccarat, Powerball, Wheel)을 완성하고, Crash 폴리시 + Casino 로비 + 통합 폴리시까지 한 번에 마감한다.

## 산출물

### 1. Baccarat 패키지 (`src/packages/games/baccarat/`)
- `types.ts`, `index.ts`
- `engine/baccaratEngine.ts` — 8덱 슈, third-card rule, pair/tie 보너스
- `store/useBaccaratStore.ts` — Zustand (베팅 P/B/T/Pair, 결과 히스토리, PF)
- `pf.ts` — PF v2 commit/reveal → shuffle seed
- `components/ImperialBaccaratTable.tsx` — Player/Banker slow reveal + squeeze tension (카드 1장씩 0.6s easeOutQuint, 마지막 카드 0.9s squeeze hold), 페어/타이 적중 시 gold halo
- `components/ImperialBaccaratBetPanel.tsx` — 4 zone(P/B/T/Pair) chip drop + 배당 표시

### 2. Powerball 패키지 (`src/packages/games/powerball/`)
- `types.ts`, `index.ts`
- `engine/powerballEngine.ts` — 6볼(1~45) + 1 powerball, 매치 카운트 → 배당 테이블
- `store/usePowerballStore.ts`, `pf.ts`
- `components/ImperialPowerballDrum.tsx` — 6볼 토네이도 추첨 캔버스(원형 궤도 회전 + 중력 drop 1볼씩), gold glow, 매치 시 펄스, 5+1 적중 시 massive win explosion(particle burst 256발 1회용)
- `components/ImperialPowerballBetPanel.tsx` — 6 + powerball 픽 그리드, Quick Pick

### 3. Wheel 패키지 (`src/packages/games/wheel/`)
- `types.ts` (risk: low/med/high, segments 10/20/30/50)
- `engine/wheelEngine.ts` — segment 분포 + easeOutQuart 회전(8~10초)
- `store/useWheelStore.ts`, `pf.ts`
- `components/ImperialWheelCanvas.tsx` — 한바퀴+ 슬로우 정지 티커, near-miss(±1 segment) 인덱스 골드 강조, 정지 시 폭발 입자
- `components/ImperialWheelBetPanel.tsx` — risk/segments 선택 + 배당 미리보기

### 4. Crash 폴리시 (`src/packages/games/crash/` 편집)
- `engine/crashEngine.ts` — `nearMissThreshold` hook 추가(목표 멀티 ±0.15x)
- `components/ImperialCanvas.tsx` — near-miss 진입 시 색온도 금→핫핑크 보간(150ms), 멀티플라이어 광선 강화(8→16 ray, additive blend), particle burst 추가
- `components/ImperialBetPanel.tsx` — 캐시아웃 클릭 시 글로벌 0.15s 슬로우모션(timeScale 0.4 → 1.0 easeOutCubic, store 전역 1회용)

### 5. Casino 로비 카드 (`src/pages/Casino.tsx` 편집 또는 신규)
- 7개 게임 카드(Crash/Plinko/Roulette/Blackjack/Baccarat/Powerball/Wheel) + "Imperial" 배지(gold gradient pill) + 진입 CTA → `/games/<g>/imperial`
- ImperialCard 시스템 재사용(`imperial-card`, `imperial-pulse-dot`)

### 6. 라우트 등록 (`src/App.tsx` 편집)
- 3개 lazy route 추가: `/games/baccarat/imperial`, `/games/powerball/imperial`, `/games/wheel/imperial`

### 7. Shared Core 보강 (필요시)
- `useSlowMotion.ts` — 캐시아웃 0.15s timeScale hook (Crash + Wheel 공용)
- `useExplosionBurst.ts` — 256-pool 1회용 폭발 입자 (Powerball + Wheel 공용)
- `ImperialBigWinOverlay.tsx` — massive win 시 전면 골드 광선 오버레이 (Powerball/Baccarat 공용)

## 기술 원칙

- **Stack**: Canvas 2D + Framer Motion + Zustand + Zod. WebGL/Three.js 금지.
- **Perf**: 모든 캔버스 60fps locked, `useViewportPause`, `prefers-reduced-motion`, DPR cap 2, object pool 64~128, GC-free.
- **Money flow**: 8경로 git diff = 0. 전 게임 데모 잔액 + PF v2 commit/reveal **만** 실호출.
- **Realtime**: 게임 채널은 `useGameChannel`만 사용.
- **A11y**: 모든 게임 reduced-motion 폴백, ARIA live region(win 발표), 키보드 베팅.
- **Design tokens**: Slice 1 `theme.ts` 재사용. 색상 직접 사용 금지.

## 작업 순서

1. Shared Core 3개 hook/컴포넌트 추가
2. Baccarat 전체 패키지
3. Powerball 전체 패키지
4. Wheel 전체 패키지
5. Crash 폴리시 편집
6. 라우트 + Casino 로비
7. 통합 폴리시 패스(haptic, reduced-motion, 토스트 톤)
8. 머지 게이트: build green, 7 route 60fps, money flow git diff=0, 청크 ≤60KB gz

## 비범위

- 신규 머니 RPC / 신규 테이블
- WebGL/Three.js
- 실시간 멀티플레이어 동기화
- 결제/입출금 변경
