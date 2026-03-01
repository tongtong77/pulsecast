'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type PlayableItem = {
  id: string
  duration: number
  transition: string
  media: {
    id: string
    name: string
    type: string
    url: string
    mimeType: string
  }
}

type PlayerProps = {
  deviceId: string
  items: PlayableItem[]
  playlistId?: string
  organizationName: string
  organizationLogo: string | null
}

const CACHE_NAME = 'signage-media-cache-v1'

const transitionClass: Record<string, string> = {
  NONE: '',
  FADE: 'transition-opacity duration-1000',
  SLIDE_LEFT: 'transition-transform duration-700',
  SLIDE_RIGHT: 'transition-transform duration-700',
  SLIDE_UP: 'transition-transform duration-700',
  SLIDE_DOWN: 'transition-transform duration-700',
  ZOOM_IN: 'transition-transform duration-700',
  ZOOM_OUT: 'transition-transform duration-700',
}

/**
 * Aggressive Offline Caching — pre-fetches all media into CacheStorage
 * so the player keeps running even when network drops.
 */
async function prefetchMediaToCache(items: PlayableItem[]): Promise<Map<string, string>> {
  const blobUrls = new Map<string, string>()

  if (typeof window === 'undefined' || !('caches' in window)) {
    // Fallback: return original URLs if CacheStorage not available
    for (const item of items) {
      blobUrls.set(item.media.url, item.media.url)
    }
    return blobUrls
  }

  const cache = await caches.open(CACHE_NAME)

  for (const item of items) {
    const url = item.media.url
    try {
      // Check if already cached
      let response = await cache.match(url)

      if (!response) {
        // Fetch and store in cache
        const fetchResponse = await fetch(url)
        if (fetchResponse.ok) {
          await cache.put(url, fetchResponse.clone())
          response = fetchResponse
        }
      }

      if (response) {
        // Create Blob URL for offline-safe rendering
        const blob = await response.blob()
        blobUrls.set(url, URL.createObjectURL(blob))
      } else {
        blobUrls.set(url, url) // fallback
      }
    } catch {
      blobUrls.set(url, url) // fallback on error
    }
  }

  return blobUrls
}

export function PlaybackEngine({ deviceId, items, playlistId, organizationName, organizationLogo }: PlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const playableItems = items
  const [cachedUrls, setCachedUrls] = useState<Map<string, string>>(new Map())
  const [cacheReady, setCacheReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const playStartRef = useRef<Date>(new Date()) // PoP: tracks when current item started

  const currentItem = playableItems[currentIndex]

  // --- Aggressive Pre-fetch: cache all media on mount ---
  useEffect(() => {
    let cancelled = false

    prefetchMediaToCache(items).then((urls) => {
      if (!cancelled) {
        setCachedUrls(urls)
        setCacheReady(true)
      }
    })

    return () => { cancelled = true }
  }, [items])

  // Get cached URL or fallback to original
  const getMediaUrl = useCallback(
    (originalUrl: string) => cachedUrls.get(originalUrl) || originalUrl,
    [cachedUrls]
  )

  // --- Heartbeat: ping every 30s ---
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch(`/api/device/${deviceId}/heartbeat`, { method: 'POST' }).catch(() => {})
    }
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 30000)
    return () => clearInterval(interval)
  }, [deviceId])

  // SSE is handled by the SSEListener component in the parent page.
  // DO NOT create a second EventSource here — it causes event conflicts.

  // --- PoP Telemetry: fire-and-forget on item transition ---
  const sendPopLog = useCallback((item: PlayableItem, startTime: Date) => {
    const duration = Math.round((Date.now() - startTime.getTime()) / 1000)
    fetch('/api/telemetry/pop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        mediaId: item.media.id,
        playlistId: playlistId || null,
        startTime: startTime.toISOString(),
        duration,
      }),
    }).catch(() => {}) // Non-blocking: never interrupt playback
  }, [deviceId, playlistId])

  // --- Advance to next item ---
  const goNext = useCallback(() => {
    // PoP: log the item that just finished
    if (currentItem) {
      sendPopLog(currentItem, playStartRef.current)
    }

    const nextTransition = playableItems[(currentIndex + 1) % playableItems.length]?.transition || 'NONE'

    if (nextTransition !== 'NONE') {
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % playableItems.length)
        playStartRef.current = new Date() // Reset start time for next item
        setVisible(true)
      }, 500)
    } else {
      setCurrentIndex((prev) => (prev + 1) % playableItems.length)
      playStartRef.current = new Date() // Reset start time for next item
    }
  }, [currentIndex, currentItem, playableItems, sendPopLog])

  // --- Timer for images / duration override ---
  useEffect(() => {
    if (!currentItem || !cacheReady) return

    if (timerRef.current) clearTimeout(timerRef.current)

    if (currentItem.media.type === 'IMAGE') {
      timerRef.current = setTimeout(goNext, currentItem.duration * 1000)
    }
    if (currentItem.media.type === 'VIDEO') {
      timerRef.current = setTimeout(goNext, (currentItem.duration + 2) * 1000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, currentItem, goNext, cacheReady])

  // --- Video autoplay ---
  useEffect(() => {
    if (currentItem?.media.type === 'VIDEO' && videoRef.current && cacheReady) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [currentIndex, currentItem, cacheReady])

  // Items are initialized via useState(items) — no sync effect needed
  // Component re-mounts on prop change via parent key

  // --- Loading state while caching ---
  if (!cacheReady || !currentItem) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Mengunduh media ke cache lokal...</p>
          <p className="text-zinc-600 text-xs mt-1">Menyiapkan playback offline-ready</p>
        </div>
      </div>
    )
  }

  const transition = transitionClass[currentItem.transition] || ''

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Content — uses cached Blob URLs for offline resilience */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${transition} ${
          visible ? 'opacity-100 scale-100 translate-x-0 translate-y-0' : (() => {
            switch (currentItem.transition) {
              case 'FADE': return 'opacity-0'
              case 'SLIDE_LEFT': return 'opacity-0 -translate-x-full'
              case 'SLIDE_RIGHT': return 'opacity-0 translate-x-full'
              case 'SLIDE_UP': return 'opacity-0 -translate-y-full'
              case 'SLIDE_DOWN': return 'opacity-0 translate-y-full'
              case 'ZOOM_IN': return 'opacity-0 scale-50'
              case 'ZOOM_OUT': return 'opacity-0 scale-150'
              default: return ''
            }
          })()
        }`}
      >
        {currentItem.media.type === 'IMAGE' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={currentItem.id}
            src={getMediaUrl(currentItem.media.url)}
            alt={currentItem.media.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            key={currentItem.id}
            ref={videoRef}
            src={getMediaUrl(currentItem.media.url)}
            className="w-full h-full object-contain"
            muted
            playsInline
            onEnded={goNext}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div className="h-full bg-blue-500/50 transition-all" style={{
          width: `${((currentIndex + 1) / playableItems.length) * 100}%`,
        }} />
      </div>

      {/* Branding overlay (subtle) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-30">
        {organizationLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={organizationLogo} alt="" className="w-6 h-6 rounded" />
        ) : null}
        <span className="text-xs text-white font-medium">{organizationName}</span>
      </div>

      {/* Cache status indicator */}
      <div className="absolute bottom-3 right-4 flex items-center gap-1.5 opacity-20">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[9px] text-white">Cached Offline</span>
      </div>
    </div>
  )
}
