'use client';

import { ReactNode } from 'react';
import AuthWrapper from '@/components/auth/AuthWrapper';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthWrapper requiredRole="admin">
      {children}
    </AuthWrapper>
  );
} 