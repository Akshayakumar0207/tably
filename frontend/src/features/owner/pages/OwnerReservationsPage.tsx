import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Check, X as XIcon, CheckCheck, TrendingUp, Star } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { Reservation, DashboardOverview } from '@/types'
import { Card, Badge, Skeleton, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/toastStore'
import { formatDate, formatTime } from '@/lib/utils'

export function OwnerReservationsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const { push } = useToastStore()
  const qc = useQueryClient()

  const { data: overview } = useQuery({
    queryKey: ['owner-dashboard', restaurantId],
    queryFn: async () => (await api.get<DashboardOverview>(`/api/owner/dashboard/${restaurantId}`)).data,
    enabled: !!restaurantId,
  })

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['owner-reservations', restaurantId],
    queryFn: async () => (await api.get<Reservation[]>(`/api/reservations/owner/restaurant/${restaurantId}`)).data,
    enabled: !!restaurantId,
    refetchInterval: 10000,
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/reservations/owner/${id}/status`, { status }),
    onSuccess: () => {
      push('Reservation updated', 'success')
      qc.invalidateQueries({ queryKey: ['owner-reservations', restaurantId] })
      qc.invalidateQueries({ queryKey: ['owner-dashboard', restaurantId] })
    },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">{overview?.restaurant_name ?? 'Reservations'}</h1>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Calendar className="h-4 w-4" />} label="Total" value={overview.total_reservations} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Today" value={overview.today_reservation_count} />
          <StatCard icon={<CheckCheck className="h-4 w-4" />} label="Completed" value={overview.completed} />
          <StatCard icon={<Star className="h-4 w-4" />} label="Rating" value={overview.avg_rating.toFixed(1)} />
        </div>
      )}

      {isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}

      {!isLoading && reservations?.length === 0 && (
        <EmptyState icon={<Calendar className="h-10 w-10" />} title="No reservations yet" description="New bookings will appear here." />
      )}

      <div className="space-y-3">
        {reservations?.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={r.status === 'confirmed' ? 'success' : r.status === 'cancelled' || r.status === 'rejected' ? 'danger' : r.status === 'completed' ? 'info' : 'warning'}>
                    {r.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[rgb(var(--color-text-muted))]">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(r.reservation_date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(r.reservation_time)}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{r.guest_count} guests</span>
                </div>
                {r.special_request && <p className="text-sm mt-1 italic text-[rgb(var(--color-text-muted))]">"{r.special_request}"</p>}
              </div>
              <div className="flex gap-2">
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => statusMutation.mutate({ id: r.id, status: 'confirmed' })}><Check className="h-3.5 w-3.5" /> Accept</Button>
                    <Button size="sm" variant="danger" onClick={() => statusMutation.mutate({ id: r.id, status: 'rejected' })}><XIcon className="h-3.5 w-3.5" /> Reject</Button>
                  </>
                )}
                {r.status === 'confirmed' && (
                  <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: r.id, status: 'completed' })}><CheckCheck className="h-3.5 w-3.5" /> Mark Completed</Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--color-text-muted))] mb-1">{icon} {label}</div>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  )
}
