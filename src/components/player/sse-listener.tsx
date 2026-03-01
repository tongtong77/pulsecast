'use client'

import { useEffect, useState } from 'react'
import { EmergencyOverlay } from '@/components/player/emergency-overlay'
import { MaintenanceScreen } from '@/components/player/maintenance-screen'

const CACHE_NAME = 'signage-media-cache-v1'

/**
 * SSE Listener — connects the Player TV to the admin's Remote Fleet Control.
 * Handles: REMOTE_COMMAND, EMERGENCY_ALERT, EMERGENCY_RESOLVED,
 *          MAINTENANCE_ACTIVE, MAINTENANCE_INACTIVE, RELOAD_PLAYER events.
 */
export function SSEListener({ deviceId }: { deviceId: string }) {
  const [status, setStatus] = useState<string | null>(null)
  const [emergencyMessage, setEmergencyMessage] = useState<string | null>(null)
  const [maintenanceActive, setMaintenanceActive] = useState(false)

  useEffect(() => {
    let es: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout | null = null

    function connect() {
      es = new EventSource(`/api/sse?deviceId=${deviceId}`)

      es.addEventListener('CONNECTED', () => {
        // Connected to fleet control
      })

      es.addEventListener('REMOTE_COMMAND', (event) => {
        try {
          const data = JSON.parse(event.data)
          handleCommand(data.command)
        } catch {
          // Failed to parse command
        }
      })

      es.addEventListener('EMERGENCY_ALERT', (event) => {
        try {
          const data = JSON.parse(event.data)
          setEmergencyMessage(data.message)
        } catch {
          // Failed to parse emergency alert
        }
      })

      es.addEventListener('EMERGENCY_RESOLVED', () => {
        setEmergencyMessage(null)
      })

      // Maintenance Mode
      es.addEventListener('MAINTENANCE_ACTIVE', () => {
        setMaintenanceActive(true)
      })

      es.addEventListener('MAINTENANCE_INACTIVE', () => {
        setMaintenanceActive(false)
      })

      // Legacy + auto-sync support
      es.addEventListener('RELOAD_PLAYER', () => {
        handleCommand('FORCE_RELOAD')
      })

      es.onerror = () => {
        es?.close()
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    function handleCommand(command: string) {
      switch (command) {
        case 'FORCE_RELOAD':
          setStatus('Memuat ulang layar...')
          setTimeout(() => window.location.reload(), 500)
          break

        case 'CLEAR_CACHE':
          setStatus('Membersihkan cache...')
          clearCacheAndReload()
          break

        case 'RELOAD_PLAYER':
          window.location.reload()
          break

        default:
          break
      }
    }

    async function clearCacheAndReload() {
      try {
        if ('caches' in window) {
          await caches.delete(CACHE_NAME)
        }
      } catch {
        // Failed to clear cache
      }
      setTimeout(() => window.location.reload(), 1500)
    }

    connect()

    return () => {
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [deviceId])

  // Emergency alert takes absolute highest priority — z-[9999]
  if (emergencyMessage) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 9999 }}>
        <EmergencyOverlay message={emergencyMessage} />
      </div>
    )
  }

  // Maintenance mode — z-[9997], below emergency
  if (maintenanceActive) {
    return <MaintenanceScreen />
  }

  // Command indicator overlay
  if (!status) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ zIndex: 9998 }}>
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xl font-medium text-white">{status}</p>
      </div>
    </div>
  )
}
