import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient<Database>(
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

  // Create a system status channel
  const systemChannel = supabaseInstance.channel('system_status');

  // Subscribe to system events
  systemChannel
    .on('system', { event: 'error' }, ({ payload }) => {
      console.error('Supabase realtime error:', payload);
    })
    .on('presence', { event: 'sync' }, () => {
      console.log('Supabase realtime state: connected');
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to Supabase realtime');
      }
    });

  return supabaseInstance;
})();

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
