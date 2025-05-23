import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://labchhgbhorszoscsqbw.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYmNoaGdiaG9yc3pvc2NzcWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNzI4ODMsImV4cCI6MjA2MjY0ODg4M30.qu1wkzZNbPMBwNrKU3B0DssUeG7WXCF_sxZRpCYp4cU"

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
      // Set email confirmation link expiry to 7 days (in seconds)
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/verify`,
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

// Email verification helpers
export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/verify`,
    },
  })
  return { error }
}

export async function verifyEmail(token: string, email: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email',
    email,
  })
  return { data, error }
}

// User role management
export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role || null
}

// Add email template configuration
export const emailTemplateConfig = {
  CONFIRMATION_TEMPLATE: {
    subject: 'Welcome to WorkMatrix - Please Confirm Your Email',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">Welcome to WorkMatrix</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin-bottom: 15px;">Thank you for signing up with WorkMatrix! We're excited to have you on board.</p>
          
          <p style="margin-bottom: 15px;">To get started, please confirm your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Confirm Email Address
            </a>
          </div>
          
          <p style="margin-bottom: 15px;">This link will expire in 7 days. If you don't confirm your email within this time, you'll need to request a new confirmation link.</p>
          
          <p style="color: #64748b; font-size: 14px;">If you didn't create an account with WorkMatrix, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 30px;">
          <p>© ${new Date().getFullYear()} WorkMatrix. All rights reserved.</p>
        </div>
      </div>
    `,
  },
};
