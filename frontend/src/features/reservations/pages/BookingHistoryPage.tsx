import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, X, CalendarX } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { Reservation, Restaurant } from '@/types'
import { Card, Badge, Skeleton, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/toastStore'
import { formatDate, formatTime } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export function BookingHistoryPage() {
  const { push } = useToastStore()
  const qc = useQueryClient()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => (await api.get<Reservation[]>('/api/reservations/my')).data,
  })

  const { data: restaurants } = useQuery({
    queryKey: ['restaurants-lookup', reservations?.map((r) => r.restaurant_id)],
    queryFn: async () => {
      const ids = [...new Set(reservations!.map((r) => r.restaurant_id))]
      const results = await Promise.all(ids.map((id) => api.get<Restaurant>(`/api/restaurants/${id}`)))
      return Object.fromEntries(results.map((r) => [r.data.id, r.data]))
    },
    enabled: !!reservations && reservations.length > 0,
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/api/reservations/${id}/cancel`),
    onSuccess: () => { push('Reservation cancelled', 'success'); qc.invalidateQueries({ queryKey: ['my-reservations'] }) },
    onError: (e) => push(apiErrorMessage(e), 'error'),
    onSettled: () => setCancellingId(null),
  })

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">My Bookings</h1>

      {isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>}

      {!isLoading && reservations?.length === 0 && (
        <EmptyState icon={<CalendarX className="h-10 w-10" />} title="No bookings yet"
          description="Reserve a table at your favorite restaurant to see it here."
          action={<Link to="/"><Button>Find a restaurant</Button></Link>} />
      )}

      <div className="space-y-3">
        {reservations?.map((r, i) => {
          const restaurant = restaurants?.[r.restaurant_id]
          const canCancel = r.status === 'pending' || r.status === 'confirmed'
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-5 flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{restaurant?.name ?? 'Loading…'}</h3>
                    <Badge variant={r.status === 'confirmed' ? 'success' : r.status === 'cancelled' || r.status === 'rejected' ? 'danger' : r.status === 'completed' ? 'info' : 'warning'}>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[rgb(var(--color-text-muted))]">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(r.reservation_date)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(r.reservation_time)}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{r.guest_count} guests</span>
                  </div>
                </div>
                {canCancel && (
                  <Button variant="outline" size="sm" loading={cancellingId === r.id}
                    onClick={() => { setCancellingId(r.id); cancelMutation.mutate(r.id) }}>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
