import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Tables = Database['public']['Tables'];
export type Profile = Tables['profiles']['Row'];
export type Organization = Tables['organizations']['Row'];
export type Team = Tables['teams']['Row'];
export type Project = Tables['projects']['Row'];
export type Task = Tables['tasks']['Row'];
export type TimeEntry = Tables['time_entries']['Row'];
export type ActivityLog = Tables['activity_logs']['Row'];
export type Screenshot = Tables['screenshots']['Row'];
export type LeaveType = Tables['leave_types']['Row'];
export type LeaveRequest = Tables['leave_requests']['Row']; 
