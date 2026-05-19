# Phase 5 STUB v2 — `user_id does not exist` 정정

## 원인
독립 백엔드(`wyhhdyrvqtoejvusnhva`)에 이미 같은 이름의 stub/구버전 테이블이 존재. `CREATE TABLE IF NOT EXISTS`는 **건너뛰기만** 하므로 컬럼이 부족한 상태로 남고, 뒤에 오는 `CREATE POLICY ... USING (auth.uid() = user_id)` 와 view/function이 `user_id` 컬럼을 찾지 못해 `42703` 발생.

지금 에러 라인은 SQL Editor 화면(L284 근방, COMMIT 직전)에 도달하기 전, 정책/뷰 생성 중 어느 한 곳. v1은 한 트랜잭션이라 전체 롤백되어 stub 0개 적용 상태.

## 해결 방식 — STUB v1.1 (idempotent + self-healing)
`scripts/independence/phase5-stub-v1.sql` 를 **자가치유형**으로 재작성:

각 stub 테이블 블록을 이 패턴으로 통일

```text
CREATE TABLE IF NOT EXISTS public.<t> (...);
-- ⬇ 핵심: 기존에 있더라도 빠진 컬럼 채워넣기
ALTER TABLE public.<t>
  ADD COLUMN IF NOT EXISTS user_id   uuid,
  ADD COLUMN IF NOT EXISTS <other>   <type> DEFAULT ...;
ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ... ;
CREATE POLICY ... USING (auth.uid() = user_id);
```

대상 테이블 (전부 동일 패턴 적용):
- `user_roles` — user_id, role, created_at
- `profiles` — id, nickname, birth_date, is_adult, profile_completed, tier, updated_at
- `wallet_balances` — user_id + 잔액 컬럼들
- `account_freezes` — user_id, reason, until_at
- `user_achievements`, `user_achievement_progress` — user_id, code, value
- `guild_members` — user_id, guild_id
- `withdrawal_requests`, `deposit_requests`, `transactions` — user_id, amount, status …
- `slot_spins` — user_id, game, bet, win
- `empire_founding_seats` — user_id, seat_no, claimed_at

추가 안전장치
- `my_active_freeze` 뷰는 `CREATE OR REPLACE VIEW` 전에 `DROP VIEW IF EXISTS` (컬럼 시그니처 변경 가능성 대비)
- `has_role(uuid, app_role)` 함수는 `user_roles.user_id` ALTER 이후로 순서 이동
- 전체를 단일 `BEGIN ... COMMIT` 유지 (atomic, 실패 시 깨끗하게 롤백)
- 끝에 자가 검증 `SELECT` 1개: 모든 대상 테이블에 `user_id`(또는 `id`) 컬럼 존재 확인

## 적용 절차
1. 본 plan 승인
2. 빌드 모드에서 `scripts/independence/phase5-stub-v1.sql` 재작성 (덮어쓰기, 파일명 유지하여 RUNBOOK 변경 불필요)
3. Studio SQL Editor에서 다시 실행 → `Success. No rows returned`
4. 그 다음 FULL CLONE 파이프라인 진행 (RUNBOOK 단계 1~4)

## 안전 원칙 (변경 없음)
- 관리형(`ketlqzfaplppmupaiwft`) READ-ONLY
- 모든 작업 idempotent — 몇 번 돌려도 안전
- stub은 임시 노이즈 차단용, 진짜 운영 스키마는 `db push`가 ALTER로 덮어씀

## 비범위
- 관리형 DB 수정 없음
- 새 마이그레이션 파일 추가 없음 (`supabase/migrations/` 안 건드림)
- 코드 변경 없음 (프론트엔드)
