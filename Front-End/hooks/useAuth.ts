import { User as SupabaseUser } from '@supabase/supabase-js';

// This file now only exports types used by the auth context
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'employee';
  avatar_url: string | null;
  department: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// The actual implementation is now in contexts/AuthContext.tsx
export { useAuth } from "@/contexts/AuthContext"; 