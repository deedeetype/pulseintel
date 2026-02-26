-- ========================================
-- PULSEINTEL DATABASE AUDIT
-- Date: 2026-02-25
-- ========================================

-- 1. CHECK USERS TABLE STRUCTURE
-- Problem: Duplicate users on signup
SELECT 
  'users table structure' as audit_step,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check for duplicate clerk_id
SELECT 
  'duplicate clerk_id check' as audit_step,
  clerk_id,
  COUNT(*) as count
FROM users
GROUP BY clerk_id
HAVING COUNT(*) > 1;

-- Check for duplicate emails
SELECT 
  'duplicate email check' as audit_step,
  email,
  COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- See all users
SELECT 
  'all users' as audit_step,
  id,
  clerk_id,
  email,
  created_at
FROM users
ORDER BY created_at DESC;

-- ========================================
-- 2. CHECK SCANS TABLE & RLS POLICIES
-- ========================================

-- Check scans table constraints
SELECT 
  'scans constraints' as audit_step,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'scans';

-- Check scans RLS policies
SELECT 
  'scans RLS policies' as audit_step,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'scans';

-- Check if scans have proper user_id
SELECT 
  'scans user_id check' as audit_step,
  COUNT(*) as total_scans,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT user_id) as user_ids
FROM scans;

-- ========================================
-- 3. CHECK REFRESH_LOGS TABLE
-- ========================================

-- Check if refresh_logs table exists
SELECT 
  'refresh_logs exists' as audit_step,
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'refresh_logs'
  ) as table_exists;

-- If exists, check structure
SELECT 
  'refresh_logs structure' as audit_step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'refresh_logs'
ORDER BY ordinal_position;

-- Check refresh_logs RLS
SELECT 
  'refresh_logs RLS policies' as audit_step,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'refresh_logs';

-- Check refresh_logs content
SELECT 
  'refresh_logs data' as audit_step,
  COUNT(*) as total_logs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN status = 'running' THEN 1 END) as running_count
FROM refresh_logs;

-- ========================================
-- 4. CHECK SCAN_SCHEDULES TABLE
-- ========================================

SELECT 
  'scan_schedules data' as audit_step,
  id,
  user_id,
  scan_id,
  enabled,
  last_run_at,
  next_run_at,
  frequency
FROM scan_schedules;

-- ========================================
-- 5. CHECK ALL RLS POLICIES (SECURITY AUDIT)
-- ========================================

SELECT 
  'all RLS policies' as audit_step,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 6. CHECK MISSING TABLES
-- ========================================

SELECT 
  'missing tables check' as audit_step,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN 'exists' 
    ELSE 'MISSING' 
  END as users_table,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'scans') THEN 'exists' 
    ELSE 'MISSING' 
  END as scans_table,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'refresh_logs') THEN 'exists' 
    ELSE 'MISSING' 
  END as refresh_logs_table,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_schedules') THEN 'exists' 
    ELSE 'MISSING' 
  END as scan_schedules_table,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'competitors') THEN 'exists' 
    ELSE 'MISSING' 
  END as competitors_table,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN 'exists' 
    ELSE 'MISSING' 
  END as alerts_table,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'insights') THEN 'exists' 
    ELSE 'MISSING' 
  END as insights_table,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'news_feed') THEN 'exists' 
    ELSE 'MISSING' 
  END as news_feed_table;
