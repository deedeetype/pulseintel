-- Migration: Add Scans table and scan_id foreign keys
-- This groups all data by scan run (industry + timestamp + user)

-- 1. Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  competitors_count INTEGER DEFAULT 0,
  alerts_count INTEGER DEFAULT 0,
  insights_count INTEGER DEFAULT 0,
  news_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- 2. Add scan_id to existing tables
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS scan_id UUID REFERENCES scans(id) ON DELETE CASCADE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS scan_id UUID REFERENCES scans(id) ON DELETE CASCADE;
ALTER TABLE insights ADD COLUMN IF NOT EXISTS scan_id UUID REFERENCES scans(id) ON DELETE CASCADE;
ALTER TABLE news_feed ADD COLUMN IF NOT EXISTS scan_id UUID REFERENCES scans(id) ON DELETE CASCADE;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_industry ON scans(industry);
CREATE INDEX IF NOT EXISTS idx_competitors_scan_id ON competitors(scan_id);
CREATE INDEX IF NOT EXISTS idx_alerts_scan_id ON alerts(scan_id);
CREATE INDEX IF NOT EXISTS idx_insights_scan_id ON insights(scan_id);
CREATE INDEX IF NOT EXISTS idx_news_scan_id ON news_feed(scan_id);

-- 4. Enable RLS on scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy for scans
CREATE POLICY "Users can view own scans" ON scans
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- 6. Update existing data (optional - group old data by industry)
-- This creates retroactive scan records for existing data
DO $$
DECLARE
  demo_user_id UUID;
  video_games_scan_id UUID;
  financial_services_scan_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM users WHERE clerk_id = 'demo_user' LIMIT 1;
  
  IF demo_user_id IS NULL THEN
    -- Create demo user if not exists
    INSERT INTO users (clerk_id, email, name, plan)
    VALUES ('demo_user', 'demo@pulseintel.com', 'Demo User', 'pro')
    RETURNING id INTO demo_user_id;
  END IF;

  -- Create scan for Video Games (if there are Video Games competitors)
  IF EXISTS (SELECT 1 FROM competitors WHERE industry = 'Video Games' AND scan_id IS NULL LIMIT 1) THEN
    INSERT INTO scans (user_id, industry, status, created_at, completed_at)
    VALUES (demo_user_id, 'Video Games', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
    RETURNING id INTO video_games_scan_id;
    
    -- Associate existing Video Games data with this scan
    UPDATE competitors SET scan_id = video_games_scan_id WHERE industry = 'Video Games' AND scan_id IS NULL;
    UPDATE alerts SET scan_id = video_games_scan_id WHERE scan_id IS NULL AND competitor_id IN (SELECT id FROM competitors WHERE scan_id = video_games_scan_id);
    UPDATE insights SET scan_id = video_games_scan_id WHERE scan_id IS NULL AND user_id = demo_user_id;
    UPDATE news_feed SET scan_id = video_games_scan_id WHERE scan_id IS NULL AND user_id = demo_user_id;
    
    -- Update counts
    UPDATE scans SET
      competitors_count = (SELECT COUNT(*) FROM competitors WHERE scan_id = video_games_scan_id),
      alerts_count = (SELECT COUNT(*) FROM alerts WHERE scan_id = video_games_scan_id),
      insights_count = (SELECT COUNT(*) FROM insights WHERE scan_id = video_games_scan_id),
      news_count = (SELECT COUNT(*) FROM news_feed WHERE scan_id = video_games_scan_id)
    WHERE id = video_games_scan_id;
  END IF;

  -- Create scan for Financial Services (most recent)
  IF EXISTS (SELECT 1 FROM competitors WHERE industry = 'Financial Services' AND scan_id IS NULL LIMIT 1) THEN
    INSERT INTO scans (user_id, industry, status, created_at, completed_at)
    VALUES (demo_user_id, 'Financial Services', 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
    RETURNING id INTO financial_services_scan_id;
    
    -- Associate existing Financial Services data
    UPDATE competitors SET scan_id = financial_services_scan_id WHERE industry = 'Financial Services' AND scan_id IS NULL;
    UPDATE alerts SET scan_id = financial_services_scan_id WHERE scan_id IS NULL AND id IN (
      SELECT a.id FROM alerts a 
      LEFT JOIN competitors c ON a.competitor_id = c.id 
      WHERE c.scan_id = financial_services_scan_id OR a.created_at > NOW() - INTERVAL '2 hours'
    );
    UPDATE insights SET scan_id = financial_services_scan_id WHERE scan_id IS NULL AND created_at > NOW() - INTERVAL '2 hours';
    UPDATE news_feed SET scan_id = financial_services_scan_id WHERE scan_id IS NULL AND created_at > NOW() - INTERVAL '2 hours';
    
    -- Update counts
    UPDATE scans SET
      competitors_count = (SELECT COUNT(*) FROM competitors WHERE scan_id = financial_services_scan_id),
      alerts_count = (SELECT COUNT(*) FROM alerts WHERE scan_id = financial_services_scan_id),
      insights_count = (SELECT COUNT(*) FROM insights WHERE scan_id = financial_services_scan_id),
      news_count = (SELECT COUNT(*) FROM news_feed WHERE scan_id = financial_services_scan_id)
    WHERE id = financial_services_scan_id;
  END IF;

END $$;

-- 7. Make scan_id required for future inserts (after migrating existing data)
-- Uncomment these after running the migration and verifying data:
-- ALTER TABLE competitors ALTER COLUMN scan_id SET NOT NULL;
-- ALTER TABLE alerts ALTER COLUMN scan_id SET NOT NULL;
-- ALTER TABLE insights ALTER COLUMN scan_id SET NOT NULL;
-- ALTER TABLE news_feed ALTER COLUMN scan_id SET NOT NULL;

COMMENT ON TABLE scans IS 'Groups competitors, alerts, insights, and news by scan run';
COMMENT ON COLUMN scans.industry IS 'Industry being scanned (e.g., "Financial Services", "Video Games")';
COMMENT ON COLUMN scans.status IS 'Scan status: pending, running, completed, or failed';
