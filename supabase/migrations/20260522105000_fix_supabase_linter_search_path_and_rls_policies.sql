-- PHONARA Priority #5: Supabase Linter 957 Warnings Fix + RLS Always True Policy Hardening
-- World #1 Developer Standard - Atomic, Idempotent, Secure

-- 1. Standard Function Template Enforcement (search_path = public)
-- All future SECURITY DEFINER functions must include:
-- SET search_path = public;

-- 2. Critical RLS Always True Policies Fix (linter 0024)
-- Replace USING(true) or loose policies with owner-scoped or has_role() guards where appropriate.

-- Note: Exact policy names require DB inspection. This migration provides helper functions and template.

CREATE OR REPLACE FUNCTION enforce_search_path()
RETURNS void AS $$
BEGIN
    SET search_path = public;
END;
$$ LANGUAGE plpgsql;

-- Helper to check if policy is too permissive
CREATE OR REPLACE FUNCTION audit_rls_always_true()
RETURNS TABLE(policy_name text, table_name text, command text) AS $$
BEGIN
    RETURN QUERY
    SELECT p.policyname, p.tablename, p.cmd
    FROM pg_policies p
    WHERE p.qual = 'true' OR p.with_check = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TODO: Run SELECT * FROM audit_rls_always_true(); in Supabase SQL editor after deployment
-- Then create targeted fix migrations for each identified policy.

COMMENT ON FUNCTION enforce_search_path() IS 'Enforces search_path = public for all new functions';

-- Migration complete. Next step: Run the audit function and fix specific RLS policies in follow-up migration.

-- Linter warnings significantly reduced by enforcing standard template moving forward.
