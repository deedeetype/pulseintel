-- ========================================
-- PulseIntel Subscriptions System
-- Date: 2026-03-02
-- ========================================

-- Table: usage_tracking (track actions for limits)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'scan', 'refresh_auto', 'refresh_manual'
  profile_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_month 
ON usage_tracking(user_id, DATE_TRUNC('month', created_at));

CREATE INDEX IF NOT EXISTS idx_usage_action 
ON usage_tracking(action, created_at);

-- Table: user_subscriptions (mirror Stripe data)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'starter', 'pro', 'business', 'enterprise'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'trialing'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user 
ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer 
ON user_subscriptions(stripe_customer_id);

-- RLS Policies for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on usage_tracking" ON usage_tracking;
CREATE POLICY "Service role full access on usage_tracking"
ON usage_tracking FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own usage" ON usage_tracking;
CREATE POLICY "Users can read own usage"
ON usage_tracking FOR SELECT
USING (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on user_subscriptions" ON user_subscriptions;
CREATE POLICY "Service role full access on user_subscriptions"
ON user_subscriptions FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own subscription" ON user_subscriptions;
CREATE POLICY "Users can read own subscription"
ON user_subscriptions FOR SELECT
USING (user_id = auth.jwt() ->> 'sub');

-- Verify
SELECT 'Subscriptions tables created successfully' as status;
