import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, X, Store } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { Restaurant } from '@/types'
import { Card, Badge, Skeleton, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/toastStore'

export function AdminRestaurantsPage() {
  const { push } = useToastStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => (await api.get<Restaurant[]>('/api/admin/restaurants')).data,
  })

  const approvalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.put(`/api/admin/restaurants/${id}/approval`, { status }),
    onSuccess: () => { push('Restaurant status updated', 'success'); qc.invalidateQueries({ queryKey: ['admin-restaurants'] }) },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const pending = data?.filter((r) => r.status === 'pending') ?? []
  const others = data?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">Restaurant Management</h1>

      {isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}

      {!isLoading && pending.length === 0 && others.length === 0 && (
        <EmptyState icon={<Store className="h-10 w-10" />} title="No restaurants yet" />
      )}

      {pending.length > 0 && (
        <>
          <h2 className="font-semibold text-sm text-[rgb(var(--color-text-muted))] mb-3">PENDING APPROVAL ({pending.length})</h2>
          <div className="space-y-3 mb-8">
            {pending.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-[rgb(var(--color-text-muted))]">{r.cuisine} · {r.city} · {r.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approvalMutation.mutate({ id: r.id, status: 'approved' })}><Check className="h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => approvalMutation.mutate({ id: r.id, status: 'rejected' })}><X className="h-3.5 w-3.5" /> Reject</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h2 className="font-semibold text-sm text-[rgb(var(--color-text-muted))] mb-3">ALL RESTAURANTS</h2>
          <div className="space-y-3">
            {others.map((r) => (
              <Card key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-[rgb(var(--color-text-muted))]">{r.cuisine} · {r.city}</p>
                </div>
                <Badge variant={r.status === 'approved' ? 'success' : 'danger'}>{r.status}</Badge>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
