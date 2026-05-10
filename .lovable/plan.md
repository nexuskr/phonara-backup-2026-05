
# wallet_balances `chk_consistency` 위반 핫픽스

## 🐛 근본 원인

`wallet_balances` 테이블 제약:
```
CHECK (total_balance = available_balance + pending_balance + locked_balance)
```

**4개 close 계열 함수**가 wallet UPDATE 시 `total_balance`에서 `v_fee_close`를 한 번 더 빼버려 제약을 깨뜨립니다.

| 함수 | 현재 (버그) | 올바른 식 |
|---|---|---|
| `live_close_position` | `total += v_credit - p.margin - v_fee_close` | `total += v_credit - p.margin` |
| `live_liquidate_position` | (동일 패턴) | (동일) |
| `admin_force_close_position(uuid, numeric, text)` | (동일 패턴) | (동일) |
| `admin_force_close_position(uuid, numeric, text, numeric)` | (동일 패턴) | (동일) |

### 왜 이게 정답인가
`v_credit = GREATEST(0, p.margin + v_pnl - v_fee_close)` 이므로:
- 정상(클램프 안 됨): `Δtotal = v_credit - margin = pnl - fee_close` ✅
- 클램프(`v_credit = 0`, 큰 손실): `Δtotal = -margin` — 이미 음수 PnL이 margin을 모두 소진, 초과분은 보험기금 부담 ✅

`Δavail + Δlocked = v_credit + (-margin) = v_credit - margin = Δtotal` ✅

## 📍 사용자에게 드러난 증상

1. 백그라운드 watcher(client `position-watcher` + cron `enforce-position-triggers-1m`)가 SL/TP/Trailing/Cross-MM 조건으로 close 시도
2. 트랜잭션이 chk_consistency 위반으로 롤백
3. 사용자가 LONG 클릭한 시점에 **다른 close 시도의 에러 토스트**가 우연히 표시 → "오픈 시 오류"로 오인
4. 포지션은 그대로 열려 있고, wallet도 변경 없음 (롤백 덕분)

## 🛠️ 마이그레이션 내용

4개 함수의 wallet UPDATE 라인 단 한 줄씩만 교체:

```sql
-- 변경 전
total_balance = total_balance + v_credit - p.margin - v_fee_close

-- 변경 후
total_balance = total_balance + v_credit - p.margin
```

다른 모든 로직(insurance_fund, live_trade_history, transactions, position_trigger_audit) **변경 없음**.

## ✅ 검증 절차

마이그레이션 적용 후:

1. **DB 시뮬레이션 쿼리** 재실행 — 임의 (margin, pnl, fee) 조합에 대해 `Δtotal == Δavail + Δlocked` 성립 확인
2. **사용자 시나리오 재현**:
   - REAL 모드에서 SOLUSDT 새 포지션 LONG 5×, 50,000원 오픈
   - TP Price = 현재가 -0.01% (즉시 발동)
   - 1분 내 cron이 자동 청산 → Trade History에 `reason='tp'`, `source='cron'` 기록
   - wallet_balances 일관성 유지 확인
3. **기존 두 포지션도 정상 청산 가능** 확인 (수동 청산 테스트)

## 🔒 부수 효과 / 리스크

- **None.** SECURITY DEFINER allowlist, RLS, 기타 트리거 영향 없음.
- 과거 잘못된 함수로 청산된 거래는 없음 (트랜잭션이 모두 롤백되어 wallet은 손상 없음).

승인하시면 즉시 마이그레이션 실행 후 검증 결과 보고합니다.
