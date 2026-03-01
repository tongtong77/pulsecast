'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Image,
  ListVideo,
  Monitor,
  CalendarClock,
  BarChart3,
  ShieldCheck,
  Settings,
  Monitor as MonitorIcon,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
  REVIEWER: 'Reviewer',
  CONTENT_CREATOR: 'Content Creator',
}

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  requiredRoles?: string[] // If set, only these roles see the item
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/dashboard/media', label: 'Media', icon: Image, requiredRoles: ['OWNER', 'ADMIN', 'EDITOR', 'CONTENT_CREATOR', 'REVIEWER'] },
  { href: '/dashboard/playlists', label: 'Playlist', icon: ListVideo, requiredRoles: ['OWNER', 'ADMIN', 'EDITOR', 'REVIEWER'] },
  { href: '/dashboard/devices', label: 'Layar TV', icon: Monitor, requiredRoles: ['OWNER', 'ADMIN', 'EDITOR'] },
  { href: '/dashboard/schedules', label: 'Jadwal', icon: CalendarClock, requiredRoles: ['OWNER', 'ADMIN', 'EDITOR'] },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, requiredRoles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/approvals', label: 'Persetujuan', icon: ShieldCheck, requiredRoles: ['OWNER', 'ADMIN', 'REVIEWER'] },
  { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings, requiredRoles: ['OWNER', 'ADMIN'] },
]

export function Sidebar({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = userRole || 'VIEWER'
  const isSuperAdmin = session?.user?.isSuperAdmin === true

  const visibleItems = navItems.filter((item) => {
    if (!item.requiredRoles) return true
    return item.requiredRoles.includes(role)
  })

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <MonitorIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-zinc-100">PulseCast</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
            {isSuperAdmin ? 'Super Admin' : (ROLE_LABELS[role] || role.replace(/_/g, ' '))}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/5'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  )}
                >
                  <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-blue-400')} />
                  <span>{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="md:hidden">
                {item.label}
              </TooltipContent>
            </Tooltip>
          )
        })}

        {/* Super Admin: Platform Console link */}
        {isSuperAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Platform</span>
            </div>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href="/super-admin"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname.startsWith('/super-admin')
                      ? 'bg-amber-600/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5'
                      : 'text-amber-400/70 hover:bg-amber-800/20 hover:text-amber-300'
                  )}
                >
                  <Crown className="w-5 h-5 shrink-0" />
                  <span>Platform Console</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="md:hidden">
                Platform Console
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 text-center">v2.0.0 • Enterprise</p>
      </div>
    </aside>
  )
}
