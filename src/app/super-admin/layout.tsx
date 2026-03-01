import { verifySuperAdmin } from '@/lib/actions/super-admin'
import { redirect } from 'next/navigation'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isSA = await verifySuperAdmin()
  if (!isSA) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Super Admin Topbar */}
      <header className="border-b border-red-500/20 bg-zinc-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <span className="text-sm">🛡️</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-red-400 tracking-wider uppercase">
                Super Admin Console
              </h1>
              <p className="text-[10px] text-zinc-500">Platform Management • SaaS Operator</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
          >
            ← Kembali ke Dashboard
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
