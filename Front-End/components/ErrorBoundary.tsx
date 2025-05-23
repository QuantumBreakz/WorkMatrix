'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleNavigateHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message.toLowerCase().includes('auth') ||
                         this.state.error?.message.toLowerCase().includes('unauthorized') ||
                         this.state.error?.message.toLowerCase().includes('unauthenticated');

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-8 p-6 bg-card rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isAuthError ? 'Authentication Error' : 'Something went wrong'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isAuthError
                  ? 'There was a problem with your authentication. Please try signing in again.'
                  : 'An unexpected error occurred. Our team has been notified.'}
              </p>
              <div className="space-y-4">
                {isAuthError ? (
                  <Button
                    onClick={() => window.location.href = '/login'}
                    className="w-full"
                    variant="default"
                  >
                    Go to Login
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={this.handleReload}
                      className="w-full"
                      variant="default"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={this.handleNavigateHome}
                      className="w-full"
                      variant="outline"
                    >
                      Go to Homepage
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
