import { ReactNode } from 'react';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/dashboard/user-nav';
import { MainNav } from '@/components/dashboard/main-nav';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthWrapper requireAuth>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            <div className="flex items-center space-x-2 mr-4">
              <Image
                src="/logo.png"
                alt="WorkMatrix Logo"
                width={32}
                height={32}
                priority
                className="rounded-lg"
              />
              <span className="hidden md:inline-block font-bold">
                WorkMatrix
              </span>
            </div>
            <div className="hidden md:block">
              <MainNav className="mx-6" />
            </div>
            <div className="md:hidden">
              <MobileNav />
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t py-6 bg-background">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by WorkMatrix Team
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} WorkMatrix. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AuthWrapper>
  );
}
