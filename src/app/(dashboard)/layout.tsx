import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { Providers } from '@/components/providers'
import { TooltipProvider } from '@/components/ui/tooltip'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <Providers>
      <TooltipProvider delayDuration={0}>
        <div className="min-h-screen bg-zinc-950">
          <Sidebar userRole={session.user.role} />
          <div className="ml-64">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </Providers>
  )
}
