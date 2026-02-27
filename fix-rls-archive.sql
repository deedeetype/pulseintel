-- Fix RLS policies to allow users to archive their own news/alerts/insights

-- News Feed: Allow users to UPDATE archived field on their own items
DROP POLICY IF EXISTS "Users can update their news" ON news_feed;
CREATE POLICY "Users can update their news"
  ON news_feed
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Alerts: Allow users to UPDATE archived field on their own items
DROP POLICY IF EXISTS "Users can update their alerts" ON alerts;
CREATE POLICY "Users can update their alerts"
  ON alerts
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Insights: Allow users to UPDATE archived field on their own items
DROP POLICY IF EXISTS "Users can update their insights" ON insights;
CREATE POLICY "Users can update their insights"
  ON insights
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Competitors: Allow users to UPDATE archived field on their own items
DROP POLICY IF EXISTS "Users can update their competitors" ON competitors;
CREATE POLICY "Users can update their competitors"
  ON competitors
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
