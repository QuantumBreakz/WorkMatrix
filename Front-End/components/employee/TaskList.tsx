'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { Task } from "@/lib/supabase-client";

interface TaskListProps {
  limit?: number;
  showViewAll?: boolean;
}

export function TaskList({ limit, showViewAll = false }: TaskListProps) {
  const { user } = useSupabaseAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .order('due_date', { ascending: true });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

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
  }, [user, limit, toast]);

  function getStatusIcon(status: string) {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckSquare className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  function getDueDateColor(dueDate: string | null): string {
    if (!dueDate) return 'text-gray-500';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-400';
    if (diffDays <= 2) return 'text-orange-400';
    if (diffDays <= 7) return 'text-yellow-400';
    return 'text-gray-500';
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(limit || 3)].map((_, i) => (
          <div 
            key={i} 
            className="animate-pulse"
            style={{ 
              animationDelay: `${i * 150}ms`,
              opacity: 1 - (i * 0.15)
            }}
          >
            <div className="h-24 bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-start gap-4">
                <div className="w-5 h-5 rounded bg-gray-700/50" />
                <div className="flex-1">
                  <div className="h-4 w-2/3 bg-gray-700/50 rounded mb-3" />
                  <div className="h-3 w-full bg-gray-700/50 rounded mb-2" />
                  <div className="h-3 w-1/4 bg-gray-700/50 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-lg border border-dashed border-gray-700 bg-gray-800/20">
        <div className="animate-bounce mb-4 bg-gray-800/40 rounded-full p-3 inline-block">
          <CheckSquare className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-lg font-medium text-gray-300 mb-1">All caught up!</p>
        <p className="text-gray-500 text-sm">No tasks are currently assigned to you</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <Card 
          key={task.id} 
          className="group bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5"
          onClick={() => router.push(`/employee/tasks/${task.id}`)}
          style={{ 
            animationDelay: `${index * 100}ms`,
            animation: 'fadeIn 0.5s ease-out forwards',
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1 transform group-hover:scale-110 transition-transform duration-200">
                {getStatusIcon(task.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base font-medium text-gray-200 truncate group-hover:text-white">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transform group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-2 group-hover:text-gray-300">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center text-xs">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span className={getDueDateColor(task.due_date)}>
                    {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {showViewAll && tasks.length >= (limit || 3) && (
        <Button
          variant="ghost"
          className="w-full mt-4 text-gray-400 hover:text-white hover:bg-gray-800/40 group transition-all duration-300"
          onClick={() => router.push('/employee/tasks')}
        >
          View All Tasks
          <ChevronRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
        </Button>
      )}
    </div>
  );
} 