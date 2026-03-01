import { NextRequest } from 'next/server'

// In-memory store for SSE connections per device
// In production, use Redis Pub/Sub for multi-instance support
const connections = new Map<string, Set<ReadableStreamDefaultController>>()

export function addConnection(deviceId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(deviceId)) {
    connections.set(deviceId, new Set())
  }
  connections.get(deviceId)!.add(controller)
}

export function removeConnection(deviceId: string, controller: ReadableStreamDefaultController) {
  const set = connections.get(deviceId)
  if (set) {
    set.delete(controller)
    if (set.size === 0) connections.delete(deviceId)
  }
}

/**
 * Send an event to all connected players for a device.
 * Called from admin actions when playlist/schedule changes.
 */
export function notifyDevice(deviceId: string, event: string, data?: string) {
  const set = connections.get(deviceId)
  if (!set) return

  const message = `event: ${event}\ndata: ${data || '{}'}\n\n`
  const encoder = new TextEncoder()

  for (const controller of set) {
    try {
      controller.enqueue(encoder.encode(message))
    } catch {
      set.delete(controller)
    }
  }
}

/**
 * Broadcast to ALL connected devices in an organization.
 */
export function notifyAllDevices(event: string, data?: string) {
  const message = `event: ${event}\ndata: ${data || '{}'}\n\n`
  const encoder = new TextEncoder()

  for (const [, controllers] of connections) {
    for (const controller of controllers) {
      try {
        controller.enqueue(encoder.encode(message))
      } catch {
        controllers.delete(controller)
      }
    }
  }
}

// SSE Endpoint
export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get('deviceId')
  if (!deviceId) {
    return new Response('Missing deviceId', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      addConnection(deviceId, controller)

      // Send keepalive comment every 15s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepalive)
        }
      }, 15000)

      // Send initial connected event
      controller.enqueue(
        encoder.encode(`event: CONNECTED\ndata: {"deviceId":"${deviceId}"}\n\n`)
      )

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive)
        removeConnection(deviceId, controller)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
