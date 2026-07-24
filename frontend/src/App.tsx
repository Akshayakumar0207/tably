import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Spinner } from '@/components/ui/primitives'

const SearchPage = lazy(() => import('@/features/restaurants/pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const RestaurantDetailPage = lazy(() => import('@/features/restaurants/pages/RestaurantDetailPage').then((m) => ({ default: m.RestaurantDetailPage })))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const BookingHistoryPage = lazy(() => import('@/features/reservations/pages/BookingHistoryPage').then((m) => ({ default: m.BookingHistoryPage })))
const FavoritesPage = lazy(() => import('@/features/reservations/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const OwnerDashboardPage = lazy(() => import('@/features/owner/pages/OwnerDashboardPage').then((m) => ({ default: m.OwnerDashboardPage })))
const OwnerFloorMapEditorPage = lazy(() => import('@/features/owner/pages/OwnerFloorMapEditorPage').then((m) => ({ default: m.OwnerFloorMapEditorPage })))
const OwnerReservationsPage = lazy(() => import('@/features/owner/pages/OwnerReservationsPage').then((m) => ({ default: m.OwnerReservationsPage })))
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminRestaurantsPage = lazy(() => import('@/features/admin/pages/AdminRestaurantsPage').then((m) => ({ default: m.AdminRestaurantsPage })))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const NotFoundPage = lazy(() => import('@/features/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function PageFallback() {
  return <div className="flex items-center justify-center py-32"><Spinner className="h-8 w-8 text-[rgb(var(--color-primary))]" /></div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<SearchPage />} />
            <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/reservations" element={<ProtectedRoute roles={['customer']}><BookingHistoryPage /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute roles={['customer']}><FavoritesPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="/owner" element={<ProtectedRoute roles={['owner']}><OwnerDashboardPage /></ProtectedRoute>} />
            <Route path="/owner/restaurants/:restaurantId/tables" element={<ProtectedRoute roles={['owner']}><OwnerFloorMapEditorPage /></ProtectedRoute>} />
            <Route path="/owner/restaurants/:restaurantId/reservations" element={<ProtectedRoute roles={['owner']}><OwnerReservationsPage /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin']}><AdminRestaurantsPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
