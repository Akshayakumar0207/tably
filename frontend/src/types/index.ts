export type UserRole = 'customer' | 'owner' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  profile_picture_url?: string | null
  is_verified: boolean
  created_at: string
}

export type RestaurantStatus = 'pending' | 'approved' | 'rejected'

export interface Restaurant {
  id: string
  owner_id: string
  name: string
  description?: string | null
  cuisine: string
  address: string
  city: string
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  opening_time: string
  closing_time: string
  status: RestaurantStatus
  cover_image_url?: string | null
  avg_rating: number
  review_count: number
  created_at: string
}

export type TableShape = 'circle' | 'rectangle'
export type TableStatus = 'available' | 'reserved_soon' | 'occupied' | 'disabled'

export interface RestaurantTable {
  id: string
  restaurant_id: string
  table_number: string
  shape: TableShape
  capacity: number
  pos_x: number
  pos_y: number
  width: number
  height: number
  is_window: boolean
  is_ac: boolean
  status: TableStatus
}

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'

export interface Reservation {
  id: string
  user_id: string
  restaurant_id: string
  table_id: string
  reservation_date: string
  reservation_time: string
  guest_count: number
  status: ReservationStatus
  special_request?: string | null
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  restaurant_id: string
  rating: number
  comment?: string | null
  created_at: string
}

export type NotificationType = 'booking_confirmation' | 'reminder' | 'promotional' | 'owner_alert' | 'system'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export interface OwnerProfile {
  id: string
  business_name: string
  business_phone?: string | null
  is_verified: boolean
}

export interface DashboardOverview {
  restaurant_name: string
  total_reservations: number
  confirmed: number
  completed: number
  pending: number
  cancelled: number
  today_reservation_count: number
  avg_rating: number
  review_count: number
  reservations_last_7_days: { date: string; reservations: number }[]
}

export interface SystemAnalytics {
  total_users: number
  total_customers: number
  total_owners: number
  total_restaurants: number
  approved_restaurants: number
  pending_restaurants: number
  total_reservations: number
  completed_reservations: number
  cancelled_reservations: number
}
