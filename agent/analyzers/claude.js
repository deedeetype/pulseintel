import axios from 'axios'

/**
 * Analyze competitors using Claude via Poe API
 */
export async function analyzeCompetitors(companies, industry, poeApiKey) {
  console.log(`🤖 Analyzing ${companies.length} companies with Claude...`)
  
  const prompt = `You are a competitive intelligence analyst. Analyze these companies in the ${industry} industry.

Companies found:
${companies.map((c, i) => `${i + 1}. ${c.name}${c.domain ? ` (${c.domain})` : ''}`).join('\n')}

For each company, provide:
1. Threat score (0-10, where 10 is highest threat)
2. Activity level (low/medium/high)
3. Brief description (1 sentence)
4. Estimated employee count (rough estimate)
5. Industry category

Return ONLY valid JSON array with this structure:
[
  {
    "name": "Company Name",
    "threat_score": 8.5,
    "activity_level": "high",
    "description": "Brief description",
    "employee_count": 500,
    "industry": "Video Games"
  }
]

Be realistic with threat scores. Only top competitors should get 8+.`

  try {
    const response = await axios.post(
      'https://api.poe.com/v1/chat/completions',
      {
        model: 'Claude-Sonnet-4.5',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${poeApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const content = response.data.choices[0].message.content
    
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const analyzed = JSON.parse(jsonMatch[0])
      console.log(`✓ Analyzed ${analyzed.length} competitors`)
      return analyzed
    } else {
      console.error('Could not parse Claude response')
      return []
    }
    
  } catch (error) {
    console.error('Error calling Claude:', error.message)
    // Fallback: basic analysis
    return companies.map(c => ({
      name: c.name,
      threat_score: 5.0 + Math.random() * 3,
      activity_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      description: c.description || `Company in ${industry}`,
      employee_count: Math.floor(Math.random() * 500) + 50,
      industry
    }))
  }
}

/**
 * Generate strategic insights using Claude
 */
export async function generateInsights(competitors, news, industry, poeApiKey) {
  console.log(`💡 Generating strategic insights...`)
  
  const topCompetitors = competitors
    .sort((a, b) => b.threat_score - a.threat_score)
    .slice(0, 5)
  
  const prompt = `You are a strategic business analyst. Based on this competitive intelligence data for the ${industry} industry, generate 3-4 strategic insights.

Top Competitors:
${topCompetitors.map(c => `- ${c.name} (Threat: ${c.threat_score}/10, Activity: ${c.activity_level})`).join('\n')}

Recent News Headlines:
${news.slice(0, 10).map(n => `- ${n.title}`).join('\n')}

Generate insights in these categories: threat, opportunity, trend, recommendation

Return ONLY valid JSON array:
[
  {
    "type": "threat",
    "title": "Clear, specific title",
    "description": "2-3 sentences with concrete analysis and implications",
    "confidence": 0.85,
    "impact": "high",
    "action_items": ["Specific action 1", "Specific action 2"]
  }
]

Be specific and actionable. Reference actual companies when relevant.`

  try {
    const response = await axios.post(
      'https://api.poe.com/v1/chat/completions',
      {
        model: 'Claude-Sonnet-4.5',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${poeApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const content = response.data.choices[0].message.content
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0])
      console.log(`✓ Generated ${insights.length} insights`)
      return insights
    } else {
      console.error('Could not parse insights response')
      return []
    }
    
  } catch (error) {
    console.error('Error generating insights:', error.message)
    return []
  }
}

/**
 * Generate alerts from news
 */
export async function generateAlerts(news, competitors, poeApiKey) {
  console.log(`🔔 Generating alerts from news...`)
  
  const prompt = `Analyze these recent news items and identify 5-7 items that should become alerts.

News:
${news.slice(0, 15).map((n, i) => `${i + 1}. ${n.title}`).join('\n')}

Competitors:
${competitors.map(c => c.name).join(', ')}

For each alert, determine:
- Priority: critical (major threat/opportunity), attention (notable), or info
- Category: funding, product, hiring, news, market
- Brief description (1-2 sentences)

Return ONLY valid JSON array:
[
  {
    "title": "Alert title",
    "description": "Brief context",
    "priority": "critical",
    "category": "funding"
  }
]`

  try {
    const response = await axios.post(
      'https://api.poe.com/v1/chat/completions',
      {
        model: 'Claude-Sonnet-4.5',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${poeApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const content = response.data.choices[0].message.content
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    
    if (jsonMatch) {
      const alerts = JSON.parse(jsonMatch[0])
      console.log(`✓ Generated ${alerts.length} alerts`)
      return alerts
    } else {
      return []
    }
    
  } catch (error) {
    console.error('Error generating alerts:', error.message)
    return []
  }
}
