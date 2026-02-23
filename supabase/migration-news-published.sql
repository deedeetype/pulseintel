-- Update news_feed to use published_at if not set
UPDATE news_feed
SET published_at = created_at
WHERE published_at IS NULL;

-- Add indexes for news sorting
CREATE INDEX IF NOT EXISTS idx_news_published ON news_feed(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_news_scan_published ON news_feed(scan_id, published_at DESC NULLS LAST);

NOTIFY pgrst, 'reload schema';