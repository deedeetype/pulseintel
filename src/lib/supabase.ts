import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Competitor = {
  id: string
  user_id: string
  name: string
  domain: string | null
  industry: string | null
  threat_score: number | null
  funding_amount: number | null
  funding_stage: string | null
  employee_count: number | null
  founded_year: number | null
  description: string | null
  logo_url: string | null
  activity_level: 'low' | 'medium' | 'high' | null
  sentiment_score: number | null
  last_activity_date: string | null
  stock_ticker: string | null
  stock_price: number | null
  stock_currency: string | null
  stock_change_percent: number | null
  created_at: string
  updated_at: string
}

export type Alert = {
  id: string
  user_id: string
  competitor_id: string | null
  title: string
  description: string | null
  priority: 'critical' | 'attention' | 'info'
  category: 'funding' | 'product' | 'hiring' | 'news' | 'market' | null
  read: boolean
  source_url: string | null
  created_at: string
}

export type Insight = {
  id: string
  user_id: string
  type: 'opportunity' | 'threat' | 'trend' | 'recommendation'
  title: string
  description: string
  confidence: number | null
  impact: 'low' | 'medium' | 'high' | null
  related_competitors: string[] | null
  action_items: string[] | null
  created_at: string
}
