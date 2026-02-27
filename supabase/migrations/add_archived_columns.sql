-- Add archived column to news_feed, alerts, insights, competitors
-- Allows soft delete (reversible) while keeping hard delete option

-- News Feed
ALTER TABLE news_feed ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_news_feed_archived ON news_feed(archived);

-- Alerts
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_archived ON alerts(archived);

-- Insights
ALTER TABLE insights ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_insights_archived ON insights(archived);

-- Competitors
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_competitors_archived ON competitors(archived);

-- Add comment for documentation
COMMENT ON COLUMN news_feed.archived IS 'Soft delete flag - archived items hidden from default views but can be restored';
COMMENT ON COLUMN alerts.archived IS 'Soft delete flag - archived items hidden from default views but can be restored';
COMMENT ON COLUMN insights.archived IS 'Soft delete flag - archived items hidden from default views but can be restored';
COMMENT ON COLUMN competitors.archived IS 'Soft delete flag - archived competitors removed from watchlist but can be restored';
