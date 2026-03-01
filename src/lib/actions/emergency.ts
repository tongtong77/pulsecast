'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Send SSE event to a specific device via HTTP trigger API.
 * MUST use HTTP because Server Actions run in different workers
 * and don't have access to the SSE route's in-memory connections Map.
 */
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
 * Broadcast an emergency alert to ALL devices in the organization.
 * Creates a DB record and sends SSE event to every connected TV.
 */
export async function broadcastEmergencyAlert(message: string) {
  const session = await auth()
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Deactivate any existing active alerts first
  await prisma.emergencyAlert.updateMany({
    where: {
      organizationId: session.user.organizationId,
      isActive: true,
    },
    data: { isActive: false, resolvedAt: new Date() },
  })

  // Create the new alert
  const alert = await prisma.emergencyAlert.create({
    data: {
      message,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  })

  // Send SSE to ALL organization devices via HTTP
  const devices = await prisma.device.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  })

  for (const device of devices) {
    await sendSSE(device.id, 'EMERGENCY_ALERT', {
      alertId: alert.id,
      message: alert.message,
      timestamp: Date.now(),
    })
  }

  revalidatePath('/dashboard/devices')
  return alert
}

/**
 * Resolve (deactivate) the active emergency alert.
 * Sends EMERGENCY_RESOLVED to all devices so they resume normal playback.
 */
export async function resolveEmergencyAlert() {
  const session = await auth()
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized')
  }

  await prisma.emergencyAlert.updateMany({
    where: {
      organizationId: session.user.organizationId,
      isActive: true,
    },
    data: { isActive: false, resolvedAt: new Date() },
  })

  // Send EMERGENCY_RESOLVED to ALL devices via HTTP
  const devices = await prisma.device.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  })

  for (const device of devices) {
    await sendSSE(device.id, 'EMERGENCY_RESOLVED', { timestamp: Date.now() })
  }

  revalidatePath('/dashboard/devices')
}

/**
 * Get the current active emergency alert for the organization.
 */
export async function getActiveEmergencyAlert() {
  const session = await auth()
  if (!session?.user?.organizationId) return null

  return prisma.emergencyAlert.findFirst({
    where: {
      organizationId: session.user.organizationId,
      isActive: true,
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
