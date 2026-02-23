#!/usr/bin/env node

import dotenv from 'dotenv'
import { findCompetitors } from './collectors/companies.js'
import { findCompetitorsPerplexity, collectNewsPerplexity } from './collectors/perplexity.js'
import { collectNews } from './collectors/news.js'
import { collectNewsAPI } from './collectors/newsapi.js'
import { analyzeCompetitors, generateInsights, generateAlerts } from './analyzers/claude.js'
import { writeToSupabase } from './writer.js'

dotenv.config()

/**
 * PulseIntel AI Agent
 * Autonomous competitive intelligence gathering and analysis
 */

async function runAgent(industry) {
  console.log(`\n🦝 PulseIntel AI Agent Starting...\n`)
  console.log(`Industry: ${industry}`)
  console.log(`Timestamp: ${new Date().toISOString()}\n`)
  console.log(`${'='.repeat(60)}\n`)
  
  const startTime = Date.now()
  
  // Validate environment variables
  const { 
    PERPLEXITY_API_KEY,
    BRAVE_API_KEY, 
    NEWS_API_KEY,
    POE_API_KEY, 
    SUPABASE_URL, 
    SUPABASE_SERVICE_KEY,
    DEMO_USER_ID 
  } = process.env
  
  if (!PERPLEXITY_API_KEY || !POE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables!')
    console.error('Required: PERPLEXITY_API_KEY, POE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY')
    process.exit(1)
  }
  
  if (!DEMO_USER_ID) {
    console.warn('⚠️  DEMO_USER_ID not set, using demo_user from seed data')
  }
  
  try {
    // Phase 1: Data Collection
    console.log(`📊 PHASE 1: Data Collection\n`)
    
    // Use Perplexity AI for both competitors and news (best quality)
    const [companies, news] = await Promise.all([
      findCompetitorsPerplexity(industry, PERPLEXITY_API_KEY),
      collectNewsPerplexity(industry, PERPLEXITY_API_KEY, 20)
    ])
    
    console.log(`\n${'='.repeat(60)}\n`)
    
    // Phase 2: AI Analysis
    console.log(`🧠 PHASE 2: AI Analysis\n`)
    
    const [analyzedCompetitors, insights, alerts] = await Promise.all([
      analyzeCompetitors(companies, industry, POE_API_KEY),
      generateInsights(companies, news, industry, POE_API_KEY),
      generateAlerts(news, companies, POE_API_KEY)
    ])
    
    console.log(`\n${'='.repeat(60)}\n`)
    
    // Phase 3: Write to Database
    console.log(`💾 PHASE 3: Database Write\n`)
    
    const results = await writeToSupabase(
      {
        industry,
        competitors: analyzedCompetitors,
        alerts,
        insights,
        news
      },
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      DEMO_USER_ID || 'demo_user',
      startTime
    )
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    
    console.log(`\n${'='.repeat(60)}\n`)
    console.log(`✨ Agent Run Complete!\n`)
    console.log(`Industry: ${industry}`)
    console.log(`Duration: ${duration}s`)
    console.log(`\nResults:`)
    console.log(`  🎯 ${results.competitors} competitors discovered`)
    console.log(`  🔔 ${results.alerts} alerts generated`)
    console.log(`  💡 ${results.insights} insights created`)
    console.log(`  📰 ${results.news} news items collected`)
    console.log(`\n🚀 Dashboard should now show live data!`)
    console.log(`\n${'='.repeat(60)}\n`)
    
  } catch (error) {
    console.error(`\n❌ Agent failed:`, error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Get industry from command line or use default
const industry = process.argv[2] || 'Video Games'

runAgent(industry)
