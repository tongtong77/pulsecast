import { getOrganizationSettings } from '@/lib/actions/organization'
import { BrandingSettingsForm } from '@/components/settings/branding-settings-form'
import { Settings } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const org = await getOrganizationSettings()
  if (!org) redirect('/dashboard')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Pengaturan Organisasi</h1>
          <p className="text-sm text-zinc-400">
            Kelola branding, logo, dan konfigurasi platform Anda.
          </p>
        </div>
      </div>

      <BrandingSettingsForm org={org} />
    </div>
  )
}
