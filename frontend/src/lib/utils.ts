import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${m} ${period}`
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    available: 'bg-emerald-500',
    reserved_soon: 'bg-amber-500',
    occupied: 'bg-rose-500',
    disabled: 'bg-gray-400',
    pending: 'bg-amber-500',
    confirmed: 'bg-emerald-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-gray-400',
    rejected: 'bg-rose-500',
    approved: 'bg-emerald-500',
  }
  return map[status] ?? 'bg-gray-400'
}
