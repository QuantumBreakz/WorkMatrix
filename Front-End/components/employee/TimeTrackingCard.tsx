'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Square } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription } from '@/lib/supabase-realtime';

// Helper function since it's missing from utils
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TimeTrackingCard() {
  const { user } = useSupabaseAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTracking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking, startTime]);

  const loadTrackingStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .select('id, user_id, start_time, end_time, status, duration')
        .eq('user_id', user.id)
        .is('end_time', null)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load time tracking status',
          variant: 'destructive',
        });
        return;
      }

      if (timeEntry) {
        setIsTracking(true);
        setStartTime(new Date(timeEntry.start_time));
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - new Date(timeEntry.start_time).getTime()) / 1000);
        setElapsedTime(elapsed);
      } else {
        setIsTracking(false);
        setStartTime(null);
        setElapsedTime(0);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load time tracking status',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Subscribe to time entry changes
  useRealtimeSubscription('time_entries', user?.id, loadTrackingStatus);

  // Initial load
  useEffect(() => {
    loadTrackingStatus();
  }, [loadTrackingStatus]);

  const startTracking = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const { error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          start_time: now.toISOString(),
          status: 'active',
        });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to start time tracking',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Time tracking started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start time tracking',
        variant: 'destructive',
      });
    }
  };

  const stopTracking = async () => {
    if (!user?.id || !startTime) return;

    try {
      const now = new Date();
      const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          end_time: now.toISOString(),
          status: 'completed',
          duration: duration
        })
        .eq('user_id', user.id)
        .is('end_time', null)
        .eq('status', 'active');

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to stop time tracking',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Time tracking stopped',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop time tracking',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200">Time Tracking</CardTitle>
        <Clock className="h-4 w-4 text-blue-400" />
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timer Display with Glow Effect */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-white tracking-wider shadow-glow">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {isTracking ? 'Currently working' : 'Ready to start'}
            </div>
          </div>

          {/* Start/Stop Button with Gradient */}
          <div className="mt-4">
            {!isTracking ? (
              <Button
                onClick={startTracking}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Working
              </Button>
            ) : (
              <Button
                onClick={stopTracking}
                variant="destructive"
                className="w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Square className="mr-2 h-5 w-5" />
                Stop Working
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  );
} 