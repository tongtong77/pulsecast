import { getDevices, getPublishedPlaylists } from '@/lib/actions/device'
import { getActiveEmergencyAlert } from '@/lib/actions/emergency'
import { AddDeviceDialog, DeviceTable } from '@/components/device/device-table'
import { EmergencyBroadcastPanel } from '@/components/device/emergency-broadcast-panel'
import { Monitor } from 'lucide-react'

export default async function DevicesPage() {
  const [devices, playlists, activeAlert] = await Promise.all([
    getDevices(),
    getPublishedPlaylists(),
    getActiveEmergencyAlert(),
  ])

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length
  const pairingCount = devices.filter((d) => d.status === 'PAIRING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Layar TV</h1>
            <p className="text-sm text-zinc-400">
              {devices.length} device • {onlineCount} online • {pairingCount} menunggu pairing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EmergencyBroadcastPanel activeAlert={activeAlert} />
          <AddDeviceDialog />
        </div>
      </div>

      {/* Emergency Alert Banner (if active) */}
      {activeAlert && (
        <EmergencyBroadcastPanel activeAlert={activeAlert} />
      )}

      {/* Table */}
      <DeviceTable devices={devices} playlists={playlists} />
    </div>
  )
}
