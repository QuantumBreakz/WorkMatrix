import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase: SupabaseClient<Database> = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password',
  },
  // User
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/update-profile',
  },
  // Dashboard
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    DAILY_HOURS: '/dashboard/daily-hours',
    SCREENSHOTS: '/dashboard/screenshots',
    USAGE_METRICS: '/dashboard/usage-metrics',
  },
  // Admin
  ADMIN: {
    USERS: '/admin/users',
    APPROVAL_REQUESTS: '/admin/approval-requests',
    PENDING_APPROVALS: '/admin/pending-approvals',
  },
} as const;

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// API error handler
export const handleApiError = <T>(error: unknown): ApiResponse<T> => {
  console.error('API Error:', error);
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  const status = error instanceof Response ? error.status : 500;
  
  return {
    error: errorMessage,
    status,
  } as ApiResponse<T>;
};

// API request handler
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return handleApiError<T>(error);
  }
}; 