'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Get the organization branding settings.
 */
export async function getOrganizationSettings() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      logoUrl: true,
      brandColor: true,
      plan: true,
      maxDevices: true,
      maxStorage: true,
    },
  })
}

/**
 * Update organization branding (Owner/Admin only).
 */
export async function updateOrganizationBranding(data: {
  name?: string
  brandColor?: string
  logoUrl?: string | null
}) {
  const session = await auth()
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify role
  const member = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  })
  if (!member) throw new Error('Insufficient permissions')

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.brandColor && { brandColor: data.brandColor }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
    },
  })

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
}

/**
 * Check SaaS plan limits before resource creation.
 * Returns { allowed: boolean, reason?: string }
 */
export async function checkPlanLimits(type: 'device' | 'storage', additionalBytes?: number) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      maxDevices: true,
      maxStorage: true,
      plan: true,
      _count: { select: { devices: true } },
      media: { select: { fileSize: true } },
    },
  })
  if (!org) throw new Error('Organization not found')

  if (type === 'device') {
    if (org._count.devices >= org.maxDevices) {
      return {
        allowed: false,
        reason: `Batas ${org.maxDevices} device untuk paket ${org.plan} tercapai. Upgrade untuk menambah lebih banyak layar.`,
      }
    }
    return { allowed: true }
  }

  if (type === 'storage') {
    const usedStorage = org.media.reduce((sum, m) => sum + m.fileSize, 0)
    const maxStorage = Number(org.maxStorage)
    const newTotal = usedStorage + (additionalBytes ?? 0)
    if (newTotal > maxStorage) {
      const usedMB = Math.round(usedStorage / 1024 / 1024)
      const maxMB = Math.round(maxStorage / 1024 / 1024)
      return {
        allowed: false,
        reason: `Storage penuh (${usedMB}MB / ${maxMB}MB). Upgrade paket atau hapus file yang tidak terpakai.`,
      }
    }
    return { allowed: true }
  }

  return { allowed: true }
}
