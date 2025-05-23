import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

/**
 * Custom hook (useRealtimeSubscription) to subscribe to Supabase realtime changes.
 * It subscribes to a given table (and optionally filters by a user id) and calls a callback (fetchData) on changes.
 *
 * @param tableName – The name of the table (e.g. 'time_entries').
 * @param userId – (Optional) A user id (or null) to filter changes (e.g. "eq('user_id', userId)").
 * @param fetchData – A callback (fetchData) (e.g. a function that re-fetches data) to be called on realtime changes.
 */
export function useRealtimeSubscription(tableName: string, userId: string | null, fetchData: () => void) {
  const subscriptionCallback = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const subscribe = async () => {
      let query = supabase.channel('realtime-' + tableName).on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
         console.log("Received realtime change (table: " + tableName + "):", payload);
         subscriptionCallback();
      });
      if (userId) {
         query = query.eq('user_id', userId);
      }
      subscription = (await query.subscribe());
    };

    subscribe();

    return () => {
       if (subscription) {
          subscription.unsubscribe();
       }
    };
  }, [tableName, userId, subscriptionCallback]);
} 