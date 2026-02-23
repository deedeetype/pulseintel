-- Add industry analytics and company info to scans table
ALTER TABLE scans ADD COLUMN IF NOT EXISTS industry_analytics JSONB;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS company_url TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
