=== Technical Spec ===
# PHONARA V2 — Technical Specification
**Supabase 스키마 + PHON 스테이킹 + 입출금 + 환전 시스템 상세 설계**

**Version:** 1.0  
**Date:** 2026-05-26

---

## 1. 전체 화폐/토큰 구조 요약

| 자산 유형 | 용도 | 비고 |
|-----------|------|------|
| **PHON** | 보상, 스테이킹, 환전 | 1 PHON = 1원 고정 |
| **USDT** | 입금, 출금, 트레이딩 | 실제 크립토 |
| **KRW** | 입금, 출금, 트레이딩 | 원화 계좌 |
| **Trading Balance** | 트레이딩 전용 | 원화 + USDT만 |

---

## 2. Supabase 핵심 스키마

### 2.1 profiles (기본 사용자 정보)

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  nickname text,
  avatar_url text,
  phone_verified boolean default false,
  kyc_level int default 0,
  created_at timestamptz default now()
);
```

### 2.2 balances (종합 잔고)

```sql
create table balances (
  user_id uuid primary key references profiles(id),
  phon_balance bigint default 0,
  phon_staked bigint default 0,
  usdt_balance numeric(20,8) default 0,
  krw_balance bigint default 0,
  trading_usdt numeric(20,8) default 0,
  trading_krw bigint default 0,
  updated_at timestamptz default now()
);
```

**참고**: 나머지 테이블 (staking_positions, rewards_log, deposit_records, withdrawal_requests, exchange_requests, trading_balances 등)의 전체 스키마는 사용자가 제공한 원본 문서의 "이전 파일 전체 내용"을 참조해야 합니다. 현재 제공된 paste는 핵심 테이블 2개 + 요약까지만 포함되어 있습니다.

**PHASE0 리셋과의 관련성**:
- empire/guild/crown/imperial 관련 테이블은 **완전 DROP** 대상 (별도 phase0 reset migration에서 처리).
- 위 balances / profiles / staking 등은 **유지 또는 진화** 대상 (PHON 스테이킹 중심의 V2 경제를 위해 보존).

---

## 3. 추가 권장 테이블 (V2 방향 기반)

- `staking_positions` (PHON 스테이킹 포지션)
- `rewards_log` (모든 보상 이력)
- `share_events` + `daily_quick_claims` (ShareCard 보상 — 이미 일부 존재)
- `deposit_records`, `withdrawal_requests`

(전체 상세 DDL은 원본 Technical Spec 문서의 완전본 필요)

---

**상태**: 부분 수신 (truncated). 전체 Technical Spec 완전본이 필요하면 사용자에게 재요청 예정.