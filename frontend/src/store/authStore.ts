import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

const STORAGE_KEY = 'tablereserve_auth'

function loadPersisted(): { accessToken: string | null; refreshToken: string | null; user: User | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { accessToken: null, refreshToken: null, user: null }
    return JSON.parse(raw)
  } catch {
    return { accessToken: null, refreshToken: null, user: null }
  }
}

function persist(state: { accessToken: string | null; refreshToken: string | null; user: User | null }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const initial = loadPersisted()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial.user,
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  setTokens: (access, refresh) => {
    set({ accessToken: access, refreshToken: refresh })
    persist({ accessToken: access, refreshToken: refresh, user: get().user })
  },
  setUser: (user) => {
    set({ user })
    persist({ accessToken: get().accessToken, refreshToken: get().refreshToken, user })
  },
  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null })
    localStorage.removeItem(STORAGE_KEY)
  },
  isAuthenticated: () => !!get().accessToken,
}))
