"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      // Assuming role is available in user object from AuthProvider
      // and profiles table has a 'role' column.
      // @ts-ignore
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      // @ts-ignore
      } else if (user.role === 'employee') {
        router.push('/employee/dashboard');
      } else {
        router.push('/login'); // Fallback if role is not defined
      }
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div className="text-center space-y-6 p-8 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Welcome to WorkMatrix
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed">
          Streamline your team's productivity with our comprehensive time tracking,
          activity monitoring, and employee management platform. Gain insights,
          manage projects, and foster a more efficient work environment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {!user ? (
            <>
              <Button asChild size="lg" className="bg-sky-500 hover:bg-sky-600 text-white">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white">
                <Link href="/register">Register</Link>
              </Button>
            </>
          ) : (
            <Button onClick={handleGetStarted} size="lg" className="bg-sky-500 hover:bg-sky-600 text-white">
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
      <footer className="absolute bottom-8 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} WorkMatrix. All rights reserved.</p>
      </footer>
    </div>
  );
}
