export type User = {
  id: string
  auth_id: string | null
  email: string
  full_name: string | null
  role: "admin" | "employee"
  is_active: boolean
  created_at: string
  last_login: string | null
}

export type Employee = {
  id: string
  user_id: string
  position: string | null
  department: string | null
  hire_date: string
  is_active: boolean
  location: string | null
  phone: string | null
  profile_image: string | null
  created_at: string
  updated_at: string
}

export type TimeEntry = {
  id: string
  user_id: string
  task_id?: string
  start_time: string
  end_time: string | null
  duration: number | null
  status: string
  created_at: string
}

export type ActivityLog = {
  id: string
  user_id: string
  time_entry_id?: string
  app_name: string
  window_title?: string
  activity_type: string
  keystroke_count: number
  mouse_events: number
  idle_time: number
  created_at: string
}

export type Screenshot = {
  id: string
  user_id: string
  filename: string
  file_path: string
  content_type: string
  file_size: number
  capture_time: string
  notes: string | null
  created_at: string
}

export type Keystroke = {
  id: string
  user_id: string
  application_name: string | null
  window_title: string | null
  count: number
  timestamp: string
  created_at: string
}

export type Ticket = {
  id: string
  user_id: string
  title: string
  description: string
  category: string | null
  priority: string
  status: string
  resolution: string | null
  created_at: string
  last_updated: string
  closed_at: string | null
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'employee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
      }
      daily_hours: {
        Row: {
          id: string
          user_id: string
          date: string
          hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          hours: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      screenshots: {
        Row: {
          id: string
          user_id: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          created_at?: string
        }
      }
      usage_metrics: {
        Row: {
          id: string
          user_id: string
          date: string
          active_time: number
          idle_time: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          active_time: number
          idle_time: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          active_time?: number
          idle_time?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
