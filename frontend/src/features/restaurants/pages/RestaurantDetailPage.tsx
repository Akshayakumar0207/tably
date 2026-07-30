import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Star, MapPin, Clock, Phone, Heart, Wind, Sun as WindowIcon, Users } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { Restaurant, RestaurantTable, Review } from '@/types'
import { FloorMap } from '@/components/floor-map/FloorMap'
import { Card, Badge, Skeleton } from '@/components/ui/primitives'
import { FadeImage } from '@/components/ui/FadeImage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { formatTime } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const { user } = useAuthStore()
  const { push } = useToastStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => (await api.get<Restaurant>(`/api/restaurants/${id}`)).data,
    enabled: !!id,
  })

  const { data: tables } = useQuery({
    queryKey: ['restaurant-tables', id],
    queryFn: async () => (await api.get<RestaurantTable[]>(`/api/restaurants/${id}/tables`)).data,
    enabled: !!id,
    refetchInterval: 10000, // live availability
  })

  const { data: reviews } = useQuery({
    queryKey: ['restaurant-reviews', id],
    queryFn: async () => (await api.get<Review[]>(`/api/restaurants/${id}/reviews`)).data,
    enabled: !!id,
  })

  const { data: gallery } = useQuery({
    queryKey: ['restaurant-gallery', id],
    queryFn: async () => (await api.get<{ id: string; url: string }[]>(`/api/restaurants/${id}/gallery`)).data,
    enabled: !!id,
  })

  const favoriteMutation = useMutation({
    mutationFn: async () => api.post(`/api/favorites/${id}`),
    onSuccess: () => { push('Added to favorites', 'success'); qc.invalidateQueries({ queryKey: ['favorites'] }) },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table)
    if (!user) { navigate('/login'); return }
    setBookingOpen(true)
  }

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-96" /></div>
  }
  if (!restaurant) return null

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-[rgb(var(--color-surface-alt))] mb-6 group">
          {restaurant.cover_image_url ? (
            <FadeImage src={restaurant.cover_image_url} alt={restaurant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[rgb(var(--color-text-muted))]">No image available</div>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-display text-3xl font-bold">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[rgb(var(--color-text-muted))]">
              <Badge variant="info">{restaurant.cuisine}</Badge>
              {restaurant.review_count > 0 && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{restaurant.avg_rating.toFixed(1)} ({restaurant.review_count} reviews)</span>
              )}
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{restaurant.address}, {restaurant.city}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}</span>
              {restaurant.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{restaurant.phone}</span>}
            </div>
          </div>
          <Button variant="outline" onClick={() => favoriteMutation.mutate()}>
            <motion.span
              className="inline-flex"
              animate={favoriteMutation.isSuccess ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.35 }}
            >
              <Heart className={favoriteMutation.isSuccess ? 'h-4 w-4 fill-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' : 'h-4 w-4'} />
            </motion.span>
            Save
          </Button>
        </div>

        {restaurant.description && <p className="text-[rgb(var(--color-text-muted))] mt-4 max-w-3xl">{restaurant.description}</p>}

        {gallery && gallery.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold mb-3">Interior</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {gallery.map((img) => (
                <div key={img.id} className="shrink-0 w-40 h-28 rounded-xl overflow-hidden group cursor-pointer">
                  <FadeImage src={img.url} alt="Restaurant interior" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 mt-10">
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Choose Your Table</h2>
          <p className="text-sm text-[rgb(var(--color-text-muted))] mb-4">
            Click an available (green) table to start booking. Live availability updates automatically.
          </p>
          {tables ? <FloorMap tables={tables} onSelectTable={handleSelectTable} selectedTableId={selectedTable?.id} /> : <Skeleton className="h-96" />}
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Reviews</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {reviews?.length === 0 && <p className="text-sm text-[rgb(var(--color-text-muted))]">No reviews yet. Be the first!</p>}
            {reviews?.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-[rgb(var(--color-border))]'}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {selectedTable && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          restaurant={restaurant}
          table={selectedTable}
          onBooked={() => { setBookingOpen(false); qc.invalidateQueries({ queryKey: ['restaurant-tables', id] }) }}
        />
      )}
    </div>
  )
}

function BookingModal({ open, onClose, restaurant, table, onBooked }: {
  open: boolean; onClose: () => void; restaurant: Restaurant; table: RestaurantTable; onBooked: () => void
}) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('19:00')
  const [guests, setGuests] = useState(2)
  const [request, setRequest] = useState('')
  const { push } = useToastStore()

  const bookMutation = useMutation({
    mutationFn: async () => api.post('/api/reservations', {
      restaurant_id: restaurant.id,
      table_id: table.id,
      reservation_date: date,
      reservation_time: time + ':00',
      guest_count: guests,
      special_request: request || undefined,
    }),
    onSuccess: () => { push('Table reserved! Awaiting owner confirmation.', 'success'); onBooked() },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal open={open} onClose={onClose} title={`Reserve Table ${table.table_number}`}>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="info"><Users className="h-3 w-3" /> Up to {table.capacity} guests</Badge>
        {table.is_window && <Badge variant="default"><WindowIcon className="h-3 w-3" /> Window seat</Badge>}
        <Badge variant="default"><Wind className="h-3 w-3" /> {table.is_ac ? 'AC' : 'Non-AC'}</Badge>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate() }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" min={today} required value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Select label="Number of guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
          {Array.from({ length: table.capacity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
        </Select>
        <Input label="Special request (optional)" placeholder="e.g. birthday celebration" value={request} onChange={(e) => setRequest(e.target.value)} />
        <Button type="submit" className="w-full" loading={bookMutation.isPending}>Confirm Reservation</Button>
      </form>
    </Modal>
  )
}
