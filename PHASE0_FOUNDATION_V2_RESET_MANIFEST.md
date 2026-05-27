# PHASE0-FOUNDATION-V2 강력 리셋 — 제거 매니페스트

**Branch:** phase0-foundation-reset-clean  
**Date:** 2026-04 (현재 세션)  
**목표:** Lovable + Empire(제국) + Crown + Guild + Baron + Crown Wars 완전 제거 → 4개 설계 문서(Mobile Tab, ShareCard, Technical Spec, Ultimate Handover) 기반 깨끗한 PHONARA V2 재건.

> **주의:** 이 문서는 스캔 결과 기반 자동 생성. 실제 실행 전 검토 필수. DB 리셋은 **가장 먼저** (또는 staging DB에서) 수행.

---

## 1. 제거 대상 주요 카테고리

### 1.1 Supabase Edge Functions (완전 삭제 대상 폴더)
- `supabase/functions/crown-replay-card/`
- `supabase/functions/crown-war-settle/`
- `supabase/functions/emperor-coach/`
- `supabase/functions/empire-og-card/`
- `supabase/functions/imperial-bet-place/` (+ .test.ts)
- `supabase/functions/imperial-bet-settle/` (+ .test.ts)
- `supabase/functions/imperial-duel-cron/` (+ .test.ts)
- `supabase/functions/imperial-lobby-analytics/`
- `supabase/functions/imperial-metrics-batch/`
- `_shared/duel-telemetry.ts` (duel 전용 로직 확인 후 삭제)

**참고:** 이미 삭제된 항목 (git): ai-bot-run, ai-daily-ops-report, ai-mission-generator, apex-coach-v2.

### 1.2 Supabase DB Tables (DROP 대상 — 최소 40+ 테이블)
**Empire (제국) 계열:**
- empire_founding_seats
- empire_units
- empire_map_progress
- empire_battles
- empire_levels
- empire_boosters

**Guild (길드) 계열:**
- guilds, guild_members, guild_chat_messages, guild_wars, guild_war_contributions
- guild_activity_feed, guild_weekly_rankings, guild_weekly_payouts

**Crown (크라운) 계열:**
- crown_events, crown_wars, crown_war_participants, crown_replays

**Imperial (제국/황제) 계열 (대부분):**
- imperial_scores, imperial_score_events
- imperial_stories, imperial_journey_stages, imperial_journey_claims
- imperial_duel_rooms, imperial_duel_bets, imperial_duel_audit, imperial_duel_telemetry, imperial_duel_alert_thresholds
- imperial_house_ledger, imperial_treasury_ledger
- imperial_emission_state, imperial_volatility_window, imperial_injection_events
- imperial_flywheel_params, imperial_flywheel_params_audit
- imperial_kill_switches, imperial_kill_switch_audit
- imperial_token_burns, imperial_user_nfts, imperial_nft_audit
- imperial_rollback_snapshots, imperial_rollout_tiers, imperial_rollout_consents
- imperial_observability_events, imperial_rollout_phases, imperial_auto_heal_log
- imperial_onboarding_grants, imperial_onboarding_caps, imperial_onboarding_fraud_signals, imperial_audit_trail

**추가 스캔 필요 항목:**
- imperial_* 관련 RLS policies, triggers, indexes, views
- empire/crown/guild/imperial 관련 모든 RPC (get_empire_*, award_crown, crown_war_*, guild_*, evolve_empire_*, record_empire_battle 등 30+ 함수)

### 1.3 Frontend Hooks (전체 또는 대부분 삭제/대체)
- `src/hooks/use-crown-war.ts`
- `src/hooks/use-empire-booster.ts`
- `src/hooks/useEmpireCrown.ts`
- `src/hooks/useDuelAccess.ts`
- `src/hooks/useImperialDuelRoom.ts`
- `src/hooks/use-imperial-highlight.ts`
- `src/hooks/useImperialKillSwitches.ts`
- `src/hooks/useImperialOnboarding.ts`
- `src/hooks/use-imperial-state.ts`
- `src/hooks/useImperialThunderWithReverb.ts`
- `src/hooks/useImperialUserNft.ts`

(참고: use-my-power, use-vip-pass 등 일부 공유 로직은 검토 후 보존/분리)

### 1.4 Lib / Core 로직 (삭제 또는 대폭 정리)
- `src/lib/crown.ts`
- `src/lib/crownReplay.ts`
- `src/lib/empireConfig.ts`
- `src/lib/imperialBurn.ts`
- `src/lib/imperialCircuitV2.ts`
- `src/lib/imperialNft.ts`
- `src/lib/branding/crownGlossary.ts`
- `src/lib/branding/tierLabel.ts` (empire tier 부분)
- `src/lib/flywheel.ts` (imperial flywheel 부분 분리 검토)
- `src/lib/store.ts`, `src/lib/wallet.ts`, `src/lib/glossary.ts` 등 산재 참조 대량 정리
- `src/packages/workers/imperial_cosmetic_worker.ts`
- `src/packages/workers/cosmetic.ts` (관련 부분)

### 1.5 Components (제거 또는 대체)
**전용 삭제:**
- `src/components/nav/ImperialDeepLinkListener.tsx`
- `src/components/trade/ImperialTradeFomoBar.tsx`
- `src/components/guide/SceneGuildWar.tsx`
- `src/components/onboarding/ImperialWelcomeDialog.tsx`
- `src/components/onboarding/ImperialVoidPreview.tsx`
- `src/components/status/TierBadge.tsx` (crown/imperial tier 시각화)

**대량 참조 정리 필요 (부분 삭제/조건부 제거):**
- `src/components/nav/MobileBottomNav.tsx` (duel 탭 제거)
- `src/components/nav/PhonaraNav.tsx`, `StakeStyleSidebar.tsx`, `MoreSheet.tsx`, `PhonaraTopBar.tsx` (황실/대관전 링크, ImperialLogo import)
- `src/components/onboarding/OnboardingV2.tsx`, `OnboardingV3.tsx`, `SixtySecondFlow.tsx` 등
- `src/components/auth/*`, `landing/*`, `guide/*`, `trading/v3/*`, `ui/*` 등 30+ 파일에 산재된 empire narrative / crown UI / guild war 언급
- `src/components/FloatingChat.tsx`, `QuickAccessStrip.tsx`, `TopHUD.tsx`, `LiveRanking.tsx` 등

**Dangling import (이미 깨진 상태):**
- `src/components/nav/PhonaraTopBar.tsx` → `@/components/brand/ImperialLogo` (파일 없음)

### 1.6 Assets
- `src/assets/nft/crown_bronze.jpg` ~ `founder_gold.jpg` (전체 9종)
- `src/assets/command-throne-bg.jpg`, `login-crown-phone.jpg`
- Slots 내부 "emperor" 심볼 등 (게임 콘텐츠라 별도 판단: Mobile Tab / ShareCard와 무관하면 유지 가능)

### 1.7 Routes & Navigation (완전 제거)
- `/duel`, `/duel/*`, `/empire`, `/crown/*`, `/guild/*` 관련 모든 링크/딥링크
- MobileBottomNav의 "실시간대결" (crimson) 탭 → **4개 설계 문서의 Mobile Tab 스펙으로 완전 재설계**
- ImperialDeepLinkListener, crown war deep link 이벤트

### 1.8 Tests & Scripts
- `src/__tests__/duel/`
- `src/__tests__/integration/imperial-fullstack.integration.test.ts`
- `scripts/check-no-crown-ui.mjs` (리셋 완료 후 삭제 또는 완전 재작성)
- `scripts/check-pr3-isolation.mjs` 등 crown/imperial 가정 스크립트
- `scripts/phase5-rollback.sql` (검토 후)

### 1.9 i18n / Locales (대량 문자열 제거)
- `src/locales/ko.ts`, `en.ts`, `ja.ts`, `vi.ts` 등
  - "황제", "제국", "크라운", "길드", "바론", "대관전", "Imperial", "Crown War", "Empire Seat" 등 수백 건

### 1.10 기타
- `src/integrations/supabase/types.ts` (DB 리셋 후 재생성 — 수백 줄 empire 타입 삭제)
- `supabase/config.toml` (Lovable/empire 관련 설정 확인)
- `before_cleanup.txt`, `MIGRATION.md` (ApexForge legacy) — 아카이브 또는 삭제
- README.md "Lovable 비의존" 섹션 업데이트 (이미 방향성과 일치)

---

## 2. 제거 우선순위 (강력 리셋 실행 순서)

**P0 (최우선 — 반드시 먼저)**
1. DB 리셋 마이그레이션 작성 및 적용 (`phase0_foundation_reset.sql`)
   - 모든 empire/guild/crown/imperial 테이블 + RPC + policy + trigger DROP
   - Idempotent (IF EXISTS) + CASCADE
   - 실행 전 staging/full backup 필수

**P1 (High — 코드 동작성 확보)**
2. Supabase Functions imperial/crown/empire 폴더 전체 삭제
3. 전용 Hooks + Libs (crown.ts, imperial*.ts, empireConfig.ts 등) 삭제
4. Navigation 완전 정리 (Mobile Tab 5탭 재설계 시작 — Mobile Tab 설계 문서 준수)
5. ImperialDeepLinkListener, duel/empire route 참조 전면 제거

**P2 (Medium — UI/UX 정리)**
6. 전용 Components (onboarding imperial*, guide SceneGuildWar, trade Imperial*, TierBadge) 삭제
7. Assets (nft crown/emperor) 삭제 + public 이미지 스캔
8. Locales empire 문자열 대량 제거 (새 브랜딩 용어로 치환 — Ultimate Handover 문서 참조)

**P3 (Lower — 마무리)**
9. Tests, workers, scripts/check-* crown 관련 정리
10. Types 재생성, 전체 grep 잔여 키워드 제거
11. Build / Lint / Test / Strict crown-check 통과 검증
12. 4개 설계 문서 기반 재건 착수 (ShareCard, Mobile Tab 등)

**위험 관리**
- "Lovable" 키워드는 대부분 과거 의존성 언급 → 문서/주석 위주로 안전 삭제.
- 일부 flywheel / phon economy / wallet 코어는 **제국 레이어만** 제거하고 핵심은 보존.
- Slots / Crash / Trading 핵심 게임 로직은 건드리지 않음 (ShareCard 대상이 될 수 있음).

---

## 3. 첫 번째로 실행할 구체적인 명령어

**비파괴적 준비 단계 (추천 1번 명령어):**

```powershell
# 1. 현재 상태 스냅샷 + 매니페스트 최신화 (이미 생성됨)
git status
git branch --show-current

# 2. 제거 대상 함수/테이블/파일을 한 번 더 정확히 카운트 (안전 확인)
powershell -Command "
  $kws = 'crown|empire|제국|guild|baron|imperial|duel.*room|crown.*war'
  (Get-ChildItem -Path src,supabase/functions,supabase/migrations -Recurse -File -Include *.ts,*.tsx,*.sql | 
   Where-Object FullName -notlike '*node_modules*' | 
   Select-String -Pattern $kws -List).Count
"

# 3. DB 리셋 스켈레톤 마이그레이션 생성 (가장 중요한 첫 실행 파일)
#    supabase/migrations/ 디렉토리에 새 파일 생성 권장 (타임스탬프 자동 or 2026xxxx_phase0_foundation_reset.sql)
```

**실제 첫 번째 "실행" 추천 (에이전트가 바로 수행할 작업):**

```bash
# (1) DB 리셋 SQL 파일 생성 (DROP 문 대량 작성 시작)
# (2) Functions imperial* 폴더 삭제 (git rm -r)
# (3) 핵심 navigation 1개 파일부터 정리 시작 (MobileBottomNav duel 탭 제거 + 새 탭 구조 주석)
```

**가장 안전하고 논리적인 "첫 실행" 명령 (지금 바로):**

```powershell
# PHASE0 RESET — Step 0: DB Reset Migration Skeleton 생성 + Functions 삭제 목록 확정
# 아래 명령으로 마이그레이션 템플릿을 즉시 작성합니다.
```

이후 에이전트가 `supabase/migrations/2026..._phase0_foundation_v2_reset.sql` 파일을 생성하고, P0 테이블/함수 DROP 문을 채워넣는 작업으로 진행.

---

## 4. 다음 단계 (사용자 승인 후)

1. **4개 설계 문서** (Mobile Tab, ShareCard, Technical Spec, Ultimate Handover) 내용을 이 저장소에 추가하거나 경로 알려주세요. (현재 repo에 존재하지 않음)
2. DB reset SQL 초안 리뷰 승인
3. `git worktree` 또는 별도 브랜치로 안전하게 병렬 작업 진행 여부 결정
4. `implement` / `review` 스킬을 사용한 체계적 제거 루프 시작

**현재 상태:** 스캔 완료. 매니페스트 생성 완료. P0 실행 대기.

---

*이 매니페스트는 `PHASE0_FOUNDATION_V2_RESET_MANIFEST.md` 로 저장되었습니다. 이후 모든 제거 작업은 이 파일을 기준으로 추적합니다.*
