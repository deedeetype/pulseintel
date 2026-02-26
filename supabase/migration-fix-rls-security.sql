-- Migration: Fix RLS Security - User Isolation
-- CRITICAL: Current RLS policies allow users to see each other's data
-- This migration fixes user isolation by properly filtering on clerk_id

-- =============================================================================
-- PROBLEM: Scans are created with user_id = Clerk string ID (e.g. "user_3AD...")
-- but RLS policies compare against users.id (UUID)
-- RESULT: Policy never matches, all users see all data
-- =============================================================================

-- Step 1: Drop existing broken policies
DROP POLICY IF EXISTS "Users can view own scans" ON scans;
DROP POLICY IF EXISTS "Public read scans" ON scans;
DROP POLICY IF EXISTS "Public delete scans" ON scans;

-- Step 2: Normalize scans.user_id to use UUID (Supabase users.id)
-- Currently scans.user_id contains Clerk ID strings - need to convert to UUIDs

-- Add temp column for migration
ALTER TABLE scans ADD COLUMN IF NOT EXISTS user_uuid UUID;

-- Map Clerk IDs to Supabase UUIDs
UPDATE scans 
SET user_uuid = users.id 
FROM users 
WHERE scans.user_id = users.clerk_id;

-- Drop old column and rename new one
ALTER TABLE scans DROP COLUMN IF EXISTS user_id;
ALTER TABLE scans RENAME COLUMN user_uuid TO user_id;

-- Add foreign key constraint
ALTER TABLE scans 
  DROP CONSTRAINT IF EXISTS scans_user_id_fkey,
  ADD CONSTRAINT scans_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Make user_id NOT NULL
ALTER TABLE scans ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Create SECURE RLS policies that actually filter by user
CREATE POLICY "Users can read own scans" ON scans
  FOR SELECT 
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT 
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

CREATE POLICY "Users can update own scans" ON scans
  FOR UPDATE 
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

CREATE POLICY "Users can delete own scans" ON scans
  FOR DELETE 
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

-- Step 4: Verify and fix other tables (should be OK since they reference users.id already)
-- But let's be explicit about ALL data isolation

-- Competitors
DROP POLICY IF EXISTS "Users can view own competitors" ON competitors;
CREATE POLICY "Users can read own competitors" ON competitors
  FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can insert own competitors" ON competitors
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Alerts
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
CREATE POLICY "Users can read own alerts" ON alerts
  FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Insights
DROP POLICY IF EXISTS "Users can view own insights" ON insights;
CREATE POLICY "Users can read own insights" ON insights
  FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- News Feed
DROP POLICY IF EXISTS "Users can view own news" ON news_feed;
CREATE POLICY "Users can read own news" ON news_feed
  FOR SELECT 
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Step 5: Add helper function to get current user's UUID from Clerk ID
CREATE OR REPLACE FUNCTION get_user_uuid()
RETURNS UUID AS $$
  SELECT id FROM users WHERE clerk_id = auth.uid()::text LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Step 6: Create index for performance (auth.uid() lookups)
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Step 7: Cleanup any orphaned data (data without valid user_id)
DELETE FROM scans WHERE user_id IS NULL;
DELETE FROM competitors WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM alerts WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM insights WHERE user_id NOT IN (SELECT id FROM users);
DELETE FROM news_feed WHERE user_id NOT IN (SELECT id FROM users);

-- Verification queries (run these manually after migration)
-- SELECT COUNT(*), user_id FROM scans GROUP BY user_id;
-- SELECT clerk_id, COUNT(*) as scan_count FROM users u JOIN scans s ON u.id = s.user_id GROUP BY clerk_id;

COMMENT ON POLICY "Users can read own scans" ON scans IS 
  'Critical security: Users can ONLY see their own scans via Clerk ID → users.id mapping';

COMMENT ON FUNCTION get_user_uuid() IS 
  'Helper to get Supabase UUID from Clerk session token (auth.uid())';
