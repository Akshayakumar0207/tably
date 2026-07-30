import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Store, Star, LayoutGrid, CalendarCheck, ImageOff } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { Restaurant, OwnerProfile } from '@/types'
import { Card, Badge, Skeleton, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { BannerUpload, GalleryUpload } from '@/components/ui/ImageUpload'
import { FadeImage } from '@/components/ui/FadeImage'
import { useToastStore } from '@/store/toastStore'

interface RestaurantFormData {
  name: string
  description: string
  cuisine: string
  address: string
  city: string
  phone: string
}

export function OwnerDashboardPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [gallery, setGallery] = useState<string[]>([])
  const [bannerError, setBannerError] = useState(false)
  const { push } = useToastStore()
  const qc = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['owner-profile'],
    queryFn: async () => {
      try {
        return (await api.get<OwnerProfile>('/api/owner/profile')).data
      } catch {
        return null
      }
    },
  })

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['owner-restaurants'],
    queryFn: async () => (await api.get<Restaurant[]>('/api/owner/restaurants')).data,
    enabled: !!profile,
  })

  const setupMutation = useMutation({
    mutationFn: async (business_name: string) => api.post('/api/owner/profile', { business_name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-profile'] }),
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const createMutation = useMutation({
    mutationFn: async (data: RestaurantFormData) => {
      const { data: restaurant } = await api.post<Restaurant>('/api/owner/restaurants', { ...data, cover_image_url: banner })
      if (gallery.length) {
        await Promise.all(gallery.map((url) => api.post(`/api/owner/restaurants/${restaurant.id}/images`, { url })))
      }
      return restaurant
    },
    onSuccess: () => {
      push('Restaurant added! Awaiting admin approval.', 'success')
      setAddOpen(false)
      setBanner(null)
      setGallery([])
      qc.invalidateQueries({ queryKey: ['owner-restaurants'] })
    },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const { register, handleSubmit, reset } = useForm<RestaurantFormData>()

  if (profile === undefined) return <div className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-40" /></div>

  if (profile === null) {
    return <OwnerOnboarding onSubmit={(name) => setupMutation.mutate(name)} loading={setupMutation.isPending} />
  }

  const submit = (d: RestaurantFormData) => {
    if (!banner) { setBannerError(true); return }
    setBannerError(false)
    createMutation.mutate(d)
    reset()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{profile.business_name}</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted))]">
            {profile.is_verified ? 'Verified owner account' : 'Account pending admin verification'}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Restaurant</Button>
      </div>

      {isLoading && <div className="grid sm:grid-cols-2 gap-6">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>}

      {!isLoading && restaurants?.length === 0 && (
        <EmptyState icon={<Store className="h-10 w-10" />} title="No restaurants yet"
          description="Add your first restaurant to start accepting reservations."
          action={<Button onClick={() => setAddOpen(true)}>Add Restaurant</Button>} />
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {restaurants?.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              <div className="aspect-[16/7] bg-[rgb(var(--color-surface-alt))] relative overflow-hidden group">
                {r.cover_image_url ? (
                  <FadeImage src={r.cover_image_url} alt={r.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[rgb(var(--color-text-muted))]">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{r.name}</h3>
                  <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>{r.status}</Badge>
                </div>
                <p className="text-sm text-[rgb(var(--color-text-muted))] mb-4">{r.city} · {r.cuisine}</p>
                {r.review_count > 0 && (
                  <p className="text-sm flex items-center gap-1 mb-4"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.avg_rating.toFixed(1)} ({r.review_count} reviews)</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/owner/restaurants/${r.id}/tables`}><Button size="sm" variant="outline"><LayoutGrid className="h-3.5 w-3.5" /> Floor Map</Button></Link>
                  <Link to={`/owner/restaurants/${r.id}/reservations`}><Button size="sm" variant="outline"><CalendarCheck className="h-3.5 w-3.5" /> Reservations</Button></Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Restaurant" className="max-w-2xl">
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <BannerUpload value={banner} onChange={(v) => { setBanner(v); if (v) setBannerError(false) }} label="Banner photo (required)" />
            {bannerError && <p className="mt-1 text-xs text-[rgb(var(--color-danger))]">Please add a banner photo — this is what customers see first.</p>}
          </div>
          <GalleryUpload images={gallery} onChange={setGallery} label="Interior photos (optional)" />

          <Input label="Restaurant name" required {...register('name', { required: true })} />
          <Textarea label="Description" rows={3} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Cuisine" required {...register('cuisine', { required: true })}>
              <option value="">Select cuisine</option>
              <option>North Indian</option><option>South Indian</option><option>Chinese</option>
              <option>Italian</option><option>Continental</option><option>Multi-Cuisine</option><option>Fast Food</option>
            </Select>
            <Select label="City" required {...register('city', { required: true })}>
              <option value="">Select city</option>
              <option>Chennai</option><option>Bangalore</option><option>Salem</option><option>Coimbatore</option>
            </Select>
          </div>
          <Input label="Address" required {...register('address', { required: true })} />
          <Input label="Phone" {...register('phone')} />
          <Button type="submit" className="w-full" loading={createMutation.isPending}>Add Restaurant</Button>
        </form>
      </Modal>
    </div>
  )
}

function OwnerOnboarding({ onSubmit, loading }: { onSubmit: (name: string) => void; loading: boolean }) {
  const [name, setName] = useState('')
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full text-center">
        <Store className="h-10 w-10 mx-auto text-[rgb(var(--color-primary))] mb-3" />
        <h2 className="font-display text-xl font-bold mb-1">Set up your business</h2>
        <p className="text-sm text-[rgb(var(--color-text-muted))] mb-6">Tell us your business name to get started as a restaurant owner.</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(name) }} className="space-y-3">
          <Input placeholder="e.g. Spice Garden Restaurants Pvt Ltd" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>Continue</Button>
        </form>
      </Card>
    </div>
  )
}
