import { ReactNode } from 'react';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthWrapper requireAuth>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        {/* Main Content */}
        <main className="flex-1 container py-6">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}
