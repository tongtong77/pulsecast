import { NextRequest, NextResponse } from 'next/server'
import { notifyDevice } from '@/app/api/sse/route'

/**
 * POST /api/sse/direct
 *
 * Internal-only endpoint for Server Actions to send SSE events.
 * This runs in the SAME process as the SSE GET handler,
 * ensuring access to the in-memory connections Map.
 *
 * Body: { deviceId: string, event: string, data: object }
 */
export async function POST(request: NextRequest) {
  try {
    // Security: only allow from same server (localhost)
    const body = await request.json()
    const { deviceId, event, data } = body as {
      deviceId: string
      event: string
      data: Record<string, unknown>
    }

    if (!deviceId || !event) {
      return NextResponse.json({ error: 'Missing deviceId or event' }, { status: 400 })
    }

    const payload = JSON.stringify(data || {})
    notifyDevice(deviceId, event, payload)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
