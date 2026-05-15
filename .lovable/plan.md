# Wizard 2000 — Signature Slot 착수 계획

기존 `SlotSignatureWrapper` 위에 Wizard 전용 비주얼/페이테이블/맥스윈 레이어 3종을 얹어 Cosmic Forge·Neon Tokyo와 동일한 생산 라인으로 마감합니다. 코어 엔진(`OlympusSlot`)·사운드/셀러브레이션 Facade는 건드리지 않습니다.

## 신규 파일

1. `src/components/slots/WizardMagicCanvas.tsx`
   - `requestAnimationFrame` 기반 60fps cap 캔버스 배경.
   - 레이어: ① 회전하는 마법진(2겹, 역방향), ② 부유 룬 글리프 12개(쿼터니언 lerp drift), ③ 미스트 파티클 40개 cap, ④ 하단 마법탑 실루엣 글로우 펄스.
   - 컬러: violet `#8b5cf6`, gold `#fbbf24`, mystic blue `#22d3ee` (semantic는 인라인 캔버스라 raw hex 허용).
   - `prefers-reduced-motion`이면 정적 그라디언트 스냅샷.
   - `visibilitychange`로 RAF pause, `dpr=1` 강제, 언마운트 시 RAF 해제 + ctx 참조 해제.

2. `src/components/slots/WizardPaytableSheet.tsx`
   - shadcn `Sheet` 기반. 헤더 “Wizard 2000 · Mystic Paytable”.
   - 심볼 그리드 + 배율표(High volatility 안내, Max 2000×).
   - Gold accent 테두리 + violet 배경, `WizardPaytableSheet.Trigger`로 외부 노출 (Cosmic/Neon과 동일 시그니처).

3. `src/components/celebration/WizardMaxWinOverlay.tsx`
   - `WinCelebrationManager` 구독 → `multiplier >= 2000` 발화.
   - 시퀀스: ① 화면 어두워짐 + 5각 Pentagram rune sweep (SVG stroke-dasharray), ② Ancient Spell 폭발 (radial gold burst + violet shockwave), ③ Magic Rune Storm (룬 30개 회오리 fall), ④ “WIZARD’S DECREE · 2000×” 타이포 슬램.
   - 사운드: `SlotSoundManager.play("legendary_win")` + `play("voice_wizard_decree")` (없으면 procedural fallback이 자동 처리).
   - prefers-reduced-motion 시 단일 페이드 + 타이포만.

4. `src/pages/casino/Wizard2000.tsx` (덮어쓰기, 14 LOC 이하)
   - `SlotSignatureWrapper`에 wizard 자산 주입.

## 수정 파일

- `src/components/slots/themes.ts`
  - 기존 `WIZARD_THEME`을 그대로 유지하되, 사양과 일치하도록 alias `export const WIZARD_2000_THEME = WIZARD_THEME;` 추가 (혼선 방지). 다른 슬롯 테마는 변경 없음.

## Wizard2000.tsx 구조

```tsx
import SlotSignatureWrapper from "@/components/slots/SlotSignatureWrapper";
import { WIZARD_2000_THEME } from "@/components/slots/themes";
import WizardMagicCanvas from "@/components/slots/WizardMagicCanvas";
import WizardPaytableSheet from "@/components/slots/WizardPaytableSheet";
import WizardMaxWinOverlay from "@/components/celebration/WizardMaxWinOverlay";

export default function Wizard2000Page() {
  return (
    <SlotSignatureWrapper
      slotId="wizard_2000"
      theme={WIZARD_2000_THEME}
      Background={WizardMagicCanvas}
      PaytableSheet={WizardPaytableSheet}
      MaxWinOverlay={WizardMaxWinOverlay}
      flareColors={{ left: "rgba(139,92,246,0.20)", right: "rgba(251,191,36,0.18)" }}
      signatureLabel="Wizard 2000 · Signature"
      accentDotColor="rgba(139,92,246,1)"
      themeKey="wizard"
    />
  );
}
```

## 성능 & 안전 가드

- 모든 캔버스: dpr=1, 파티클 cap, RAF 1개, `visibilitychange`/언마운트 정리.
- GPU 합성: `transform3d` + `will-change: transform, opacity`.
- DevCheats / haptic / edge flare는 Wrapper가 자동 적용.
- TypeScript strict, SSR safe (`typeof window` 체크), 디자인 토큰 위주(캔버스 raw hex만 예외).

## 다음 슬롯(Dragon Empire) 대비 — Wrapper 보완 후보

- `flareColors`에 펄스 속도/세기 옵션 추가 (`pulseHz`, `intensity`).
- Background 컴포넌트에 공통 `paused: boolean` prop 표준화 → Wrapper가 visibility 일괄 제어.
- MaxWinOverlay에 공통 `voiceLineKey` prop을 두어 사운드 키만 갈아끼우면 되도록 정리.
- 페이테이블 Sheet의 공통 레이아웃을 `BasePaytableSheet`로 추출, 테마는 토큰만 주입.

## 산출물 점검

- Mobile Performance 목표: 96~98/100 (Cosmic·Neon과 동일).
- Lighthouse 회귀 시 캔버스 파티클 cap을 우선 축소.
