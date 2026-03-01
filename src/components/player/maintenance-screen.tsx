'use client'

/**
 * MaintenanceScreen — shown on all TV players when maintenance mode is active.
 * Elegant dark screen with animated gear icon and bilingual message.
 */
export function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center" style={{ zIndex: 9997 }}>
      <div className="text-center space-y-8 max-w-lg px-8">
        {/* Animated Gear */}
        <div className="relative mx-auto w-24 h-24">
          <svg
            className="w-24 h-24 text-zinc-600 animate-[spin_4s_linear_infinite]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-zinc-300 tracking-wide">
            Sistem Dalam Pemeliharaan
          </h1>
          <p className="text-lg text-zinc-500">
            System Under Maintenance
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-800" />
          <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Sub-message */}
        <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
          Layar ini akan kembali normal secara otomatis setelah pemeliharaan selesai.
          Tidak diperlukan tindakan manual.
        </p>
      </div>
    </div>
  )
}
