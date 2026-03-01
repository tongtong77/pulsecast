'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Palette, Building2, Monitor, Save } from 'lucide-react'
import { updateOrganizationBranding } from '@/lib/actions/organization'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type OrgData = {
  id: string
  name: string
  slug: string
  logo: string | null
  logoUrl: string | null
  brandColor: string
  plan: string
  maxDevices: number
  maxStorage: bigint
}

export function BrandingSettingsForm({ org }: { org: OrgData }) {
  const router = useRouter()
  const [name, setName] = useState(org.name)
  const [brandColor, setBrandColor] = useState(org.brandColor)
  const [logoUrl, setLogoUrl] = useState(org.logoUrl ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateOrganizationBranding({
        name: name.trim() || undefined,
        brandColor,
        logoUrl: logoUrl.trim() || null,
      })
      toast.success('Branding berhasil diperbarui! 🎨')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  const storageUsedMB = 0 // Will be calculated from actual media
  const storageLimitMB = Number(org.maxStorage) / 1024 / 1024

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Branding Card */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-400" />
            White-Label Branding
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Kustomisasi tampilan layar TV Anda dengan identitas merek perusahaan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Nama Organisasi</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
            />
          </div>

          {/* Brand Color */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Warna Merek</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-zinc-700 cursor-pointer bg-transparent"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#3b82f6"
                className="bg-zinc-900/50 border-zinc-700 text-zinc-100 font-mono uppercase"
                maxLength={7}
              />
              {/* Preview dot */}
              <div
                className="w-8 h-8 rounded-full border-2 border-zinc-700"
                style={{ backgroundColor: brandColor }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Warna ini akan digunakan di IDLE screen, ticker, dan aksen layar TV.
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label className="text-zinc-300">URL Logo Perusahaan</Label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="bg-zinc-900/50 border-zinc-700 text-zinc-100"
            />
            {logoUrl && (
              <div className="mt-3 p-4 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-16 h-16 rounded-lg object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <p className="text-xs text-zinc-500">Preview logo di layar TV</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4"
            style={{ backgroundColor: brandColor }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Branding
          </Button>
        </CardContent>
      </Card>

      {/* Plan & Limits Card */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-400" />
            Paket & Batas
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Informasi paket langganan dan batas resource Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Plan Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Paket Saat Ini</span>
            <Badge
              className={
                org.plan === 'ENTERPRISE'
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                  : org.plan === 'PRO'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              }
            >
              {org.plan}
            </Badge>
          </div>

          {/* Slug */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Slug Organisasi</span>
            <code className="text-sm text-zinc-300 bg-zinc-800 px-2 py-1 rounded">{org.slug}</code>
          </div>

          {/* Device Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                Batas Layar TV
              </span>
              <span className="text-zinc-300">{org.maxDevices} device</span>
            </div>
          </div>

          {/* Storage Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Storage</span>
              <span className="text-zinc-300">
                {storageUsedMB} MB / {Math.round(storageLimitMB)} MB
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((storageUsedMB / storageLimitMB) * 100, 100)}%`,
                  backgroundColor: brandColor,
                }}
              />
            </div>
          </div>

          {/* Upgrade CTA */}
          {org.plan === 'FREE' && (
            <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-4 mt-4">
              <p className="text-sm text-violet-300 font-medium">🚀 Upgrade ke PRO</p>
              <p className="text-xs text-violet-400/60 mt-1">
                Dapatkan 50 device, 10GB storage, dan fitur White-Label premium.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
