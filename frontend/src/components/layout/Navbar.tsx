import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { UtensilsCrossed, Moon, Sun, Bell, User as UserIcon, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AppNotification } from '@/types'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<AppNotification[]>('/api/notifications')).data,
    enabled: !!user,
    refetchInterval: 15000,
  })
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'owner' ? '/owner' : null

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <UtensilsCrossed className="h-6 w-6 text-[rgb(var(--color-primary))]" />
          Tably
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-[rgb(var(--color-primary))]">Search</Link>
          {user && <Link to="/reservations" className="hover:text-[rgb(var(--color-primary))]">My Bookings</Link>}
          {user && <Link to="/favorites" className="hover:text-[rgb(var(--color-primary))]">Favorites</Link>}
          {dashboardLink && <Link to={dashboardLink} className="hover:text-[rgb(var(--color-primary))]">Dashboard</Link>}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-[rgb(var(--color-surface-alt))]" aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {user && (
            <div className="relative">
              <button onClick={() => setNotifOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-[rgb(var(--color-surface-alt))]" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[rgb(var(--color-primary))] text-white text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-xl">
                  <div className="p-3 border-b border-[rgb(var(--color-border))] font-semibold text-sm">Notifications</div>
                  {!notifications?.length && <p className="p-4 text-sm text-[rgb(var(--color-text-muted))]">No notifications yet.</p>}
                  {notifications?.map((n) => (
                    <div key={n.id} className={`p-3 border-b border-[rgb(var(--color-border))] last:border-0 ${!n.is_read ? 'bg-[rgb(var(--color-primary))]/5' : ''}`}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/profile" className="p-2 rounded-lg hover:bg-[rgb(var(--color-surface-alt))]"><UserIcon className="h-4 w-4" /></Link>
              <Button size="sm" variant="outline" onClick={() => { logout(); navigate('/') }}>Logout</Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>Login</Button>
              <Button size="sm" onClick={() => navigate('/register')}>Sign up</Button>
            </div>
          )}

          <button className="md:hidden p-2" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden flex flex-col gap-1 px-4 pb-4 text-sm font-medium">
          <Link to="/" onClick={() => setMobileOpen(false)} className="py-2">Search</Link>
          {user && <Link to="/reservations" onClick={() => setMobileOpen(false)} className="py-2">My Bookings</Link>}
          {user && <Link to="/favorites" onClick={() => setMobileOpen(false)} className="py-2">Favorites</Link>}
          {dashboardLink && <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="py-2">Dashboard</Link>}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="py-2">Profile</Link>
              <button onClick={() => { logout(); navigate('/'); setMobileOpen(false) }} className="py-2 text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="py-2">Sign up</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
