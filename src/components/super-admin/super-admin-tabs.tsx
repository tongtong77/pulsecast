'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Users, Activity } from 'lucide-react'
import { TenantTable } from './tenant-table'
import { GlobalUsersTab } from './global-users-tab'
import { SystemHealthTab } from './system-health-tab'

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

type SystemHealth = {
  globalStorageUsed: number
  globalStorageLabel: string
  totalOrgs: number
  totalDevices: number
  onlineDevices: number
  totalUsers: number
  totalMedia: number
}

export function SuperAdminTabs({
  orgs,
  users,
  systemHealth,
}: {
  orgs: OrgRow[]
  users: UserRow[]
  systemHealth: SystemHealth
}) {
  // Build org options for user creation
  const orgOptions = orgs.map((o) => ({ id: o.id, name: o.name }))

  return (
    <Tabs defaultValue="tenants" className="w-full">
      <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto">
        <TabsTrigger
          value="tenants"
          className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400 gap-2 px-4 py-2"
        >
          <Building2 className="w-4 h-4" />
          Tenants
        </TabsTrigger>
        <TabsTrigger
          value="users"
          className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400 gap-2 px-4 py-2"
        >
          <Users className="w-4 h-4" />
          Global Users
        </TabsTrigger>
        <TabsTrigger
          value="health"
          className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400 gap-2 px-4 py-2"
        >
          <Activity className="w-4 h-4" />
          System Health
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tenants" className="mt-6">
        <TenantTable orgs={orgs} />
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <GlobalUsersTab users={users} orgOptions={orgOptions} />
      </TabsContent>

      <TabsContent value="health" className="mt-6">
        <SystemHealthTab data={systemHealth} />
      </TabsContent>
    </Tabs>
  )
}
