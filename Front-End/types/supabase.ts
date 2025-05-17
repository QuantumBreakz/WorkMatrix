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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'employee'
          department: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'admin' | 'employee'
          department?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'employee'
          department?: string | null
          phone?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          settings?: Json
          created_at?: string
        }
        Update: {
          name?: string
          settings?: Json
        }
      }
      teams: {
        Row: {
          id: string
          org_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          created_at?: string
        }
        Update: {
          org_id?: string
          name?: string
        }
      }
      projects: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          org_id?: string
          name?: string
          description?: string
          status?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          assigned_to: string | null
          title: string
          description: string | null
          status: string
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          assigned_to?: string
          title: string
          description?: string
          status?: string
          due_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string
          assigned_to?: string
          title?: string
          description?: string
          status?: string
          due_date?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          start_time: string
          end_time: string | null
          duration: number | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string
          start_time: string
          end_time?: string
          duration?: number
          status?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          task_id?: string
          start_time?: string
          end_time?: string
          duration?: number
          status?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          app_name: string
          window_title: string | null
          activity_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          app_name: string
          window_title?: string | null
          activity_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          app_name?: string
          window_title?: string | null
          activity_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      app_usage: {
        Row: {
          id: string
          user_id: string
          total_active_time: number
          total_idle_time: number
          last_active: string
          mouse_movements: number
          keyboard_events: number
          scroll_events: number
          network_requests: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_active_time?: number
          total_idle_time?: number
          last_active?: string
          mouse_movements?: number
          keyboard_events?: number
          scroll_events?: number
          network_requests?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_active_time?: number
          total_idle_time?: number
          last_active?: string
          mouse_movements?: number
          keyboard_events?: number
          scroll_events?: number
          network_requests?: number
          created_at?: string
          updated_at?: string
        }
      }
      screenshots: {
        Row: {
          id: string
          user_id: string
          data: string
          captured_at: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: string
          captured_at: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: string
          captured_at?: string
          uploaded_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          data: string
          duration: number | null
          captured_at: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: string
          duration?: number | null
          captured_at: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: string
          duration?: number | null
          captured_at?: string
          uploaded_at?: string
        }
      }
      leave_types: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string
          created_at?: string
        }
        Update: {
          org_id?: string
          name?: string
          description?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          user_id: string
          leave_type_id: string
          start_date: string
          end_date: string
          status: string
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          leave_type_id: string
          start_date: string
          end_date: string
          status?: string
          reason?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          leave_type_id?: string
          start_date?: string
          end_date?: string
          status?: string
          reason?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
