-- Validation queries for admin_resolve_deposit idempotency protection
-- Run these after applying the migration to verify data consistency

-- ============================================================================
-- SECTION 1: Baseline Validation (Run First)
-- ============================================================================

-- 1.1 Check deposit_approve_log table exists and is empty initially
SELECT 
  COUNT(*) as total_approve_logs,
  MAX(approved_at) as latest_approval
FROM public.deposit_approve_log;

-- 1.2 Verify function signature updated correctly
SELECT 
  proname as function_name,
  pronargs as arg_count,
  prosecdef as security_definer
FROM pg_proc
WHERE proname = 'admin_resolve_deposit'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 1.3 Get baseline wallet balances
SELECT 
  COUNT(*) as total_wallets,
  SUM(available_balance) as total_available,
  SUM(total_balance) as total_balance
FROM public.wallet_balances;

-- ============================================================================
-- SECTION 2: Post-Approval Validation (Run After Approval)
-- ============================================================================

-- 2.1 Verify approval log entry created for each approved deposit
SELECT 
  dr.id as request_id,
  dr.user_id,
  dr.amount,
  dr.bonus_amount,
  dr.status,
  dr.approved_at,
  dal.admin_id,
  dal.approved_at as log_approved_at,
  CASE WHEN dal.request_id IS NOT NULL THEN 'HAS_LOG' ELSE 'MISSING_LOG' END as log_status
FROM public.deposit_requests dr
LEFT JOIN public.deposit_approve_log dal ON dr.id = dal.request_id
WHERE dr.status::text = 'approved'
ORDER BY dr.approved_at DESC
LIMIT 20;

-- 2.2 Verify transaction created for each approved deposit
SELECT 
  dr.id as request_id,
  dr.user_id,
  dr.amount + COALESCE(dr.bonus_amount, 0) as expected_credit,
  t.amount as transaction_amount,
  t.created_at as transaction_time,
  CASE WHEN t.id IS NOT NULL THEN 'HAS_TXN' ELSE 'MISSING_TXN' END as txn_status
FROM public.deposit_requests dr
LEFT JOIN public.transactions t ON dr.id::text = t.ref_id AND t.kind = 'deposit_credit'
WHERE dr.status::text = 'approved'
ORDER BY dr.approved_at DESC
LIMIT 20;

-- 2.3 Wallet balance consistency check
-- Verify: available_balance <= total_balance for all wallets
SELECT 
  user_id,
  available_balance,
  total_balance,
  (available_balance - total_balance) as discrepancy,
  CASE 
    WHEN available_balance <= total_balance THEN 'OK'
    ELSE 'ERROR: AVAILABLE > TOTAL'
  END as consistency_check
FROM public.wallet_balances
WHERE available_balance > total_balance
ORDER BY discrepancy DESC;

-- 2.4 Verify transactions reference existing deposits
SELECT 
  t.ref_id,
  COUNT(*) as txn_count,
  SUM(t.amount) as total_credited,
  MAX(t.created_at) as latest_credit
FROM public.transactions t
WHERE t.kind = 'deposit_credit'
GROUP BY t.ref_id
HAVING NOT EXISTS (
  SELECT 1 FROM public.deposit_requests dr WHERE dr.id::text = t.ref_id
)
LIMIT 20;

-- ============================================================================
-- SECTION 3: Duplicate Call Simulation (Manual Testing)
-- ============================================================================

-- 3.1 After approval, simulate a retry of the same admin_resolve_deposit call
-- This should return idempotent=true without double-crediting
-- SELECT public.admin_resolve_deposit(
--   _request_id := '<insert_approved_request_uuid>',
--   _action := 'approve',
--   _memo := 'Retry call for testing'
-- );

-- Then verify with:
-- SELECT * FROM public.deposit_approve_log WHERE request_id = '<insert_approved_request_uuid>';
-- Should see exactly ONE entry, not multiple

-- ============================================================================
-- SECTION 4: Inconsistency Detection (Edge Cases)
-- ============================================================================

-- 4.1 Find approved deposits WITH transaction log but missing approve_log entry
-- These are safe (transaction exists) but should log for audit
SELECT 
  dr.id as request_id,
  dr.user_id,
  dr.amount,
  'APPROVED_BUT_NO_LOG' as issue
FROM public.deposit_requests dr
WHERE dr.status::text = 'approved'
AND NOT EXISTS (SELECT 1 FROM public.deposit_approve_log WHERE request_id = dr.id)
AND EXISTS (SELECT 1 FROM public.transactions WHERE ref_id = dr.id::text AND kind = 'deposit_credit');

-- 4.2 Find approved deposits WITHOUT transaction (these should trigger fail-closed error on retry)
SELECT 
  dr.id as request_id,
  dr.user_id,
  dr.amount,
  dr.approved_at,
  'APPROVED_BUT_NO_TXN' as issue
FROM public.deposit_requests dr
WHERE dr.status::text = 'approved'
AND NOT EXISTS (SELECT 1 FROM public.transactions WHERE ref_id = dr.id::text AND kind = 'deposit_credit');

-- ============================================================================
-- SECTION 5: Request Status History Audit
-- ============================================================================

-- 5.1 Verify status history created for each approved deposit
SELECT 
  request_id,
  user_id,
  from_status,
  to_status,
  COUNT(*) as event_count,
  MAX(created_at) as latest_event
FROM public.request_status_history
WHERE request_kind = 'deposit'
GROUP BY request_id, user_id, from_status, to_status
HAVING to_status IN ('approved', 'completed')
ORDER BY latest_event DESC
LIMIT 20;

-- ============================================================================
-- SECTION 6: Concurrent Call Analysis (If applicable)
-- ============================================================================

-- 6.1 Check for duplicate approve logs (should be 0)
SELECT 
  request_id,
  COUNT(*) as duplicate_count
FROM public.deposit_approve_log
GROUP BY request_id
HAVING COUNT(*) > 1;

-- 6.2 Check transaction counts per request (should be 1 per approved deposit)
SELECT 
  ref_id,
  COUNT(*) as txn_count,
  SUM(amount) as total_amount
FROM public.transactions
WHERE kind = 'deposit_credit'
GROUP BY ref_id
HAVING COUNT(*) > 1
ORDER BY txn_count DESC;

-- ============================================================================
-- SECTION 7: Performance & Index Check
-- ============================================================================

-- 7.1 Verify indexes exist and are used
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'deposit_approve_log'
ORDER BY indexname;

-- 7.2 Check index usage (if available in your Supabase setup)
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'deposit_approve_log'
-- ORDER BY idx_scan DESC;

-- ============================================================================
-- SECTION 8: Repair Query (For Inconsistent States)
-- ============================================================================

-- 8.1 Create missing approve logs for approved deposits that have transactions
-- BACKUP: Run SELECT first to see what would be created
SELECT 
  dr.id as request_id,
  dr.admin_id,
  dr.approved_at
FROM public.deposit_requests dr
WHERE dr.status::text = 'approved'
AND NOT EXISTS (SELECT 1 FROM public.deposit_approve_log WHERE request_id = dr.id)
AND EXISTS (SELECT 1 FROM public.transactions WHERE ref_id = dr.id::text AND kind = 'deposit_credit')
LIMIT 20;

-- 8.2 Repair (only if comfortable with the above results):
-- INSERT INTO public.deposit_approve_log(request_id, admin_id, approved_at)
-- SELECT 
--   dr.id,
--   dr.admin_id,
--   dr.approved_at
-- FROM public.deposit_requests dr
-- WHERE dr.status::text = 'approved'
-- AND NOT EXISTS (SELECT 1 FROM public.deposit_approve_log WHERE request_id = dr.id)
-- AND EXISTS (SELECT 1 FROM public.transactions WHERE ref_id = dr.id::text AND kind = 'deposit_credit')
-- ON CONFLICT (request_id) DO NOTHING;

-- ============================================================================
-- SECTION 9: Summary Report
-- ============================================================================

-- 9.1 Complete status overview
SELECT 
  dr.status::text,
  COUNT(*) as total_requests,
  SUM(dr.amount + COALESCE(dr.bonus_amount, 0)) as total_credited,
  COUNT(CASE WHEN dal.request_id IS NOT NULL THEN 1 END) as with_approval_log,
  COUNT(CASE WHEN t.id IS NOT NULL THEN 1 END) as with_transaction
FROM public.deposit_requests dr
LEFT JOIN public.deposit_approve_log dal ON dr.id = dal.request_id
LEFT JOIN public.transactions t ON dr.id::text = t.ref_id AND t.kind = 'deposit_credit'
GROUP BY dr.status::text
ORDER BY total_requests DESC;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
STEP 1: Run SECTION 1 queries first to establish baseline
STEP 2: Manually call admin_resolve_deposit() for test deposit
STEP 3: Run SECTION 2 queries to verify single approval created correct records
STEP 4: Run SECTION 3 first query to simulate retry of same approval
        Should return idempotent=true
STEP 5: Run SECTION 4 queries to check for edge cases
STEP 6: Run SECTION 5-8 for detailed audit if issues found
STEP 7: Run SECTION 9 for final summary

KEY EXPECTATIONS:
- Each approved deposit should have exactly 1 entry in deposit_approve_log
- Each approved deposit should have exactly 1 transaction entry (kind='deposit_credit')
- Wallet balances: available_balance <= total_balance always
- Retry call should return idempotent=true without additional wallet/transaction updates
*/
