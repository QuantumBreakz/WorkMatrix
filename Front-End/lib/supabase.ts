import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = "https://labchhgbhorszoscsqbw.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYmNoaGdiaG9yc3pvc2NzcWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNzI4ODMsImV4cCI6MjA2MjY0ODg4M30.qu1wkzZNbPMBwNrKU3B0DssUeG7WXCF_sxZRpCYp4cU"

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': 'workmatrix',
      },
    },
  }
)

// Types for Supabase
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) return error.message
    if ('error_description' in error) return error.error_description
  }
  return 'An unexpected error occurred'
}

// Session management helpers
export async function getActiveSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return session
}

// Type-safe database query helpers
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: Partial<Tables<'profiles'>>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
