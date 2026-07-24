import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { ToastContainer } from '@/components/layout/ToastContainer'

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[rgb(var(--color-border))] py-6 mt-10">
        <p className="text-center text-xs text-[rgb(var(--color-text-muted))]">
          © {new Date().getFullYear()} Tably. Built for effortless restaurant reservations.
        </p>
      </footer>
      <ToastContainer />
    </div>
  )
}
