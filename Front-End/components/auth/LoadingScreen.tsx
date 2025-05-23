'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 p-8 rounded-lg bg-gray-800/90 shadow-xl border border-gray-700/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-gray-300 text-sm font-medium">Loading...</p>
        <p className="text-gray-400 text-xs">Please wait while we verify your session</p>
      </div>
    </div>
  );
} 
