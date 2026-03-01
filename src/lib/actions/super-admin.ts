'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'

// SSE helper — MUST use fetch() not direct import (different worker processes)
const SSE_BASE = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function broadcastSSE(event: string, data: Record<string, unknown>) {
  try {
    // Get ALL online devices and send to each
    const devices = await prisma.device.findMany({
      where: { status: 'ONLINE' },
      select: { id: true },
    })

    await Promise.allSettled(
      devices.map((d) =>
        fetch(`${SSE_BASE}/api/sse/direct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: d.id, event, data }),
        })
      )
    )
  } catch (e) {
    console.error('[SSE] broadcastSSE failed:', e)
  }
}

// ============================================================================
// AUTH GUARD
// ============================================================================

export async function verifySuperAdmin() {
  const session = await auth()
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  })

  return user?.isSuperAdmin ?? false
}

// ============================================================================
// ORGANIZATIONS - READ
// ============================================================================

export async function getAllOrganizations() {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden: Super Admin access required')

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          members: true,
          devices: true,
          media: true,
          playlists: true,
        },
      },
      media: { select: { fileSize: true } },
      members: {
        where: { role: 'OWNER' },
        include: { user: { select: { name: true, email: true } } },
        take: 1,
      },
    },
  })

  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    brandColor: org.brandColor,
    maxDevices: org.maxDevices,
    maxStorage: Number(org.maxStorage),
    deviceCount: org._count.devices,
    memberCount: org._count.members,
    mediaCount: org._count.media,
    playlistCount: org._count.playlists,
    storageUsed: org.media.reduce((sum, m) => sum + m.fileSize, 0),
    owner: org.members[0]?.user ?? null,
    createdAt: org.createdAt,
  }))
}

// ============================================================================
// ORGANIZATIONS - CREATE, UPDATE, DELETE
// ============================================================================

export async function createOrganization(name: string, slug: string) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  // Validate slug uniqueness
  const existing = await prisma.organization.findUnique({ where: { slug } })
  if (existing) throw new Error('Slug sudah digunakan')

  await prisma.organization.create({
    data: { name, slug },
  })

  revalidatePath('/super-admin')
}

export async function updateOrganization(orgId: string, name: string, slug: string) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  // Check slug uniqueness (exclude current org)
  const existing = await prisma.organization.findFirst({
    where: { slug, id: { not: orgId } },
  })
  if (existing) throw new Error('Slug sudah digunakan oleh organisasi lain')

  await prisma.organization.update({
    where: { id: orgId },
    data: { name, slug },
  })

  revalidatePath('/super-admin')
}

export async function deleteOrganization(orgId: string) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  // CASCADE: Prisma schema has onDelete: Cascade for all relations
  await prisma.organization.delete({ where: { id: orgId } })

  revalidatePath('/super-admin')
}

// ============================================================================
// ORGANIZATIONS - PLAN & SUSPEND
// ============================================================================

const PLAN_LIMITS: Record<string, { maxDevices: number; maxStorage: number }> = {
  FREE: { maxDevices: 3, maxStorage: 1 * 1024 * 1024 * 1024 },
  PRO: { maxDevices: 25, maxStorage: 10 * 1024 * 1024 * 1024 },
  ENTERPRISE: { maxDevices: 999, maxStorage: 100 * 1024 * 1024 * 1024 },
}

export async function updateOrganizationPlan(
  orgId: string,
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const limits = PLAN_LIMITS[plan]
  if (!limits) throw new Error('Invalid plan')

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      maxDevices: limits.maxDevices,
      maxStorage: BigInt(limits.maxStorage),
    },
  })

  revalidatePath('/super-admin')
}

export async function suspendOrganization(orgId: string, suspended: boolean) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    select: { userId: true },
  })

  const userIds = members.map((m) => m.userId)

  if (userIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: userIds }, isSuperAdmin: false },
      data: { isActive: !suspended },
    })
  }

  revalidatePath('/super-admin')
}

// ============================================================================
// USERS - READ
// ============================================================================

export async function getAllUsers() {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      isSuperAdmin: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
  })

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    isSuperAdmin: u.isSuperAdmin,
    createdAt: u.createdAt,
    organization: u.memberships[0]?.organization?.name ?? '—',
    organizationId: u.memberships[0]?.organization?.id ?? null,
    role: u.isSuperAdmin
      ? 'SUPER_ADMIN'
      : u.memberships[0]?.role ?? 'NO_ORG',
  }))
}

// ============================================================================
// USERS - CREATE, UPDATE, DELETE, TOGGLE
// ============================================================================

export async function createUser(
  name: string,
  email: string,
  password: string,
  organizationId: string | null,
  role: string
) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email sudah terdaftar')

  const hashedPassword = await hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  // Add to organization if specified
  if (organizationId && role) {
    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId,
        role: role as 'OWNER' | 'ADMIN' | 'REVIEWER' | 'EDITOR' | 'CONTENT_CREATOR' | 'VIEWER',
      },
    })
  }

  revalidatePath('/super-admin')
}

export async function updateUser(userId: string, name: string, email: string) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  // Check email uniqueness
  const existing = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  })
  if (existing) throw new Error('Email sudah digunakan pengguna lain')

  await prisma.user.update({
    where: { id: userId },
    data: { name, email },
  })

  revalidatePath('/super-admin')
}

export async function deleteUser(userId: string) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  })
  if (user?.isSuperAdmin) throw new Error('Tidak bisa menghapus Super Admin')

  await prisma.user.delete({ where: { id: userId } })

  revalidatePath('/super-admin')
}

export async function toggleUserActive(userId: string) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, isSuperAdmin: true },
  })

  if (!user) throw new Error('User not found')
  if (user.isSuperAdmin) throw new Error('Cannot deactivate a Super Admin')

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  })

  revalidatePath('/super-admin')
}

// ============================================================================
// PLATFORM STATS
// ============================================================================

export async function getPlatformStats() {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const [orgCount, userCount, deviceCount, mediaCount] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.device.count(),
    prisma.media.count(),
  ])

  const onlineDevices = await prisma.device.count({
    where: { status: 'ONLINE' },
  })

  const storageResult = await prisma.media.aggregate({
    _sum: { fileSize: true },
  })
  const globalStorageUsed = storageResult._sum.fileSize || 0

  return { orgCount, userCount, deviceCount, onlineDevices, mediaCount, globalStorageUsed }
}

// ============================================================================
// MAINTENANCE MODE (SSE Broadcast)
// ============================================================================

export async function setMaintenanceMode(active: boolean) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  const event = active ? 'MAINTENANCE_ACTIVE' : 'MAINTENANCE_INACTIVE'
  await broadcastSSE(event, { active })

  return { success: true, maintenanceActive: active }
}

/**
 * Reset a user's password (Super Admin only).
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  const isSA = await verifySuperAdmin()
  if (!isSA) throw new Error('Forbidden')

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password minimal 6 karakter')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) throw new Error('User tidak ditemukan')

  const hashedPassword = await hash(newPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  revalidatePath('/super-admin')
}
