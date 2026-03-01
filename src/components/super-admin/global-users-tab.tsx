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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { MoreVertical, UserX, UserCheck, Shield, Loader2, Plus, Pencil, Trash2, KeyRound } from 'lucide-react'
import { createUser, updateUser, deleteUser, toggleUserActive, resetUserPassword } from '@/lib/actions/super-admin'
import { toast } from 'sonner'

type UserRow = {
  id: string
  name: string
  email: string
  isActive: boolean
  isSuperAdmin: boolean
  createdAt: string
  organization: string
  organizationId: string | null
  role: string
}

type OrgOption = { id: string; name: string }

const roleColors: Record<string, string> = {
  OWNER: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  ADMIN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  EDITOR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CONTENT_CREATOR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  REVIEWER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  VIEWER: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  SUPER_ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  NO_ORG: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
}

const ROLES = ['OWNER', 'ADMIN', 'REVIEWER', 'EDITOR', 'CONTENT_CREATOR', 'VIEWER'] as const

function normalizeRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function GlobalUsersTab({ users, orgOptions }: { users: UserRow[]; orgOptions: OrgOption[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  // Create user
  const [showCreate, setShowCreate] = useState(false)
  const [cName, setCName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cPassword, setCPassword] = useState('')
  const [cOrgId, setCOrgId] = useState('')
  const [cRole, setCRole] = useState<string>('EDITOR')

  // Edit user
  const [editTarget, setEditTarget] = useState<UserRow | null>(null)
  const [eName, setEName] = useState('')
  const [eEmail, setEEmail] = useState('')

  // Delete user
  const [delTarget, setDelTarget] = useState<UserRow | null>(null)

  // Reset password
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null)
  const [newPassword, setNewPassword] = useState('')

  function openEdit(u: UserRow) {
    setEditTarget(u)
    setEName(u.name)
    setEEmail(u.email)
  }

  async function handleCreate() {
    if (!cName.trim() || !cEmail.trim() || !cPassword.trim()) return
    setSaving(true)
    try {
      await createUser(cName.trim(), cEmail.trim(), cPassword, cOrgId || null, cRole)
      toast.success(`Pengguna ${cName} berhasil dibuat`)
      setShowCreate(false)
      setCName(''); setCEmail(''); setCPassword(''); setCOrgId(''); setCRole('EDITOR')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat pengguna')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editTarget || !eName.trim() || !eEmail.trim()) return
    setSaving(true)
    try {
      await updateUser(editTarget.id, eName.trim(), eEmail.trim())
      toast.success('Pengguna berhasil diperbarui')
      setEditTarget(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memperbarui')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!delTarget) return
    setSaving(true)
    try {
      await deleteUser(delTarget.id)
      toast.success(`${delTarget.name} berhasil dihapus`)
      setDelTarget(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(userId: string, name: string) {
    setToggling(userId)
    try {
      await toggleUserActive(userId)
      toast.success(`Status ${name} berhasil diubah`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memproses.')
    } finally {
      setToggling(null)
    }
  }

  async function handleResetPassword() {
    if (!pwTarget || !newPassword.trim()) return
    setSaving(true)
    try {
      await resetUserPassword(pwTarget.id, newPassword)
      toast.success(`Password ${pwTarget.name} berhasil direset`)
      setPwTarget(null)
      setNewPassword('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mereset password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-100">All Platform Users ({users.length})</h2>
            <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </Button>
          </div>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium">Nama</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Email</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Organisasi</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center">Role</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center">Status</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center w-14">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-zinc-800">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.isSuperAdmin && <Shield className="w-4 h-4 text-rose-400 shrink-0" />}
                        <span className="font-medium text-zinc-200">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{user.email}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{user.organization}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] ${roleColors[user.role] ?? roleColors.NO_ORG}`}>
                        {normalizeRole(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Aktif</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {!user.isSuperAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 w-48">
                            <DropdownMenuItem
                              onClick={() => openEdit(user)}
                              className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2 text-blue-400" />
                              Edit Pengguna
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => { setPwTarget(user); setNewPassword('') }}
                              className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer"
                            >
                              <KeyRound className="w-4 h-4 mr-2 text-amber-400" />
                              Ubah Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggle(user.id, user.name)}
                              disabled={toggling === user.id}
                              className={`cursor-pointer ${
                                user.isActive
                                  ? 'text-orange-400 focus:bg-orange-500/10'
                                  : 'text-emerald-400 focus:bg-emerald-500/10'
                              }`}
                            >
                              {toggling === user.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : user.isActive ? (
                                <UserX className="w-4 h-4 mr-2" />
                              ) : (
                                <UserCheck className="w-4 h-4 mr-2" />
                              )}
                              {user.isActive ? 'Deactivate' : 'Reactivate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                              onClick={() => setDelTarget(user)}
                              className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus Pengguna
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-[10px] text-zinc-600">Protected</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                      Belum ada pengguna terdaftar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== CREATE USER DIALOG ===== */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Tambah Pengguna Baru</DialogTitle>
            <DialogDescription className="text-zinc-400">Buat akun baru dan assign ke organisasi.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Nama Lengkap</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="John Doe" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Email</Label>
              <Input value={cEmail} onChange={(e) => setCEmail(e.target.value)} type="email" placeholder="john@example.com" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Password</Label>
              <Input value={cPassword} onChange={(e) => setCPassword(e.target.value)} type="password" placeholder="Min 6 karakter" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="text-zinc-300">Organisasi</Label>
                <Select value={cOrgId} onValueChange={setCOrgId}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Pilih org..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {orgOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id} className="text-zinc-300 focus:bg-zinc-800">
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-zinc-300">Role</Label>
                <Select value={cRole} onValueChange={setCRole}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-zinc-300 focus:bg-zinc-800">
                        {normalizeRole(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-zinc-700 text-zinc-300">Batal</Button>
            <Button onClick={handleCreate} disabled={saving || !cName.trim() || !cEmail.trim() || !cPassword.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Buat Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT USER DIALOG ===== */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Pengguna</DialogTitle>
            <DialogDescription className="text-zinc-400">Ubah nama dan email pengguna.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Nama</Label>
              <Input value={eName} onChange={(e) => setEName(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Email</Label>
              <Input value={eEmail} onChange={(e) => setEEmail(e.target.value)} type="email" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
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

      {/* ===== DELETE USER DIALOG ===== */}
      <Dialog open={!!delTarget} onOpenChange={() => setDelTarget(null)}>
        <DialogContent className="bg-zinc-950 border-red-500/30 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">Hapus Pengguna</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-zinc-200">{delTarget?.name}</span> ({delTarget?.email})?
              Semua data terkait pengguna ini akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelTarget(null)} className="border-zinc-700 text-zinc-300">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== RESET PASSWORD DIALOG ===== */}
      <Dialog open={!!pwTarget} onOpenChange={() => setPwTarget(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Ubah Password
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Reset password untuk <span className="font-bold text-zinc-200">{pwTarget?.name}</span> ({pwTarget?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Password Baru</Label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="Minimal 6 karakter"
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)} className="border-zinc-700 text-zinc-300">Batal</Button>
            <Button onClick={handleResetPassword} disabled={saving || newPassword.length < 6}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
