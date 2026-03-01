'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

/**
 * Get PoP analytics metrics for the last N days.
 * All queries scoped to organizationId for multi-tenant isolation.
 */
export async function getPopAnalytics(days: number = 30) {
  const session = await auth()
  if (!session?.user?.organizationId) {
    return { error: 'Unauthorized' }
  }

  const orgId = session.user.organizationId
  const since = new Date()
  since.setDate(since.getDate() - days)

  // Run all aggregation queries in parallel
  const [
    totalImpressions,
    totalDurationResult,
    topDevices,
    topMedia,
    dailyImpressions,
  ] = await Promise.all([
    // 1. Total impressions
    prisma.playLog.count({
      where: { organizationId: orgId, startTime: { gte: since } },
    }),

    // 2. Total duration (seconds → hours)
    prisma.playLog.aggregate({
      where: { organizationId: orgId, startTime: { gte: since } },
      _sum: { duration: true },
    }),

    // 3. Top 5 most active devices
    prisma.playLog.groupBy({
      by: ['deviceId'],
      where: { organizationId: orgId, startTime: { gte: since } },
      _count: { id: true },
      _sum: { duration: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),

    // 4. Top 5 most played media
    prisma.playLog.groupBy({
      by: ['mediaId'],
      where: { organizationId: orgId, startTime: { gte: since } },
      _count: { id: true },
      _sum: { duration: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),

    // 5. Daily impressions (last 7 days for chart)
    prisma.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
      `SELECT DATE("startTime") as day, COUNT(*)::bigint as count
       FROM play_logs
       WHERE "organizationId" = $1 AND "startTime" >= $2
       GROUP BY DATE("startTime")
       ORDER BY day ASC`,
      orgId,
      since
    ),
  ])

  // Resolve device and media names
  const deviceIds = topDevices.map((d) => d.deviceId)
  const mediaIds = topMedia.map((m) => m.mediaId)

  const [devices, media] = await Promise.all([
    prisma.device.findMany({
      where: { id: { in: deviceIds } },
      select: { id: true, name: true, location: true },
    }),
    prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true, name: true, type: true },
    }),
  ])

  const deviceMap = new Map(devices.map((d) => [d.id, d]))
  const mediaMap = new Map(media.map((m) => [m.id, m]))

  const totalDurationHours = Math.round(
    (totalDurationResult._sum.duration || 0) / 3600 * 10
  ) / 10

  return {
    totalImpressions,
    totalDurationHours,
    topDevices: topDevices.map((d) => ({
      deviceId: d.deviceId,
      name: deviceMap.get(d.deviceId)?.name || 'Unknown',
      location: deviceMap.get(d.deviceId)?.location || '-',
      impressions: d._count.id,
      durationHours: Math.round((d._sum.duration || 0) / 3600 * 10) / 10,
    })),
    topMedia: topMedia.map((m) => ({
      mediaId: m.mediaId,
      name: mediaMap.get(m.mediaId)?.name || 'Unknown',
      type: mediaMap.get(m.mediaId)?.type || 'IMAGE',
      impressions: m._count.id,
      durationHours: Math.round((m._sum.duration || 0) / 3600 * 10) / 10,
    })),
    dailyImpressions: dailyImpressions.map((d) => ({
      day: new Date(d.day as unknown as string).toISOString().slice(0, 10),
      count: Number(d.count),
    })),
  }
}

/**
 * Export PoP data as CSV for auditors/advertisers.
 */
export async function exportPopCSV(days: number = 30) {
  const session = await auth()
  if (!session?.user?.organizationId) {
    return { error: 'Unauthorized' }
  }

  const orgId = session.user.organizationId
  const since = new Date()
  since.setDate(since.getDate() - days)

  const logs = await prisma.playLog.findMany({
    where: { organizationId: orgId, startTime: { gte: since } },
    include: {
      device: { select: { name: true, location: true } },
      media: { select: { name: true, type: true } },
    },
    orderBy: { startTime: 'desc' },
    take: 10000, // Limit for performance
  })

  // Build CSV
  const header = 'Device Name,Location,Media Name,Media Type,Start Time,End Time,Duration (s)\n'
  const rows = logs.map((log) =>
    [
      `"${log.device.name}"`,
      `"${log.device.location || '-'}"`,
      `"${log.media.name}"`,
      log.media.type,
      log.startTime.toISOString(),
      log.endTime.toISOString(),
      log.duration,
    ].join(',')
  ).join('\n')

  return { csv: header + rows, filename: `pop-report-${new Date().toISOString().slice(0, 10)}.csv` }
}
