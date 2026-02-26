-- Cleanup: Remove all test data for fresh start
-- Run this to clean all tables before retesting with proper user isolation

-- WARNING: This deletes ALL data from these tables
-- Only run if you want a clean slate for testing

-- Delete all scans (CASCADE will handle related data)
DELETE FROM scans;

-- Verify cleanup (should show 0 for all)
SELECT 'scans' as table_name, COUNT(*) as count FROM scans
UNION ALL
SELECT 'competitors', COUNT(*) FROM competitors
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'insights', COUNT(*) FROM insights
UNION ALL
SELECT 'news_feed', COUNT(*) FROM news_feed
UNION ALL
SELECT 'users', COUNT(*) FROM users;

-- Keep users table intact - they're needed for Clerk auth
-- Users will be recreated automatically via Clerk webhook on next login
