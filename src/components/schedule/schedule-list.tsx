'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Calendar,
  Plus,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  Clock,
  MonitorSmartphone,
  ListVideo,
  CalendarDays,
} from 'lucide-react'
import {
  createSchedule,
  deleteSchedule,
  toggleScheduleActive,
} from '@/lib/actions/schedule'
import { toast } from 'sonner'

type ScheduleItem = {
  id: string
  name: string
  priority: number
  startDate: Date
  endDate: Date
  startTime: string | null
  endTime: string | null
  daysOfWeek: number[]
  isActive: boolean
  playlist: { id: string; name: string; status: string }
  device: { id: string; name: string; location: string | null }
}

type FormOption = { id: string; name: string; location?: string | null }

const DAY_NAMES = [
  { value: 1, label: 'Sen' },
  { value: 2, label: 'Sel' },
  { value: 3, label: 'Rab' },
  { value: 4, label: 'Kam' },
  { value: 5, label: 'Jum' },
  { value: 6, label: 'Sab' },
  { value: 7, label: 'Min' },
]

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ========== Create Schedule Dialog ==========

export function CreateScheduleDialog({
  playlists,
  devices,
}: {
  playlists: FormOption[]
  devices: FormOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7])
  const [playlistId, setPlaylistId] = useState('')
  const [deviceId, setDeviceId] = useState('')

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget)
      await createSchedule({
        name: form.get('name') as string,
        playlistId,
        deviceId,
        startDate: form.get('startDate') as string,
        endDate: form.get('endDate') as string,
        startTime: (form.get('startTime') as string) || undefined,
        endTime: (form.get('endTime') as string) || undefined,
        daysOfWeek: selectedDays,
        priority: parseInt(form.get('priority') as string) || 0,
      })
      toast.success('Jadwal berhasil dibuat!')
      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membuat jadwal.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedDays([1, 2, 3, 4, 5, 6, 7])
    setPlaylistId('')
    setDeviceId('')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-lg shadow-teal-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Buat Jadwal
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Jadwal Baru</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Jadwalkan kapan playlist tertentu akan ditayangkan di device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="sch-name" className="text-zinc-300">Nama Campaign</Label>
              <Input
                id="sch-name" name="name" required
                placeholder="Contoh: Promo Weekend Maret"
                className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
              />
            </div>

            {/* Playlist & Device */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-1">
                  <ListVideo className="w-3.5 h-3.5" /> Playlist
                </Label>
                <Select value={playlistId} onValueChange={setPlaylistId} required>
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {playlists.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id} className="text-zinc-300">{pl.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-1">
                  <MonitorSmartphone className="w-3.5 h-3.5" /> Device
                </Label>
                <Select value={deviceId} onValueChange={setDeviceId} required>
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {devices.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-zinc-300">
                        {d.name}{d.location ? ` (${d.location})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-zinc-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
                </Label>
                <Input
                  id="startDate" name="startDate" type="date" required
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-zinc-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Selesai
                </Label>
                <Input
                  id="endDate" name="endDate" type="date" required
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>

            {/* Time Window */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Jam Mulai
                </Label>
                <Input
                  id="startTime" name="startTime" type="time"
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Jam Selesai
                </Label>
                <Input
                  id="endTime" name="endTime" type="time"
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> Hari Aktif
              </Label>
              <div className="flex gap-2">
                {DAY_NAMES.map((day) => (
                  <label
                    key={day.value}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                      selectedDays.includes(day.value)
                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                      className="hidden"
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-zinc-300">Prioritas (0 = rendah, 100 = tinggi)</Label>
              <Input
                id="priority" name="priority" type="number" min={0} max={100} defaultValue={0}
                className="bg-zinc-900/50 border-zinc-700 text-zinc-100 w-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-zinc-700 text-zinc-300">Batal</Button>
            <Button type="submit" disabled={loading || !playlistId || !deviceId} className="bg-linear-to-r from-teal-600 to-emerald-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Jadwal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ========== Schedule List ==========

export function ScheduleList({ schedules }: { schedules: ScheduleItem[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const handleToggle = async (id: string) => {
    setToggling(id)
    try {
      await toggleScheduleActive(id)
      router.refresh()
    } catch {
      toast.error('Gagal mengubah status jadwal.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    try {
      await deleteSchedule(id)
      toast.success(`Jadwal "${name}" berhasil dihapus.`)
      router.refresh()
    } catch {
      toast.error('Gagal menghapus jadwal.')
    } finally {
      setDeleting(null)
    }
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Calendar className="w-16 h-16 mb-4 text-zinc-700" />
        <h3 className="text-lg font-medium text-zinc-400">Belum ada jadwal</h3>
        <p className="text-sm mt-1">Buat jadwal pertama untuk menayangkan playlist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {schedules.map((sch) => {
        const now = new Date()
        const isExpired = new Date(sch.endDate) < now
        const isUpcoming = new Date(sch.startDate) > now

        return (
          <div
            key={sch.id}
            className={`rounded-xl border p-4 transition-all ${
              !sch.isActive
                ? 'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                : isExpired
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-zinc-200 truncate">{sch.name}</h3>
                  {sch.isActive ? (
                    isExpired ? (
                      <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px]">Expired</Badge>
                    ) : isUpcoming ? (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px]">Upcoming</Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">Active</Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="border-zinc-600/30 text-zinc-500 text-[10px]">Nonaktif</Badge>
                  )}
                  {sch.priority > 0 && (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">P{sch.priority}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <ListVideo className="w-3.5 h-3.5 text-violet-400" />
                    <span className="truncate">{sch.playlist.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MonitorSmartphone className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">{sch.device.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>{formatDate(sch.startDate)} – {formatDate(sch.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {sch.startTime && sch.endTime
                        ? `${sch.startTime} – ${sch.endTime}`
                        : '24 Jam'}
                    </span>
                  </div>
                </div>

                {/* Days of week */}
                <div className="flex gap-1 mt-2">
                  {DAY_NAMES.map((day) => (
                    <span
                      key={day.value}
                      className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${
                        sch.daysOfWeek.includes(day.value)
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      }`}
                    >
                      {day.label[0]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => handleToggle(sch.id)}
                  disabled={toggling === sch.id}
                  className={`w-8 h-8 p-0 ${sch.isActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title={sch.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {toggling === sch.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sch.isActive ? (
                    <Power className="w-4 h-4" />
                  ) : (
                    <PowerOff className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => handleDelete(sch.id, sch.name)}
                  disabled={deleting === sch.id}
                  className="w-8 h-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  {deleting === sch.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
