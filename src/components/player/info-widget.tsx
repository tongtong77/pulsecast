'use client'

import { useState, useEffect } from 'react'
import { Monitor } from 'lucide-react'

/**
 * InfoWidget — Shows clock, date, and organization logo.
 * Used in multi-zone layouts (SPLIT_VERTICAL sidebar, L_SHAPE sidebar).
 */
export function InfoWidget({
  organizationName,
  organizationLogo,
  brandColor = '#3b82f6',
}: {
  organizationName: string
  organizationLogo: string | null
  brandColor?: string
}) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="h-full flex flex-col items-center justify-center p-6"
      style={{ background: `linear-gradient(180deg, #09090b, ${brandColor}08)` }}
    >
      {/* Logo */}
      {organizationLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={organizationLogo}
          alt={organizationName}
          className="w-20 h-20 rounded-2xl object-contain mb-6"
          style={{ borderColor: `${brandColor}30`, borderWidth: '2px' }}
        />
      ) : (
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: `${brandColor}15`, borderColor: `${brandColor}30`, borderWidth: '1px' }}
        >
          <Monitor className="w-10 h-10" style={{ color: brandColor }} />
        </div>
      )}

      {/* Organization Name */}
      <h2 className="text-lg font-bold text-zinc-200 text-center mb-6 tracking-wide">
        {organizationName}
      </h2>

      {/* Digital Clock */}
      <div className="text-5xl font-extralight text-zinc-100 font-mono tracking-widest tabular-nums mb-3">
        {time.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })}
      </div>

      {/* Date */}
      <p className="text-sm text-zinc-500 font-light text-center">
        {time.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      {/* Status indicator */}
      <div className="mt-8 flex items-center gap-2 text-zinc-600">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
        <span className="text-xs">Live</span>
      </div>
    </div>
  )
}
