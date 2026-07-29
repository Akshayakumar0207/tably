import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { User as UserIcon, Camera, Loader2 } from 'lucide-react'
import { api, apiErrorMessage } from '@/lib/api'
import { compressImage } from '@/lib/imageCompression'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/primitives'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { User } from '@/types'

interface FormData {
  full_name: string
  phone: string
}

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { push } = useToastStore()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: { full_name: user?.full_name ?? '', phone: user?.phone ?? '' },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => (await api.put<User>('/api/users/me', data)).data,
    onSuccess: (data) => { setUser(data); push('Profile updated', 'success'); qc.invalidateQueries() },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  })

  const pictureMutation = useMutation({
    mutationFn: async (url: string) => (await api.put<User>('/api/users/me/picture', { url })).data,
    onSuccess: (data) => { setUser(data); push('Profile picture updated', 'success') },
    onError: (e) => push(apiErrorMessage(e), 'error'),
    onSettled: () => setUploading(false),
  })

  const handlePictureSelect = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    const dataUrl = await compressImage(file, 400, 0.8)
    pictureMutation.mutate(dataUrl)
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-16 w-16 rounded-full bg-[rgb(var(--color-surface-alt))] flex items-center justify-center overflow-hidden group transition-transform duration-200 hover:scale-105"
            >
              {user.profile_picture_url ? (
                <img src={user.profile_picture_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-7 w-7 text-[rgb(var(--color-text-muted))]" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePictureSelect(e.target.files?.[0])} />
            <div>
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-sm text-[rgb(var(--color-text-muted))] capitalize">{user.role} account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <Input label="Full name" {...register('full_name')} />
            <Input label="Email" value={user.email} disabled className="opacity-60" />
            <Input label="Phone" {...register('phone')} />
            <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
