-- Migration: Fix RLS Security - User Isolation (CORRECTED VERSION)
-- CRITICAL: Current RLS policies allow users to see each other's data
-- This migration fixes user isolation by properly filtering on TEXT user_id

-- =============================================================================
-- SOLUTION: All tables use user_id TEXT (Clerk IDs like "user_3AD...")
-- RLS policies need to filter on: user_id = auth.uid()::text (direct comparison)
-- NO UUID conversion needed - the TEXT model is correct!
-- =============================================================================

-- Step 1: Drop ALL existing broken policies
DROP POLICY IF EXISTS "Users can view own scans" ON scans;
DROP POLICY IF EXISTS "Public read scans" ON scans;
DROP POLICY IF EXISTS "Public delete scans" ON scans;
DROP POLICY IF EXISTS "Users can read own scans" ON scans;
DROP POLICY IF EXISTS "Users can insert own scans" ON scans;
DROP POLICY IF EXISTS "Users can update own scans" ON scans;
DROP POLICY IF EXISTS "Users can delete own scans" ON scans;
DROP POLICY IF EXISTS "Users can view own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can read own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can insert own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can delete own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can read own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can view own insights" ON insights;
DROP POLICY IF EXISTS "Users can read own insights" ON insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON insights;
DROP POLICY IF EXISTS "Users can delete own insights" ON insights;
DROP POLICY IF EXISTS "Users can view own news" ON news_feed;
DROP POLICY IF EXISTS "Users can read own news" ON news_feed;
DROP POLICY IF EXISTS "Users can insert own news" ON news_feed;
DROP POLICY IF EXISTS "Users can delete own news" ON news_feed;

-- Step 2: Create CORRECT RLS policies that filter on TEXT user_id = Clerk ID
-- Scans
CREATE POLICY "Users can read own scans" ON scans
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own scans" ON scans
  FOR UPDATE 
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own scans" ON scans
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Competitors
CREATE POLICY "Users can read own competitors" ON competitors
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own competitors" ON competitors
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own competitors" ON competitors
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Alerts
CREATE POLICY "Users can read own alerts" ON alerts
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own alerts" ON alerts
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own alerts" ON alerts
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Insights
CREATE POLICY "Users can read own insights" ON insights
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- News Feed
CREATE POLICY "Users can read own news" ON news_feed
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own news" ON news_feed
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own news" ON news_feed
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_news_user_id ON news_feed(user_id);

COMMENT ON POLICY "Users can read own scans" ON scans IS 
  'Critical security: Users can ONLY see their own scans via direct TEXT comparison: user_id = auth.uid()::text';
