'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MonitorSmartphone,
  Plus,
  Trash2,
  Loader2,
  MoreVertical,
  ListVideo,
  Copy,
  Wifi,
  WifiOff,
  Radio,
  RotateCcw,
  Layers,
  RefreshCw,
  HardDriveDownload,
} from 'lucide-react'
import {
  createDevice,
  deleteDevice,
  assignPlaylist,
  updateDeviceLayout,
} from '@/lib/actions/device'
import { toast } from 'sonner'

type DeviceItem = {
  id: string
  name: string
  location: string | null
  orientation: string
  layoutType: string
  tickerText: string | null
  status: string
  pairingCode: string | null
  lastHeartbeat: Date | null
  timezone: string
  resolution: string | null
  currentPlaylist: { id: string; name: string; status: string } | null
  createdAt: Date
}

type PlaylistOption = { id: string; name: string }

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ONLINE: { label: 'Online', icon: Wifi, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
  OFFLINE: { label: 'Offline', icon: WifiOff, color: 'border-red-500/30 text-red-400 bg-red-500/10' },
  PAIRING: { label: 'Pairing', icon: Radio, color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
}

// ========== Add Device Dialog ==========

export function AddDeviceDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ name: string; pairingCode: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const device = await createDevice(formData)
      setResult({ name: device.name, pairingCode: device.pairingCode! })
      toast.success(`Device "${device.name}" berhasil ditambahkan!`)
      router.refresh()
    } catch {
      toast.error('Gagal menambahkan device.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setResult(null)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Pairing code disalin!')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null) }}>
      <DialogTrigger asChild>
        <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Device
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
        {!result ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Tambah Device Baru</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Daftarkan layar TV/Monitor baru ke CMS.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Nama Device</Label>
                <Input
                  id="name" name="name" required
                  placeholder="Contoh: Lobby TV 1"
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-zinc-300">Lokasi (Opsional)</Label>
                <Input
                  id="location" name="location"
                  placeholder="Contoh: Gedung A, Lantai 1"
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Orientasi</Label>
                <Select name="orientation" defaultValue="LANDSCAPE">
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem value="LANDSCAPE" className="text-zinc-300">Landscape (Horizontal)</SelectItem>
                    <SelectItem value="PORTRAIT" className="text-zinc-300">Portrait (Vertikal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} className="border-zinc-700 text-zinc-300">Batal</Button>
              <Button type="submit" disabled={loading} className="bg-linear-to-r from-blue-600 to-indigo-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Device Berhasil Ditambahkan! 🎉</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Masukkan kode pairing ini di layar TV &quot;{result.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Pairing Code</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-4xl font-mono font-bold tracking-[0.3em] text-blue-400 bg-blue-500/10 px-6 py-4 rounded-xl border border-blue-500/20">
                    {result.pairingCode}
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => copyCode(result.pairingCode)}
                    className="border-zinc-700 text-zinc-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Kode ini akan tampil di halaman pairing player device.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="bg-linear-to-r from-blue-600 to-indigo-600 w-full">
                Selesai
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ========== Device Table ==========

export function DeviceTable({
  devices,
  playlists,
}: {
  devices: DeviceItem[]
  playlists: PlaylistOption[]
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [layoutDialog, setLayoutDialog] = useState<DeviceItem | null>(null)
  const [layoutType, setLayoutType] = useState('FULLSCREEN')
  const [tickerText, setTickerText] = useState('')
  const [savingLayout, setSavingLayout] = useState(false)

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    try {
      await deleteDevice(id)
      toast.success(`Device "${name}" berhasil dihapus.`)
      router.refresh()
    } catch {
      toast.error('Gagal menghapus device.')
    } finally {
      setDeleting(null)
    }
  }

  const handleAssign = async (deviceId: string, playlistId: string | null) => {
    setAssigning(deviceId)
    try {
      await assignPlaylist(deviceId, playlistId)
      toast.success(playlistId ? 'Playlist berhasil diassign!' : 'Playlist dicopot.')
      router.refresh()
    } catch {
      toast.error('Gagal mengassign playlist.')
    } finally {
      setAssigning(null)
    }
  }

  const openLayoutDialog = (device: DeviceItem) => {
    setLayoutDialog(device)
    setLayoutType(device.layoutType || 'FULLSCREEN')
    setTickerText(device.tickerText || '')
  }

  const handleSaveLayout = async () => {
    if (!layoutDialog) return
    setSavingLayout(true)
    try {
      await updateDeviceLayout(
        layoutDialog.id,
        layoutType as 'FULLSCREEN' | 'L_SHAPE' | 'BOTTOM_TICKER' | 'SPLIT_VERTICAL',
        tickerText
      )
      toast.success('Layout berhasil diperbarui!')
      setLayoutDialog(null)
      router.refresh()
    } catch {
      toast.error('Gagal memperbarui layout.')
    } finally {
      setSavingLayout(false)
    }
  }

  const sendRemoteCommand = async (deviceId: string, deviceName: string, command: 'FORCE_RELOAD' | 'CLEAR_CACHE') => {
    const label = command === 'FORCE_RELOAD' ? 'Refresh Layar' : 'Bersihkan Cache'
    try {
      const res = await fetch('/api/sse/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, command }),
      })
      if (res.ok) {
        toast.success(`Perintah "${label}" terkirim ke "${deviceName}"! 📡`)
      } else {
        toast.error(`Gagal mengirim perintah ke "${deviceName}".`)
      }
    } catch {
      toast.error('Gagal menghubungi server.')
    }
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <MonitorSmartphone className="w-16 h-16 mb-4 text-zinc-700" />
        <h3 className="text-lg font-medium text-zinc-400">Belum ada device</h3>
        <p className="text-sm mt-1">Tambahkan layar TV/Monitor pertama Anda.</p>
      </div>
    )
  }

  return (
    <>
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">Nama</TableHead>
            <TableHead className="text-zinc-400">Lokasi</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-zinc-400">Orientasi</TableHead>
            <TableHead className="text-zinc-400">Playlist Aktif</TableHead>
            <TableHead className="text-zinc-400 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => {
            const status = statusConfig[device.status] || statusConfig.OFFLINE
            const StatusIcon = status.icon

            return (
              <TableRow key={device.id} className="border-zinc-800 hover:bg-zinc-900/50">
                <TableCell>
                  <div>
                    <p className="font-medium text-zinc-200">{device.name}</p>
                    {device.pairingCode && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {device.pairingCode}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {device.location || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${status.color} gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{device.orientation === 'LANDSCAPE' ? '⬛ Landscape' : '▬ Portrait'}</span>
                    {device.layoutType && device.layoutType !== 'FULLSCREEN' && (
                      <Badge variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/10 text-[10px]">
                        {device.layoutType.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {device.currentPlaylist ? (
                    <div className="flex items-center gap-1.5">
                      <ListVideo className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-sm text-zinc-300">{device.currentPlaylist.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600">Tidak ada</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-zinc-500">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 w-56">
                      {/* Quick Assign Playlist */}
                      {playlists.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs text-zinc-500 font-medium">
                            Quick Assign Playlist
                          </div>
                          {playlists.map((pl) => (
                            <DropdownMenuItem
                              key={pl.id}
                              onClick={() => handleAssign(device.id, pl.id)}
                              disabled={assigning === device.id}
                              className={`text-zinc-300 focus:bg-zinc-800 cursor-pointer text-xs ${
                                device.currentPlaylist?.id === pl.id ? 'text-blue-400' : ''
                              }`}
                            >
                              <ListVideo className="w-3.5 h-3.5 mr-2" />
                              {pl.name}
                              {device.currentPlaylist?.id === pl.id && ' ✓'}
                            </DropdownMenuItem>
                          ))}
                          {device.currentPlaylist && (
                            <DropdownMenuItem
                              onClick={() => handleAssign(device.id, null)}
                              className="text-zinc-500 focus:bg-zinc-800 cursor-pointer text-xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-2" />
                              Copot Playlist
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-zinc-800" />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => openLayoutDialog(device)}
                        className="text-zinc-300 focus:bg-zinc-800 cursor-pointer"
                      >
                        <Layers className="w-4 h-4 mr-2" />
                        Layout Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <div className="px-2 py-1.5 text-xs text-zinc-500 font-medium">
                        Fleet Control
                      </div>
                      <DropdownMenuItem
                        onClick={() => sendRemoteCommand(device.id, device.name, 'FORCE_RELOAD')}
                        className="text-zinc-300 focus:bg-zinc-800 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        🔄 Paksa Refresh Layar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => sendRemoteCommand(device.id, device.name, 'CLEAR_CACHE')}
                        className="text-zinc-300 focus:bg-zinc-800 cursor-pointer"
                      >
                        <HardDriveDownload className="w-4 h-4 mr-2" />
                        🧹 Bersihkan Cache TV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem
                        onClick={() => handleDelete(device.id, device.name)}
                        disabled={deleting === device.id}
                        className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                      >
                        {deleting === device.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Hapus Device
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>

    {/* Layout Settings Dialog */}
    <Dialog open={!!layoutDialog} onOpenChange={(v) => { if (!v) setLayoutDialog(null) }}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Layout Settings</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Atur tipe layout zona untuk &quot;{layoutDialog?.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Tipe Layout</Label>
            <Select value={layoutType} onValueChange={setLayoutType}>
              <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                <SelectItem value="FULLSCREEN" className="text-zinc-300">Fullscreen</SelectItem>
                <SelectItem value="BOTTOM_TICKER" className="text-zinc-300">Bottom Ticker (Teks Berjalan)</SelectItem>
                <SelectItem value="L_SHAPE" className="text-zinc-300">L-Shape</SelectItem>
                <SelectItem value="SPLIT_VERTICAL" className="text-zinc-300">Split Vertical 50/50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {layoutType === 'BOTTOM_TICKER' && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Ticker Message</Label>
              <Input
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                placeholder="Contoh: Selamat datang di Acme Corp — Promosi Akhir Tahun!"
                className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
              />
              <p className="text-[11px] text-zinc-500">Teks ini akan berjalan di 10% bawah layar TV.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLayoutDialog(null)} className="border-zinc-700 text-zinc-300">Batal</Button>
          <Button onClick={handleSaveLayout} disabled={savingLayout} className="bg-linear-to-r from-blue-600 to-indigo-600">
            {savingLayout ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
