import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

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
