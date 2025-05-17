"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"

export default function NotFound() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    setIsLoading(true);
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={handleGoBack}
            disabled={isLoading}
          >
            {isLoading ? "Going back..." : "Go Back"}
          </Button>
          <Link href={user ? "/dashboard" : "/"}>
            <Button>
              Go to {user ? "Dashboard" : "Home"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
