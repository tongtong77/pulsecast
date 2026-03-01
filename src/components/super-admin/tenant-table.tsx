'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MoreVertical, Crown, Loader2, ShieldOff, ShieldCheck, Pencil, Trash2, Plus } from 'lucide-react'
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  updateOrganizationPlan,
  suspendOrganization,
} from '@/lib/actions/super-admin'
import { toast } from 'sonner'

type OrgRow = {
  id: string
  name: string
  slug: string
  plan: string
  brandColor: string
  maxDevices: number
  maxStorage: number
  deviceCount: number
  memberCount: number
  mediaCount: number
  storageLabel: string
  maxStorageLabel: string
  owner: { name: string; email: string } | null
}

const planColors: Record<string, string> = {
  FREE: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  PRO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ENTERPRISE: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

const PLAN_OPTIONS: { value: 'FREE' | 'PRO' | 'ENTERPRISE'; label: string; devices: number; storage: string }[] = [
  { value: 'FREE', label: 'Free', devices: 3, storage: '1 GB' },
  { value: 'PRO', label: 'Pro', devices: 25, storage: '10 GB' },
  { value: 'ENTERPRISE', label: 'Enterprise', devices: 999, storage: '100 GB' },
]

export function TenantTable({ orgs }: { orgs: OrgRow[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [suspending, setSuspending] = useState<string | null>(null)

  // Create org dialog
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')

  // Edit org dialog
  const [editTarget, setEditTarget] = useState<OrgRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')

  // Edit plan dialog
  const [planTarget, setPlanTarget] = useState<OrgRow | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE')

  // Delete danger zone
  const [deleteTarget, setDeleteTarget] = useState<OrgRow | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  function openEdit(org: OrgRow) {
    setEditTarget(org)
    setEditName(org.name)
    setEditSlug(org.slug)
  }

  function openPlan(org: OrgRow) {
    setPlanTarget(org)
    setSelectedPlan(org.plan as 'FREE' | 'PRO' | 'ENTERPRISE')
  }

  function openDelete(org: OrgRow) {
    setDeleteTarget(org)
    setDeleteConfirm('')
  }

  async function handleCreate() {
    if (!createName.trim() || !createSlug.trim()) return
    setSaving(true)
    try {
      await createOrganization(createName.trim(), createSlug.trim().toLowerCase().replace(/\s+/g, '-'))
      toast.success('Organisasi berhasil dibuat')
      setShowCreate(false)
      setCreateName('')
      setCreateSlug('')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat organisasi')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editTarget || !editName.trim() || !editSlug.trim()) return
    setSaving(true)
    try {
      await updateOrganization(editTarget.id, editName.trim(), editSlug.trim().toLowerCase().replace(/\s+/g, '-'))
      toast.success('Organisasi berhasil diperbarui')
      setEditTarget(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memperbarui')
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePlan() {
    if (!planTarget) return
    setSaving(true)
    try {
      await updateOrganizationPlan(planTarget.id, selectedPlan)
      toast.success(`Paket ${planTarget.name} diubah ke ${selectedPlan}`)
      setPlanTarget(null)
      router.refresh()
    } catch {
      toast.error('Gagal mengubah paket.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteOrganization(deleteTarget.id)
      toast.success(`${deleteTarget.name} dan semua datanya telah dihapus permanen`)
      setDeleteTarget(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus')
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspend(orgId: string, orgName: string, suspend: boolean) {
    setSuspending(orgId)
    try {
      await suspendOrganization(orgId, suspend)
      toast.success(suspend ? `${orgName} telah di-suspend` : `${orgName} telah diaktifkan kembali`)
      router.refresh()
    } catch {
      toast.error('Gagal memproses.')
    } finally {
      setSuspending(null)
    }
  }

  return (
    <>
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-100">
              All Tenants ({orgs.length})
            </h2>
            <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Organisasi
            </Button>
          </div>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium">Organisasi</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Owner</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center">Plan</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center">Devices</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center">Members</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center">Media</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right">Storage</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center w-14">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id} className="border-zinc-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: org.brandColor }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{org.name}</p>
                          <p className="text-xs text-zinc-500">{org.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.owner ? (
                        <div>
                          <p className="text-sm text-zinc-300">{org.owner.name}</p>
                          <p className="text-xs text-zinc-500">{org.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={planColors[org.plan] ?? planColors.FREE}>
                        {org.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-zinc-300">{org.deviceCount}</span>
                      <span className="text-zinc-600">/{org.maxDevices}</span>
                    </TableCell>
                    <TableCell className="text-center text-zinc-300">{org.memberCount}</TableCell>
                    <TableCell className="text-center text-zinc-300">{org.mediaCount}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-zinc-300">{org.storageLabel}</span>
                      <span className="text-zinc-600"> / {org.maxStorageLabel}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 w-52">
                          <DropdownMenuItem
                            onClick={() => openEdit(org)}
                            className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2 text-blue-400" />
                            Edit Organisasi
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openPlan(org)}
                            className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer"
                          >
                            <Crown className="w-4 h-4 mr-2 text-amber-400" />
                            Ubah Paket
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem
                            onClick={() => handleSuspend(org.id, org.name, true)}
                            disabled={suspending === org.id}
                            className="text-orange-400 focus:bg-orange-500/10 focus:text-orange-300 cursor-pointer"
                          >
                            <ShieldOff className="w-4 h-4 mr-2" />
                            Suspend Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSuspend(org.id, org.name, false)}
                            disabled={suspending === org.id}
                            className="text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Unsuspend Tenant
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem
                            onClick={() => openDelete(org)}
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Organisasi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {orgs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-zinc-500 py-12">
                      Belum ada organisasi terdaftar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== CREATE ORG DIALOG ===== */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Tambah Organisasi Baru</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Organisasi baru akan dimulai dengan paket FREE.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Nama Organisasi</Label>
              <Input
                value={createName}
                onChange={(e) => {
                  setCreateName(e.target.value)
                  setCreateSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                }}
                placeholder="PT Acme Corporation"
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Slug (URL ID)</Label>
              <Input
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                placeholder="acme-corporation"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-zinc-700 text-zinc-300">
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={saving || !createName.trim() || !createSlug.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Buat Organisasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT ORG DIALOG ===== */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Organisasi</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Ubah nama dan slug organisasi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Nama</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Slug</Label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} className="border-zinc-700 text-zinc-300">Batal</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT PLAN DIALOG ===== */}
      <Dialog open={!!planTarget} onOpenChange={() => setPlanTarget(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Ubah Paket — {planTarget?.name}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Limit device dan storage akan disesuaikan otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {PLAN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedPlan(opt.value)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left ${
                  selectedPlan === opt.value
                    ? 'border-blue-500 bg-blue-500/10 text-zinc-100'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <p className="text-[11px] mt-0.5 opacity-70">Max {opt.devices} devices • {opt.storage} storage</p>
                </div>
                {selectedPlan === opt.value && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPlanTarget(null)} className="border-zinc-700 text-zinc-300">Batal</Button>
            <Button onClick={handleSavePlan} disabled={saving || selectedPlan === planTarget?.plan}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE DANGER ZONE ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-950 border-red-500/30 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Hapus Organisasi Permanen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 space-y-3">
              <p>
                Tindakan ini akan <span className="text-red-400 font-bold">menghapus permanen</span> organisasi
                <span className="font-bold text-zinc-200"> {deleteTarget?.name}</span> beserta semua data:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-zinc-500">
                <li>{deleteTarget?.mediaCount ?? 0} media files</li>
                <li>{deleteTarget?.deviceCount ?? 0} devices</li>
                <li>{deleteTarget?.memberCount ?? 0} members</li>
                <li>Semua playlist, schedule, dan log</li>
              </ul>
              <div className="pt-2">
                <Label className="text-zinc-300 text-sm">
                  Ketik <span className="font-mono font-bold text-red-400">{deleteTarget?.name}</span> untuk mengonfirmasi:
                </Label>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={deleteTarget?.name}
                  className="bg-zinc-900 border-red-500/30 text-zinc-100 mt-2 font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-zinc-700 text-zinc-300">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleteConfirm !== deleteTarget?.name}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Hapus Permanen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
