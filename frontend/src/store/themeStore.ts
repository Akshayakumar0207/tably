import { create } from 'zustand'

interface ThemeState {
  theme: 'light' | 'dark'
  toggle: () => void
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  localStorage.setItem('tablereserve_theme', theme)
}

const stored = (localStorage.getItem('tablereserve_theme') as 'light' | 'dark' | null)
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const initial: 'light' | 'dark' = stored ?? (prefersDark ? 'dark' : 'light')
applyTheme(initial)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initial,
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    set({ theme: next })
  },
}))
