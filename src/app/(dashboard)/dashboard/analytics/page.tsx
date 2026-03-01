import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getPopAnalytics } from '@/lib/actions/analytics'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const data = await getPopAnalytics(30)

  if ('error' in data) {
    return (
      <div className="p-8 text-red-400">
        Error: {data.error}
      </div>
    )
  }

  return <AnalyticsDashboard data={data} />
}
