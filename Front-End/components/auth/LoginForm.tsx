'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, check if email is verified
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!user?.email_confirmed_at) {
        // Sign out the user since we don't want unverified users to be logged in
        await supabase.auth.signOut();
        
        // Send another verification email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`,
          },
        });

        if (resendError) throw resendError;

        toast({
          title: 'Email Verification Required',
          description: 'Please check your email for the verification link. A new link has been sent.',
          variant: 'default',
        });
        
        // Redirect to verification page with email parameter
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
        return;
      }

      // Get user profile and role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, department')
        .match({ id: user.id })
        .single();

      if (profileError) throw profileError;

      const profile = profileData as Profile;

      // Redirect based on role
      if (profile.role === 'employee') {
        router.push('/employee/dashboard');
      } else if (profile.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        throw new Error('Invalid user role');
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email and password to continue</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <div className="text-sm text-center space-y-2">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline block"
            >
              Forgot password?
            </Link>
            <div className="text-gray-500">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
} 