-- Add profile-related columns to scans table for incremental scan model
-- This migration transforms scans from a "history" model to a "profile" model

ALTER TABLE scans 
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refresh_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient profile lookup (industry + company_url)
CREATE INDEX IF NOT EXISTS idx_scans_profile_lookup 
  ON scans (industry, company_url) 
  WHERE status = 'completed';

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scans_updated_at 
  BEFORE UPDATE ON scans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Add comment explaining the new model
COMMENT ON COLUMN scans.last_refreshed_at IS 'Timestamp of the most recent incremental refresh for this profile';
COMMENT ON COLUMN scans.refresh_count IS 'Number of times this profile has been refreshed (incremental scans)';
COMMENT ON COLUMN scans.updated_at IS 'Auto-updated timestamp whenever the record is modified';
