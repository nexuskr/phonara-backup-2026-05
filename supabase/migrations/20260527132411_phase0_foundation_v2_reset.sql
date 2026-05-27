-- =====================================================================
-- PHASE0-FOUNDATION-V2 강력 리셋 — DB 완전 초기화 마이그레이션
-- =====================================================================
-- 목적: Lovable + Empire(제국) + Crown + Guild + Baron + Crown Wars
--       관련 모든 테이블, RPC, 정책, 트리거 완전 제거
--
-- 실행 전 필수:
--   1. Supabase Dashboard 또는 psql로 FULL BACKUP (또는 staging에서 먼저 테스트)
--   2. 이 마이그레이션 적용 후 → 새로운 4개 설계 문서 기반 스키마 재건
--
-- 주의: DROP ... CASCADE 사용. 의존하는 뷰/함수/정책 함께 제거됨.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. 안전 장치: 이 리셋은 "phase0" 네임스페이스 하에서만 동작
--    (실수로 프로덕션에 적용되지 않도록 주석으로 명확히 표시)
-- ---------------------------------------------------------------------
-- SELECT 'PHASE0 FOUNDATION V2 RESET — EMPIRE/CROWN/GUILD LAYERS ONLY' AS notice;

-- =====================================================================
-- 1. EMPIRE (제국) 관련 RPC / FUNCTION 먼저 제거
-- =====================================================================

DROP FUNCTION IF EXISTS public.get_empire_seats_remaining() CASCADE;
DROP FUNCTION IF EXISTS public.get_next_empire_day() CASCADE;
DROP FUNCTION IF EXISTS public.evolve_empire_unit(_unit_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.record_empire_battle(_battle_id UUID, _result TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_empire_map(_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.recompute_empire_level(_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_empire_booster(_user_id UUID) CASCADE;

-- =====================================================================
-- 2. GUILD (길드) 관련 RPC 제거
-- =====================================================================

DROP FUNCTION IF EXISTS public.is_guild_member(_user_id UUID, _guild_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_guild(_name TEXT, _emblem TEXT, _description TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.join_guild(_guild_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.leave_guild() CASCADE;
DROP FUNCTION IF EXISTS public.send_guild_message(_message TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.declare_guild_war(_defender_guild_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.contribute_guild_war(_war_id UUID, _score BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.get_guild_leaderboard(_limit INT) CASCADE;
DROP FUNCTION IF EXISTS public.accrue_guild_contribution() CASCADE;
DROP FUNCTION IF EXISTS public.get_guild_rankings(_week_start DATE) CASCADE;
DROP FUNCTION IF EXISTS public._grant_guild_crown(_user_id UUID, _amount INT, _dedupe_key TEXT, _meta JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.settle_guild_weekly(_target_week DATE) CASCADE;
DROP FUNCTION IF EXISTS public.delete_guild() CASCADE;

-- =====================================================================
-- 3. CROWN (크라운) / CROWN WAR 관련 RPC 제거
-- =====================================================================

DROP FUNCTION IF EXISTS public.award_crown(_user_id UUID, _amount INT, _source TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.crown_war_ensure_active() CASCADE;
DROP FUNCTION IF EXISTS public.crown_war_on_award() CASCADE;
DROP FUNCTION IF EXISTS public.get_crown_war_snapshot() CASCADE;

-- =====================================================================
-- 4. IMPERIAL (제국/황제) 관련 RPC 대량 제거
-- =====================================================================

DROP FUNCTION IF EXISTS public.award_imperial_score(_user_id UUID, _points INT, _reason TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.arena_join_duel(p_round_id UUID) CASCADE;  -- legacy duel entry

-- (필요시 추가 imperial_* RPC가 발견되면 계속 DROP FUNCTION ... CASCADE)

-- =====================================================================
-- 5. TABLES — EMPIRE 계열 (CASCADE)
-- =====================================================================

DROP TABLE IF EXISTS public.empire_founding_seats CASCADE;
DROP TABLE IF EXISTS public.empire_units CASCADE;
DROP TABLE IF EXISTS public.empire_map_progress CASCADE;
DROP TABLE IF EXISTS public.empire_battles CASCADE;
DROP TABLE IF EXISTS public.empire_levels CASCADE;
DROP TABLE IF EXISTS public.empire_boosters CASCADE;

-- =====================================================================
-- 6. TABLES — GUILD 계열
-- =====================================================================

DROP TABLE IF EXISTS public.guilds CASCADE;
DROP TABLE IF EXISTS public.guild_members CASCADE;
DROP TABLE IF EXISTS public.guild_chat_messages CASCADE;
DROP TABLE IF EXISTS public.guild_wars CASCADE;
DROP TABLE IF EXISTS public.guild_war_contributions CASCADE;
DROP TABLE IF EXISTS public.guild_activity_feed CASCADE;
DROP TABLE IF EXISTS public.guild_weekly_rankings CASCADE;
DROP TABLE IF EXISTS public.guild_weekly_payouts CASCADE;

-- =====================================================================
-- 7. TABLES — CROWN 계열
-- =====================================================================

DROP TABLE IF EXISTS public.crown_events CASCADE;
DROP TABLE IF EXISTS public.crown_wars CASCADE;
DROP TABLE IF EXISTS public.crown_war_participants CASCADE;
DROP TABLE IF EXISTS public.crown_replays CASCADE;

-- =====================================================================
-- 8. TABLES — IMPERIAL 계열 (대량)
-- =====================================================================

DROP TABLE IF EXISTS public.imperial_scores CASCADE;
DROP TABLE IF EXISTS public.imperial_score_events CASCADE;
DROP TABLE IF EXISTS public.imperial_stories CASCADE;
DROP TABLE IF EXISTS public.imperial_journey_stages CASCADE;
DROP TABLE IF EXISTS public.imperial_journey_claims CASCADE;

DROP TABLE IF EXISTS public.imperial_duel_rooms CASCADE;
DROP TABLE IF EXISTS public.imperial_duel_bets CASCADE;
DROP TABLE IF EXISTS public.imperial_duel_audit CASCADE;
DROP TABLE IF EXISTS public.imperial_duel_telemetry CASCADE;
DROP TABLE IF EXISTS public.imperial_duel_alert_thresholds CASCADE;

DROP TABLE IF EXISTS public.imperial_house_ledger CASCADE;
DROP TABLE IF EXISTS public.imperial_treasury_ledger CASCADE;
DROP TABLE IF EXISTS public.imperial_emission_state CASCADE;
DROP TABLE IF EXISTS public.imperial_volatility_window CASCADE;
DROP TABLE IF EXISTS public.imperial_injection_events CASCADE;
DROP TABLE IF EXISTS public.imperial_flywheel_params CASCADE;
DROP TABLE IF EXISTS public.imperial_flywheel_params_audit CASCADE;

DROP TABLE IF EXISTS public.imperial_kill_switches CASCADE;
DROP TABLE IF EXISTS public.imperial_kill_switch_audit CASCADE;
DROP TABLE IF EXISTS public.imperial_token_burns CASCADE;
DROP TABLE IF EXISTS public.imperial_user_nfts CASCADE;
DROP TABLE IF EXISTS public.imperial_nft_audit CASCADE;
DROP TABLE IF EXISTS public.imperial_rollback_snapshots CASCADE;
DROP TABLE IF EXISTS public.imperial_rollout_tiers CASCADE;
DROP TABLE IF EXISTS public.imperial_rollout_consents CASCADE;

DROP TABLE IF EXISTS public.imperial_observability_events CASCADE;
DROP TABLE IF EXISTS public.imperial_rollout_phases CASCADE;
DROP TABLE IF EXISTS public.imperial_auto_heal_log CASCADE;

DROP TABLE IF EXISTS public.imperial_onboarding_grants CASCADE;
DROP TABLE IF EXISTS public.imperial_onboarding_caps CASCADE;
DROP TABLE IF EXISTS public.imperial_onboarding_fraud_signals CASCADE;
DROP TABLE IF EXISTS public.imperial_audit_trail CASCADE;

-- =====================================================================
-- 9. (선택) 추가 정리 — empire/imperial 관련 컬럼/정책이 다른 테이블에 남아있다면
--    예: ALTER TABLE public.phon_balances DROP COLUMN IF EXISTS empire_xxx;
--    (현재 스캔 기준으로는 별도 테이블로 분리되어 있었으므로 주석 처리)
-- =====================================================================

-- 예시 (필요시 주석 해제 후 구체화):
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS empire_rank;
-- DROP POLICY IF EXISTS "empire_only_xxx" ON public.some_table;

-- =====================================================================
-- 10. Lovable 잔재 (문서/주석 수준) — 코드에서는 이미 대부분 제거됨
-- =====================================================================
-- (이 마이그레이션에서는 DB 레벨에서 Lovable 관련 테이블은 발견되지 않았음)

-- =====================================================================
-- 11. V2 재건을 위한 보존 대상 명시 (4개 설계 문서 기준)
--    - balances, profiles, staking_positions, rewards_log, share_events, daily_quick_claims 등
--      PHON 경제 + ShareCard + Mobile Tab 관련 핵심 테이블은 **DROP 금지**
--    - 이 리셋은 오직 empire/guild/crown/imperial/duel/baron 레거시 레이어만 제거
-- =====================================================================

-- 예시 (실제 실행 시 주석 해제하지 말 것 — 참고용)
-- SELECT '보존: balances, profiles, share_events, daily_quick_claims, staking_* (V2 PHON 경제 + ShareCard)' AS note;

-- =====================================================================
-- 완료 후 권장 작업
-- =====================================================================
-- 1. supabase functions: deploy --all (또는 삭제된 imperial/crown 함수 폴더 제거)
-- 2. npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
-- 3. grep -r "empire\|crown\|imperial\|guild.*war" src/ --include="*.ts" --include="*.tsx" | head -30
-- 4. 4개 설계 문서 기반 신규 테이블 (ShareCard, Mobile Tab 관련 등) 생성 마이그레이션 작성

COMMIT;

-- =====================================================================
-- 실행 기록 (수동으로 채우세요)
-- - Applied on: [YYYY-MM-DD]
-- - Environment: local / staging / prod (절대 prod 먼저 금지)
-- - Backup ID: [Supabase backup identifier]
-- =====================================================================
