"use client"

import React, { useEffect, useState } from 'react';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

interface DailyHours {
  date: string;
  total_hours: number;
  user_id: string;
}

interface Screenshot {
  id: string;
  filename: string;
  timestamp: string;
  user_id: string;
  url: string;
}

interface UsageMetrics {
  api_calls: number;
  storage_mb: number;
}

interface StorageFile {
  name: string;
  metadata: {
    size: number;
  };
}

interface DashboardProps {
  user: User;
}

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const CACHE_KEY = 'workmatrix_dashboard_cache';

export default function Dashboard({ user }: DashboardProps) {
  const [dailyHours, setDailyHours] = useState<DailyHours[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics>({ api_calls: 0, storage_mb: 0 });
  const [showNotification, setShowNotification] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
    // Check usage metrics every 5 minutes
    const interval = setInterval(checkUsageMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user.id]);

  const fetchData = async () => {
    try {
      // Fetch daily hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('daily_hours')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (hoursError) throw hoursError;
      setDailyHours(hoursData || []);

      // Fetch recent screenshots
      const { data: screenshotsData, error: screenshotsError } = await supabase
        .from('screenshots')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (screenshotsError) throw screenshotsError;
      setScreenshots(screenshotsData || []);

      // Initial usage metrics check
      await checkUsageMetrics();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUsageMetrics = async () => {
    try {
      // Get API calls from api_calls.json
      const { data: apiData, error: apiError } = await supabase
        .storage
        .from('system')
        .download('api_calls.json');

      if (apiError) throw apiError;

      const apiCalls = JSON.parse(await apiData.text()) as Record<string, number>;
      const totalCalls = Object.values(apiCalls).reduce((sum: number, count: number) => sum + count, 0);

      // Get storage usage
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('screenshots')
        .list();

      if (storageError) throw storageError;

      const totalStorage = (storageData as StorageFile[]).reduce(
        (sum: number, file: StorageFile) => sum + file.metadata.size,
        0
      ) / (1024 * 1024);

      setUsageMetrics({
        api_calls: totalCalls,
        storage_mb: totalStorage
      });

      // Show notification if approaching limits
      setShowNotification(totalCalls > 40000 || totalStorage > 450);
    } catch (error) {
      console.error('Error checking usage metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">WorkMatrix Dashboard</h1>

        {/* Usage Notification Banner */}
        {showNotification && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Approaching Usage Limits</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>API Calls: {usageMetrics.api_calls.toLocaleString()} / 50,000</p>
                  <p>Storage: {usageMetrics.storage_mb.toFixed(1)}MB / 500MB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Hours Table */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Employee Hours</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyHours.map((hours) => (
                  <tr key={hours.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hours.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hours.total_hours.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Screenshots Grid */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Screenshots</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="relative aspect-video">
                <Image
                  src={screenshot.url}
                  alt={`Screenshot from ${screenshot.timestamp}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                  {new Date(screenshot.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
