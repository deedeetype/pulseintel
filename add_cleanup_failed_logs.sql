-- ========================================
-- Automatic Cleanup of Failed Refresh Logs
-- Date: 2026-03-02
-- ========================================

-- Option 1: Delete failed logs older than 7 days (keep recent failures for debugging)
DELETE FROM refresh_logs
WHERE status = 'failed'
  AND completed_at < NOW() - INTERVAL '7 days';

-- Option 2: Keep only the last 3 failed logs per scan (rolling window)
DELETE FROM refresh_logs
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY scan_id ORDER BY started_at DESC) as rn
    FROM refresh_logs
    WHERE status = 'failed'
  ) sub
  WHERE rn > 3
);

-- Verify: Show remaining failed logs
SELECT 
  scan_id,
  status,
  error_message,
  started_at,
  AGE(NOW(), started_at) as age
FROM refresh_logs
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 10;
