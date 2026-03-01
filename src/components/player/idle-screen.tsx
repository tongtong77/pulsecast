'use client'

import { useState, useEffect } from 'react'
import { Monitor } from 'lucide-react'

export function IdleScreen({
  deviceId,
  deviceName,
  organizationName,
  organizationLogo,
  brandColor = '#3b82f6',
}: {
  deviceId: string
  deviceName: string
  organizationName: string
  organizationLogo: string | null
  brandColor?: string
}) {
  const [time, setTime] = useState(new Date())

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Heartbeat
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch(`/api/device/${deviceId}/heartbeat`, { method: 'POST' }).catch(() => {})
    }
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 30000)
    return () => clearInterval(interval)
  }, [deviceId])

  // SSE listener for content updates
  useEffect(() => {
    const evtSource = new EventSource(`/api/sse?deviceId=${deviceId}`)
    evtSource.addEventListener('RELOAD_PLAYER', () => {
      window.location.reload()
    })
    return () => evtSource.close()
  }, [deviceId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, #09090b, ${brandColor}10, #09090b)` }}
    >
      {/* Animated background orbs with brand color */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ backgroundColor: `${brandColor}08` }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ backgroundColor: `${brandColor}05`, animationDelay: '2s' }}
      />

      {/* Logo */}
      <div className="relative z-10 text-center">
        {organizationLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={organizationLogo}
            alt={organizationName}
            className="w-28 h-28 rounded-2xl mx-auto mb-8 shadow-2xl object-contain"
            style={{ borderColor: `${brandColor}30`, borderWidth: '2px' }}
          />
        ) : (
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            style={{
              backgroundColor: `${brandColor}15`,
              borderColor: `${brandColor}30`,
              borderWidth: '1px',
            }}
          >
            <Monitor className="w-14 h-14" style={{ color: brandColor }} />
          </div>
        )}

        {/* Organization name */}
        <h1 className="text-3xl font-bold text-zinc-200 mb-2 tracking-wide">
          {organizationName}
        </h1>

        {/* Clock */}
        <div className="text-7xl font-extralight text-zinc-100 my-8 font-mono tracking-widest tabular-nums">
          {time.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}
        </div>

        <p className="text-lg text-zinc-500 font-light mb-2">
          {time.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {/* Status indicator with brand color */}
        <div className="mt-10 flex items-center gap-2 text-zinc-600">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: brandColor }}
          />
          <span className="text-sm">Menunggu Konten...</span>
        </div>

        <p className="text-xs text-zinc-700 mt-4">
          {deviceName}
        </p>
      </div>
    </div>
  )
}
