import AuthWrapper from '@/components/auth/AuthWrapper';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper requireUnauth>
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left side - Auth form */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="WorkMatrix Logo"
                  width={32}
                  height={32}
                  priority
                />
                <span className="text-2xl font-bold">WorkMatrix</span>
              </div>
              <ThemeToggle />
            </div>
            {children}
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block relative bg-muted">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted-foreground/20" />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-2xl space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to WorkMatrix
              </h1>
              <p className="text-lg text-muted-foreground">
                Track productivity, monitor work hours, and manage your team efficiently
                with our comprehensive employee monitoring solution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
} 
