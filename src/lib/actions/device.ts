'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import crypto from 'crypto'
import { triggerDeviceReload } from '@/lib/sse-notify'

// ------ Helpers ------

function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/1/O/0 for clarity
  let code = ''
  const bytes = crypto.randomBytes(6)
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

// ------ Schemas ------

const createDeviceSchema = z.object({
  name: z.string().min(1, 'Nama device wajib diisi').max(100),
  location: z.string().max(200).optional(),
  orientation: z.enum(['LANDSCAPE', 'PORTRAIT']),
})

// ------ Actions ------

export async function getDevices() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.device.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      currentPlaylist: { select: { id: true, name: true, status: true } },
    },
  })
}

export async function createDevice(formData: FormData) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const data = createDeviceSchema.parse({
    name: formData.get('name'),
    location: formData.get('location') || undefined,
    orientation: formData.get('orientation') || 'LANDSCAPE',
  })

  // Generate unique pairing code
  let pairingCode = generatePairingCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await prisma.device.findUnique({ where: { pairingCode } })
    if (!existing) break
    pairingCode = generatePairingCode()
    attempts++
  }

  const device = await prisma.device.create({
    data: {
      name: data.name,
      location: data.location || null,
      orientation: data.orientation,
      status: 'PAIRING',
      pairingCode,
      organizationId: session.user.organizationId,
    },
  })

  revalidatePath('/dashboard/devices')
  return device
}

export async function deleteDevice(deviceId: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  await prisma.device.deleteMany({
    where: { id: deviceId, organizationId: session.user.organizationId },
  })

  revalidatePath('/dashboard/devices')
}

export async function assignPlaylist(deviceId: string, playlistId: string | null) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  await prisma.device.updateMany({
    where: { id: deviceId, organizationId: session.user.organizationId },
    data: { currentPlaylistId: playlistId },
  })

  revalidatePath('/dashboard/devices')

  // Auto-sync: reload the device so it picks up the new playlist
  triggerDeviceReload(deviceId)
}

export async function getPublishedPlaylists() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.playlist.findMany({
    where: {
      organizationId: session.user.organizationId,
      status: 'PUBLISHED',
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

export async function updateDeviceLayout(
  deviceId: string,
  layoutType: 'FULLSCREEN' | 'L_SHAPE' | 'BOTTOM_TICKER' | 'SPLIT_VERTICAL',
  tickerText?: string
) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  await prisma.device.updateMany({
    where: { id: deviceId, organizationId: session.user.organizationId },
    data: {
      layoutType,
      tickerText: layoutType === 'BOTTOM_TICKER' ? (tickerText || null) : null,
    },
  })

  revalidatePath('/dashboard/devices')

  // Auto-sync: reload the device so it picks up new layout
  triggerDeviceReload(deviceId)
}

export async function renameDevice(deviceId: string, newName: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const trimmed = newName.trim()
  if (!trimmed || trimmed.length > 100) throw new Error('Nama tidak valid')

  await prisma.device.updateMany({
    where: { id: deviceId, organizationId: session.user.organizationId },
    data: { name: trimmed },
  })

  revalidatePath('/dashboard/devices')
}
