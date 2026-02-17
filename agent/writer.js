import { createClient } from '@supabase/supabase-js'

/**
 * Write analyzed data to Supabase
 */
export async function writeToSupabase(data, supabaseUrl, supabaseKey, userId) {
  console.log(`\n💾 Writing data to Supabase...`)
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const results = {
    competitors: 0,
    alerts: 0,
    insights: 0,
    news: 0
  }
  
  try {
    // 1. Insert Competitors
    if (data.competitors?.length > 0) {
      const competitorsToInsert = data.competitors.map(c => ({
        user_id: userId,
        name: c.name,
        domain: c.domain || null,
        industry: c.industry || data.industry,
        threat_score: c.threat_score || 5.0,
        activity_level: c.activity_level || 'medium',
        description: c.description,
        employee_count: c.employee_count || null,
        sentiment_score: Math.random() * 0.5 + 0.3, // 0.3-0.8
        last_activity_date: new Date().toISOString()
      }))
      
      const { data: inserted, error } = await supabase
        .from('competitors')
        .insert(competitorsToInsert)
        .select()
      
      if (error) {
        console.error('Error inserting competitors:', error.message)
      } else {
        results.competitors = inserted?.length || 0
        console.log(`✓ Inserted ${results.competitors} competitors`)
        
        // Store competitor IDs for linking
        data.competitorIds = inserted || []
      }
    }
    
    // 2. Insert Alerts
    if (data.alerts?.length > 0) {
      const alertsToInsert = data.alerts.map(a => ({
        user_id: userId,
        competitor_id: data.competitorIds?.[0]?.id || null, // Link to first competitor for demo
        title: a.title,
        description: a.description,
        priority: a.priority || 'info',
        category: a.category || 'news',
        read: false
      }))
      
      const { data: inserted, error } = await supabase
        .from('alerts')
        .insert(alertsToInsert)
        .select()
      
      if (error) {
        console.error('Error inserting alerts:', error.message)
      } else {
        results.alerts = inserted?.length || 0
        console.log(`✓ Inserted ${results.alerts} alerts`)
      }
    }
    
    // 3. Insert Insights
    if (data.insights?.length > 0) {
      const insightsToInsert = data.insights.map(i => ({
        user_id: userId,
        type: i.type || 'recommendation',
        title: i.title,
        description: i.description,
        confidence: i.confidence || 0.7,
        impact: i.impact || 'medium',
        action_items: i.action_items || []
      }))
      
      const { data: inserted, error } = await supabase
        .from('insights')
        .insert(insightsToInsert)
        .select()
      
      if (error) {
        console.error('Error inserting insights:', error.message)
      } else {
        results.insights = inserted?.length || 0
        console.log(`✓ Inserted ${results.insights} insights`)
      }
    }
    
    // 4. Insert News
    if (data.news?.length > 0) {
      const newsToInsert = data.news.map(n => ({
        user_id: userId,
        title: n.title,
        summary: n.summary,
        source: n.source,
        source_url: n.source_url,
        published_at: n.published_at,
        relevance_score: n.relevance_score || 0.5,
        sentiment: 'neutral',
        tags: n.tags || []
      }))
      
      const { data: inserted, error } = await supabase
        .from('news_feed')
        .insert(newsToInsert)
        .select()
      
      if (error) {
        console.error('Error inserting news:', error.message)
      } else {
        results.news = inserted?.length || 0
        console.log(`✓ Inserted ${results.news} news items`)
      }
    }
    
    console.log(`\n✨ Data write complete!`)
    console.log(`   Competitors: ${results.competitors}`)
    console.log(`   Alerts: ${results.alerts}`)
    console.log(`   Insights: ${results.insights}`)
    console.log(`   News: ${results.news}`)
    
    return results
    
  } catch (error) {
    console.error('Fatal error writing to Supabase:', error)
    throw error
  }
}
