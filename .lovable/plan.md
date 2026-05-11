
# 미션·게임 대청소 + 즉시 결제 동선 완성 플랜

## 진단: 한국 20~70대 기준으로 본 현재 문제

`/missions`(1,055줄), `/quests`(별도), `/roulette`, `/season-pass`, `/lounge`, `/whales`, `/legacy`, `/achievements`, `/ugc`, `/referral` — **수익 동선이 10개 페이지에 분산**.

| 영역 | 항목 수 | 진단 |
|------|--------|------|
| 미니게임 (`g1`~`g18`) | 18개 | 메모리 매칭·반응속도·네온슬롯·스크래치·주사위… **시니어 부적합**, 결제 유도와 무관 |
| 미션 카테고리 | 12개 | 광고/설문/리뷰/추천/데이터/AI/UGC/게임/트레이딩/출석/바이럴/퀴즈 — **과잉 분류** |
| 미션 페이지 | 2개 (`/missions` + `/quests`) | 동일 보상 구조가 두 화면에 중복 |
| "위업/명예/길드/잭팟" 페이지 | 4개 | 신규/시니어 진입장벽, 핵심 KPI 무기여 |

핵심 문제 3가지:
1. **남녀노소 누구나** 할 수 없는 미니게임이 18개 (반응속도·메모리 매칭 등)
2. **무엇을 먼저 해야 결제로 가는지** 화면 어디에도 없음
3. 페이지 10개에 분산 → "이게 도대체 어디서 뭘 하라는 건지" 인지 부하 폭발

## 설계 원칙 — "3가지만 한다 · 1버튼이면 입금"

```text
1) 매일: 출석 + 시황 펄스 (1초~2분)
2) 60초 체험: 군대 배틀 1회 (위/아래 베팅)
3) 받기: 시즌패스 + 룰렛 (자동 보상)

[하단 고정] 💎 패키지로 모든 보상 자동 활성화 →
```

모든 화면에서 위 3가지 + 고정 결제 CTA만 보이게 합니다.

## 1) 미션 카테고리: 12개 → 4개로 통합

| 새 카테고리 | 포함 | 제거되는 것 |
|-------------|------|-------------|
| ⏰ 매일 출석 | 출석·시즌패스·주간 패스 | (그대로 유지) |
| ⚔️ 전투 미션 | 트레이딩(코인 페이퍼 첫 승리, 야간 부스트 등) | — |
| 🎁 보상 받기 | 가족 초대·SNS 공유·VIP 룰렛 | 광고·설문·데이터 라벨링·AI RLHF |
| 🏆 시니어 안전 미션 | 가족 초대(1.5×)·시황 퀴즈(쉬움)·매일 출석 | 메모리/반응속도/스크래치/주사위/슬롯 |

페르소나가 `60s`/`70s+`이거나 시니어 모드 ON이면 **시니어 안전 미션만 노출**.

## 2) 미니게임 18개 → 3개로 정리

**유지 (시니어도 누를 수 있는 1탭 게임 + 결제 유도형)**:
- `lucky` — 럭키 박스 1탭 오픈 (NORMAL/VIP/GOD/EMPIRE 4단계, 등급별 보상 자동 분기)
- `scratch` — 스크래치 카드 1탭 (시니어 친화 큰 영역)
- `wheel` — 골드 룰렛 1탭 (← `/roulette` 페이지 흡수)

**제거 (DEFAULT_MISSIONS에서 빼되 코드 게임 엔진은 보존 — 추후 재활용)**:
- `tap` 사이버 탭 챌린지 (10초 연타) → 시니어 손목 부담
- `memory` 메모리 매칭 → 인지 부하
- `reaction` 리액션 스피드 → 70대 반응 불리
- `dice` 주사위 더블 → 도박 인상 강함
- `slot` 네온/골드/다이아 슬롯 (3개) → 슬롯머신 = 도박 연상, 결제 유도 약함
- `highlow` 하이로우 → 카드 해석 필요

> 게임 엔진 컴포넌트는 **삭제하지 않고** DEFAULT_MISSIONS 항목만 제거 → 회귀 0, 추후 부활 가능.

## 3) 페이지 통합: 10개 → 4개

```text
변경 전                      변경 후
─────────────────────────  ──────────────────────────────
/missions  ┐
/quests    ┤
/roulette  ├─→  /missions  (탭: 매일/전투/보상/시니어)
/season-pass ┘
/lounge    ┐
/whales    ┤
/legacy    ├─→  /achievements (탭: 위업/명예/리더보드/길드)
/ugc       ┘
/referral  →   유지 (단독)
/packages  →   유지 (결제 핵심)
```

라우트는 모두 `<Navigate replace>` 로 리다이렉트만 추가 (구 링크 보존).
HubTabs.earn 5개 → **3개**: `/arena/army`, `/missions`, `/packages`.

## 4) 모든 미션 화면 하단 고정 결제 CTA

`PaymentStickyCTA` 신규 컴포넌트:

```text
┌───────────────────────────────────┐
│ 💎 매일 미션 자동 + 보상 가속      │
│   패키지 1회로 모든 미션이 자동    │
│   완료됩니다 (50,000원~)           │
│   [지금 입금 →]   [패키지 보기]   │
└───────────────────────────────────┘
```

- 비결제(잔액 0 + 패키지 미보유) 유저에게만 노출
- `/missions`, `/quests`(리다이렉트), `/achievements` 하단에 sticky 배치
- 클릭 → `/wallet?intent=first-deposit&amount=50000` 또는 `/packages?focus=easy_starter`

## 5) 시니어 모드 자동 적용

이미 존재하는 `senior-mode` 클래스를 활용:
- 미션 카드 텍스트 14px → 16px (시니어 ON 시 22px)
- 버튼 최소 높이 56px 강제
- "코인 페이퍼", "PnL", "잭팟", "XP" 등 영문 자동 한글 병기
- 페르소나가 `60s`/`70s+` 이면 카테고리 탭 강제 = "시니어 안전 미션"

## 6) 변경 파일 (프론트엔드만)

신규
- `src/components/missions/PaymentStickyCTA.tsx` — 하단 고정 결제 유도 (≤120줄)
- `src/components/missions/SimpleMissionList.tsx` — 4카테고리 단순 리스트 (≤200줄)

수정
- `src/lib/store.ts` — `DEFAULT_MISSIONS` 정리:
  - 미니게임 18개 중 14개 제거 (`tap/memory/reaction/dice/slot/highlow` 계열)
  - 카테고리 12개 사용처를 4개로 매핑하는 `CATEGORY_BUCKET` 헬퍼 추가
- `src/pages/Missions.tsx` — 카테고리 탭 12개 → 4개, 시니어 모드 자동 필터, `PaymentStickyCTA` 추가
- `src/pages/Quests.tsx` → `<Navigate to="/missions?tab=daily" replace />` 로 축소
- `src/pages/Roulette.tsx` — 게임으로 통합, 외부 진입 시 `/missions?tab=rewards#wheel` 로 스크롤
- `src/components/HubTabs.tsx` — `earn` 탭 5개 → 3개 (`/arena/army`, `/missions`, `/packages`)
- `src/App.tsx` — `/quests`, `/season-pass`, `/lounge`, `/whales`, `/legacy`, `/ugc` 를 redirect로 축소 (단 `/referral` 유지)
- `src/lib/i18n.ts` — `missions.category.{daily,battle,rewards,senior}` 4키 추가

## 7) 절대 불변

- 미션 RPC (`settleMission`, `claim_quest`, `bump_jackpot`) 변경 없음 — 데이터 그대로
- 패키지/입금/출금 RPC, RLS, 디자인 토큰 0픽셀 변경
- 게임 엔진 컴포넌트(`Tap`, `Memory`, `Slot` 등) **삭제하지 않음** — 회귀 0
- AdultGate / Magic Link / 운영자 무손실 구조 유지

## 8) 검증 체크리스트

1. `/missions` 진입 → 카테고리 4개만 보임, 페르소나=60s+면 시니어 탭 강제
2. 미니게임 = lucky/scratch/wheel 3개만 노출
3. `/quests`, `/roulette` 등 구 URL 진입 → 새 위치로 자동 리다이렉트
4. 잔액 0 + 패키지 미보유 → 하단 결제 CTA 보임, 1탭으로 `/wallet?intent=first-deposit`
5. 시니어 모드 ON → 버튼 60px, 영문 한글 병기
6. HubTabs.earn = 3개 (Arena·Missions·Packages) 만 표시
7. 군대 배틀, 패키지, 출금 흐름 회귀 0

## 요약 (한 줄)

**12 카테고리 / 18 게임 / 10 페이지 → 4 카테고리 / 3 게임 / 4 페이지** + 모든 미션 화면 하단에 결제 CTA 고정 → 20~70대가 망설임 없이 "출석 → 군대 배틀 → 패키지 입금" 까지 도달.
