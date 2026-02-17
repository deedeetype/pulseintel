/**
 * Simplified agent that runs directly in Netlify Functions
 * No filesystem dependencies
 */

interface AgentResult {
  competitors: any[]
  alerts: any[]
  insights: any[]
  news: any[]
}

export async function runSimpleAgent(industry: string): Promise<AgentResult> {
  console.log(`[Simple Agent] Starting scan for: ${industry}`)
  
  // Mock competitors (would use API calls in production)
  const competitors = getMockCompetitors(industry)
  
  // Collect news (would use NewsAPI)
  const news = await collectNewsSimple(industry)
  
  // Generate insights (would use Claude/Poe API)
  const insights = generateInsightsSimple(competitors, news, industry)
  
  // Generate alerts
  const alerts = generateAlertsSimple(news, competitors)
  
  console.log(`[Simple Agent] Complete: ${competitors.length} competitors, ${news.length} news`)
  
  return {
    competitors,
    alerts,
    insights,
    news
  }
}

function getMockCompetitors(industry: string) {
  const videoGamesCompetitors = [
    { name: 'Epic Games', threat_score: 9.2, activity_level: 'high', employee_count: 3200, industry: 'Video Games' },
    { name: 'Unity Technologies', threat_score: 8.8, activity_level: 'high', employee_count: 5800, industry: 'Video Games' },
    { name: 'Roblox Corporation', threat_score: 8.5, activity_level: 'high', employee_count: 2100, industry: 'Video Games' },
    { name: 'Discord', threat_score: 7.9, activity_level: 'high', employee_count: 600, industry: 'Video Games' },
    { name: 'Valve Corporation', threat_score: 8.7, activity_level: 'medium', employee_count: 360, industry: 'Video Games' },
    { name: 'Riot Games', threat_score: 8.3, activity_level: 'high', employee_count: 2500, industry: 'Video Games' },
    { name: 'Krafton', threat_score: 7.2, activity_level: 'medium', employee_count: 3500, industry: 'Video Games' },
    { name: 'Niantic', threat_score: 6.8, activity_level: 'medium', employee_count: 1000, industry: 'Video Games' },
    { name: 'Supercell', threat_score: 7.6, activity_level: 'medium', employee_count: 340, industry: 'Video Games' },
    { name: 'miHoYo', threat_score: 8.1, activity_level: 'high', employee_count: 4000, industry: 'Video Games' },
    { name: 'Playtika', threat_score: 6.2, activity_level: 'medium', employee_count: 4200, industry: 'Video Games' },
    { name: 'Scopely', threat_score: 6.9, activity_level: 'high', employee_count: 1200, industry: 'Video Games' },
    { name: 'Gameplay Galaxy', threat_score: 5.4, activity_level: 'high', employee_count: 85, industry: 'Video Games' },
    { name: 'Immutable', threat_score: 6.1, activity_level: 'high', employee_count: 280, industry: 'Video Games' },
    { name: 'Dream Games', threat_score: 6.5, activity_level: 'high', employee_count: 250, industry: 'Video Games' },
  ]
  
  if (industry.toLowerCase().includes('game') || industry.toLowerCase().includes('video')) {
    return videoGamesCompetitors
  }
  
  // Generic competitors for other industries
  return Array.from({ length: 10 }, (_, i) => ({
    name: `Company ${i + 1}`,
    threat_score: 5 + Math.random() * 3,
    activity_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    employee_count: Math.floor(Math.random() * 1000) + 100,
    industry
  }))
}

async function collectNewsSimple(industry: string) {
  // Would call NewsAPI here
  // For now, return mock news
  return [
    { title: `${industry} market sees record growth`, source: 'TechCrunch', relevance_score: 0.9 },
    { title: `New funding round for ${industry} startup`, source: 'VentureBeat', relevance_score: 0.85 },
    { title: `${industry} trends to watch in 2026`, source: 'Forbes', relevance_score: 0.8 },
    { title: `Major acquisition in ${industry} space`, source: 'Bloomberg', relevance_score: 0.95 },
    { title: `${industry} innovation breakthrough`, source: 'Wired', relevance_score: 0.75 },
  ]
}

function generateInsightsSimple(competitors: any[], news: any[], industry: string) {
  return [
    {
      type: 'threat',
      title: 'Increasing Competition',
      description: `${competitors.length} active competitors detected in ${industry}. Top players showing aggressive expansion.`,
      confidence: 0.85,
      impact: 'high'
    },
    {
      type: 'opportunity',
      title: 'Market Growth',
      description: `${industry} market experiencing rapid growth based on recent news signals.`,
      confidence: 0.78,
      impact: 'high'
    },
    {
      type: 'trend',
      title: 'Technology Shift',
      description: `AI and automation becoming standard in ${industry}. Early adoption recommended.`,
      confidence: 0.82,
      impact: 'medium'
    },
    {
      type: 'recommendation',
      title: 'Strategic Focus',
      description: `Focus on differentiation. Monitor top 3 competitors closely.`,
      confidence: 0.75,
      impact: 'high'
    }
  ]
}

function generateAlertsSimple(news: any[], competitors: any[]) {
  return [
    {
      title: 'Competitor Funding Alert',
      description: 'Major competitor secured $100M Series C',
      priority: 'critical',
      category: 'funding'
    },
    {
      title: 'Market Movement',
      description: 'Industry leader announced new product launch',
      priority: 'attention',
      category: 'product'
    },
    {
      title: 'Hiring Surge',
      description: 'Top 3 competitors increased hiring by 40%',
      priority: 'attention',
      category: 'hiring'
    },
    {
      title: 'News Mention',
      description: 'Your industry mentioned in major tech publication',
      priority: 'info',
      category: 'news'
    },
    {
      title: 'Market Trend',
      description: 'Emerging technology gaining traction',
      priority: 'info',
      category: 'market'
    }
  ]
}
