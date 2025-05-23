import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create a singleton instance
const supabaseInstance = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth',
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-application-name': 'workmatrix',
      },
    },
  }
);

// Set up error handling for auth state changes
supabaseInstance.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Auth token refreshed');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    // Clear any local storage or state if needed
    localStorage.removeItem('sb-auth');
  }
});

// Create a system status channel for monitoring
const systemChannel = supabaseInstance.channel('system_status');

// Subscribe to system events
systemChannel
  .on('system', { event: 'error' }, ({ payload }) => {
    console.error('Supabase realtime error:', payload);
  })
  .on('presence', { event: 'sync' }, () => {
    console.log('Supabase realtime state: connected');
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('New presence:', key, newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('Left presence:', key, leftPresences);
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to Supabase realtime');
    } else if (status === 'CLOSED') {
      console.log('Disconnected from Supabase realtime');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        systemChannel.subscribe();
      }, 5000);
    }
  });

// Export the singleton instance
export const supabase: SupabaseClient<Database> = supabaseInstance;

// Helper function to check if the session is valid
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}

// Helper function to refresh the session
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    throw error;
  }
}

// Helper function to get the current user's role
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

// Helper function to check connection
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
}

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  if (error?.error_description) {
    return error.error_description;
  }
  return 'An unexpected error occurred';
}

export type { Database } from '@/types/supabase';
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type Screenshot = Database['public']['Tables']['screenshots']['Row'];
export type LeaveType = Database['public']['Tables']['leave_types']['Row'];
export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']; 
