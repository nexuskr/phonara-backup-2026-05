# PHONARA Phase A Transaction Consistency

## 목적
Phase A에서 데이터 정합성, 동시성, idempotency, 실패/롤백 전략을 실제 구현 기준으로 정리한 문서입니다.

## 목표
- 잔액/거래/보상 흐름에서 정합성을 보장합니다.
- 출금 및 보상 지급 시 동시성 문제를 예방합니다.
- 중복 요청이 들어와도 안전하게 처리합니다.
- 실패 시 rollback 범위와 복구 기준을 명확히 합니다.

---

## 1. 핵심 원칙
1. 돈이 변하는 모든 흐름은 원자적으로 처리합니다.
2. 잔액 차감과 거래 기록은 같은 트랜잭션에서 처리합니다.
3. 출금/보상은 동시 요청에 대해 락을 사용합니다.
4. idempotency_key 를 통해 중복 요청을 통제합니다.
5. 실패 시 복구 가능한 상태를 먼저 정의합니다.

---

## 2. 트랜잭션 경계

### 2.1 Deposit
- deposit_requests.status 업데이트
- wallets.balance 증가
- transactions 기록 생성
- audit_logs 기록 생성

### 2.2 Withdrawal
- withdrawal_requests.status 업데이트
- wallets.available_balance 차감
- transactions 기록 생성
- audit_logs 기록 생성

### 2.3 Reward
- reward_history 기록 생성 또는 상태 변경
- wallets.balance 또는 available_balance 업데이트
- transactions 기록 생성
- audit_logs 기록 생성

---

## 3. 동시성 제어
- 출금/보상은 wallets 행 잠금을 사용합니다.
- idempotency_key 를 병행합니다.
- 락 순서는 wallets → 대상 요청 테이블입니다.

---

## 4. Idempotency 정책
- CreateDeposit, CreateWithdrawalRequest, PayoutReward 는 idempotency_key 를 수용합니다.
- 동일 키 요청은 기존 결과를 그대로 반환합니다.
- 중복 키는 유니크 인덱스로 방지합니다.

---

## 5. 실패 / 롤백 전략

### 5.1 Withdrawal
- 외부 지급 실패 시 wallets.available_balance 를 원복합니다.
- withdrawal_requests.status 를 failed 로 변경합니다.
- transactions.status 를 failed 로 변경합니다.
- audit_logs 에 복구 원인을 기록합니다.

### 5.2 Reward
- reward_history.status = failed
- transactions.status = failed
- audit_logs 기록

### 5.3 Deposit
- deposit_requests.status = failed
- transactions.status = failed
- audit_logs 기록
