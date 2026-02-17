import axios from 'axios'
import { getMockCompetitors } from './mock-competitors.js'

/**
 * Find competitors in a given industry using Brave Search
 */
export async function findCompetitors(industry, braveApiKey) {
  console.log(`🔍 Searching for competitors in: ${industry}`)
  
  // Try Brave Search first, fallback to mock if rate limited
  let useMock = false
  
  const queries = [
    `top companies in ${industry}`,
    `${industry} startups 2025 2026`,
    `leading ${industry} platforms`,
  ]
  
  const companies = new Set()
  const companyData = []
  
  for (const query of queries) {
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'X-Subscription-Token': braveApiKey,
          'Accept': 'application/json'
        },
        params: {
          q: query,
          count: 10
        }
      })
      
      const results = response.data.web?.results || []
      
      for (const result of results) {
        // Extract company names from results
        const text = `${result.title} ${result.description}`
        const potentialCompanies = extractCompanyNames(text, industry)
        
        potentialCompanies.forEach(company => {
          if (!companies.has(company.name.toLowerCase())) {
            companies.add(company.name.toLowerCase())
            companyData.push({
              name: company.name,
              domain: extractDomain(result.url),
              description: result.description?.substring(0, 200) || '',
              source: result.url
            })
          }
        })
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error(`Error searching "${query}":`, error.message)
      if (error.response?.status === 429) {
        console.log(`⚠️  Brave Search quota exceeded, using mock data...`)
        useMock = true
        break
      }
    }
  }
  
  // Use mock data if Brave Search failed
  if (useMock || companyData.length === 0) {
    console.log(`📦 Using mock competitor data for ${industry}`)
    const mockData = getMockCompetitors(industry)
    if (mockData.length > 0) {
      console.log(`✓ Loaded ${mockData.length} mock competitors`)
      return mockData
    }
  }
  
  console.log(`✓ Found ${companyData.length} potential competitors`)
  return companyData.slice(0, 15) // Top 15
}

/**
 * Extract company names from text
 */
function extractCompanyNames(text, industry) {
  const companies = []
  
  // Common patterns for company mentions
  const patterns = [
    /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})(?:\s+(?:Inc|LLC|Corp|Ltd|Games|Entertainment|Studios|Interactive))/g,
    /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})(?=\s+(?:is|are|has|was|announced|launched|released))/g,
  ]
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const name = match[1].trim()
      if (name.length > 2 && !isCommonWord(name)) {
        companies.push({ name })
      }
    }
  }
  
  return companies
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return null
  }
}

/**
 * Filter out common words
 */
function isCommonWord(word) {
  const common = ['The', 'And', 'For', 'With', 'This', 'That', 'These', 'Those', 'Here', 'There']
  return common.includes(word)
}
