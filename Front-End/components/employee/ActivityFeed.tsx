'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Monitor, Keyboard, Mouse } from 'lucide-react';
import { format } from 'date-fns';
import type { ActivityLog } from '@/lib/supabase-client';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

function getActivityIcon(activityType: string) {
  switch (activityType) {
    case 'window':
      return <Monitor className="h-4 w-4 text-purple-400" />;
    case 'keyboard':
      return <Keyboard className="h-4 w-4 text-green-400" />;
    case 'mouse':
      return <Mouse className="h-4 w-4 text-blue-400" />;
    default:
      return <Activity className="h-4 w-4 text-gray-400" />;
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200">Recent Activity</CardTitle>
        <Activity className="h-4 w-4 text-blue-400" />
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="space-y-4 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pr-2">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 italic">No recent activity</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 transform hover:-translate-y-1 transition-transform duration-200"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">
                      {activity.app_name || 'Unknown Application'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.window_title || 'No window title'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gradient Overlay for Scroll */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
        </div>
      </CardContent>
    </div>
  );
} 