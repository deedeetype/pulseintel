-- Add industry analytics and company info to scans table
ALTER TABLE scans ADD COLUMN IF NOT EXISTS industry_analytics JSONB;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS company_url TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add stock data to competitors table
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS stock_ticker TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS stock_price DECIMAL(10,2);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS stock_currency TEXT DEFAULT 'USD';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS stock_change_percent DECIMAL(6,2);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
