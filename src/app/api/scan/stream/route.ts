import { NextRequest } from 'next/server'
import { startAgentScan, getScanProgress } from '@/lib/agent-runner'

/**
 * Server-Sent Events (SSE) endpoint for real-time progress updates
 * GET /api/scan/stream?industry=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const industry = searchParams.get('industry')
  const userId = searchParams.get('userId') || 'demo_user'

  if (!industry) {
    return new Response('Industry is required', { status: 400 })
  }

  // Create readable stream for SSE
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Start the agent scan
        const jobId = await startAgentScan(industry, userId)
        
        // Send initial event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'started', 
          jobId,
          progress: 0,
          message: 'Scan initiated...'
        })}\n\n`))

        // Poll for updates
        const pollInterval = setInterval(async () => {
          const progress = getScanProgress(jobId)

          if (!progress) {
            clearInterval(pollInterval)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error',
              message: 'Job not found'
            })}\n\n`))
            controller.close()
            return
          }

          // Send progress update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            ...progress
          })}\n\n`))

          // If completed or failed, stop polling
          if (progress.status === 'completed' || progress.status === 'failed') {
            clearInterval(pollInterval)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: progress.status,
              ...progress
            })}\n\n`))
            controller.close()
          }
        }, 1000) // Update every second

        // Safety timeout: close stream after 3 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          controller.close()
        }, 3 * 60 * 1000)

      } catch (error: any) {
        console.error('[SSE] Error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error.message
        })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
