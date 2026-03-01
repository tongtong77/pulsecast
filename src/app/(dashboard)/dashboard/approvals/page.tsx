import { getApprovalQueue } from '@/lib/actions/approval'
import { ApprovalDashboard } from '@/components/approval/approval-dashboard'
import { ShieldCheck } from 'lucide-react'

export default async function ApprovalsPage() {
  const data = await getApprovalQueue()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Content Approval</h1>
          <p className="text-sm text-zinc-400">
            Review dan setujui konten sebelum ditayangkan di layar.
          </p>
        </div>
      </div>

      <ApprovalDashboard data={data} />
    </div>
  )
}
