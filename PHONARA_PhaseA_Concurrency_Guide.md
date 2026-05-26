# PHONARA Phase A Concurrency Guide

## 목적
Phase A에서 출금, 보상 지급, 입금 처리의 동시성/트랜잭션 구현 방식을 Supabase/Postgres 기준으로 실제 구현 가능한 수준으로 정리한 문서입니다.

## 목표
- 어떤 테이블을, 언제, 어떻게 잠글지 명확히 정의합니다.
- idempotency, state transition, rollback 을 코드 관점에서 고정합니다.
- RPC 기반 구현을 기준으로 실제 개발에 바로 사용할 수 있는 예시를 제공합니다.

---

## 1. 구현 원칙

### 1.1 기본 전략
- Phase A에서는 Pessimistic Lock 을 기본으로 합니다.
- wallets 행을 먼저 잠근 뒤 잔액을 검증/변경합니다.
- 요청 테이블(deposit_requests, withdrawal_requests, reward_history)도 동일 트랜잭션에서 잠급니다.

### 1.2 핵심 규칙
1. 잔액 변경, 상태 변경, 거래 기록, 감사 로그는 하나의 DB transaction 안에서 처리합니다.
2. 외부 지급 호출은 DB commit 이후에 수행하고, 실패 시 별도 복구 RPC를 호출합니다.
3. idempotency_key 는 요청 중복을 막기 위한 1차 수단으로 사용합니다.
4. 락 순서는 항상 고정합니다: wallets → 대상 요청 테이블 → audit_logs/transactions 기록.
5. 상태 검증은 락 획득 이후에 재검증합니다.

---

## 2. 잠금 범위와 락 순서

### 2.1 락 순서
1. wallets row
2. target request row
3. transactions / audit_logs 는 직접 잠금 없이 삽입합니다.

### 2.2 요청별 락 범위
| 처리 | 잠금 대상 | 이유 |
| --- | --- | --- |
| 출금 승인 | wallets, withdrawal_requests | 잔액 중복 차감 및 상태 경쟁 방지 |
| 외부 지급 완료/실패 | wallets, withdrawal_requests | 원복/완료 상태 갱신의 원자성 보장 |
| 보상 지급 | wallets, reward_history | 중복 지급 및 잔액 경합 방지 |
| 입금 확정 | wallets, deposit_requests | 중복 확정 방지 및 상태 전이 안전성 확보 |

---

## 3. 상태 전이와 트랜잭션 경계

### 3.1 출금
- pending → approved
- approved → processing
- processing → completed
- processing → failed

### 3.2 보상
- pending → completed
- pending → failed

### 3.3 입금
- approved → completed
- approved → failed

### 3.4 트랜잭션 경계 기준
- wallets.balance 또는 wallets.available_balance 변경은 transactions 생성과 같은 트랜잭션으로 묶습니다.
- audit_logs 기록도 같은 트랜잭션에 포함합니다.
- 외부 시스템 호출은 트랜잭션 밖에서 수행합니다.

---

## 4. Idempotency 정책

### 4.1 기본 정책
- CreateDeposit, CreateWithdrawalRequest, PayoutReward 요청은 선택적으로 idempotency_key 를 수용합니다.
- 같은 idempotency_key 는 기존 결과를 그대로 반환합니다.
- 실패한 요청도 기본적으로 재시도 가능하도록 설계합니다.

### 4.2 적용 대상
- deposit_requests.idempotency_key
- withdrawal_requests.idempotency_key
- reward_history.idempotency_key

### 4.3 구현 규칙
1. idempotency_key 가 있으면 먼저 기존 요청을 조회합니다.
2. 기존 요청이 있으면 기존 response payload 를 그대로 반환합니다.
3. 기존 요청이 없으면 신규 트랜잭션을 시작합니다.
4. 동시 요청이 들어오면 유니크 인덱스가 충돌을 막고, 한쪽은 재조회 후 기존 결과를 반환합니다.

---

## 5. RPC 설계 원칙

### 5.1 권장 방식
- 핵심 금융 트랜잭션은 SECURITY DEFINER RPC 함수로 구현합니다.
- API 레이어는 입력 검증과 응답 포맷 전환만 담당합니다.

### 5.2 함수 책임 분리
- approve_withdrawal
- complete_withdrawal
- fail_withdrawal
- process_reward_payout
- complete_deposit

---

## 6. 출금 처리 흐름

### 6.1 승인 단계
1. API가 관리자 권한과 입력값을 검증합니다.
2. approve_withdrawal RPC 를 호출합니다.
3. 함수는 wallets 와 withdrawal_requests 를 FOR UPDATE 로 잠급니다.
4. 상태가 pending 인지 재검증합니다.
5. available_balance 를 차감합니다.
6. transactions 를 pending 상태로 생성합니다.
7. withdrawal_requests.status 를 processing 으로 갱신합니다.
8. audit_logs 를 기록합니다.

### 6.2 외부 지급 성공
1. 외부 지급 API 호출
2. 성공 시 complete_withdrawal RPC 호출
3. withdrawal_requests.status 를 completed 로 변경
4. transactions.status 를 completed 로 변경
5. audit_logs 를 기록

### 6.3 외부 지급 실패
1. 외부 지급 API 호출
2. 실패 시 fail_withdrawal RPC 호출
3. wallets.available_balance 를 원복
4. withdrawal_requests.status 를 failed 로 변경
5. transactions.status 를 failed 로 변경
6. audit_logs 를 기록

---

## 7. 예시 SQL 함수

### 7.1 approve_withdrawal
```sql
CREATE OR REPLACE FUNCTION approve_withdrawal(p_withdrawal_id UUID, p_admin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal withdrawal_requests%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_tx_id UUID;
BEGIN
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_WITHDRAWAL_REQUEST_NOT_FOUND',
      'message', '출금 요청 정보를 찾을 수 없습니다.'
    );
  END IF;

  IF v_withdrawal.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_INVALID_STATE_TRANSITION',
      'message', '현재 상태에서는 변경할 수 없습니다.'
    );
  END IF;

  SELECT * INTO v_wallet
  FROM wallets
  WHERE id = v_withdrawal.wallet_id
  FOR UPDATE;

  IF v_wallet.available_balance < v_withdrawal.amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_INSUFFICIENT_BALANCE',
      'message', '잔액이 부족합니다.'
    );
  END IF;

  UPDATE wallets
  SET available_balance = available_balance - v_withdrawal.amount,
      updated_at = now()
  WHERE id = v_withdrawal.wallet_id;

  INSERT INTO transactions (
    id, user_id, wallet_id, type, direction, amount, currency, status, provider,
    reference_type, reference_id, memo, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_withdrawal.user_id, v_withdrawal.wallet_id, 'withdrawal', 'debit',
    v_withdrawal.amount, v_withdrawal.currency, 'pending', 'internal',
    'withdrawal_requests', v_withdrawal.id, '출금 승인 처리 중', now(), now()
  ) RETURNING id INTO v_tx_id;

  UPDATE withdrawal_requests
  SET status = 'processing', reviewed_by = p_admin_id, reviewed_at = now(), updated_at = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO audit_logs (
    id, actor_user_id, target_type, target_id, action, before_data, after_data, reason, created_at
  ) VALUES (
    gen_random_uuid(), p_admin_id, 'withdrawal_requests', p_withdrawal_id, 'approve',
    jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'processing'),
    '관리자 승인', now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'error_code', null,
    'message', '출금 요청이 승인되었습니다.',
    'data', jsonb_build_object(
      'withdrawal_id', p_withdrawal_id,
      'status', 'processing',
      'transaction_id', v_tx_id
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_INTERNAL_SERVER',
      'message', '요청을 처리하는 중 오류가 발생했습니다.'
    );
END;
$$;
```

### 7.2 complete_withdrawal
```sql
CREATE OR REPLACE FUNCTION complete_withdrawal(p_withdrawal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal withdrawal_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_WITHDRAWAL_REQUEST_NOT_FOUND',
      'message', '출금 요청 정보를 찾을 수 없습니다.'
    );
  END IF;

  IF v_withdrawal.status <> 'processing' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_INVALID_STATE_TRANSITION',
      'message', '현재 상태에서는 완료 처리할 수 없습니다.'
    );
  END IF;

  UPDATE withdrawal_requests
  SET status = 'completed', updated_at = now()
  WHERE id = p_withdrawal_id;

  UPDATE transactions
  SET status = 'completed', updated_at = now()
  WHERE reference_type = 'withdrawal_requests'
    AND reference_id = p_withdrawal_id;

  INSERT INTO audit_logs (
    id, actor_user_id, target_type, target_id, action, before_data, after_data, reason, created_at
  ) VALUES (
    gen_random_uuid(), NULL, 'withdrawal_requests', p_withdrawal_id, 'complete',
    jsonb_build_object('status', 'processing'), jsonb_build_object('status', 'completed'),
    '외부 지급 성공', now()
  );

  RETURN jsonb_build_object('success', true, 'error_code', null, 'message', '출금이 완료되었습니다.');
END;
$$;
```

### 7.3 fail_withdrawal
```sql
CREATE OR REPLACE FUNCTION fail_withdrawal(p_withdrawal_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal withdrawal_requests%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_WITHDRAWAL_REQUEST_NOT_FOUND',
      'message', '출금 요청 정보를 찾을 수 없습니다.'
    );
  END IF;

  IF v_withdrawal.status <> 'processing' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_INVALID_STATE_TRANSITION',
      'message', '현재 상태에서는 실패 처리할 수 없습니다.'
    );
  END IF;

  SELECT * INTO v_wallet
  FROM wallets
  WHERE id = v_withdrawal.wallet_id
  FOR UPDATE;

  UPDATE wallets
  SET available_balance = available_balance + v_withdrawal.amount,
      updated_at = now()
  WHERE id = v_withdrawal.wallet_id;

  UPDATE withdrawal_requests
  SET status = 'failed', updated_at = now()
  WHERE id = p_withdrawal_id;

  UPDATE transactions
  SET status = 'failed', updated_at = now()
  WHERE reference_type = 'withdrawal_requests'
    AND reference_id = p_withdrawal_id;

  INSERT INTO audit_logs (
    id, actor_user_id, target_type, target_id, action, before_data, after_data, reason, created_at
  ) VALUES (
    gen_random_uuid(), NULL, 'withdrawal_requests', p_withdrawal_id, 'fail',
    jsonb_build_object('status', 'processing'), jsonb_build_object('status', 'failed'),
    p_reason, now()
  );

  RETURN jsonb_build_object('success', true, 'error_code', null, 'message', '출금 요청이 실패 처리되었습니다.');
END;
$$;
```

### 7.4 process_reward_payout
```sql
CREATE OR REPLACE FUNCTION process_reward_payout(
  p_user_id UUID,
  p_wallet_id UUID,
  p_reward_type TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_source TEXT,
  p_metadata JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_reward_id UUID;
BEGIN
  SELECT * INTO v_wallet
  FROM wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM reward_history
    WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN jsonb_build_object('success', true, 'error_code', null, 'message', '이미 처리된 요청입니다.');
  END IF;

  INSERT INTO reward_history (
    id, user_id, wallet_id, reward_type, amount, currency, status, source, metadata, idempotency_key,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_user_id, p_wallet_id, p_reward_type, p_amount, p_currency, 'pending',
    p_source, p_metadata, p_idempotency_key, now(), now()
  ) RETURNING id INTO v_reward_id;

  UPDATE wallets
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  INSERT INTO transactions (
    id, user_id, wallet_id, type, direction, amount, currency, status, provider,
    reference_type, reference_id, memo, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_user_id, p_wallet_id, 'reward', 'credit', p_amount, p_currency,
    'completed', 'internal', 'reward_history', v_reward_id, '보상 지급 완료', now(), now()
  );

  UPDATE reward_history
  SET status = 'completed', updated_at = now()
  WHERE id = v_reward_id;

  INSERT INTO audit_logs (
    id, actor_user_id, target_type, target_id, action, before_data, after_data, reason, created_at
  ) VALUES (
    gen_random_uuid(), p_user_id, 'reward_history', v_reward_id, 'payout',
    jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'completed'),
    '보상 지급 완료', now()
  );

  RETURN jsonb_build_object('success', true, 'error_code', null, 'message', '보상이 지급되었습니다.');
END;
$$;
```

### 7.5 complete_deposit
```sql
CREATE OR REPLACE FUNCTION complete_deposit(p_deposit_id UUID, p_provider TEXT, p_provider_reference TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deposit deposit_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_deposit
  FROM deposit_requests
  WHERE id = p_deposit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_DEPOSIT_REQUEST_NOT_FOUND',
      'message', '입금 요청 정보를 찾을 수 없습니다.'
    );
  END IF;

  IF v_deposit.status <> 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ERR_INVALID_STATE_TRANSITION',
      'message', '현재 상태에서는 입금 확정이 불가능합니다.'
    );
  END IF;

  UPDATE deposit_requests
  SET status = 'completed', provider_reference = p_provider_reference, updated_at = now()
  WHERE id = p_deposit_id;

  UPDATE wallets
  SET balance = balance + v_deposit.amount, updated_at = now()
  WHERE id = v_deposit.wallet_id;

  INSERT INTO transactions (
    id, user_id, wallet_id, type, direction, amount, currency, status, provider,
    reference_type, reference_id, memo, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_deposit.user_id, v_deposit.wallet_id, 'deposit', 'credit',
    v_deposit.amount, v_deposit.currency, 'completed', p_provider, 'deposit_requests',
    p_deposit_id, '입금 확정 처리', now(), now()
  );

  INSERT INTO audit_logs (
    id, actor_user_id, target_type, target_id, action, before_data, after_data, reason, created_at
  ) VALUES (
    gen_random_uuid(), NULL, 'deposit_requests', p_deposit_id, 'complete',
    jsonb_build_object('status', 'approved'), jsonb_build_object('status', 'completed'),
    '입금 확정', now()
  );

  RETURN jsonb_build_object('success', true, 'error_code', null, 'message', '입금이 확정되었습니다.');
END;
$$;
```

---

## 8. 테스트 시나리오
- 동일 출금 요청을 동시에 2회 전송해도 available_balance 가 2번 차감되지 않는다.
- 동일 보상 지급 요청을 중복 전송해도 reward_history 가 1건만 생성된다.
- 외부 지급 실패 시 transactions.status = failed 이고 available_balance 가 원복된다.
- idempotency_key 를 재사용하면 동일 response payload 가 반환된다.
