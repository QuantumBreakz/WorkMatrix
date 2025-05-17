import { User as SupabaseUser, Session } from '@supabase/supabase-js'

export interface UserMetadata {
  full_name?: string
  avatar_url?: string
  email?: string
  role?: 'admin' | 'employee'
  department?: string
  phone?: string
}

export interface User extends SupabaseUser {
  user_metadata: UserMetadata
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: Error | null
  session: Session | null
}

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'employee'
  department: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
} 