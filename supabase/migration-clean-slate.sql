-- ============================================
-- CLEAN SLATE: Reset all data for production
-- ============================================
-- WARNING: This will DELETE ALL existing scans, competitors, alerts, insights, news, and users
-- Only run this if you're ready to start fresh with proper RLS policies

-- Disable RLS temporarily to allow deletion
ALTER TABLE scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Delete all data (CASCADE will handle foreign keys)
TRUNCATE TABLE scans CASCADE;
TRUNCATE TABLE competitors CASCADE;
TRUNCATE TABLE alerts CASCADE;
TRUNCATE TABLE insights CASCADE;
TRUNCATE TABLE news_feed CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Reload schema
NOTIFY pgrst, 'reload schema';

-- Done! Users will be recreated automatically via Clerk webhook on next sign-in
