import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notifyDevice } from '@/app/api/sse/route'

type RemoteCommand = 'RELOAD_PLAYER' | 'FORCE_RELOAD' | 'CLEAR_CACHE'

/**
 * POST /api/sse/trigger
 * Sends a targeted command to a specific device or all org devices via SSE.
 *
 * Body: {
 *   deviceId?: string,        — target specific device (if omitted, all org devices)
 *   command?: RemoteCommand    — default: RELOAD_PLAYER
 * }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { deviceId, command = 'RELOAD_PLAYER' } = body as {
      deviceId?: string
      command?: RemoteCommand
    }

    const validCommands: RemoteCommand[] = ['RELOAD_PLAYER', 'FORCE_RELOAD', 'CLEAR_CACHE']
    if (!validCommands.includes(command)) {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 })
    }

    const payload = JSON.stringify({ command, timestamp: Date.now() })

    if (deviceId) {
      // Verify device belongs to org
      const device = await prisma.device.findFirst({
        where: { id: deviceId, organizationId: session.user.organizationId },
      })
      if (!device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 })
      }
      notifyDevice(deviceId, 'REMOTE_COMMAND', payload)
    } else {
      // Broadcast to all org devices
      const devices = await prisma.device.findMany({
        where: { organizationId: session.user.organizationId, status: 'ONLINE' },
        select: { id: true },
      })
      for (const d of devices) {
        notifyDevice(d.id, 'REMOTE_COMMAND', payload)
      }
    }

    return NextResponse.json({ ok: true, command, deviceId: deviceId || 'all' })
  } catch {
    return NextResponse.json({ error: 'Failed to trigger' }, { status: 500 })
  }
}
