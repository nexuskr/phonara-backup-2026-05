# Imperial Ascension Loader — 황제의 입궁 로딩 화면

`/duel` 진입 직전에 1.9~2.3초간 재생되는 시네마틱 풀스크린 로딩. Home의 Imperial Duel 카드(`/duel` 링크)와 향후 중앙 FAB 모두에서 동일하게 트리거.

## 신규 컴포넌트

`src/packages/duel/components/loader/ImperialAscensionLoader.tsx`

Props:
- `open: boolean`
- `onDone: () => void` — 2.2s 후 자동 호출, 클릭 시 즉시 호출
- `target?: string` (기본 `/duel`) — 라우팅은 호출측 책임. 로더는 onDone만 발화

내부 구성 (모두 `pointer-events-none`, will-change: transform/opacity, transform·opacity만 사용):
1. **Backdrop** — `fixed inset-0 z-[100] bg-[#070302]` + 3단 radial gradient(Gold center → HotPink mid → WarmAmber edge), 0→1 opacity 280ms
2. **Divine Light Ray** — 세로 conic-gradient blade, scaleY 0→1 (0.6s, cubic-bezier(.2,.7,.2,1))
3. **Crown Core** — 거대 SVG (8각 별 + 왕관 + 중앙 P), 3-layer glow (gold inner / hotpink mid / amber outer), 회전 0→14deg & scale 0.6→1 spring(220/16), HotPink outer ring `divine-spin` 6s linear
4. **Imperial Seal Burst** — 0.9s 시점 scale 0→1.4→1, opacity flash, mix-blend-screen
5. **Crown Particle Ring** — 14개 mini-crown 이모지 SVG, 원형 배치, 4s 회전 + 개별 floatY 1.6s ease-in-out infinite
6. **Confetti Storm** — lazy `import("canvas-confetti")` (기존 청크 재사용), 0.5s 시점 ~150 particle Gold/HotPink/White 3-shot
7. **Title** — `황제의 대관전`, Cinzel(font-imperial), `clamp(2.8rem,9vw,5.2rem)`, tracking-[0.12em], multi-shadow gold+pink, fade+translateY 12→0 (0.8s in)
8. **Progress Ring** — SVG 160px, gold stroke 1.5 base + HotPink stroke sweep `stroke-dashoffset` 0→100 over 2.1s linear (CSS keyframe, no JS RAF)
9. **Subtitle** — `황실 입장 중…`, Pretendard SemiBold, warm gold, breathing opacity 0.6↔1 1.4s

타이밍 라인:
```text
0.00s  backdrop fade-in
0.10s  light ray scaleY
0.20s  crown enter (spring)
0.50s  confetti burst 1
0.90s  seal flash + confetti burst 2
1.40s  confetti burst 3
0.00s→2.10s  progress ring 0→100%
2.20s  onDone() — 자동 dismiss
```

전체 컨테이너 `onClick={onDone}` (cursor-pointer)로 즉시 스킵 허용. `prefers-reduced-motion` 시 confetti/회전 생략, opacity-only fade로 단순화.

## 트리거 통합

`src/pages/Home.tsx` Imperial Duel `<Link to="/duel">` 를 `<button>` + 로컬 state로 교체:
- 클릭 시 `setLoading(true)` → 로더 마운트
- `onDone` 콜백에서 `navigate("/duel")` 호출
- 키보드 접근성: `role="link"` + Enter/Space 핸들러
- 비주얼/카피/레이아웃은 100% 유지

`ImperialAscensionLoader`는 lazy import + `<Suspense fallback={null}>` 로 감싸 초기 청크에 영향 없음.

## 성능/번들

- framer-motion: 이미 사용 중 (추가 비용 0)
- canvas-confetti: 기존 lazy 청크 재사용 (DivineJackpotOverlay와 공유)
- 신규 청크 ~3KB br 예상, index 청크 영향 0
- 모든 애니메이션 transform/opacity only, GPU layer 강제 (`transform: translate3d(0,0,0)`)
- 60fps 검증: Chrome Perf 1프레임 budget <16ms

## 검증

- `npm run build` index ≤180KB br 유지
- 콘솔 에러 0
- money-flow diff 0 (UI 전용, 상태/RPC 미접촉)
- Desktop 1440 + Mobile 390 스크린샷
- `prefers-reduced-motion` 환경 확인

## 비포함 (다음 슬라이스)

- 중앙 BottomNav FAB의 `/duel` 신규 진입점 추가 (현재 명세는 로더 구현에 한정)
- 실잔액 입장료/AAL2 (Phase 3.5 Real Betting과 함께)
