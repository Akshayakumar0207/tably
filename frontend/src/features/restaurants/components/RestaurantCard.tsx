import { Link } from 'react-router-dom'
import { Star, MapPin, UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Restaurant } from '@/types'
import { Card, Badge } from '@/components/ui/primitives'

export function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Link to={`/restaurants/${restaurant.id}`}>
        <Card className="overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
          <div className="aspect-[4/3] bg-[rgb(var(--color-surface-alt))] relative overflow-hidden">
            {restaurant.cover_image_url ? (
              <img src={restaurant.cover_image_url} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UtensilsCrossed className="h-10 w-10 text-[rgb(var(--color-text-muted))]" />
              </div>
            )}
            <Badge variant="default" className="absolute top-3 left-3 glass">{restaurant.cuisine}</Badge>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-lg leading-tight">{restaurant.name}</h3>
              {restaurant.review_count > 0 && (
                <div className="flex items-center gap-1 text-sm shrink-0">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{restaurant.avg_rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="flex items-center gap-1 text-sm text-[rgb(var(--color-text-muted))] mt-1.5">
              <MapPin className="h-3.5 w-3.5" /> {restaurant.city}
            </p>
            {restaurant.description && (
              <p className="text-sm text-[rgb(var(--color-text-muted))] mt-2 line-clamp-2">{restaurant.description}</p>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
