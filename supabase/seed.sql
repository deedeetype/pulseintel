-- PulseIntel Seed Data
-- Run AFTER schema.sql

-- Insert demo user (replace clerk_id with your actual Clerk ID after auth is set up)
INSERT INTO users (clerk_id, email, name, plan) VALUES
  ('demo_user', 'david@labwyze.com', 'David', 'pro')
ON CONFLICT (clerk_id) DO NOTHING;

-- Get user ID for seed data
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  SELECT id INTO demo_user_id FROM users WHERE clerk_id = 'demo_user';

  -- Insert Competitors
  INSERT INTO competitors (
    user_id, name, domain, industry, threat_score, funding_amount, 
    funding_stage, employee_count, founded_year, description, 
    activity_level, sentiment_score, last_activity_date
  ) VALUES
    (
      demo_user_id, 
      'DataWatch Pro', 
      'datawatch.io', 
      'Competitive Intelligence', 
      8.9,
      50000000,
      'Series B',
      120,
      2019,
      'AI-powered market intelligence platform with focus on real-time analytics',
      'high',
      0.72,
      NOW() - INTERVAL '2 hours'
    ),
    (
      demo_user_id,
      'MarketPulse',
      'marketpulse.com',
      'Business Intelligence',
      7.2,
      15000000,
      'Series A',
      45,
      2020,
      'Market research and competitor tracking tool for enterprises',
      'medium',
      0.58,
      NOW() - INTERVAL '1 day'
    ),
    (
      demo_user_id,
      'CompetitorRadar',
      'competitorradar.ai',
      'Competitive Intelligence',
      6.5,
      8000000,
      'Seed',
      28,
      2022,
      'Automated competitor monitoring with social media integration',
      'low',
      0.45,
      NOW() - INTERVAL '3 days'
    ),
    (
      demo_user_id,
      'InsightFlow',
      'insightflow.co',
      'Business Analytics',
      7.8,
      30000000,
      'Series A',
      85,
      2021,
      'Strategic insights platform combining market data and AI predictions',
      'high',
      0.68,
      NOW() - INTERVAL '12 hours'
    ),
    (
      demo_user_id,
      'TrendScout',
      'trendscout.io',
      'Market Research',
      5.9,
      3000000,
      'Pre-seed',
      15,
      2023,
      'Early-stage startup focusing on emerging technology trends',
      'medium',
      0.52,
      NOW() - INTERVAL '2 days'
    );

  -- Insert Alerts
  INSERT INTO alerts (
    user_id, competitor_id, title, description, priority, category, read
  ) VALUES
    (
      demo_user_id,
      (SELECT id FROM competitors WHERE name = 'DataWatch Pro' AND user_id = demo_user_id),
      'DataWatch Pro raised $50M Series B',
      'Major funding round led by Sequoia Capital. Plans to expand into European markets and hire 60+ employees in next quarter.',
      'critical',
      'funding',
      false
    ),
    (
      demo_user_id,
      (SELECT id FROM competitors WHERE name = 'MarketPulse' AND user_id = demo_user_id),
      'New product launch detected',
      'MarketPulse announced AI-powered predictive analytics feature. Beta testing starts next month with 100 enterprise customers.',
      'attention',
      'product',
      false
    ),
    (
      demo_user_id,
      (SELECT id FROM competitors WHERE name = 'InsightFlow' AND user_id = demo_user_id),
      'InsightFlow expanding sales team',
      'Job postings show 15 new sales positions across US and Canada. Signals aggressive growth strategy.',
      'attention',
      'hiring',
      false
    ),
    (
      demo_user_id,
      NULL,
      'Industry report: CI market growing 23% YoY',
      'Gartner report shows competitive intelligence software market accelerating. Key drivers: AI adoption and remote work.',
      'info',
      'market',
      true
    ),
    (
      demo_user_id,
      (SELECT id FROM competitors WHERE name = 'CompetitorRadar' AND user_id = demo_user_id),
      'CompetitorRadar partnership with Salesforce',
      'Strategic integration announced at Dreamforce. Could accelerate their enterprise adoption.',
      'attention',
      'news',
      false
    ),
    (
      demo_user_id,
      (SELECT id FROM competitors WHERE name = 'DataWatch Pro' AND user_id = demo_user_id),
      'Key executive hired from Google',
      'Former Google Cloud VP joins as Chief Product Officer. Deep expertise in AI/ML products.',
      'critical',
      'hiring',
      false
    );

  -- Insert AI Insights
  INSERT INTO insights (
    user_id, type, title, description, confidence, impact, related_competitors, action_items
  ) VALUES
    (
      demo_user_id,
      'threat',
      'Emerging competitive threat from well-funded rivals',
      'Analysis of recent funding rounds shows 3 competitors raised significant capital (totaling $93M). This capital enables aggressive market expansion and could pressure market share. DataWatch Pro''s $50M Series B is particularly concerning given their strong product-market fit.',
      0.87,
      'high',
      ARRAY[
        (SELECT id FROM competitors WHERE name = 'DataWatch Pro' AND user_id = demo_user_id)::text,
        (SELECT id FROM competitors WHERE name = 'InsightFlow' AND user_id = demo_user_id)::text
      ],
      ARRAY[
        'Accelerate product roadmap for AI features',
        'Consider strategic partnerships to expand market reach',
        'Strengthen customer retention programs',
        'Evaluate raising additional capital'
      ]
    ),
    (
      demo_user_id,
      'opportunity',
      'Market gap in mid-market segment',
      'Competitive analysis reveals most players focus on enterprise (1000+ employees) or SMB. Mid-market companies (100-1000 employees) are underserved. This segment is growing 28% annually and has strong willingness to pay.',
      0.82,
      'high',
      ARRAY[]::text[],
      ARRAY[
        'Develop mid-market-specific pricing tier',
        'Create case studies targeting this segment',
        'Partner with mid-market-focused VCs for introductions',
        'Optimize onboarding for faster time-to-value'
      ]
    ),
    (
      demo_user_id,
      'trend',
      'AI-powered automation becoming table stakes',
      'All top competitors now offer AI-driven insights. Customer surveys show this is now expected baseline functionality rather than premium feature. Manual analysis tools seeing significant churn.',
      0.91,
      'medium',
      ARRAY[
        (SELECT id FROM competitors WHERE name = 'DataWatch Pro' AND user_id = demo_user_id)::text,
        (SELECT id FROM competitors WHERE name = 'MarketPulse' AND user_id = demo_user_id)::text
      ],
      ARRAY[
        'Invest in ML/AI capabilities',
        'Hire data science team',
        'Consider acquiring AI/ML startup',
        'Train existing features as AI-powered in marketing'
      ]
    ),
    (
      demo_user_id,
      'recommendation',
      'Strategic positioning opportunity in vertical markets',
      'Generic CI tools face commoditization. Competitors with vertical focus (healthcare, fintech) show 3x higher retention and 2x NPS scores. Consider pivoting to become the dominant player in 2-3 high-value verticals.',
      0.79,
      'medium',
      ARRAY[]::text[],
      ARRAY[
        'Conduct vertical market research',
        'Interview top customers in target verticals',
        'Develop industry-specific features',
        'Rebrand/reposition messaging'
      ]
    );

END $$;
