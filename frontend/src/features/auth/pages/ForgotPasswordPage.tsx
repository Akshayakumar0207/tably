import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, apiErrorMessage } from '@/lib/api'
import { useToastStore } from '@/store/toastStore'
import { useState } from 'react'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { push } = useToastStore()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', data)
      setSent(true)
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
          <KeyRound className="h-9 w-9 mx-auto text-[rgb(var(--color-primary))]" />
          <h1 className="font-display text-2xl font-bold mt-3">Reset your password</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-sm">
          {sent ? (
            <p className="text-sm text-center text-[rgb(var(--color-text-muted))]">
              If that email is registered, a reset link has been sent. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[rgb(var(--color-text-muted))] mt-6">
          <Link to="/login" className="text-[rgb(var(--color-primary))] font-medium hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  )
}
