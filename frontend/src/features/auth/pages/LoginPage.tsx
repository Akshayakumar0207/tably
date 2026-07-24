import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokens, setUser } = useAuthStore()
  const { push } = useToastStore()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: tokens } = await api.post('/api/auth/login', data)
      setTokens(tokens.access_token, tokens.refresh_token)
      const { data: me } = await api.get<User>('/api/auth/me')
      setUser(me)
      push('Welcome back!', 'success')
      const dest = me.role === 'admin' ? '/admin' : me.role === 'owner' ? '/owner' : (location.state?.from ?? '/')
      navigate(dest, { replace: true })
    } catch (err) {
      push(apiErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <UtensilsCrossed className="h-9 w-9 mx-auto text-[rgb(var(--color-primary))]" />
          <h1 className="font-display text-2xl font-bold mt-3">Welcome back</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">Log in to book your next table</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-xs text-[rgb(var(--color-primary))] hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" className="w-full" loading={loading}>Log In</Button>
        </form>

        <p className="text-center text-sm text-[rgb(var(--color-text-muted))] mt-6">
          Don't have an account? <Link to="/register" className="text-[rgb(var(--color-primary))] font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  )
}
