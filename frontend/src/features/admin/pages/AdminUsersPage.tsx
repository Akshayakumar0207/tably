import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { User } from '@/types'
import { Card, Badge, Skeleton, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/toastStore'

export function AdminUsersPage() {
  const { push } = useToastStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<User[]>('/api/admin/users')).data,
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => api.put(`/api/admin/users/${id}/toggle-active`),
    onSuccess: () => { push('User status updated', 'success'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">User Management</h1>

      {isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}

      {!isLoading && data?.length === 0 && <EmptyState icon={<Users className="h-10 w-10" />} title="No users yet" />}

      <div className="space-y-2">
        {data?.map((u) => (
          <Card key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{u.full_name} <span className="text-[rgb(var(--color-text-muted))] font-normal">· {u.email}</span></p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info">{u.role}</Badge>
                <Badge variant={u.is_verified ? 'success' : 'warning'}>{u.is_verified ? 'verified' : 'unverified'}</Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(u.id)}>Toggle Active</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
