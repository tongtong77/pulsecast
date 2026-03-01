import { getSchedules, getScheduleFormData } from '@/lib/actions/schedule'
import { CreateScheduleDialog, ScheduleList } from '@/components/schedule/schedule-list'
import { CalendarDays } from 'lucide-react'

export default async function SchedulesPage() {
  const [schedules, formData] = await Promise.all([
    getSchedules(),
    getScheduleFormData(),
  ])

  const activeCount = schedules.filter((s) => s.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Jadwal</h1>
            <p className="text-sm text-zinc-400">
              {schedules.length} jadwal • {activeCount} aktif
            </p>
          </div>
        </div>
        <CreateScheduleDialog
          playlists={formData.playlists}
          devices={formData.devices}
        />
      </div>

      {/* List */}
      <ScheduleList schedules={schedules} />
    </div>
  )
}
