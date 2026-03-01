'use client'

import { useEffect, useState } from 'react'

/**
 * TickerMarquee — CSS-driven horizontal scrolling text.
 * Animation defined in globals.css (.animate-marquee).
 * Renders empty div during SSR to avoid hydration mismatch.
 */
export function TickerMarquee({ text, brandColor = '#3b82f6' }: { text: string; brandColor?: string }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="w-full h-full bg-zinc-900" />
  }

  return (
    <div
      className="w-full h-full flex items-center overflow-hidden relative"
      style={{
        backgroundColor: `${brandColor}15`,
        borderTop: `2px solid ${brandColor}40`,
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10"
        style={{ background: `linear-gradient(to right, ${brandColor}15, transparent)` }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10"
        style={{ background: `linear-gradient(to left, ${brandColor}15, transparent)` }}
      />

      <div className="animate-marquee whitespace-nowrap flex items-center gap-16">
        <span className="text-2xl font-semibold text-white tracking-wide">{text}</span>
        <span style={{ color: `${brandColor}60` }} className="text-2xl">●</span>
        <span className="text-2xl font-semibold text-white tracking-wide">{text}</span>
        <span style={{ color: `${brandColor}60` }} className="text-2xl">●</span>
        <span className="text-2xl font-semibold text-white tracking-wide">{text}</span>
        <span style={{ color: `${brandColor}60` }} className="text-2xl">●</span>
      </div>
    </div>
  )
}
