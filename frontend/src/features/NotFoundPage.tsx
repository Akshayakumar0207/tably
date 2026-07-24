import { Link } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <UtensilsCrossed className="h-12 w-12 text-[rgb(var(--color-text-muted))] mb-4" />
      <h1 className="font-display text-4xl font-bold mb-2">404</h1>
      <p className="text-[rgb(var(--color-text-muted))] mb-6">This page doesn't exist or has been moved.</p>
      <Link to="/"><Button>Back to Home</Button></Link>
    </div>
  )
}
