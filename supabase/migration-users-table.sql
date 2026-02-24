-- Create users table to store Clerk user data
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id foreign key to scans table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scans' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE scans ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update existing scans to use a default user (DEMO_USER_ID)
-- Replace this ID with your actual first Clerk user ID after first sign-up
UPDATE scans 
SET user_id = '2db9243c-9c2b-4c3d-bd1e-48f80f39dfd7' 
WHERE user_id IS NULL;

-- RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Update scans RLS policies to use user_id
-- Drop old public policies (keep only for testing, remove before prod)
-- DROP POLICY "Public read scans" ON scans;
-- DROP POLICY "Public delete scans" ON scans;

-- Add user-scoped policies (commented out for now - enable after testing)
-- CREATE POLICY "Users can read own scans" ON scans
--   FOR SELECT
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own scans" ON scans
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own scans" ON scans
--   FOR UPDATE
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete own scans" ON scans
--   FOR DELETE
--   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
