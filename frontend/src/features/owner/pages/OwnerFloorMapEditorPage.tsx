import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Circle, RectangleHorizontal } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import type { RestaurantTable } from '@/types'
import { FloorMap } from '@/components/floor-map/FloorMap'
import { Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToastStore } from '@/store/toastStore'

interface TableFormData {
  table_number: string
  shape: 'circle' | 'rectangle'
  capacity: number
  is_window: boolean
  is_ac: boolean
}

export function OwnerFloorMapEditorPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<RestaurantTable | null>(null)
  const { push } = useToastStore()
  const qc = useQueryClient()

  const { data: tables } = useQuery({
    queryKey: ['owner-tables', restaurantId],
    queryFn: async () => (await api.get<RestaurantTable[]>(`/api/owner/restaurants/${restaurantId}/tables`)).data,
    enabled: !!restaurantId,
  })

  const { register, handleSubmit, reset } = useForm<TableFormData>({
    defaultValues: { shape: 'circle', capacity: 2, is_window: false, is_ac: true },
  })

  const createMutation = useMutation({
    mutationFn: async (data: TableFormData) => api.post(`/api/owner/restaurants/${restaurantId}/tables`, {
      ...data, pos_x: 100 + Math.random() * 400, pos_y: 100 + Math.random() * 200,
      width: data.shape === 'circle' ? 60 : 80, height: data.shape === 'circle' ? 60 : 50,
    }),
    onSuccess: () => { push('Table added', 'success'); setAddOpen(false); reset(); qc.invalidateQueries({ queryKey: ['owner-tables', restaurantId] }) },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RestaurantTable> }) =>
      api.put(`/api/owner/restaurants/${restaurantId}/tables/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-tables', restaurantId] }),
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/owner/restaurants/${restaurantId}/tables/${id}`),
    onSuccess: () => { push('Table deleted', 'success'); setSelected(null); qc.invalidateQueries({ queryKey: ['owner-tables', restaurantId] }) },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const handleDrag = (tableId: string, x: number, y: number) => {
    qc.setQueryData<RestaurantTable[]>(['owner-tables', restaurantId], (old) =>
      old?.map((t) => (t.id === tableId ? { ...t, pos_x: x, pos_y: y } : t))
    )
  }

  const handleDragEnd = () => {
    const current = qc.getQueryData<RestaurantTable[]>(['owner-tables', restaurantId])
    const table = current?.find((t) => t.id === selected?.id)
    if (table) updateMutation.mutate({ id: table.id, data: { pos_x: table.pos_x, pos_y: table.pos_y } })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Floor Layout Editor</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted))]">Drag tables to arrange your floor plan. Changes save automatically.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Table</Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div onPointerUp={handleDragEnd}>
          {tables && <FloorMap tables={tables} editable onDrag={handleDrag} onSelectTable={setSelected} selectedTableId={selected?.id} />}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">All Tables ({tables?.length ?? 0})</h3>
          {tables?.map((t) => (
            <Card key={t.id} className={`p-3 cursor-pointer ${selected?.id === t.id ? 'ring-2 ring-[rgb(var(--color-primary))]' : ''}`} onClick={() => setSelected(t)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {t.shape === 'circle' ? <Circle className="h-3.5 w-3.5" /> : <RectangleHorizontal className="h-3.5 w-3.5" />}
                  Table {t.table_number} · {t.capacity} seats
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(t.id) }} className="text-[rgb(var(--color-danger))]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <Select
                className="mt-2 text-xs py-1"
                value={t.status}
                onChange={(e) => updateMutation.mutate({ id: t.id, data: { status: e.target.value as RestaurantTable['status'] } })}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="available">Available</option>
                <option value="reserved_soon">Reserved Soon</option>
                <option value="occupied">Occupied</option>
                <option value="disabled">Disabled</option>
              </Select>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Table">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
          <Input label="Table number" placeholder="e.g. T5" required {...register('table_number', { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Shape" {...register('shape')}>
              <option value="circle">Circle</option>
              <option value="rectangle">Rectangle</option>
            </Select>
            <Input label="Capacity" type="number" min={1} max={20} required {...register('capacity', { required: true, valueAsNumber: true })} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('is_window')} /> Window seat</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('is_ac')} defaultChecked /> AC</label>
          </div>
          <Button type="submit" className="w-full" loading={createMutation.isPending}>Add Table</Button>
        </form>
      </Modal>
    </div>
  )
}
