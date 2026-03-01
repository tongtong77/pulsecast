import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/telemetry/pop
 * High-performance Proof of Play endpoint.
 * Called by Player Engine AFTER each media item finishes playing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, mediaId, playlistId, startTime, duration } = body as {
      deviceId: string
      mediaId: string
      playlistId?: string | null
      startTime: string
      duration: number
    }

    // Minimal validation
    if (!deviceId || !mediaId || !startTime || typeof duration !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Resolve organizationId from device
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { organizationId: true },
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + duration * 1000)

    // Sanitize playlistId — only link if it's a valid non-empty string
    const safePlaylistId = playlistId && typeof playlistId === 'string' && playlistId.length > 0
      ? playlistId
      : null

    await prisma.playLog.create({
      data: {
        deviceId,
        mediaId,
        playlistId: safePlaylistId,
        organizationId: device.organizationId,
        startTime: start,
        endTime: end,
        duration,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[PoP Telemetry Error]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

