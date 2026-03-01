'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  HardDrive,
  Activity,
  Server,
  Wifi,
  Monitor,
  Users,
  Building2,
  Database,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react'
import { setMaintenanceMode } from '@/lib/actions/super-admin'
import { toast } from 'sonner'

type SystemHealthData = {
  globalStorageUsed: number
  globalStorageLabel: string
  totalOrgs: number
  totalDevices: number
  onlineDevices: number
  totalUsers: number
  totalMedia: number
}

export function SystemHealthTab({ data }: { data: SystemHealthData }) {
  const [maintenanceActive, setMaintenanceActive] = useState(false)
  const [toggling, setToggling] = useState(false)

  const deviceOnlinePercent =
    data.totalDevices > 0
      ? Math.round((data.onlineDevices / data.totalDevices) * 100)
      : 0

  async function handleMaintenanceToggle() {
    const newState = !maintenanceActive
    setToggling(true)
    try {
      await setMaintenanceMode(newState)
      setMaintenanceActive(newState)
      toast.success(newState
        ? '🔧 Maintenance Mode AKTIF — Semua layar TV menampilkan halaman maintenance'
        : '✅ Maintenance Mode NONAKTIF — Semua layar TV kembali normal'
      )
    } catch {
      toast.error('Gagal mengubah status maintenance')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Server Uptime</CardTitle>
            <Server className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">99.97%</div>
            <p className="text-xs text-zinc-500 mt-1">SLA Target: 99.9%</p>
            <div className="mt-3 w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '99.97%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Device Health</CardTitle>
            <Wifi className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">
              {data.onlineDevices}<span className="text-lg text-zinc-500">/{data.totalDevices}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{deviceOnlinePercent}% online</p>
            <div className="mt-3 w-full bg-zinc-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  deviceOnlinePercent > 80 ? 'bg-emerald-500' : deviceOnlinePercent > 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(deviceOnlinePercent, 2)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Global Storage</CardTitle>
            <HardDrive className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{data.globalStorageLabel}</div>
            <p className="text-xs text-zinc-500 mt-1">Total semua organisasi</p>
            <div className="mt-3 w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '35%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200 text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Resource Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Building2 className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-lg font-bold text-zinc-100">{data.totalOrgs}</p>
                  <p className="text-[11px] text-zinc-500">Organisasi</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-lg font-bold text-zinc-100">{data.totalUsers}</p>
                  <p className="text-[11px] text-zinc-500">Total Users</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Monitor className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-lg font-bold text-zinc-100">{data.totalDevices}</p>
                  <p className="text-[11px] text-zinc-500">Devices</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <HardDrive className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-lg font-bold text-zinc-100">{data.totalMedia}</p>
                  <p className="text-[11px] text-zinc-500">Media Files</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200 text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              System Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-800/30">
              <div>
                <p className="text-sm font-medium text-zinc-200">Maintenance Mode</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Saat aktif, semua layar TV menampilkan halaman pemeliharaan via SSE broadcast.
                </p>
              </div>
              <button
                onClick={handleMaintenanceToggle}
                disabled={toggling}
                className="shrink-0 ml-4 disabled:opacity-50"
              >
                {toggling ? (
                  <Loader2 className="w-10 h-10 text-zinc-400 animate-spin" />
                ) : maintenanceActive ? (
                  <ToggleRight className="w-10 h-10 text-red-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-600" />
                )}
              </button>
            </div>
            {maintenanceActive && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-sm text-red-400 font-medium">
                  Maintenance Mode AKTIF — Semua TV menampilkan halaman maintenance
                </span>
              </div>
            )}

            {/* Platform Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-800/30">
              <div>
                <p className="text-sm font-medium text-zinc-200">Platform Status</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Status operasional keseluruhan</p>
              </div>
              <Badge className={maintenanceActive
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }>
                {maintenanceActive ? 'Under Maintenance' : 'All Systems Operational'}
              </Badge>
            </div>

            {/* SSE Connections */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-800/30">
              <div>
                <p className="text-sm font-medium text-zinc-200">SSE Connections</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Koneksi real-time ke device player</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-emerald-400">{data.onlineDevices} live</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
