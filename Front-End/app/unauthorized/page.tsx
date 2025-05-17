import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Unauthorized Access</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator
            if you believe this is a mistake.
          </p>
          <div className="mt-8 space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Go to Homepage
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
