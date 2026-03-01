import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  Image,
  ListVideo,
  CalendarClock,
  TrendingUp,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId

  if (!orgId) {
    return <div className="text-zinc-400 p-8">Unauthorized</div>
  }

  // Live database stats (scoped to org)
  const [deviceCount, mediaCount, playlistCount, scheduleCount, onlineCount] =
    await Promise.all([
      prisma.device.count({ where: { organizationId: orgId } }),
      prisma.media.count({ where: { organizationId: orgId } }),
      prisma.playlist.count({ where: { organizationId: orgId } }),
      prisma.schedule.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.device.count({ where: { organizationId: orgId, status: 'ONLINE' } }),
    ])

  const stats = [
    {
      label: 'Total Layar',
      value: deviceCount.toString(),
      description: `${onlineCount} online`,
      icon: Monitor,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      href: '/dashboard/devices',
    },
    {
      label: 'Total Media',
      value: mediaCount.toString(),
      description: 'File tersimpan',
      icon: Image,
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      href: '/dashboard/media',
    },
    {
      label: 'Playlist',
      value: playlistCount.toString(),
      description: 'Daftar putar',
      icon: ListVideo,
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-400',
      href: '/dashboard/playlists',
    },
    {
      label: 'Jadwal Aktif',
      value: scheduleCount.toString(),
      description: 'Kampanye berjalan',
      icon: CalendarClock,
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      href: '/dashboard/schedules',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Selamat Datang, {session?.user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-zinc-400 mt-1">
            Kelola konten digital signage organisasi Anda dari sini.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 gap-1.5"
        >
          <Activity className="w-3 h-3" />
          Sistem Aktif
        </Badge>
      </div>

      {/* Stats Grid — Live from DB */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.label}
                </CardTitle>
                <div
                  className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-zinc-100">
                  {stat.value}
                </div>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">
            🚀 Langkah Pertama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/media" className="p-4 rounded-lg border border-zinc-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                <Image className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-medium text-zinc-200 mb-1">Upload Media</h3>
              <p className="text-xs text-zinc-500">
                Unggah gambar dan video untuk konten signage Anda
              </p>
            </Link>
            <Link href="/dashboard/playlists" className="p-4 rounded-lg border border-zinc-800 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
                <ListVideo className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-medium text-zinc-200 mb-1">Buat Playlist</h3>
              <p className="text-xs text-zinc-500">
                Susun urutan media menjadi playlist yang menarik
              </p>
            </Link>
            <Link href="/dashboard/devices" className="p-4 rounded-lg border border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                <Monitor className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-medium text-zinc-200 mb-1">Daftarkan Layar</h3>
              <p className="text-xs text-zinc-500">
                Hubungkan TV/Monitor ke CMS untuk menampilkan konten
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
