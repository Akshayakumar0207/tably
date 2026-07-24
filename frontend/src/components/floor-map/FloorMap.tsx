import { motion } from 'framer-motion'
import type { RestaurantTable } from '@/types'
import { cn } from '@/lib/utils'

const statusFill: Record<string, string> = {
  available: '#10b981',
  reserved_soon: '#f59e0b',
  occupied: '#ef4444',
  disabled: '#9ca3af',
}

interface FloorMapProps {
  tables: RestaurantTable[]
  selectedTableId?: string | null
  onSelectTable?: (table: RestaurantTable) => void
  editable?: boolean
  onDrag?: (tableId: string, x: number, y: number) => void
}

export function FloorMap({ tables, selectedTableId, onSelectTable, editable, onDrag }: FloorMapProps) {
  const width = 700
  const height = 460

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>, table: RestaurantTable) => {
    if (!editable || !onDrag) return
    const svg = (e.currentTarget.ownerSVGElement) as SVGSVGElement
    const move = (ev: PointerEvent) => {
      const rect = svg.getBoundingClientRect()
      const scaleX = width / rect.width
      const scaleY = height / rect.height
      const x = Math.max(20, Math.min(width - 20, (ev.clientX - rect.left) * scaleX))
      const y = Math.max(20, Math.min(height - 20, (ev.clientY - rect.top) * scaleY))
      onDrag(table.id, Math.round(x), Math.round(y))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-alt))]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[560px]" style={{ aspectRatio: `${width}/${height}` }}>
        <defs>
          <pattern id="floorGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgb(var(--color-border))" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#floorGrid)" />

        {/* entrance marker */}
        <rect x={width / 2 - 40} y={height - 14} width="80" height="10" rx="4" fill="rgb(var(--color-border))" />
        <text x={width / 2} y={height - 20} textAnchor="middle" fontSize="11" fill="rgb(var(--color-text-muted))">Entrance</text>

        {tables.map((table) => {
          const isSelected = table.id === selectedTableId
          const disabled = table.status === 'disabled' || table.status === 'occupied'
          const fill = statusFill[table.status]

          return (
            <g
              key={table.id}
              transform={`translate(${table.pos_x}, ${table.pos_y})`}
              onClick={() => !editable && !disabled && onSelectTable?.(table)}
              onPointerDown={(e) => handlePointerDown(e, table)}
              style={{ cursor: editable ? 'grab' : disabled ? 'not-allowed' : 'pointer' }}
              className="select-none"
            >
              {table.shape === 'circle' ? (
                <motion.circle
                  r={table.width / 2}
                  fill={fill}
                  fillOpacity={isSelected ? 1 : 0.85}
                  stroke={isSelected ? 'rgb(var(--color-primary))' : 'white'}
                  strokeWidth={isSelected ? 3 : 2}
                  whileHover={!disabled ? { scale: 1.08 } : {}}
                  animate={{ scale: isSelected ? 1.08 : 1 }}
                />
              ) : (
                <motion.rect
                  x={-table.width / 2}
                  y={-table.height / 2}
                  width={table.width}
                  height={table.height}
                  rx={8}
                  fill={fill}
                  fillOpacity={isSelected ? 1 : 0.85}
                  stroke={isSelected ? 'rgb(var(--color-primary))' : 'white'}
                  strokeWidth={isSelected ? 3 : 2}
                  whileHover={!disabled ? { scale: 1.05 } : {}}
                  animate={{ scale: isSelected ? 1.05 : 1 }}
                />
              )}
              <text textAnchor="middle" dy="4" fontSize="13" fontWeight="700" fill="white">
                {table.table_number}
              </text>
              <text textAnchor="middle" dy="-16" fontSize="10" fill="rgb(var(--color-text-muted))">
                {table.capacity} seats
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-[rgb(var(--color-border))] text-xs">
        {Object.entries(statusFill).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className={cn('capitalize text-[rgb(var(--color-text-muted))]')}>{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
