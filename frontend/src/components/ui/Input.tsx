import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium mb-1.5 text-[rgb(var(--color-text))]">{label}</label>}
    <input
      ref={ref}
      id={id}
      className={cn(
        'w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3.5 py-2.5 text-sm outline-none transition-colors',
        'focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20',
        error && 'border-[rgb(var(--color-danger))]',
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-[rgb(var(--color-danger))]">{error}</p>}
  </div>
))
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, error, id, ...props }, ref) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>}
    <textarea
      ref={ref}
      id={id}
      className={cn(
        'w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3.5 py-2.5 text-sm outline-none transition-colors',
        'focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20',
        error && 'border-[rgb(var(--color-danger))]',
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-[rgb(var(--color-danger))]">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, id, children, ...props }, ref) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>}
    <select
      ref={ref}
      id={id}
      className={cn(
        'w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3.5 py-2.5 text-sm outline-none transition-colors',
        'focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20',
        error && 'border-[rgb(var(--color-danger))]',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-[rgb(var(--color-danger))]">{error}</p>}
  </div>
))
Select.displayName = 'Select'
