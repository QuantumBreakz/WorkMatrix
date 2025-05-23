'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import LoadingScreen from './LoadingScreen';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Profile['role'];

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export default function AuthWrapper({ 
  children, 
  requiredRole,
  redirectTo = '/login'
}: AuthWrapperProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      // If no user is logged in, redirect to login
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // If a role is required and the user doesn't have it, redirect to appropriate dashboard
      if (requiredRole && userRole !== requiredRole) {
        const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
        router.push(dashboardPath);
        return;
      }

      // If user is logged in but on login page, redirect to appropriate dashboard
      if (pathname === '/login' || pathname === '/') {
        const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
        router.push(dashboardPath);
      }
    }
  }, [user, userRole, isLoading, requiredRole, redirectTo, router, pathname]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If no user is logged in, don't render children
  if (!user) {
    return null;
  }

  // If role is required and user doesn't have it, don't render children
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
} 
