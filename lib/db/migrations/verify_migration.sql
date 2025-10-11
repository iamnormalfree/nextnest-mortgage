-- Verification Script: Check Dr. Elena Database Setup
-- Run this first to see what's already configured

-- =============================================================================
-- PART 1: Check Tables
-- =============================================================================
SELECT
  'Tables Status' as check_type,
  table_name,
  CASE
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'conversation_turns', 'calculation_audit')
ORDER BY table_name;

-- =============================================================================
-- PART 2: Check Indexes
-- =============================================================================
SELECT
  'Indexes Status' as check_type,
  indexname as index_name,
  tablename as table_name,
  '✅ EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_turns', 'calculation_audit')
ORDER BY tablename, indexname;

-- =============================================================================
-- PART 3: Check RLS Policies
-- =============================================================================
SELECT
  'Policies Status' as check_type,
  tablename as table_name,
  policyname as policy_name,
  '✅ EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_turns', 'calculation_audit')
ORDER BY tablename, policyname;

-- =============================================================================
-- PART 4: Check Views
-- =============================================================================
SELECT
  'Views Status' as check_type,
  table_name as view_name,
  '✅ EXISTS' as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('active_conversations', 'model_usage_stats', 'calculation_compliance_report')
ORDER BY table_name;

-- =============================================================================
-- PART 5: Check RLS Enabled
-- =============================================================================
SELECT
  'RLS Status' as check_type,
  tablename as table_name,
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_turns', 'calculation_audit');

-- =============================================================================
-- PART 6: Test Insert Permissions (Cleanup after)
-- =============================================================================
-- This will test if service role can insert
-- If you see "✅ CAN INSERT", your permissions are correct

DO $$
BEGIN
  -- Try to insert a test record
  INSERT INTO conversations (id, user_id, broker_persona, lead_score, loan_type)
  VALUES ('test-verify-001', 'test-user', 'balanced', 75, 'new_purchase');

  -- If we got here, insertion worked
  RAISE NOTICE '✅ CAN INSERT - Service role permissions correct';

  -- Clean up
  DELETE FROM conversations WHERE id = 'test-verify-001';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ CANNOT INSERT - Error: %', SQLERRM;
END $$;
