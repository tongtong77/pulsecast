'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { triggerDeviceReload } from '@/lib/sse-notify'

// ------ Schemas ------

const createScheduleSchema = z
  .object({
    name: z.string().min(1, 'Nama jadwal wajib diisi').max(100),
    playlistId: z.string().min(1, 'Playlist wajib dipilih'),
    deviceId: z.string().min(1, 'Device wajib dipilih'),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    daysOfWeek: z.array(z.number().int().min(1).max(7)).optional(),
    priority: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: 'Tanggal selesai tidak boleh sebelum tanggal mulai', path: ['endDate'] }
  )

// ------ Actions ------

export async function getSchedules() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.schedule.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ isActive: 'desc' }, { startDate: 'asc' }],
    include: {
      playlist: { select: { id: true, name: true, status: true } },
      device: { select: { id: true, name: true, location: true } },
    },
  })
}

export async function createSchedule(input: {
  name: string
  playlistId: string
  deviceId: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  daysOfWeek?: number[]
  priority?: number
}) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const data = createScheduleSchema.parse(input)

  const schedule = await prisma.schedule.create({
    data: {
      name: data.name,
      playlistId: data.playlistId,
      deviceId: data.deviceId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      daysOfWeek: data.daysOfWeek ?? [1, 2, 3, 4, 5, 6, 7],
      priority: data.priority ?? 0,
      isActive: true,
      organizationId: session.user.organizationId,
    },
  })

  revalidatePath('/dashboard/schedules')
  triggerDeviceReload(data.deviceId)
  return schedule
}

export async function toggleScheduleActive(scheduleId: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, organizationId: session.user.organizationId },
  })
  if (!schedule) throw new Error('Schedule not found')

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { isActive: !schedule.isActive },
  })

  revalidatePath('/dashboard/schedules')
  triggerDeviceReload(schedule.deviceId)
}

export async function deleteSchedule(scheduleId: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  // Get device ID before deleting
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, organizationId: session.user.organizationId },
    select: { deviceId: true },
  })

  await prisma.schedule.deleteMany({
    where: { id: scheduleId, organizationId: session.user.organizationId },
  })

  revalidatePath('/dashboard/schedules')
  if (schedule) triggerDeviceReload(schedule.deviceId)
}

export async function getScheduleFormData() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const [playlists, devices] = await Promise.all([
    prisma.playlist.findMany({
      where: { organizationId: session.user.organizationId, status: 'PUBLISHED' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.device.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true, location: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return { playlists, devices }
}

export async function renameSchedule(scheduleId: string, newName: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const trimmed = newName.trim()
  if (!trimmed || trimmed.length > 100) throw new Error('Nama tidak valid')

  await prisma.schedule.updateMany({
    where: { id: scheduleId, organizationId: session.user.organizationId },
    data: { name: trimmed },
  })

  revalidatePath('/dashboard/schedules')
}
