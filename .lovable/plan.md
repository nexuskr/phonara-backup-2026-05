# Phonara World — Stake×롤빛×Freecash 리빌드 마스터플랜

## 목표 (한 줄)

"입금 안 해도 매일 들어오게 만들고, 들어오면 슬롯/크래쉬에 안 빠질 수 없게 만들고, 빠지면 자기 친구를 끌고 오게 만든다."

포지셔닝: **PHON 기반 디지털 카지노 + Earn 허브 + 살아있는 세계**
타깃: 한국 20~70대 전 연령. 1차 한국 점령 → 글로벌 확장.

---

## 핵심 진단 (지금 부족한 것)

기존 자산은 이미 세계 1위급:
- 카지노(슬롯/크래쉬/룰렛) + PHON 경제 + NFT + Empire 10티어
- VIP Empire Pass + Founding Seats + Crown War
- Whale Strike Rail / Empire Booster / Oracle Fortress
- Trust v2 (환불·손실보호) + AI Coach + Reactivation

사용자 갈증: **"세계가 살아있는 느낌이 없다."**
→ 콘텐츠는 많은데 **하나로 묶인 가상세계 정체성**이 약함.
→ 첫 5분에 "이 안에서 살고 싶다"는 후킹이 없음.

## 풀어야 할 3가지

1. **중독성 코어 루프** — 매일 30분 이상 안 나가게
2. **Earn 허브** — 무자본 유저를 슬롯 머니로 전환
3. **세계관 통합** — 흩어진 기능들을 "Phonara World"로 묶기

---

## 6주 스프린트 (Phase 1: 한국 점령)

### Week 1 — Earn Hub MVP (`/earn`)

기존 미션/스트릭/초대 시스템을 **하나의 허브**로 통합.

- `/earn` 신규 라우트, 좌측 사이드 메인 진입점에 🎁 배지
- 5개 카드: 일일출석 · 일일미션 · 친구초대 · 플레이투언 · 주간보스
- **일일 로그인 스트릭**: D1=100 → D7=1,000 PHON + 슬롯 프리스핀 10
- **일일 미션 5종** (자동 롤): 슬롯 50스핀 / 크래쉬 3판 / 친구초대 / 채팅 / 트레이딩 1회
- **친구 초대 2단**: 가입(+200) → 첫 입금(양쪽 +1,500)
- **Play-to-Earn**: 누적 베팅 10k PHON마다 보너스 크레딧 100 PHON (출금 불가, 베팅만)
- **오퍼월 슬롯** (UI만, 실제 광고 SDK는 Week 5): 설문/앱설치 placeholder + "Coming Soon"

### Week 2 — 중독성 코어 루프 강화

- **슬롯 빅윈 연출 3단** (Mega/Epic/Legendary 풀화면 + 화면 흔들림 + 사운드 빌드업)
- **연속 스핀 콤보**: 3연승 시 "Hot Streak" 오버레이 + 다음 스핀 1.2x 멀티
- **크래쉬 라이브 채팅** + 베팅 마키 (현재 라운드 베팅 중인 유저 닉네임 흘림)
- **룰렛 일일 무료 1회** (Earn에서 클레임, 잭팟 확률 0.1%로 떡밥)
- **세션 종료 방지**: 5분 비활동 시 "🔥 지금 잭팟 임박" 토스트 (실데이터 기반)

### Week 3 — 세계관 통합 ("Phonara World")

- **메인 페이지 리디자인**: Stake처럼 다크 + 골드, 좌측 영구 사이드바
  - Casino / Crash / Roulette / Trading / Earn / Empire / Lounge
- **상단 라이브 티커**: Whale Strike + VIP 입장 + 최근 출금 한 줄 마키 (이미 있는 RPC 재활용)
- **PowerHeader 확장**: PHON 잔액 + NFT 부스트 + Empire Tier + Crown 카운트 (이미 있음, 위치 강화)
- **온보딩 60초**: 가입 → 무료 룰렛 1회 → Earn 일일미션 1개 → 슬롯 데모 → 패키지 추천
- **사운드 디자인**: 모든 화면 진입 시 짧은 시그니처 사운드 (음소거 가능)

### Week 4 — 소셜 레이어

- **글로벌 채팅 강화**: 빅윈 자동 브로드캐스트 + 이모지 리액션
- **친구 시스템**: 친구 추가 / 친구 빅윈 알림 / 친구 랭킹
- **라이브 스트리밍 뷰어 카운트** (이미 있는 /live에 viewer count UI 추가)
- **TikTok형 빅윈 피드** (V17 PersonalizedFeedRail 재활용, 자동재생 풀스크린 모드)

### Week 5 — Earn 실수익 연결

- **오퍼월 SDK 연동** (AdGate Media 또는 OfferToro): 외부 광고/설문 완료 → PHON
- **시크릿 키** 필요: `OFFERWALL_API_KEY` (선택한 SDK 결정 후 secrets 추가)
- **CPA 마진**: 광고주 페이 1$ = 유저 800 PHON (≈0.6$) → 마진 40%
- **출금 안전망**: Earn으로만 번 PHON은 상품권/NFT로만 환급 (이미 있는 Trust v2 활용)

### Week 6 — 데이터 & 폴리시

- **신규 대시보드 패널** (`/admin/kpi`):
  - D1/D7/D30 리텐션 · ARPU · Earn→실입금 전환율 · 평균 세션 길이
- **A/B 테스트 프레임워크**: 빅윈 연출 강도 / 온보딩 순서 / 미션 리워드 금액
- **푸시 알림** (PWA): 잭팟 임박 / 친구 빅윈 / 일일미션 리셋

---

## Phase 2 (6주 이후, 미루기로 한 것들)

- 코인 트레이딩 UX 고도화 (TradingView 차트 / 원클릭 베팅 / NFT 부스터 연동 강화)
- 메타버스 레이어 (아바타 / 가상 라운지 룸 / 보이스 채팅)
- 글로벌 확장 (영어/일본어/베트남어 + Curacao 라이선스 검토)

---

## 기술 사항 (개발용)

### 신규 라우트
- `src/pages/Earn.tsx` (5카드 그리드)
- `src/pages/PhonaraWorld.tsx` (메인 리디자인, 기존 Index 대체 또는 병행)

### 신규 테이블 (migration)
- `daily_login_streaks` (user_id, current_streak, last_claim_at, total_claimed)
- `daily_missions` (id, user_id, mission_code, progress, target, claimed_at, expires_at)
- `play_to_earn_ledger` (user_id, total_wagered_phon, bonus_credit_balance, last_credit_at)
- `referral_rewards` (referrer_id, referee_id, signup_reward_at, deposit_reward_at)
- `offerwall_completions` (user_id, provider, offer_id, payout_phon, completed_at, status)

### 신규 RPC
- `claim_daily_streak()` → 보상 + streak++
- `roll_daily_missions()` (cron 매일 00:00 KST) → 유저별 5개 미션 자동 생성
- `claim_mission(mission_id)`
- `process_referral_deposit(referee_id)` (입금 트리거에서 호출)
- `credit_play_to_earn(user_id, wagered)` (베팅 RPC 내부 호출)

### 재활용 (이미 있는 자산)
- Whale Strike Rail / VIP Arrivals / Reactivation Campaign / Trust v2 / NFT Boost
- AI Coach (Earn 일일 브리핑 카드로 통합)
- Founding Seats / Crown War (Empire 탭 그대로)

### 디자인 토큰
- 다크 베이스 `#0B0E1A` + 골드 `#F0B935` + 액센트 핫핑크 `#FF3B7C`
- 폰트: Pretendard (한글) + Space Grotesk (영문)
- 모든 카드: 그라디언트 보더 + 펄스 글로우 (Stake 스타일)

### 결제 제약 (메모 준수)
코인 입금 + 한국 계좌이체 + 상품권 수동 — Stripe/PG 자동 제안 금지.

---

## 검증 지표 (6주 후 성공 기준)

| 지표 | 현재 추정 | 6주 목표 |
|---|---|---|
| D1 리텐션 | ~30% | 55%+ |
| D7 리텐션 | ~10% | 25%+ |
| 평균 세션 | ~5분 | 18분+ |
| Earn→실입금 전환 | N/A | 8%+ |
| DAU | 기준선 | 5x |

---

## 다음 액션

승인 시 Week 1 (Earn Hub MVP)부터 착수.
스프린트 1주 단위로 보고 + 다음 주 우선순위 재확인.
