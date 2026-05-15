# Cherry Sakura 500 — 7번째 Signature Slot 착수 계획

마지막 Signature Slot. Low volatility · MAX 500× · 한국 50–70대 친화적 따뜻한 사쿠라 테마.
기존 모든 추상화(SlotSignatureWrapper, useAnimatedCanvas, BasePaytableSheet, BaseMaxWinOverlay) 그대로 활용.

## 1. 신규 파일

### `src/components/slots/SakuraPetalCanvas.tsx`
- `useAnimatedCanvas` 사용, dpr=1, 60fps cap
- 레이어 (뒤→앞):
  - 원경 산 실루엣 + 사쿠라 나무 (정적, setup 시 1회 스탬프)
  - 부드러운 안개 띠 (sin 기반 느린 좌우 이동, alpha 0.05)
  - 중앙 lantern glow 펄스 (radial gradient, 2.4s breathe)
  - 벚꽃 petal 45개: 느린 낙화(vy 0.25–0.55) + 바람(sin 진동) + rotation drift, 색상 #fbcfe8/#fda4af/#fff1f5 mix
- prefers-reduced-motion: 정적 1프레임만 (drawStaticFn)

### `src/components/slots/SakuraPaytableSheet.tsx`
- `BasePaytableSheet` 사용, TitleIcon=`Flower2`
- 톤: Soft Pink (#fbcfe8) + Warm Gold (#fde68a) + Light Mint (#a7f3d0)
- 섹션:
  - 고배당: 🌸 Sakura Crown / 🏯 Pagoda / 🍶 Sake / 🎴 Hanafuda  (5x: ×100/×60/×40/×25)
  - 저배당: A/K/Q/J  (5x: ×15~×8)
  - 특수: WILD(🌸 Golden Sakura), SCATTER(🏮 Lantern)
  - 잭팟: MAX ×500 도달 시 "벚꽃의 축복" cinematic
  - footer: "Low volatility · 안정적 · RTP 96.5% — 천천히 즐기세요"

### `src/components/celebration/SakuraMaxWinOverlay.tsx`
- `BaseMaxWinOverlay` 사용
- palette: warm pink radial backdrop / soft gold ↔ pink flares / shockwave 미사용 (우아하게)
- triggerAt=500, durationMs=3400, titleDelayMs=250
- titleText="벚꽃의 축복" (한국 유저 우선)
- icon: 인라인 Sakura 5-petal SVG (gold stroke + pink fill, drop-shadow soft)
- cinematic:
  - 80개 petal storm (CSS animated divs, transform-only)
  - 3개 떠오르는 lantern (slow upward float, warm orange glow)
  - 중앙 golden light burst (1회 1.2s scale 0→3 fade)
- confetti: factor 그대로지만 색상 [#fbcfe8, #fde68a, #a7f3d0, #fff1f5], scalar 1.1 (덜 과하게)

### `src/pages/casino/CherrySakura500.tsx` (in-place 교체)
- 기존 OlympusSlot 호출 제거, `SlotSignatureWrapper` 15 LOC 패턴
- `useRequireAuth` 가드는 Wrapper가 처리하므로 단순화

```tsx
<SlotSignatureWrapper
  slotId="cherry_sakura"
  theme={CHERRY_SAKURA_THEME}
  Background={SakuraPetalCanvas}
  PaytableSheet={SakuraPaytableSheet}
  MaxWinOverlay={SakuraMaxWinOverlay}
  flareColors={{ left: "rgba(249,168,212,0.22)", right: "rgba(163,230,187,0.18)" }}
  signatureLabel="Cherry Sakura · Signature"
  accentDotColor="rgba(249,168,212,1)"
  themeKey="sakura"
/>
```

## 2. 수정하지 않는 파일
- `themes.ts` — `CHERRY_SAKURA_THEME` 이미 존재, 그대로 사용
- `SlotSignatureWrapper`, `BaseMaxWinOverlay`, `BasePaytableSheet`, `useAnimatedCanvas` — 전혀 변경 없음
- 다른 6개 슬롯 — 무영향

## 3. 한국 유저 친화 디자인 디테일
- petal 낙화 속도: vy 0.25–0.55 px/frame (다른 슬롯의 절반)
- Win cinematic 길이: 3.4s (Low vol에 맞춰 짧고 우아)
- 색상 채도: 모두 파스텔 (saturation < 60%)
- 음향: BaseMaxWinOverlay의 voice line 생략 (primary jingle만)
- 한국어 우선: titleText "벚꽃의 축복", paytable 톤 "천천히 즐기세요"

## 4. 성능 목표
- Mobile Lighthouse 96–98/100
- Canvas paint ops/frame ≤ 16 (petal 45 + 안개 1 + lantern 1)
- GPU composite-only (transform/opacity), reflow 0
- petal 풀 사전할당, GC 압력 0

## 5. 기술 세부 (참고)

```text
SakuraPetalCanvas
├─ setup: stamp mountain+tree silhouette to offscreen, seed petals[45]
├─ draw(t):
│   ├─ ctx.globalCompositeOperation = 'source-over'
│   ├─ drawImage(offscreen)            // 원경 정적
│   ├─ drawFog(t)                      // 1 path, alpha 0.05
│   ├─ drawLanternGlow(t)              // 1 radial gradient
│   └─ drawPetals(t)                   // 45 × {arc/bezier + rotate}
└─ static: 동일하지만 t=0 고정
```

## 6. 작업 후 보고에 포함될 항목
- 신규 파일 4개 경로
- CherrySakura500.tsx 최종 구조 (LOC)
- Mobile Performance 예상치
- 7개 Signature Slot 완료 요약 (LOC 절감, 추상화 사용률)
- 다음 Phase 제안: (a) 슬롯 음원 통일 / (b) Empire/Crown 연동 강화 / (c) PWA + 배포 준비 / (d) Sim 리그래시
