import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { api } from '@/lib/api'
import type { Restaurant } from '@/types'
import { RestaurantCard } from '@/features/restaurants/components/RestaurantCard'
import { Input, Select } from '@/components/ui/Input'
import { Skeleton, EmptyState } from '@/components/ui/primitives'

const CUISINES = ['All Cuisines', 'North Indian', 'South Indian', 'Chinese', 'Italian', 'Continental', 'Multi-Cuisine', 'Fast Food']

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [city, setCity] = useState('')
  const [cuisine, setCuisine] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', debouncedQuery, city, cuisine],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (debouncedQuery) params.q = debouncedQuery
      if (city) params.city = city
      if (cuisine && cuisine !== 'All Cuisines') params.cuisine = cuisine
      const { data } = await api.get<Restaurant[]>('/api/restaurants', { params })
      return data
    },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Find your table</h1>
        <p className="text-[rgb(var(--color-text-muted))] mt-2">Discover and reserve tables at the best restaurants near you</p>
      </motion.div>

      <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 mb-8 max-w-3xl mx-auto">
        <Input placeholder="Search restaurants..." value={query} onChange={(e) => setQuery(e.target.value)}
          className="pl-10" style={{ backgroundImage: 'none' }} />
        <div className="relative -mt-[52px] sm:mt-0 pointer-events-none hidden sm:block" />
        <Select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All Cities</option>
          <option value="Chennai">Chennai</option>
          <option value="Bangalore">Bangalore</option>
          <option value="Salem">Salem</option>
          <option value="Coimbatore">Coimbatore</option>
        </Select>
        <Select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <EmptyState icon={<Search className="h-10 w-10" />} title="No restaurants found"
          description="Try adjusting your search or filters to find more results." />
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((r, i) => <RestaurantCard key={r.id} restaurant={r} index={i} />)}
        </div>
      )}
    </div>
  )
}
