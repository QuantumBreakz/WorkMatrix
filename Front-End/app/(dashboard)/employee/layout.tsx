'use client';

import { ReactNode } from 'react';
import AuthWrapper from '@/components/auth/AuthWrapper';

export default function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthWrapper requiredRole="employee">
      {children}
    </AuthWrapper>
  );
} 