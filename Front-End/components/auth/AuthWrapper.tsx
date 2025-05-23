'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import LoadingScreen from './LoadingScreen';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Profile['role'];

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

export default function AuthWrapper({ children, requiredRole, requireAuth = false }: AuthWrapperProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user && requireAuth) {
        // Store the current path for redirect after login
        const currentPath = window.location.pathname;
        router.push(`/login?redirectedFrom=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (user && userRole) {
        // Handle role-specific routing
        const isInAdminRoute = pathname.startsWith('/admin');
        const isInEmployeeRoute = pathname.startsWith('/employee');

        if (userRole === 'admin' && !isInAdminRoute) {
          router.push('/admin/dashboard');
          return;
        }

        if (userRole === 'employee' && !isInEmployeeRoute) {
          router.push('/employee/dashboard');
          return;
        }

        // Check if user has required role for this route
        if (requiredRole && userRole !== requiredRole) {
          const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
          router.push(dashboardPath);
          return;
        }
      }
    }
  }, [user, userRole, isLoading, router, pathname, requireAuth, requiredRole]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
} 
