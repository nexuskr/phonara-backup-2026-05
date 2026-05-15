# 슬롯 배경 표시 수정

## 문제
배경 이미지(`bg.jpg`)는 Wizard(보라/마법서), Dragon(진홍/궁전), Olympus(황금) 모두 정상 존재하고 `theme.bg`로 연결되어 있음.

그러나 `OlympusSlot.tsx` 365번째 줄의 오버레이가 `hsl(var(--background) / 0.7) → 0.95` 라서 다크 테마에서 사실상 거의 불투명한 검정으로 배경을 덮어버림 → 사용자에게 "검은 화면"으로 보임.

## 수정안 (UI/표현 한정, 로직 무변경)

### 1. `SlotTheme`에 옵션 필드 추가 (`OlympusSlot.tsx`)
```ts
bgOverlay?: string;  // CSS gradient string, 기본값은 기존과 동일
bgPosition?: string; // 기본 "center"
```

### 2. 배경 오버레이를 가볍게 + 테마 색조 주입
365번째 줄을 `theme.bgOverlay ?? DEFAULT_OVERLAY` 사용으로 교체. 새 기본값:
```
linear-gradient(180deg, hsl(var(--background) / 0.35) 0%, hsl(var(--background) / 0.55) 60%, hsl(var(--background) / 0.85) 100%)
```
→ 상단은 배경이 또렷하게 보이고, 하단(릴/컨트롤 영역)만 어둡게 가려져 가독성 유지.

### 3. `themes.ts`에 테마별 색조 그라디언트 지정
- **Olympus**: 황금/앰버 틴트
  `linear-gradient(180deg, hsl(45 80% 10% / 0.25), hsl(var(--background) / 0.55) 55%, hsl(var(--background) / 0.9))`
- **Wizard**: 바이올렛/시안 틴트
  `linear-gradient(180deg, hsl(265 70% 12% / 0.30), hsl(var(--background) / 0.55) 55%, hsl(var(--background) / 0.9))`
- **Dragon**: 진홍/스톤 틴트
  `linear-gradient(180deg, hsl(0 70% 12% / 0.30), hsl(var(--background) / 0.55) 55%, hsl(var(--background) / 0.9))`

### 4. (옵션) 카지노 로비 카드도 동일한 가벼운 오버레이로 통일
`Casino.tsx` 카드의 `linear-gradient(180deg, transparent 30%, hsl(var(--background) / 0.95))` 는 이미 상단 투명이라 정상 — 변경 없음.

## 변경 파일
- `src/components/slots/OlympusSlot.tsx` — 타입 + 기본 오버레이 약화
- `src/components/slots/themes.ts` — 테마 3종에 `bgOverlay` 지정

## QA
1. `/casino/olympus-1000`, `/casino/wizard-2000`, `/casino/dragon-empire` 각각 배경 이미지 식별 가능한지
2. 릴 영역 텍스트/숫자 가독성 유지되는지
3. 모바일(작은 뷰포트)에서 배경 잘림 자연스러운지
