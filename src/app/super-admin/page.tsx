import { getAllOrganizations, getAllUsers, getPlatformStats } from '@/lib/actions/super-admin'
import { Card, CardContent } from '@/components/ui/card'
import {
  Building2,
  Users,
  Monitor,
  HardDrive,
  Radio,
} from 'lucide-react'
import { SuperAdminTabs } from '@/components/super-admin/super-admin-tabs'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default async function SuperAdminPage() {
  const [stats, orgs, users] = await Promise.all([
    getPlatformStats(),
    getAllOrganizations(),
    getAllUsers(),
  ])

  // Serialize data for client components
  const serializedOrgs = orgs.map((org) => ({
    ...org,
    maxStorage: org.maxStorage,
    createdAt: org.createdAt.toISOString(),
    storageLabel: formatBytes(org.storageUsed),
    maxStorageLabel: formatBytes(org.maxStorage),
  }))

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  const systemHealth = {
    globalStorageUsed: stats.globalStorageUsed,
    globalStorageLabel: formatBytes(stats.globalStorageUsed),
    totalOrgs: stats.orgCount,
    totalDevices: stats.deviceCount,
    onlineDevices: stats.onlineDevices,
    totalUsers: stats.userCount,
    totalMedia: stats.mediaCount,
  }

  return (
    <div className="space-y-8">
      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats.orgCount}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Organisasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats.userCount}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats.deviceCount}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Radio className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats.onlineDevices}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats.mediaCount}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Media</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Console */}
      <SuperAdminTabs
        orgs={serializedOrgs}
        users={serializedUsers}
        systemHealth={systemHealth}
      />
    </div>
  )
}
