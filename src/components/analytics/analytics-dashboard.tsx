'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Monitor,
  PlayCircle,
  Clock,
  Download,
  Film,
  Image as ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { exportPopCSV } from '@/lib/actions/analytics'

type AnalyticsData = {
  totalImpressions: number
  totalDurationHours: number
  topDevices: Array<{
    deviceId: string
    name: string
    location: string
    impressions: number
    durationHours: number
  }>
  topMedia: Array<{
    mediaId: string
    name: string
    type: string
    impressions: number
    durationHours: number
  }>
  dailyImpressions: Array<{ day: string; count: number }>
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [exporting, setExporting] = useState(false)

  const mostActiveDevice = data.topDevices[0]
  const mostPlayedMedia = data.topMedia[0]

  // Format data for Recharts: human-readable day label
  const chartData = data.dailyImpressions.map((d) => ({
    date: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(d.day + 'T00:00:00')),
    count: d.count,
  }))

  async function handleExportCSV() {
    setExporting(true)
    try {
      const result = await exportPopCSV(30)
      if ('csv' in result && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Proof of Play Analytics
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Laporan penayangan konten 30 hari terakhir</p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={exporting}
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Mengekspor...' : 'Ekspor CSV'}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Impresi</CardTitle>
            <PlayCircle className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">
              {data.totalImpressions.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-zinc-500 mt-1">penayangan media</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Durasi Tayang</CardTitle>
            <Clock className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">
              {data.totalDurationHours} <span className="text-lg text-zinc-500">jam</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">akumulasi seluruh device</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Device Paling Aktif</CardTitle>
            <Monitor className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-zinc-100 truncate">
              {mostActiveDevice?.name || '—'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {mostActiveDevice ? `${mostActiveDevice.impressions.toLocaleString('id-ID')} impresi` : 'Belum ada data'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Media Paling Populer</CardTitle>
            <TrendingUp className="w-5 h-5 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-zinc-100 truncate">
              {mostPlayedMedia?.name || '—'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {mostPlayedMedia ? `${mostPlayedMedia.impressions.toLocaleString('id-ID')} kali tayang` : 'Belum ada data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Daily Impressions — Recharts BarChart */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg">Tren Penayangan Harian</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
              Belum ada data penayangan. Player akan mengirim telemetri secara otomatis.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  tick={{ fill: '#888888', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#444' }}
                />
                <YAxis
                  stroke="#888888"
                  tick={{ fill: '#888888', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#e4e4e7',
                    fontSize: 13,
                  }}
                  labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                  formatter={(value: number | undefined) => [(value ?? 0).toLocaleString('id-ID'), 'Impresi']}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tables: Top Devices & Top Media */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Devices */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200 text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              Top 5 Device Paling Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topDevices.length === 0 ? (
              <p className="text-zinc-500 text-sm">Belum ada data.</p>
            ) : (
              <div className="space-y-3">
                {data.topDevices.map((device, i) => (
                  <div key={device.deviceId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-500 w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium truncate">{device.name}</p>
                      <p className="text-[11px] text-zinc-500">{device.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-100">{device.impressions.toLocaleString('id-ID')}</p>
                      <p className="text-[11px] text-zinc-500">{device.durationHours}h</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Media */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200 text-lg flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-400" />
              Top 5 Media Paling Populer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topMedia.length === 0 ? (
              <p className="text-zinc-500 text-sm">Belum ada data.</p>
            ) : (
              <div className="space-y-3">
                {data.topMedia.map((media, i) => (
                  <div key={media.mediaId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-500 w-5">#{i + 1}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {media.type === 'VIDEO' ? (
                        <Film className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                      <p className="text-sm text-zinc-200 font-medium truncate">{media.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-100">{media.impressions.toLocaleString('id-ID')}</p>
                      <p className="text-[11px] text-zinc-500">{media.durationHours}h</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
