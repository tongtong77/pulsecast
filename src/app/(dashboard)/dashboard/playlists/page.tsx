import { getPlaylists } from '@/lib/actions/playlist'
import { CreatePlaylistDialog, PlaylistList } from '@/components/playlist/playlist-list'
import { ListVideo } from 'lucide-react'

export default async function PlaylistsPage() {
  const playlists = await getPlaylists()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <ListVideo className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Playlist</h1>
            <p className="text-sm text-zinc-400">
              {playlists.length} playlist • Kelola urutan tayang konten
            </p>
          </div>
        </div>
        <CreatePlaylistDialog />
      </div>

      {/* List */}
      <PlaylistList playlists={playlists} />
    </div>
  )
}
