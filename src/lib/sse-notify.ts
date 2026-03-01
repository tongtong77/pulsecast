/**
 * SSE Notify Helper — triggers SSE events via HTTP to /api/sse/direct.
 *
 * CRITICAL: We MUST use fetch() to the /api/sse/direct endpoint
 * instead of importing notifyDevice directly. Server Actions run in
 * different worker processes, so the in-memory connections Map in
 * sse/route.ts would be EMPTY when called from a Server Action context.
 *
 * The /api/sse/direct endpoint runs in the same process as the SSE GET handler,
 * so it has access to the actual connections Map.
 */

const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function sendSSE(deviceId: string, event: string, data: Record<string, unknown>) {
  try {
    await fetch(`${BASE_URL}/api/sse/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, event, data }),
    })
  } catch (e) {
    console.error('[SSE] sendSSE failed:', e)
  }
}

/**
 * Send RELOAD command to all devices in an organization.
 */
export async function triggerOrgReload(organizationId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const devices = await prisma.device.findMany({
      where: { organizationId, status: 'ONLINE' },
      select: { id: true },
    })

    for (const d of devices) {
      await sendSSE(d.id, 'REMOTE_COMMAND', { command: 'FORCE_RELOAD', timestamp: Date.now() })
    }
  } catch (e) {
    console.error('[SSE] triggerOrgReload failed:', e)
  }
}

/**
 * Send FORCE_RELOAD command to a specific device.
 */
export async function triggerDeviceReload(deviceId: string) {
  await sendSSE(deviceId, 'REMOTE_COMMAND', { command: 'FORCE_RELOAD', timestamp: Date.now() })
}
