-- ========================================
-- Migration: Add industry to refresh_logs
-- Date: 2026-03-02
-- Safe: ✅ Non-breaking (nullable column)
-- ========================================

-- 1. Add industry column (nullable, non-breaking)
ALTER TABLE refresh_logs 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- 2. Backfill existing logs with industry from scans (if any exist)
UPDATE refresh_logs rl
SET industry = s.industry
FROM scans s
WHERE rl.scan_id = s.id 
  AND rl.industry IS NULL;

-- 3. Verify the change
SELECT 
  id, 
  scan_id, 
  industry, 
  status, 
  started_at
FROM refresh_logs
ORDER BY started_at DESC
LIMIT 5;

-- 4. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'refresh_logs'
ORDER BY ordinal_position;
