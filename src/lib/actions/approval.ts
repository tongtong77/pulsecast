'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Get all media items pending review for the organization.
 */
export async function getPendingMedia() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.media.findMany({
    where: {
      organizationId: session.user.organizationId,
      approvalStatus: 'PENDING_REVIEW',
    },
    include: {
      uploadedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get all approval items (media) grouped by status.
 */
export async function getApprovalQueue() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const [pending, recentApproved, recentRejected] = await Promise.all([
    prisma.media.findMany({
      where: {
        organizationId: session.user.organizationId,
        approvalStatus: 'PENDING_REVIEW',
      },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.media.findMany({
      where: {
        organizationId: session.user.organizationId,
        approvalStatus: 'APPROVED',
      },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.media.findMany({
      where: {
        organizationId: session.user.organizationId,
        approvalStatus: 'REJECTED',
      },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ])

  return { pending, recentApproved, recentRejected }
}

/**
 * Approve a media item. Only ADMIN, OWNER, or REVIEWER can approve.
 */
export async function approveMedia(mediaId: string) {
  const session = await auth()
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify authorization (must be ADMIN, OWNER, or REVIEWER)
  const member = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: { in: ['OWNER', 'ADMIN', 'REVIEWER'] },
    },
  })
  if (!member) throw new Error('Insufficient permissions')

  await prisma.media.update({
    where: { id: mediaId },
    data: { approvalStatus: 'APPROVED' },
  })

  revalidatePath('/dashboard/approvals')
  revalidatePath('/dashboard/media')
}

/**
 * Reject a media item. Only ADMIN, OWNER, or REVIEWER can reject.
 */
export async function rejectMedia(mediaId: string) {
  const session = await auth()
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const member = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: { in: ['OWNER', 'ADMIN', 'REVIEWER'] },
    },
  })
  if (!member) throw new Error('Insufficient permissions')

  await prisma.media.update({
    where: { id: mediaId },
    data: { approvalStatus: 'REJECTED' },
  })

  revalidatePath('/dashboard/approvals')
  revalidatePath('/dashboard/media')
}
