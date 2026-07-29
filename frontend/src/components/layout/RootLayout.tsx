import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { ToastContainer } from '@/components/layout/ToastContainer'

export function RootLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-[rgb(var(--color-border))] py-6 mt-10">
        <p className="text-center text-xs text-[rgb(var(--color-text-muted))]">
          © {new Date().getFullYear()} TableReserve. Built for effortless restaurant reservations.
        </p>
      </footer>
      <ToastContainer />
    </div>
  )
}
