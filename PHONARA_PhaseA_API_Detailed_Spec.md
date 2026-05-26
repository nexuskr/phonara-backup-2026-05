# PHONARA Phase A API Detailed Spec

## 목적
Phase A에서 실제 개발을 시작할 수 있도록 주요 API의 요청/응답, 검증 규칙, 상태 전이, 에러 코드 매핑을 정리한 문서입니다.

## 기준
- 백엔드와 프런트엔드가 동일한 계약으로 개발될 수 있어야 합니다.
- Phase A의 핵심 경로만 우선 정의합니다.
- 모든 응답은 [PHONARA_PhaseA_ErrorCode_ResponseFormat.md](PHONARA_PhaseA_ErrorCode_ResponseFormat.md)의 공통 포맷을 따릅니다.

---

## 1. 공통 규칙

### 1.1 공통 응답 포맷
- 성공/실패 응답 구조는 공통 포맷 문서를 따릅니다.

### 1.2 인증
- 모든 사용자 API는 인증 토큰 기반으로 호출됩니다.
- 관리자 API는 관리자 권한이 필요합니다.

### 1.3 공통 검증 규칙
- amount 는 `0 < amount <= 1e12` 범위로 제한합니다.
- currency 는 `USDT`, `KRW`, `POINT` 중 하나여야 합니다.
- method 는 API별 허용 값만 허용합니다.
- trace_id 는 응답에 항상 포함됩니다.

### 1.4 상태 값 기준
- deposit_requests.status: `pending`, `approved`, `rejected`, `completed`, `failed`
- withdrawal_requests.status: `pending`, `approved`, `rejected`, `processing`, `completed`, `failed`
- transactions.status: `pending`, `completed`, `failed`, `reversed`

---

## 2. CreateDeposit

### 목적
사용자가 입금 요청을 생성합니다.

### Endpoint
- `POST /api/v1/deposits`

### Request
```json
{
  "method": "USDT",
  "amount": 100,
  "currency": "USDT",
  "memo": "첫 입금",
  "voucher_code": null,
  "bank_name": null,
  "bank_account_mask": null,
  "tx_hash": "0xabc123",
  "idempotency_key": "dep_20260526_001"
}
```

### Supported Methods
- `USDT`
- `KRW_TRANSFER`
- `VOUCHER`

### Validation
- method 는 필수입니다.
- amount 는 필수이며 0보다 커야 합니다.
- currency 는 필수이며 `USDT`, `KRW` 중 하나여야 합니다.
- `USDT` 인 경우 `tx_hash` 는 필수입니다.
- `KRW_TRANSFER` 인 경우 `bank_name`, `bank_account_mask` 가 필수입니다.
- `VOUCHER` 인 경우 `voucher_code` 가 필수입니다.
- `idempotency_key` 는 선택값이며, 제공 시 동일 키로 재요청하면 기존 결과를 반환합니다.
- 동일 사용자가 현재 `pending` 상태의 동일 요청을 중복 생성할 수 없습니다.

### Success Response
```json
{
  "success": true,
  "error_code": null,
  "message": "입금 요청이 생성되었습니다.",
  "data": {
    "request_id": "dep_123",
    "status": "pending",
    "method": "USDT",
    "amount": 100,
    "currency": "USDT"
  },
  "trace_id": "uuid-v4"
}
```

### Error Mapping
| 상황 | error_code | message |
| --- | --- | --- |
| 필수 값 누락 / 형식 오류 | `ERR_INVALID_INPUT` | 입력값이 올바르지 않습니다. |
| 지원하지 않는 방식 | `ERR_DEPOSIT_METHOD_UNSUPPORTED` | 지원하지 않는 입금 방식입니다. |
| 동일 요청 중복 | `ERR_DUPLICATE_REQUEST` | 이미 처리 중인 요청이 있습니다. |
| 서버 장애 | `ERR_INTERNAL_SERVER` | 요청을 처리하는 중 오류가 발생했습니다. |

### State Transition
- `pending` → `approved` → `completed`
- `pending` → `rejected`
- `pending` → `failed`

---

## 3. CreateWithdrawalRequest

### 목적
사용자가 출금 요청을 생성합니다.

### Endpoint
- `POST /api/v1/withdrawals`

### Request
```json
{
  "method": "USDT",
  "amount": 50,
  "currency": "USDT",
  "wallet_address": "0xabc...",
  "bank_name": null,
  "bank_account_mask": null,
  "memo": "출금 요청",
  "idempotency_key": "wd_20260526_001"
}
```

### Validation
- method 는 필수입니다.
- amount 는 필수이며 0보다 커야 합니다.
- currency 는 필수이며 `USDT`, `KRW` 중 하나여야 합니다.
- `USDT` 인 경우 `wallet_address` 가 필수입니다.
- `KRW_TRANSFER` 인 경우 `bank_name`, `bank_account_mask` 가 필수입니다.
- `idempotency_key` 는 선택값이며, 제공 시 동일 키로 재요청하면 기존 결과를 반환합니다.
- 요청 금액은 사용자의 `available_balance` 를 초과할 수 없습니다.
- 동일 사용자가 현재 `pending` 또는 `processing` 상태의 출금 요청을 중복 생성할 수 없습니다.

### Success Response
```json
{
  "success": true,
  "error_code": null,
  "message": "출금 요청이 생성되었습니다.",
  "data": {
    "request_id": "wd_123",
    "status": "pending",
    "method": "USDT",
    "amount": 50,
    "currency": "USDT"
  },
  "trace_id": "uuid-v4"
}
```

### Error Mapping
| 상황 | error_code | message |
| --- | --- | --- |
| 필수 값 누락 / 형식 오류 | `ERR_INVALID_INPUT` | 입력값이 올바르지 않습니다. |
| 잔액 부족 | `ERR_INSUFFICIENT_BALANCE` | 잔액이 부족합니다. |
| 중복 제출 | `ERR_DUPLICATE_REQUEST` | 이미 처리 중인 요청이 있습니다. |
| 서버 장애 | `ERR_INTERNAL_SERVER` | 요청을 처리하는 중 오류가 발생했습니다. |

### State Transition
- `pending` → `approved` → `processing` → `completed`
- `pending` → `rejected`
- `pending` → `failed`
- `processing` → `failed`

---

## 4. GetTransactions

### 목적
사용자의 최근 거래 내역을 조회합니다.

### Endpoint
- `GET /api/v1/transactions`

### Query Params
- `limit` (default: 20)
- `cursor`
- `type`
- `status`

### Validation
- `limit` 는 1~100 범위입니다.
- `type` 는 `deposit`, `withdrawal`, `reward`, `adjustment`, `fee` 중 하나여야 합니다.
- `status` 는 `pending`, `completed`, `failed`, `reversed` 중 하나여야 합니다.

### Success Response
```json
{
  "success": true,
  "error_code": null,
  "message": "거래 내역을 조회했습니다.",
  "data": {
    "items": [
      {
        "transaction_id": "tx_001",
        "type": "deposit",
        "direction": "credit",
        "amount": 100,
        "currency": "USDT",
        "status": "completed",
        "created_at": "2026-05-26T00:00:00Z"
      }
    ],
    "next_cursor": null
  },
  "trace_id": "uuid-v4"
}
```

### Error Mapping
| 상황 | error_code | message |
| --- | --- | --- |
| 인증 실패 | `ERR_UNAUTHORIZED` | 로그인이 필요합니다. |
| 조회 실패 | `ERR_INTERNAL_SERVER` | 요청을 처리하는 중 오류가 발생했습니다. |

---

## 5. PayoutReward

### 목적
보상 지급을 생성하고 잔액 반영까지 연결합니다.

### Endpoint
- `POST /api/v1/rewards/payout`

### Request
```json
{
  "user_id": "uuid",
  "reward_type": "mission_complete",
  "amount": 10,
  "currency": "POINT",
  "source": "mission",
  "metadata": {
    "mission_key": "daily_login"
  },
  "idempotency_key": "reward_20260526_001"
}
```

### Validation
- user_id 는 필수입니다.
- reward_type 는 필수입니다.
- amount 는 필수이며 0보다 커야 합니다.
- currency 는 필수이며 `USDT`, `KRW`, `POINT` 중 하나여야 합니다.
- `idempotency_key` 는 선택값이며, 제공 시 동일 키로 재요청하면 기존 결과를 반환합니다.
- 동일 reward_type + source + metadata 조합으로 중복 지급이 발생하지 않아야 합니다.

### Success Response
```json
{
  "success": true,
  "error_code": null,
  "message": "보상이 지급되었습니다.",
  "data": {
    "reward_id": "rw_001",
    "wallet_id": "wallet_001",
    "amount": 10,
    "currency": "POINT",
    "status": "completed"
  },
  "trace_id": "uuid-v4"
}
```

### Error Mapping
| 상황 | error_code | message |
| --- | --- | --- |
| 중복 지급 | `ERR_REWARD_ALREADY_CLAIMED` | 이미 지급된 보상입니다. |
| 지급 실패 | `ERR_REWARD_PAYOUT_FAILED` | 보상 지급에 실패했습니다. |
| 서버 장애 | `ERR_INTERNAL_SERVER` | 요청을 처리하는 중 오류가 발생했습니다. |

### State Transition
- `pending` → `completed`
- `pending` → `failed`

---

## 6. AdminApproveWithdrawal

### 목적
관리자가 출금 요청을 승인합니다.

### Endpoint
- `POST /api/v1/admin/withdrawals/{withdrawal_id}/approve`

### Validation
- 관리자 권한 필요
- 대상 출금 요청이 존재해야 함
- 현재 상태는 `pending` 이어야 함
- 잔액 검증 후 승인 가능

### Success Response
```json
{
  "success": true,
  "error_code": null,
  "message": "출금 요청이 승인되었습니다.",
  "data": {
    "withdrawal_id": "wd_123",
    "status": "approved"
  },
  "trace_id": "uuid-v4"
}
```

### Error Mapping
| 상황 | error_code | message |
| --- | --- | --- |
| 관리자 권한 없음 | `ERR_ADMIN_REQUIRED` | 관리자 권한이 필요합니다. |
| 요청 없음 | `ERR_WITHDRAWAL_REQUEST_NOT_FOUND` | 출금 요청 정보를 찾을 수 없습니다. |
| 상태 전이 불가 | `ERR_INVALID_STATE_TRANSITION` | 현재 상태에서는 변경할 수 없습니다. |
| 감사 로그 실패 | `ERR_AUDIT_LOG_WRITE_FAILED` | 요청은 처리되었지만 로그 저장에 실패했습니다. |
| 서버 장애 | `ERR_INTERNAL_SERVER` | 요청을 처리하는 중 오류가 발생했습니다. |

### State Transition
- `pending` → `approved` → `processing` → `completed`
- `pending` → `rejected`

---

## 7. AdminRejectWithdrawal

### 목적
관리자가 출금 요청을 거절합니다.

### Endpoint
- `POST /api/v1/admin/withdrawals/{withdrawal_id}/reject`

### Request
```json
{
  "reason": "검증 실패"
}
```

### Validation
- 관리자 권한 필요
- 대상 출금 요청이 존재해야 함
- 현재 상태는 `pending` 이어야 함
- reason 는 필수입니다.

### Success Response
```json
{
  "success": true,
  "error_code": null,
  "message": "출금 요청이 거절되었습니다.",
  "data": {
    "withdrawal_id": "wd_123",
    "status": "rejected"
  },
  "trace_id": "uuid-v4"
}
```

### Error Mapping
| 상황 | error_code | message |
| --- | --- | --- |
| 관리자 권한 없음 | `ERR_ADMIN_REQUIRED` | 관리자 권한이 필요합니다. |
| 요청 없음 | `ERR_WITHDRAWAL_REQUEST_NOT_FOUND` | 출금 요청 정보를 찾을 수 없습니다. |
| 상태 전이 불가 | `ERR_INVALID_STATE_TRANSITION` | 현재 상태에서는 변경할 수 없습니다. |
| 서버 장애 | `ERR_INTERNAL_SERVER` | 요청을 처리하는 중 오류가 발생했습니다. |

### State Transition
- `pending` → `rejected`

---

## 8. 구현 참고
- 요청 생성 API는 `idempotency_key` 를 선택적으로 수용합니다.
- 관리자 승인 API는 `approve_withdrawal` RPC를 사용합니다.
- 외부 지급 성공/실패는 각각 `complete_withdrawal` / `fail_withdrawal` RPC를 사용합니다.
- 보상 지급은 `process_reward_payout` RPC를 사용합니다.
- 입금 확정은 `complete_deposit` RPC를 사용합니다.
