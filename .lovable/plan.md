# v19.0 Hybrid Rebuild — Imperial Empire OS

전체 플랫폼을 "하나의 메타 가상 황제 제국"으로 통합한다. 백엔드·인프라는 **0줄 변경**, UI/네비/알림/베팅 흐름만 v19 톤으로 재조립한다.

## 절대 불변 (Untouched)

- money-flow 8경로 (FREEZE 가드)
- Operator Isolation (admin 청크)
- Bundle Budget (size-limit + bundle-budget.mjs)
- Phase D (Avatar + Virtual Lobby)
- Phase F Push 인프라 (`push_send_log`, cap, kill switch, `send-push`, `reengagement-tick` cron)
- Trust v2 / Legal Consent / Practice Mode / Loss Protection / VIP Pass
- DB migration·RPC·edge function 0건 (Slice 4 베팅 흐름도 신규 백엔드 없이 기존 RPC 재조립)

## 작업 범위

UI 레이어 (`src/pages/**`, `src/components/**`, `src/packages/ui|earn|wallet/components/**`) + Phase F Push **카피·딥링크만** 재배선.

## 카피 톤 규칙 (확정)

- ✅ **OK**: "지금 진입", "라운드 시작", "오늘의 도전", "폐하, 다음 라운드 바로 입장", "10,000 PHON 충전 → 즉시 베팅"
- ❌ **금지** (규제·Trust v2 정합성): "역전 가능", "회복 가능", "조금만 더 하면", "충분히 이깁니다" 등 **결과 약속/손실 회복 암시**
- 호칭 "폐하" + Warm King 존중어는 전면 허용
- 직접적 입금 CTA는 **행동 단위**로 (금액·1탭 경로 명시) — 결과 단위 ❌
- "군대/전쟁/army/war" 어휘 전면 삭제 → "제국/Empire/궁/Court" 톤으로 치환

## 슬라이스 구조

```text
Slice 1  Auth + Onboarding 리빌드  ← 이번 PR에서 진행
Slice 2  Imperial Dashboard + Imperial Live Pulse Rail (FOMO 위젯 1개로 압축)
Slice 3  Navigation 5탭 + Imperial FAB
Slice 4  Betting Experience (Bet Slip / Cash Out / Auto Bet / History + Replay)
Slice 5  알림 시스템 정리 (Push 카피 v19 + Sonner dedupe + 게임결과 토스트 축소)
Slice 6  Imperial Polish + 군대→제국 어휘 치환 + 메타 세계관 통합 sweep
```

각 슬라이스는 독립 PR. 슬라이스 끝마다 `check-money-flow-freeze.mjs` / `check-operator-isolation.mjs` / `npm run size:check` PASS 확인.

---

## Slice 1 상세 — Auth + Onboarding

### 목표

"0원 → 황제 시작" 첫 화면을 5초 안에 이해. 산만한 온보딩 (`OnboardingV2`·`OnboardingV3`·`SixtySecondFlow` 3종 중첩) 을 **단일 Imperial Onboarding** 으로 통합.

### 화면

**1) `/auth` (Auth.tsx) — Imperial Throne Gate**
- 단일 컬럼, full-bleed warm-gold gradient
- 상단: 작은 제국 인장 + "Phonara · Empire OS"
- 중앙: 큰 헤드라인 "폐하, 제국이 기다리고 있습니다"
- 서브: "무료로 시작 · 첫 10,000 PHON 즉시 지급"
- 1개의 Primary CTA: **Google 1탭 로그인** (이메일은 토글로 접기)
- 하단 미세 카피: Trust 3 chip (출금 평균 N분 / N명 활동 / Practice Mode)
- 기존 백엔드/세션 로직 그대로 — Tailwind/카피만 교체

**2) `/welcome` (신규, App 루트 라우트 추가)**
- 첫 로그인 직후 **1회만** 표시. localStorage `phonara:welcome:v19` 로 dedupe
- 3-슬라이드 풀스크린 (가로 스와이프)
  1. "폐하, 즉시 10,000 PHON" — 자동 지급 애니메이션 (count-up)
  2. "오늘의 무료 도전 3개" — 출석 / 미션 / 무료 슬롯 1회 카드
  3. "준비되시면 입장" — 단일 CTA `/dashboard?focus=quick-start`
- Skip 버튼은 항상 우상단

**3) 기존 온보딩 정리**
- `OnboardingV2.tsx`, `OnboardingV3.tsx`, `SixtySecondFlow.tsx`, `FirstDepositTopBanner.tsx`, `EarnedToast.tsx` 의 **Dashboard 마운트 제거** (파일 삭제하지 않음 — 코드 보존, 단지 마운트 해제)
- Dashboard 는 Slice 2 에서 본격 정리. Slice 1 에서는 마운트만 빠짐
- `Onboarding60s` (`@pkg/earn/components`) 는 Home 에서 유지 (이미 1회 디듀프)

### 기술 메모

- `src/pages/Welcome.tsx` 신규 (≈120줄)
- `App.tsx` 라우트 등록 + Auth 성공 후 redirect 분기 (`/welcome` if first-time, else `/dashboard`)
- `src/pages/Auth.tsx`: JSX 재작성, `supabase.auth.*` 호출은 그대로
- `src/pages/Dashboard.tsx`: `<OnboardingV2/>`, `<SixtySecondFlow/>`, `<EarnedToast/>`, `<FirstDepositTopBanner/>` Suspense 블록 제거 (lazy import 도 제거)
- 디자인 토큰 only: `bg-gradient-imperial`, `glow-imperial`, `pulse-halo`, `imperial-card`, `text-gradient-imperial`
- 신규 색/폰트 추가 0건

### 검증

1. `check-money-flow-freeze.mjs` → PASS
2. `check-operator-isolation.mjs` → PASS
3. `npm run size:check` → index 청크 delta ≤ +2KB (gzip)
4. 새 계정 가입 → `/welcome` 1회 표시 → 두 번째 로그인 시 `/dashboard` 직행
5. 기존 계정 로그인 → `/dashboard` 직행 (`/welcome` 미노출)

### Out of Scope (Slice 1)

- Dashboard 본문 리빌드 → Slice 2
- Push 카피 → Slice 5
- 베팅 흐름 → Slice 4

---

## 위험 & 완화

| 위험 | 완화 |
|---|---|
| Dashboard 마운트 해제로 기존 funnel 지표 누락 | Slice 2 에서 Imperial Live Pulse Rail 로 대체 분석 이벤트 재배선 |
| `/welcome` 라우트 prerender 누락 | `scripts/prerender.mjs` 화이트리스트 확인, 인증 전용이므로 prerender 불필요 |
| 카피 톤 충돌 (사용자 답변 내부 불일치) | 본 플랜의 "안전선" 톤 규칙을 기본값으로 채택. 더 강한 톤 원하시면 본 카드 거절 + 수정 요청 |

승인 시 Slice 1 즉시 시작.
