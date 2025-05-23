import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { Database } from './database';

declare global {
  interface Window {
    supabase: SupabaseClient<Database>;
  }
}

export type { Database, Session, User }; 