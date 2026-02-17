-- PulseIntel Database Schema - Simplified (no constraints for quick setup)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS news_feed CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (simple version)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitors table  
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  threat_score DECIMAL(3,1),
  funding_amount BIGINT,
  funding_stage TEXT,
  employee_count INTEGER,
  description TEXT,
  activity_level TEXT,
  sentiment_score DECIMAL(3,2),
  last_activity_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  competitor_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  category TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights table
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2),
  impact TEXT,
  action_items TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News Feed table
CREATE TABLE news_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  competitor_id UUID,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  source_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  relevance_score DECIMAL(3,2),
  sentiment TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo user
INSERT INTO users (clerk_id, email, name) VALUES
  ('demo_user', 'david@labwyze.com', 'David');

-- Disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed DISABLE ROW LEVEL SECURITY;

-- Verify tables
SELECT 'Tables created successfully!' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
