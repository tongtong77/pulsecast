'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'

export async function getMedia() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.media.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { name: true } } },
  })
}

export async function deleteMedia(mediaId: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  // Find media scoped to org
  const media = await prisma.media.findFirst({
    where: {
      id: mediaId,
      organizationId: session.user.organizationId,
    },
  })

  if (!media) throw new Error('Media not found')

  // Delete physical file
  try {
    const filePath = path.join(process.cwd(), 'public', media.url)
    await fs.unlink(filePath)
    // Delete thumbnail too
    if (media.thumbnail) {
      const thumbPath = path.join(process.cwd(), 'public', media.thumbnail)
      await fs.unlink(thumbPath).catch(() => {})
    }
  } catch {
    // File might not exist, continue with DB deletion
  }

  await prisma.media.delete({ where: { id: mediaId } })
  revalidatePath('/dashboard/media')

  return { success: true }
}
