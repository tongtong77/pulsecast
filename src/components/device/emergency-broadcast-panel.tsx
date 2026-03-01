'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Siren, ShieldCheck } from 'lucide-react'
import { broadcastEmergencyAlert, resolveEmergencyAlert } from '@/lib/actions/emergency'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type ActiveAlert = {
  id: string
  message: string
  createdAt: Date
  createdBy: { name: string }
} | null

export function EmergencyBroadcastPanel({ activeAlert }: { activeAlert: ActiveAlert }) {
  const router = useRouter()
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)

  const handleBroadcast = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await broadcastEmergencyAlert(message.trim())
      toast.error('🚨 EMERGENCY ALERT DIKIRIM KE SEMUA LAYAR!', {
        duration: 8000,
        style: { background: '#dc2626', color: '#fff', border: 'none' },
      })
      setBroadcastOpen(false)
      setMessage('')
      router.refresh()
    } catch {
      toast.error('Gagal mengirim alert darurat.')
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      await resolveEmergencyAlert()
      toast.success('✅ Alert darurat dimatikan. Layar kembali normal.')
      router.refresh()
    } catch {
      toast.error('Gagal mematikan alert.')
    } finally {
      setResolving(false)
    }
  }

  if (activeAlert) {
    return (
      <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Siren className="w-6 h-6 text-red-400 animate-bounce" />
            <div>
              <p className="text-sm font-bold text-red-400 uppercase tracking-wider">
                🚨 Alert Darurat Aktif
              </p>
              <p className="text-lg font-bold text-white mt-1">&quot;{activeAlert.message}&quot;</p>
              <p className="text-xs text-red-300/60 mt-1">
                Diaktifkan oleh {activeAlert.createdBy.name}
              </p>
            </div>
          </div>
          <Button
            onClick={handleResolve}
            disabled={resolving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            {resolving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="w-4 h-4 mr-2" />
            )}
            Matikan Alert
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={() => setBroadcastOpen(true)}
        variant="outline"
        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
      >
        <Siren className="w-4 h-4 mr-2" />
        Emergency Broadcast
      </Button>

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="bg-zinc-950 border-red-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Siren className="w-5 h-5" />
              Emergency Broadcast
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Pesan ini akan meng-override SEMUA layar TV di organisasi Anda secara instan.
              Gunakan hanya untuk keadaan darurat nyata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Pesan Darurat</Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contoh: EVAKUASI GEDUNG SEKARANG"
                className="bg-zinc-900/50 border-red-500/30 text-zinc-100 uppercase font-bold text-lg"
                autoFocus
              />
            </div>
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-xs text-red-400">
                ⚠️ Setelah dikirim, SEMUA layar TV akan menampilkan pesan darurat dengan layar
                merah berkedip. Playlist yang sedang tayang akan dihentikan sementara.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBroadcastOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Batal
            </Button>
            <Button
              onClick={handleBroadcast}
              disabled={!message.trim() || sending}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '🚨 '}
              Broadcast Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
