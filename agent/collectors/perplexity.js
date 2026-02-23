import axios from 'axios'

/**
 * Find competitors using Perplexity AI (sonar-pro model)
 * More intelligent than Brave Search - understands context and returns structured data
 */
export async function findCompetitorsPerplexity(industry, perplexityApiKey) {
  console.log(`🔍 Searching for competitors in: ${industry} (via Perplexity AI)`)
  
  const prompt = `List the top 15 companies and startups in the ${industry} industry as of 2025-2026. 

For each company, provide:
- Company name
- Website domain (just the domain, e.g., example.com)
- Brief description (1-2 sentences)
- Market position (e.g., "Market Leader", "Rising Startup", "Established Player")

Focus on active, relevant companies. Include both established leaders and promising newcomers.

Format your response as a JSON array of objects with keys: name, domain, description, position.`

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a business intelligence analyst specializing in competitive analysis. Provide accurate, up-to-date information about companies and market landscapes. Always respond with valid JSON when requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data.choices[0].message.content
    
    // Try to parse JSON from response
    let companies = []
    try {
      // Extract JSON array from response (handles markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        companies = JSON.parse(jsonMatch[0])
      } else {
        companies = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Perplexity JSON response:', parseError.message)
      console.log('Raw response:', content.substring(0, 500))
      return []
    }

    // Validate and normalize data
    const validCompanies = companies
      .filter(c => c.name && c.description)
      .map(c => ({
        name: c.name,
        domain: c.domain || null,
        description: c.description.substring(0, 300),
        market_position: c.position || c.market_position || 'Competitor',
        source: 'Perplexity AI'
      }))
      .slice(0, 15)

    console.log(`✓ Found ${validCompanies.length} competitors via Perplexity AI`)
    
    // Log sample
    if (validCompanies.length > 0) {
      console.log('\nSample competitor:')
      console.log(`  ${validCompanies[0].name} (${validCompanies[0].domain})`)
      console.log(`  ${validCompanies[0].description.substring(0, 80)}...`)
    }

    return validCompanies

  } catch (error) {
    console.error(`❌ Perplexity API error:`, error.response?.data || error.message)
    if (error.response?.status === 401) {
      console.error('⚠️  Invalid Perplexity API key')
    }
    return []
  }
}

/**
 * Collect industry news and trends using Perplexity
 */
export async function collectNewsPerplexity(industry, perplexityApiKey, limit = 20) {
  console.log(`📰 Collecting news for: ${industry} (via Perplexity AI)`)
  
  const prompt = `Find and summarize the ${limit} most recent and significant news stories, trends, and developments in the ${industry} industry (from the last 30 days).

For each item, provide:
- Title (headline)
- Summary (2-3 sentences)
- Source (publication name)
- URL (if available)
- Date (approximate, e.g., "3 days ago", "January 2026")
- Tags (2-4 relevant keywords)

Focus on: product launches, funding rounds, partnerships, market shifts, regulatory changes, and competitive moves.

Format as a JSON array with keys: title, summary, source, url, published_at, tags.`

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a news analyst tracking industry developments. Provide recent, accurate, and relevant news. Always respond with valid JSON when requested. Include source URLs when available.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data.choices[0].message.content
    
    // Parse JSON response
    let newsItems = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0]
        // Clean up common JSON issues from AI responses
        const cleanedJson = jsonStr
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/\n/g, ' ') // Remove newlines inside strings
        newsItems = JSON.parse(cleanedJson)
      } else {
        newsItems = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Perplexity news JSON:', parseError.message)
      console.log('⚠️  Falling back to empty news array (competitors still collected)')
      return []
    }

    // Normalize data
    const validNews = newsItems
      .filter(n => n.title && n.summary)
      .map(n => ({
        title: n.title,
        description: n.summary || n.description,
        url: n.url || null,
        source: n.source || 'Perplexity AI',
        published_at: n.published_at || n.date || new Date().toISOString(),
        tags: Array.isArray(n.tags) ? n.tags : []
      }))
      .slice(0, limit)

    console.log(`✓ Collected ${validNews.length} news items via Perplexity AI`)

    return validNews

  } catch (error) {
    console.error(`❌ Perplexity news collection error:`, error.response?.data || error.message)
    return []
  }
}
