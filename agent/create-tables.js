import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitors table  
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  threat_score DECIMAL(3,1),
  funding_amount BIGINT,
  funding_stage TEXT,
  employee_count INTEGER,
  founded_year INTEGER,
  description TEXT,
  logo_url TEXT,
  activity_level TEXT,
  sentiment_score DECIMAL(3,2),
  last_activity_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  competitor_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  category TEXT,
  read BOOLEAN DEFAULT FALSE,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2),
  impact TEXT,
  related_competitors TEXT[],
  action_items TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News Feed table
CREATE TABLE IF NOT EXISTS news_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  competitor_id UUID,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source TEXT,
  source_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  relevance_score DECIMAL(3,2),
  sentiment TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

const queries = schema.split(';').filter(q => q.trim())

console.log('Creating tables...')
for (const query of queries) {
  if (query.trim()) {
    const { error } = await supabase.rpc('exec_sql', { sql: query })
    if (error) {
      console.log('Query:', query.substring(0, 50))
      console.log('Trying direct insert...')
    }
  }
}

console.log('Done!')
