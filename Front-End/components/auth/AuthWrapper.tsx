'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('admin' | 'employee')[];
}

export default function AuthWrapper({ children, requireAuth = true, allowedRoles = [] }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push('/login');
      } else if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect based on role if user doesn't have permission
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/employee/dashboard');
        }
      }
    }
  }, [user, loading, requireAuth, allowedRoles, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
} 
