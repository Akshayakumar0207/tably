import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UtensilsCrossed } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, apiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useState } from 'react'
import type { User } from '@/types'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'owner']),
})
type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer' },
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const { push } = useToastStore()
  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: tokens } = await api.post('/api/auth/register', data)
      useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
      const { data: me } = await api.get<User>('/api/auth/me')
      setUser(me)
      push('Account created successfully!', 'success')
      navigate(me.role === 'owner' ? '/owner' : '/', { replace: true })
    } catch (err) {
      push(apiErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <UtensilsCrossed className="h-9 w-9 mx-auto text-[rgb(var(--color-primary))]" />
          <h1 className="font-display text-2xl font-bold mt-3">Create your account</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">Book tables or list your restaurant</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setValue('role', 'customer')}
              className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${role === 'customer' ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]' : 'border-[rgb(var(--color-border))]'}`}>
              I'm a Customer
            </button>
            <button type="button" onClick={() => setValue('role', 'owner')}
              className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${role === 'owner' ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]' : 'border-[rgb(var(--color-border))]'}`}>
              I'm a Restaurant Owner
            </button>
          </div>

          <Input label="Full name" placeholder="Asha Kumar" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Phone (optional)" type="tel" placeholder="9876543210" error={errors.phone?.message} {...register('phone')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
        </form>

        <p className="text-center text-sm text-[rgb(var(--color-text-muted))] mt-6">
          Already have an account? <Link to="/login" className="text-[rgb(var(--color-primary))] font-medium hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  )
}
