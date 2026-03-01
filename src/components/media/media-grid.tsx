'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Media } from '@/generated/prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileImage, FileVideo, Trash2, Loader2, ImageOff, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { deleteMedia } from '@/lib/actions/media'
import { toast } from 'sonner'

type MediaWithUploader = Media & {
  uploadedBy: { name: string }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const approvalBadge: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  APPROVED: {
    label: 'Approved',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    icon: CheckCircle2,
  },
  PENDING_REVIEW: {
    label: 'Pending',
    color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    icon: Clock,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'border-red-500/30 text-red-400 bg-red-500/10',
    icon: XCircle,
  },
}

export function MediaGrid({ media }: { media: MediaWithUploader[] }) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<MediaWithUploader | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMedia(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" berhasil dihapus.`)
      setDeleteTarget(null)
      router.refresh()
    } catch {
      toast.error('Gagal menghapus media.')
    } finally {
      setDeleting(false)
    }
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <ImageOff className="w-16 h-16 mb-4 text-zinc-700" />
        <h3 className="text-lg font-medium text-zinc-400">Belum ada media</h3>
        <p className="text-sm mt-1">
          Upload gambar atau video pertama Anda untuk memulai.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media.map((item) => {
          const status = item.approvalStatus || 'APPROVED'
          const badge = approvalBadge[status] || approvalBadge.APPROVED
          const BadgeIcon = badge.icon

          return (
            <div
              key={item.id}
              className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-all"
            >
              {/* Thumbnail / Preview */}
              <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                {item.type === 'IMAGE' ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-violet-500/10 to-blue-500/10">
                    <FileVideo className="w-10 h-10 text-violet-400" />
                  </div>
                )}

                {/* Type badge (top-left) */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] backdrop-blur-sm ${
                      item.type === 'IMAGE'
                        ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                        : 'border-violet-500/30 text-violet-400 bg-violet-500/10'
                    }`}
                  >
                    {item.type === 'IMAGE' ? (
                      <FileImage className="w-3 h-3 mr-1" />
                    ) : (
                      <FileVideo className="w-3 h-3 mr-1" />
                    )}
                    {item.type}
                  </Badge>
                </div>

                {/* Approval badge (bottom-left) */}
                <div className="absolute bottom-2 left-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] backdrop-blur-sm ${badge.color}`}
                  >
                    <BadgeIcon className="w-3 h-3 mr-1" />
                    {badge.label}
                  </Badge>
                </div>

                {/* Delete button (hover, top-right) */}
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{formatFileSize(item.fileSize)}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Hapus Media</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Apakah Anda yakin ingin menghapus{' '}
              <span className="font-medium text-zinc-200">
                &ldquo;{deleteTarget?.name}&rdquo;
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-zinc-700 text-zinc-300"
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                'Hapus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
