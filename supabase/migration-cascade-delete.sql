-- Add CASCADE DELETE constraints to ensure all related data is deleted when a scan is deleted
-- This allows deleting a profile and all its competitors, alerts, insights, and news automatically

-- Drop existing foreign key constraints
ALTER TABLE competitors DROP CONSTRAINT IF EXISTS competitors_scan_id_fkey;
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_scan_id_fkey;
ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_scan_id_fkey;
ALTER TABLE news_feed DROP CONSTRAINT IF EXISTS news_feed_scan_id_fkey;

-- Re-add foreign key constraints with CASCADE DELETE
ALTER TABLE competitors
  ADD CONSTRAINT competitors_scan_id_fkey
  FOREIGN KEY (scan_id)
  REFERENCES scans(id)
  ON DELETE CASCADE;

ALTER TABLE alerts
  ADD CONSTRAINT alerts_scan_id_fkey
  FOREIGN KEY (scan_id)
  REFERENCES scans(id)
  ON DELETE CASCADE;

ALTER TABLE insights
  ADD CONSTRAINT insights_scan_id_fkey
  FOREIGN KEY (scan_id)
  REFERENCES scans(id)
  ON DELETE CASCADE;

ALTER TABLE news_feed
  ADD CONSTRAINT news_feed_scan_id_fkey
  FOREIGN KEY (scan_id)
  REFERENCES scans(id)
  ON DELETE CASCADE;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
