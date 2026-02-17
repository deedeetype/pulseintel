import axios from 'axios'

/**
 * Collect recent news about an industry using Brave Search
 */
export async function collectNews(industry, braveApiKey, limit = 20) {
  console.log(`📰 Collecting news for: ${industry}`)
  
  const queries = [
    `${industry} news 2026`,
    `${industry} announcements funding`,
    `${industry} product launch 2026`,
  ]
  
  const newsItems = []
  
  for (const query of queries) {
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'X-Subscription-Token': braveApiKey,
          'Accept': 'application/json'
        },
        params: {
          q: query,
          count: 10,
          freshness: 'pw' // Past week
        }
      })
      
      const results = response.data.web?.results || []
      
      for (const result of results) {
        newsItems.push({
          title: result.title,
          summary: result.description?.substring(0, 300) || '',
          source: extractSource(result.url),
          source_url: result.url,
          published_at: new Date().toISOString(), // Brave doesn't provide publish date
          relevance_score: 0.8, // Default high relevance
          tags: extractTags(result.title + ' ' + result.description)
        })
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error(`Error fetching news for "${query}":`, error.message)
    }
  }
  
  console.log(`✓ Collected ${newsItems.length} news items`)
  return newsItems.slice(0, limit)
}

/**
 * Extract source name from URL
 */
function extractSource(url) {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
  } catch {
    return 'Unknown'
  }
}

/**
 * Extract relevant tags from text
 */
function extractTags(text) {
  const tags = []
  const keywords = ['funding', 'acquisition', 'launch', 'release', 'partnership', 'hiring', 'expansion', 'AI', 'revenue', 'growth']
  
  const lowerText = text.toLowerCase()
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      tags.push(keyword)
    }
  }
  
  return tags
}
