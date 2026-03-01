'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ListVideo,
  Plus,
  Trash2,
  Loader2,
  Eye,
  MoreVertical,
  Archive,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  createPlaylist,
  deletePlaylist,
  updatePlaylistStatus,
} from '@/lib/actions/playlist'
import { toast } from 'sonner'
import Link from 'next/link'

type PlaylistItem = {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  _count: { items: number }
  createdBy: { name: string }
}

const statusColors: Record<string, string> = {
  DRAFT: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  PUBLISHED: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  ARCHIVED: 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
}

export function CreatePlaylistDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const playlist = await createPlaylist(formData)
      toast.success(`Playlist "${playlist.name}" berhasil dibuat!`)
      setOpen(false)
      router.push(`/dashboard/playlists/${playlist.id}`)
    } catch {
      toast.error('Gagal membuat playlist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Buat Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Playlist Baru</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Buat playlist baru dan tambahkan media ke dalamnya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Nama Playlist</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Contoh: Promo Januari 2026"
                className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Deskripsi (Opsional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="Deskripsi singkat playlist..."
                className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-violet-600 to-indigo-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PlaylistList({ playlists }: { playlists: PlaylistItem[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    try {
      await deletePlaylist(id)
      toast.success(`Playlist "${name}" berhasil dihapus.`)
      router.refresh()
    } catch {
      toast.error('Gagal menghapus playlist.')
    } finally {
      setDeleting(null)
    }
  }

  const handleStatusChange = async (id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      await updatePlaylistStatus(id, status)
      toast.success(`Status berhasil diubah ke ${statusLabels[status]}.`)
      router.refresh()
    } catch {
      toast.error('Gagal mengubah status.')
    }
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <ListVideo className="w-16 h-16 mb-4 text-zinc-700" />
        <h3 className="text-lg font-medium text-zinc-400">Belum ada playlist</h3>
        <p className="text-sm mt-1">Buat playlist pertama Anda.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {playlists.map((pl) => (
        <div
          key={pl.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <ListVideo className="w-5 h-5 text-violet-400" />
              </div>
              <Badge variant="outline" className={statusColors[pl.status]}>
                {statusLabels[pl.status]}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-zinc-500 hover:text-zinc-300">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                <DropdownMenuItem
                  onClick={() => handleStatusChange(pl.id, pl.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                  className="text-zinc-300 focus:bg-zinc-800 cursor-pointer"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {pl.status === 'PUBLISHED' ? 'Set Draft' : 'Publish'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(pl.id, 'ARCHIVED')}
                  className="text-zinc-300 focus:bg-zinc-800 cursor-pointer"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Arsipkan
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(pl.id, pl.name)}
                  disabled={deleting === pl.id}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                >
                  {deleting === pl.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href={`/dashboard/playlists/${pl.id}`} className="block">
            <h3 className="font-semibold text-zinc-200 group-hover:text-white truncate">
              {pl.name}
            </h3>
            {pl.description && (
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                {pl.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-3 text-[11px] text-zinc-500">
              <span>{pl._count.items} item</span>
              <span>
                {new Date(pl.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
