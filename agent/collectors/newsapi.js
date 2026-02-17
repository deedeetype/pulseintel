import axios from 'axios'

/**
 * Collect real news using NewsAPI
 */
export async function collectNewsAPI(industry, apiKey, limit = 20) {
  console.log(`📰 Collecting news from NewsAPI for: ${industry}`)
  
  const newsItems = []
  
  // Build search query based on industry
  const queries = buildNewsQueries(industry)
  
  for (const query of queries) {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          apiKey: apiKey,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 10,
          from: getDateDaysAgo(7) // Last 7 days
        }
      })
      
      const articles = response.data.articles || []
      
      for (const article of articles) {
        // Skip removed/deleted articles
        if (article.title === '[Removed]' || !article.title) continue
        
        newsItems.push({
          title: article.title,
          summary: article.description?.substring(0, 300) || article.content?.substring(0, 300) || '',
          source: article.source?.name || 'Unknown',
          source_url: article.url,
          published_at: article.publishedAt,
          relevance_score: calculateRelevance(article, query),
          tags: extractTags(article.title + ' ' + article.description)
        })
      }
      
      // Rate limit: 500 req/day free tier
      await new Promise(resolve => setTimeout(resolve, 300))
      
    } catch (error) {
      console.error(`Error fetching NewsAPI for "${query}":`, error.response?.data?.message || error.message)
    }
  }
  
  // Remove duplicates based on title
  const uniqueNews = Array.from(
    new Map(newsItems.map(item => [item.title, item])).values()
  )
  
  console.log(`✓ Collected ${uniqueNews.length} news items from NewsAPI`)
  return uniqueNews.slice(0, limit)
}

/**
 * Build search queries based on industry
 */
function buildNewsQueries(industry) {
  const normalized = industry.toLowerCase()
  
  if (normalized.includes('video') || normalized.includes('game')) {
    return [
      'video games OR gaming',
      'game studio OR esports',
      'gaming platform OR game engine'
    ]
  }
  
  if (normalized.includes('health') || normalized.includes('medical')) {
    return [
      'healthcare technology OR healthtech',
      'medical AI OR telehealth',
      'digital health OR health platform'
    ]
  }
  
  if (normalized.includes('fintech') || normalized.includes('finance')) {
    return [
      'fintech OR financial technology',
      'banking platform OR payment',
      'cryptocurrency OR blockchain finance'
    ]
  }
  
  if (normalized.includes('ai') || normalized.includes('ml')) {
    return [
      'artificial intelligence OR machine learning',
      'AI startup OR ML platform',
      'generative AI OR LLM'
    ]
  }
  
  // Generic fallback
  return [
    industry,
    `${industry} startup`,
    `${industry} innovation`
  ]
}

/**
 * Calculate relevance score (0-1)
 */
function calculateRelevance(article, query) {
  let score = 0.5 // Base score
  
  const text = `${article.title} ${article.description}`.toLowerCase()
  const keywords = query.toLowerCase().split(' OR ')
  
  // Boost if keywords appear
  for (const keyword of keywords) {
    if (text.includes(keyword.trim())) {
      score += 0.15
    }
  }
  
  // Boost for recency (last 24h)
  const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
  if (hoursAgo < 24) {
    score += 0.2
  }
  
  return Math.min(score, 1.0)
}

/**
 * Extract relevant tags
 */
function extractTags(text) {
  const tags = []
  const keywords = [
    'funding', 'acquisition', 'merger', 'IPO', 'launch', 'release', 
    'partnership', 'hiring', 'expansion', 'AI', 'revenue', 'growth',
    'shutdown', 'layoff', 'controversy', 'regulation', 'security'
  ]
  
  const lowerText = text.toLowerCase()
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      tags.push(keyword)
    }
  }
  
  return tags
}

/**
 * Get date N days ago in ISO format
 */
function getDateDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}
