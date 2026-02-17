import { NextRequest, NextResponse } from 'next/server'
import { startAgentScan, getScanProgress } from '@/lib/agent-runner'

/**
 * API endpoint to trigger AI agent scan
 * POST /api/scan
 * Body: { industry: string, userId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { industry, userId } = body

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    console.log(`[API] Scan requested for industry: ${industry}, user: ${userId || 'demo'}`)

    // Start agent scan in background
    const jobId = await startAgentScan(industry, userId || 'demo_user')

    return NextResponse.json({
      success: true,
      message: 'Scan initiated',
      industry,
      jobId,
      estimatedDuration: 20,
    })

  } catch (error) {
    console.error('[API] Scan error:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scan?jobId=xxx
 * Check scan status (real-time polling)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId is required' },
      { status: 400 }
    )
  }

  const progress = getScanProgress(jobId)

  if (!progress) {
    return NextResponse.json(
      { error: 'Job not found or expired' },
      { status: 404 }
    )
  }

  return NextResponse.json(progress)
}
