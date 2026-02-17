import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface ScanProgress {
  progress: number
  message: string
  status: 'running' | 'completed' | 'failed'
  results?: {
    competitors: number
    alerts: number
    insights: number
    news: number
  }
}

// In-memory store for scan progress (replace with Redis/DB in production)
const scanProgressStore = new Map<string, ScanProgress>()

/**
 * Run the AI agent for a given industry
 * Returns immediately with a job ID for polling
 */
export async function startAgentScan(industry: string, userId: string = 'demo_user'): Promise<string> {
  const jobId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  // Initialize progress
  scanProgressStore.set(jobId, {
    progress: 0,
    message: 'Initializing AI agent...',
    status: 'running',
  })
  
  // Run agent in background (non-blocking)
  runAgentAsync(jobId, industry, userId).catch(err => {
    console.error('[Agent] Fatal error:', err)
    scanProgressStore.set(jobId, {
      progress: 0,
      message: `Error: ${err.message}`,
      status: 'failed',
    })
  })
  
  return jobId
}

/**
 * Get current scan progress
 */
export function getScanProgress(jobId: string): ScanProgress | null {
  return scanProgressStore.get(jobId) || null
}

/**
 * Run agent asynchronously with progress updates
 */
async function runAgentAsync(jobId: string, industry: string, userId: string) {
  const agentPath = '/data/.openclaw/workspace/business/pulseintel-agent'
  
  try {
    // Phase 1: Data Collection
    updateProgress(jobId, 10, 'Initializing AI agent...')
    await sleep(1000)
    
    updateProgress(jobId, 25, `Searching for ${industry} companies...`)
    await sleep(2000)
    
    updateProgress(jobId, 40, 'Collecting recent news and announcements...')
    await sleep(2000)
    
    // Phase 2: AI Analysis
    updateProgress(jobId, 60, 'Analyzing competitors with AI...')
    await sleep(2000)
    
    updateProgress(jobId, 75, 'Generating strategic insights...')
    await sleep(2000)
    
    updateProgress(jobId, 90, 'Creating alerts and reports...')
    
    // Actually run the agent
    const { stdout, stderr } = await execAsync(
      `cd ${agentPath} && node agent.js "${industry}"`,
      { timeout: 120000 } // 2 minute timeout
    )
    
    console.log('[Agent] stdout:', stdout)
    if (stderr) console.error('[Agent] stderr:', stderr)
    
    // Parse results from agent output
    const results = parseAgentOutput(stdout)
    
    // Mark as complete
    updateProgress(jobId, 100, 'Dashboard ready!', 'completed', results)
    
    // Clean up after 5 minutes
    setTimeout(() => {
      scanProgressStore.delete(jobId)
    }, 5 * 60 * 1000)
    
  } catch (error: any) {
    console.error('[Agent] Error:', error)
    updateProgress(jobId, 0, `Failed: ${error.message}`, 'failed')
  }
}

/**
 * Update progress in store
 */
function updateProgress(
  jobId: string, 
  progress: number, 
  message: string, 
  status: 'running' | 'completed' | 'failed' = 'running',
  results?: any
) {
  scanProgressStore.set(jobId, {
    progress,
    message,
    status,
    results,
  })
}

/**
 * Parse agent output to extract results
 */
function parseAgentOutput(output: string): any {
  const results = {
    competitors: 0,
    alerts: 0,
    insights: 0,
    news: 0,
  }
  
  const competitorsMatch = output.match(/🎯 (\d+) competitors discovered/)
  const alertsMatch = output.match(/🔔 (\d+) alerts generated/)
  const insightsMatch = output.match(/💡 (\d+) insights created/)
  const newsMatch = output.match(/📰 (\d+) news items collected/)
  
  if (competitorsMatch) results.competitors = parseInt(competitorsMatch[1])
  if (alertsMatch) results.alerts = parseInt(alertsMatch[1])
  if (insightsMatch) results.insights = parseInt(insightsMatch[1])
  if (newsMatch) results.news = parseInt(newsMatch[1])
  
  return results
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
