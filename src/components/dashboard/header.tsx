'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, LogOut, User, ChevronDown } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  const userInitials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AD'

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Organization info */}
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-zinc-500" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200">
              {session?.user?.organizationName ?? 'Loading...'}
            </span>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-wider">
              {(session?.user?.role ?? '...').replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* Right: User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-zinc-800/50">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-zinc-200">
                  {session?.user?.name}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {session?.user?.email}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-500 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-zinc-950 border-zinc-800"
          >
            <DropdownMenuLabel className="text-zinc-400 text-xs font-normal">
              Signed in as
            </DropdownMenuLabel>
            <DropdownMenuLabel className="text-zinc-200 -mt-1">
              {session?.user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
