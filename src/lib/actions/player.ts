'use server'

import { prisma } from '@/lib/prisma'

/**
 * Pair a device using a 6-digit pairing code.
 * Sets device to ONLINE, clears pairing code.
 */
export async function pairDevice(pairingCode: string) {
  if (!pairingCode || pairingCode.length !== 6) {
    return { error: 'Kode pairing harus 6 karakter.' }
  }

  const device = await prisma.device.findUnique({
    where: { pairingCode: pairingCode.toUpperCase() },
    include: { organization: { select: { name: true, slug: true, logo: true, brandColor: true, logoUrl: true } } },
  })

  if (!device) {
    return { error: 'Kode pairing tidak valid atau sudah digunakan.' }
  }

  // Activate device
  await prisma.device.update({
    where: { id: device.id },
    data: {
      status: 'ONLINE',
      pairingCode: null,
      lastHeartbeat: new Date(),
    },
  })

  return {
    success: true,
    deviceId: device.id,
    deviceName: device.name,
    organization: device.organization,
  }
}

/**
 * Smart Content Resolver — determines what to play right now.
 * Priority: Active Schedule > Current Playlist > IDLE
 */
export async function getPlayableContent(deviceId: string) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      organization: { select: { name: true, logo: true, slug: true, brandColor: true, logoUrl: true } },
      currentPlaylist: {
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { media: true },
            where: { media: { approvalStatus: 'APPROVED' } },
          },
        },
      },
    },
  })

  if (!device) return { status: 'NOT_FOUND' as const }

  // 1. Check active schedules for current day/time
  const now = new Date()
  const currentDay = now.getDay() === 0 ? 7 : now.getDay() // ISO: 1=Mon, 7=Sun
  const currentTime = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: device.timezone,
  })

  const schedules = await prisma.schedule.findMany({
    where: {
      deviceId: device.id,
      organizationId: device.organizationId,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      playlist: {
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { media: true },
            where: { media: { approvalStatus: 'APPROVED' } },
          },
        },
      },
    },
  })

  // STEP 1: Filter — collect ALL schedules valid for RIGHT NOW
  const validSchedules = schedules.filter((schedule) => {
    // Check day of week
    const scheduleDays = schedule.daysOfWeek.map(Number)
    if (!scheduleDays.includes(currentDay)) return false

    // Check time window (only if both are set)
    if (schedule.startTime && schedule.endTime) {
      if (currentTime < schedule.startTime || currentTime > schedule.endTime) return false
    }

    // Must have playable content
    if (schedule.playlist.items.length === 0) return false

    return true
  })

  // STEP 2: Sort by priority DESC — highest number wins
  validSchedules.sort((a, b) => b.priority - a.priority)

  // STEP 3: Pick the winner (index 0 = highest priority)
  const winningSchedule = validSchedules[0]

  if (winningSchedule) {
    return {
      status: 'PLAYING' as const,
      source: 'schedule' as const,
      scheduleName: winningSchedule.name,
      playlistId: winningSchedule.playlistId,
      device: {
        id: device.id,
        name: device.name,
        orientation: device.orientation,
        layoutType: device.layoutType,
        tickerText: device.tickerText,
      },
      organization: device.organization,
      items: winningSchedule.playlist.items.map((item) => ({
        id: item.id,
        duration: item.duration,
        transition: item.transition,
        media: {
          id: item.media.id,
          name: item.media.name,
          type: item.media.type,
          url: item.media.url,
          mimeType: item.media.mimeType,
        },
      })),
    }
  }

  // 2. Fallback to device's current playlist
  if (device.currentPlaylist && device.currentPlaylist.items.length > 0) {
    return {
      status: 'PLAYING' as const,
      source: 'direct' as const,
      scheduleName: null,
      playlistId: device.currentPlaylistId,
      device: {
        id: device.id,
        name: device.name,
        orientation: device.orientation,
        layoutType: device.layoutType,
        tickerText: device.tickerText,
      },
      organization: device.organization,
      items: device.currentPlaylist.items.map((item) => ({
        id: item.id,
        duration: item.duration,
        transition: item.transition,
        media: {
          id: item.media.id,
          name: item.media.name,
          type: item.media.type,
          url: item.media.url,
          mimeType: item.media.mimeType,
        },
      })),
    }
  }

  // 3. IDLE — no content
  return {
    status: 'IDLE' as const,
    device: {
      id: device.id,
      name: device.name,
      orientation: device.orientation,
      layoutType: device.layoutType,
      tickerText: device.tickerText,
    },
    organization: device.organization,
    items: [],
  }
}
