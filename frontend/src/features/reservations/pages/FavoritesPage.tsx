import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { Restaurant } from '@/types'
import { RestaurantCard } from '@/features/restaurants/components/RestaurantCard'
import { Skeleton, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/toastStore'
import { Link } from 'react-router-dom'

export function FavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => (await api.get<Restaurant[]>('/api/favorites')).data,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">Favorite Restaurants</h1>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <EmptyState icon={<Heart className="h-10 w-10" />} title="No favorites yet"
          description="Save restaurants you love to find them quickly later."
          action={<Link to="/"><Button>Explore restaurants</Button></Link>} />
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((r, i) => <RestaurantCard key={r.id} restaurant={r} index={i} />)}
        </div>
      )}
    </div>
  )
}

// keep mutation utilities available for future remove-favorite UI without unused warnings
export function useRemoveFavorite() {
  const qc = useQueryClient()
  const { push } = useToastStore()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/favorites/${id}`),
    onSuccess: () => { push('Removed from favorites', 'success'); qc.invalidateQueries({ queryKey: ['favorites'] }) },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })
}
