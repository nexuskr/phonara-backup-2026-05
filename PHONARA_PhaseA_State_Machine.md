# PHONARA Phase A State Machine

## 목적
Phase A에서 입금, 출금, 보상, 거래, 감사 로그가 어떻게 상태를 전이하는지 정의합니다.

## 목표
- API 개발 시 상태 전이를 기준으로 구현할 수 있게 합니다.
- 데이터 정합성을 위해 트랜잭션 경계와 동시성 규칙을 함께 정의합니다.
- 프런트엔드가 상태 기반 UI를 안정적으로 구현할 수 있게 합니다.

---

## 1. 핵심 원칙
- 상태는 각 테이블의 status 컬럼을 기준으로 관리합니다.
- 상태 전이는 서버에서만 변경 가능합니다.
- 모든 상태 변경 시 audit_logs 에 기록합니다.
- 잔액 변경, 거래 기록, 보상 기록, 감사 로그 기록은 같은 트랜잭션에서 처리합니다.

---

## 2. 상태 정의

### 2.1 Deposit Requests
| 상태 | 의미 |
| --- | --- |
| pending | 요청 생성 완료, 검토 대기 |
| approved | 요청 승인 완료 |
| rejected | 요청 거절 완료 |
| completed | 입금 처리 완료 |
| failed | 처리 실패 |

### 2.2 Withdrawal Requests
| 상태 | 의미 |
| --- | --- |
| pending | 요청 생성 완료, 관리자 검토 대기 |
| approved | 관리자 승인 완료 |
| rejected | 관리자 거절 완료 |
| processing | 실제 출금 처리 진행 중 |
| completed | 출금 완료 |
| failed | 처리 실패 |

### 2.3 Transactions
| 상태 | 의미 |
| --- | --- |
| pending | 트랜잭션 생성됨, 반영 전 |
| completed | 트랜잭션 완료 |
| failed | 트랜잭션 실패 |
| reversed | 취소/되돌림 |

### 2.4 Reward History
| 상태 | 의미 |
| --- | --- |
| pending | 지급 요청 생성됨 |
| completed | 지급 완료 |
| failed | 지급 실패 |

---

## 3. 상태 전이 규칙

### 3.1 Deposit Requests
| 현재 | 다음 | 조건 |
| --- | --- | --- |
| pending | approved | 관리자 승인 |
| pending | rejected | 관리자 거절 |
| approved | completed | 입금 확정 처리 성공 |
| approved | failed | 입금 확정 처리 실패 |
| pending | failed | 시스템 검증 실패 |

### 3.2 Withdrawal Requests
| 현재 | 다음 | 조건 |
| --- | --- | --- |
| pending | approved | 관리자 승인 |
| pending | rejected | 관리자 거절 |
| approved | processing | 실제 출금 처리 진입 |
| processing | completed | 외부 지급 성공 |
| processing | failed | 외부 지급 실패 |
| approved | failed | 승인 후 처리 실패 |

### 3.3 Transactions
| 현재 | 다음 | 조건 |
| --- | --- | --- |
| pending | completed | 잔액 반영 완료 |
| pending | failed | 처리 실패 |
| completed | reversed | 관리자/시스템 취소 |

### 3.4 Reward History
| 현재 | 다음 | 조건 |
| --- | --- | --- |
| pending | completed | 지급 반영 완료 |
| pending | failed | 지급 실패 |

---

## 4. API별 상태 전이

### 4.1 CreateDeposit
- pending → approved → completed
- pending → failed
- approved → failed

### 4.2 CreateWithdrawalRequest
- pending → approved → processing → completed
- pending → rejected
- processing → failed

### 4.3 PayoutReward
- pending → completed
- pending → failed

### 4.4 AdminApproveWithdrawal
- pending → approved

### 4.5 AdminRejectWithdrawal
- pending → rejected

---

## 5. 트랜잭션 경계

### 5.1 Deposit
- deposit_requests.status 업데이트
- wallets.balance 증가
- transactions 기록 생성
- audit_logs 기록 생성

### 5.2 Withdrawal
- withdrawal_requests.status 업데이트
- wallets.available_balance 차감
- transactions 기록 생성
- audit_logs 기록 생성

### 5.3 Reward
- reward_history 기록 생성 또는 상태 변경
- wallets.balance 또는 available_balance 업데이트
- transactions 기록 생성
- audit_logs 기록 생성

---

## 6. 동시성 제어
- 출금/보상은 wallets 행 락을 사용합니다.
- 입금은 idempotency_key 로 중복 처리 위험을 줄입니다.
- 상태 검증은 락 획득 이후에 재검증합니다.
