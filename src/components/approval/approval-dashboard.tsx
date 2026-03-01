'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  Video,
  Loader2,
  FileCheck,
  FileX,
} from 'lucide-react'
import { approveMedia, rejectMedia } from '@/lib/actions/approval'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type MediaItem = {
  id: string
  name: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  fileSize: number
  approvalStatus: string
  createdAt: Date
  uploadedBy: { name: string }
}

type ApprovalData = {
  pending: MediaItem[]
  recentApproved: MediaItem[]
  recentRejected: MediaItem[]
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MediaPreview({ item }: { item: MediaItem }) {
  if (item.type === 'IMAGE') {
    return (
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div className="w-16 h-16 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
      <Video className="w-6 h-6 text-violet-400" />
    </div>
  )
}

export function ApprovalDashboard({ data }: { data: ApprovalData }) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)

  const handleApprove = async (id: string, name: string) => {
    setProcessing(id)
    try {
      await approveMedia(id)
      toast.success(`"${name}" disetujui! ✅`)
      router.refresh()
    } catch {
      toast.error('Gagal menyetujui media.')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string, name: string) => {
    setProcessing(id)
    try {
      await rejectMedia(id)
      toast.error(`"${name}" ditolak.`)
      router.refresh()
    } catch {
      toast.error('Gagal menolak media.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{data.pending.length}</p>
                <p className="text-xs text-zinc-400">Menunggu Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{data.recentApproved.length}</p>
                <p className="text-xs text-zinc-400">Baru Disetujui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <FileX className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{data.recentRejected.length}</p>
                <p className="text-xs text-zinc-400">Ditolak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Queue */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Antrean Review ({data.pending.length})
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Konten yang menunggu persetujuan sebelum bisa ditayangkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.pending.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p>Tidak ada konten yang menunggu review 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <MediaPreview item={item} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.type === 'IMAGE' ? (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Video className="w-3.5 h-3.5 text-violet-400" />
                      )}
                      <p className="font-medium text-zinc-200 truncate">{item.name}</p>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Oleh {item.uploadedBy.name} • {formatBytes(item.fileSize)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id, item.name)}
                      disabled={processing === item.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {processing === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(item.id, item.name)}
                      disabled={processing === item.id}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      {(data.recentApproved.length > 0 || data.recentRejected.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentApproved.length > 0 && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Baru Disetujui
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentApproved.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        {item.type}
                      </Badge>
                      <span className="text-zinc-300 truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {data.recentRejected.length > 0 && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Ditolak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentRejected.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                        {item.type}
                      </Badge>
                      <span className="text-zinc-300 truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
