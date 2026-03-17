-- Migration: Database Function Security Hardening (Phase 11)
-- Date: 2026-03-27
-- Description: Fixes linter warnings for role-mutable search paths by explicitly setting search_path.

-- 1. DYNAMIC HARDENING BLOCK
-- This block identifies ALL functions in the 'public' schema that do not have an explicit search_path set
-- and applies 'SET search_path = public' to them. This catches 'ghost' functions like add_xp, etc.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND (p.proconfig IS NULL OR NOT (p.proconfig @> ARRAY['search_path=public']))
          AND p.prokind = 'f' -- Only regular functions
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_record.func_signature);
            RAISE NOTICE 'Hardened: %', func_record.func_signature;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to harden %: %', func_record.func_signature, SQLERRM;
        END;
    LOOP;
END $$;

-- 2. AUTH SECURITY RECOMMENDATION
-- Note: 'Leaked Password Protection' must be enabled in the Supabase Dashboard:
-- Auth > Settings > Password Policy > Enable 'Leaked Password Protection'
