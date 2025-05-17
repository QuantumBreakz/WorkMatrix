'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

export function TaskList() {
  const { user } = useSupabaseAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, description, status, due_date')
          .eq('assignee_id', user.id)
          .order('due_date', { ascending: true })
          .limit(5);

        if (error) throw error;

        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tasks',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user, toast]);

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-blue-400';
      case 'overdue':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  function getStatusIcon(status: string) {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  }

  return (
    <div className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-200">Recent Tasks</CardTitle>
        <CheckSquare className="h-4 w-4 text-blue-400" />
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="space-y-4 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pr-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 italic">No tasks assigned</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 transform hover:-translate-y-1 transition-transform duration-200"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate group-hover:text-clip group-hover:whitespace-normal">
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">
                        Due {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
                      </span>
                    </div>
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