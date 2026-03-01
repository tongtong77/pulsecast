'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { triggerOrgReload } from '@/lib/sse-notify'

// ------ Schemas ------

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Nama playlist wajib diisi').max(100),
  description: z.string().max(500).optional(),
})

const updatePlaylistItemsSchema = z.object({
  playlistId: z.string(),
  items: z.array(
    z.object({
      mediaId: z.string(),
      order: z.number().int().min(0),
      duration: z.number().int().min(1).max(3600).optional(),
      transition: z.enum([
        'NONE',
        'FADE',
        'SLIDE_LEFT',
        'SLIDE_RIGHT',
        'SLIDE_UP',
        'SLIDE_DOWN',
        'ZOOM_IN',
        'ZOOM_OUT',
      ]).optional(),
    })
  ),
})

// ------ Actions ------

export async function getPlaylists() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.playlist.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      createdBy: { select: { name: true } },
    },
  })
}

export async function getPlaylistById(id: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.playlist.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: { media: true },
      },
      createdBy: { select: { name: true } },
    },
  })
}

export async function createPlaylist(formData: FormData) {
  const session = await auth()
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const data = createPlaylistSchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
  })

  const playlist = await prisma.playlist.create({
    data: {
      name: data.name,
      description: data.description || null,
      status: 'DRAFT',
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  })

  revalidatePath('/dashboard/playlists')
  triggerOrgReload(session.user.organizationId)
  return playlist
}

export async function updatePlaylistStatus(
  playlistId: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  await prisma.playlist.updateMany({
    where: { id: playlistId, organizationId: session.user.organizationId },
    data: { status },
  })

  revalidatePath('/dashboard/playlists')
  revalidatePath(`/dashboard/playlists/${playlistId}`)
  triggerOrgReload(session.user.organizationId)
}

export async function deletePlaylist(playlistId: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  // Delete items first, then playlist (cascade would also work but being explicit)
  await prisma.playlistItem.deleteMany({ where: { playlistId } })
  await prisma.playlist.deleteMany({
    where: { id: playlistId, organizationId: session.user.organizationId },
  })

  revalidatePath('/dashboard/playlists')
  triggerOrgReload(session.user.organizationId)
}

export async function updatePlaylistItems(
  input: z.infer<typeof updatePlaylistItemsSchema>
) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const data = updatePlaylistItemsSchema.parse(input)

  // Verify playlist belongs to org
  const playlist = await prisma.playlist.findFirst({
    where: {
      id: data.playlistId,
      organizationId: session.user.organizationId,
    },
  })

  if (!playlist) throw new Error('Playlist not found')

  // Replace all items atomically
  await prisma.$transaction(async (tx) => {
    // Delete existing items
    await tx.playlistItem.deleteMany({
      where: { playlistId: data.playlistId },
    })

    // Create new items
    if (data.items.length > 0) {
      await tx.playlistItem.createMany({
        data: data.items.map((item) => ({
          playlistId: data.playlistId,
          mediaId: item.mediaId,
          order: item.order,
          duration: item.duration ?? 10,
          transition: item.transition ?? 'FADE',
        })),
      })
    }
  })

  revalidatePath(`/dashboard/playlists/${data.playlistId}`)
  triggerOrgReload(session.user.organizationId)
}

export async function getOrganizationMedia() {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  return prisma.media.findMany({
    where: {
      organizationId: session.user.organizationId,
      approvalStatus: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function renamePlaylist(playlistId: string, newName: string) {
  const session = await auth()
  if (!session?.user?.organizationId) throw new Error('Unauthorized')

  const trimmed = newName.trim()
  if (!trimmed || trimmed.length > 100) throw new Error('Nama tidak valid')

  await prisma.playlist.updateMany({
    where: { id: playlistId, organizationId: session.user.organizationId },
    data: { name: trimmed },
  })

  revalidatePath('/dashboard/playlists')
}
