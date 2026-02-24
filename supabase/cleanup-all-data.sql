-- PulseIntel: Clean all scan/competitor/alert/insight/news data
-- Keeps users table intact
-- Run this in Supabase SQL Editor to start fresh

-- Delete all data in reverse dependency order
DELETE FROM news_feed;
DELETE FROM insights;
DELETE FROM alerts;
DELETE FROM competitors;
DELETE FROM scans;

-- Reset auto-increment sequences if needed (optional)
-- ALTER SEQUENCE scans_id_seq RESTART WITH 1;

-- Verify counts
SELECT 
  (SELECT COUNT(*) FROM scans) as scans_count,
  (SELECT COUNT(*) FROM competitors) as competitors_count,
  (SELECT COUNT(*) FROM alerts) as alerts_count,
  (SELECT COUNT(*) FROM insights) as insights_count,
  (SELECT COUNT(*) FROM news_feed) as news_count,
  (SELECT COUNT(*) FROM users) as users_count;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
