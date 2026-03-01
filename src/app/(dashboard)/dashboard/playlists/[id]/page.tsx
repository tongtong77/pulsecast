import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPlaylistById, getOrganizationMedia } from '@/lib/actions/playlist'
import { PlaylistBuilder } from '@/components/playlist/playlist-builder'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ListVideo } from 'lucide-react'

const statusColors: Record<string, string> = {
  DRAFT: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  PUBLISHED: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  ARCHIVED: 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10',
}

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [playlist, allMedia] = await Promise.all([
    getPlaylistById(id),
    getOrganizationMedia(),
  ])

  if (!playlist) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/playlists">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <ListVideo className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-100">
                {playlist.name}
              </h1>
              <Badge
                variant="outline"
                className={statusColors[playlist.status]}
              >
                {playlist.status}
              </Badge>
            </div>
            {playlist.description && (
              <p className="text-sm text-zinc-400">{playlist.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Builder */}
      <PlaylistBuilder
        playlistId={playlist.id}
        initialItems={playlist.items}
        allMedia={allMedia}
      />
    </div>
  )
}
