'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase, emailTemplateConfig } from '@/lib/supabase';
import { Loader2, Mail, CheckCircle2, XCircle } from 'lucide-react';

export default function EmailVerification() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const email = searchParams.get('email');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setIsVerifying(false);
        setVerificationStatus('error');
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
          email,
        });

        if (error) throw error;

        setVerificationStatus('success');
        toast({
          title: 'Email verified successfully',
          description: 'You can now sign in to your account.',
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        toast({
          title: 'Verification failed',
          description: error.message || 'Please try again or request a new verification link.',
          variant: 'destructive',
        });
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, email, router, toast]);

  const handleResendVerification = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the new verification link.',
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: 'Failed to resend verification email',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    if (isVerifying) {
      return (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying Email
            </CardTitle>
            <CardDescription>Please wait while we verify your email address...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Email Verified
            </CardTitle>
            <CardDescription>Your email has been successfully verified!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              You will be redirected to the login page shortly...
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Verification Failed
          </CardTitle>
          <CardDescription>
            {email
              ? 'Your verification link has expired or is invalid.'
              : 'No verification link found.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {email && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Would you like us to send a new verification link to {email}?
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                <span>Check your spam folder if you don't see the email.</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {email && (
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      {renderContent()}
    </div>
  );
} 
