import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Store, CalendarCheck, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import type { SystemAnalytics } from '@/types'
import { Card, Skeleton } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get<SystemAnalytics>('/api/admin/analytics/system')).data,
  })

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">Admin Dashboard</h1>

      {isLoading && <div className="grid sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}

      {data && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={<Users className="h-4 w-4" />} label="Total Users" value={data.total_users} sub={`${data.total_customers} customers · ${data.total_owners} owners`} />
          <Stat icon={<Store className="h-4 w-4" />} label="Restaurants" value={data.total_restaurants} sub={`${data.approved_restaurants} approved · ${data.pending_restaurants} pending`} />
          <Stat icon={<CalendarCheck className="h-4 w-4" />} label="Reservations" value={data.total_reservations} sub={`${data.completed_reservations} completed`} />
          <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Cancelled" value={data.cancelled_reservations} sub="reservations" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/restaurants"><Button variant="outline">Manage Restaurants</Button></Link>
        <Link to="/admin/users"><Button variant="outline">Manage Users</Button></Link>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--color-text-muted))] mb-1">{icon} {label}</div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">{sub}</p>
    </Card>
  )
}
