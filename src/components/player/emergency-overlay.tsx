'use client'

import { useEffect, useState } from 'react'

/**
 * Emergency Alert Overlay — renders a fullscreen flashing red screen
 * with the emergency message. Completely overrides all content.
 */
export function EmergencyOverlay({ message }: { message: string }) {
  const [flash, setFlash] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFlash((prev) => !prev)
    }, 800) // Flash every 800ms
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center transition-colors duration-300 ${
        flash ? 'bg-red-700' : 'bg-red-900'
      }`}
    >
      {/* Siren icon animation */}
      <div className="mb-8 animate-bounce">
        <svg
          className="w-24 h-24 text-white drop-shadow-2xl"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* EMERGENCY label */}
      <div className="mb-6 px-8 py-3 bg-white/20 rounded-full backdrop-blur-sm">
        <p className="text-lg font-bold tracking-[0.5em] text-white uppercase">
          ⚠️ EMERGENCY ALERT ⚠️
        </p>
      </div>

      {/* Message */}
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white text-center max-w-[90vw] leading-tight animate-pulse drop-shadow-2xl">
        {message}
      </h1>

      {/* Bottom instruction */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/60 text-sm font-medium">
          Alert ini dikendalikan oleh Admin CMS. Harap ikuti instruksi evakuasi.
        </p>
      </div>
    </div>
  )
}
