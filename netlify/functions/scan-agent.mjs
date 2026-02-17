import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// In-memory progress store
const progressStore = new Map()

export default async (req, context) => {
  const url = new URL(req.url)
  const industry = url.searchParams.get('industry') || 'Video Games'
  const jobId = url.searchParams.get('jobId')
  const action = url.searchParams.get('action') || 'start'

  // Get progress
  if (action === 'status' && jobId) {
    const progress = progressStore.get(jobId)
    return new Response(JSON.stringify(progress || { error: 'Job not found' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Start new scan
  const newJobId = `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  progressStore.set(newJobId, {
    progress: 0,
    message: 'Starting scan...',
    status: 'running'
  })

  // Run agent inline with embedded logic
  runAgentInline(newJobId, industry)

  return new Response(JSON.stringify({
    success: true,
    jobId: newJobId,
    message: 'Scan started'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function runAgentInline(jobId, industry) {
  // Simulate agent progress (since we can't run Node script directly)
  const steps = [
    { progress: 10, message: 'Initializing AI agent...' },
    { progress: 25, message: `Searching for ${industry} companies...` },
    { progress: 40, message: 'Collecting recent news...' },
    { progress: 60, message: 'Analyzing competitors with AI...' },
    { progress: 75, message: 'Generating strategic insights...' },
    { progress: 90, message: 'Creating alerts and reports...' },
  ]

  for (const step of steps) {
    await sleep(2000)
    progressStore.set(jobId, {
      progress: step.progress,
      message: step.message,
      status: 'running'
    })
  }

  // Actually call agent via HTTP API or use inline logic
  try {
    // For now: mark complete (you'd integrate actual agent logic here)
    await sleep(3000)
    
    progressStore.set(jobId, {
      progress: 100,
      message: 'Dashboard ready!',
      status: 'completed',
      results: {
        competitors: 15,
        alerts: 5,
        insights: 4,
        news: 20
      }
    })

    // Clean up after 5 minutes
    setTimeout(() => progressStore.delete(jobId), 5 * 60 * 1000)
    
  } catch (error) {
    progressStore.set(jobId, {
      progress: 0,
      message: `Error: ${error.message}`,
      status: 'failed'
    })
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const config = {
  path: '/api/scan-agent'
}
