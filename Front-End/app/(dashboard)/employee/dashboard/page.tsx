"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import { Clock, CheckSquare, BarChart2, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWebSocket } from '@/lib/services/websocket-service'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { TimeTrackingCard } from '@/components/employee/TimeTrackingCard'
import { TaskList } from '@/components/employee/TaskList'
import { WorkSummaryGrid } from '@/components/employee/WorkSummaryGrid'
import { useRealtimeSubscription } from '@/lib/supabase-realtime'
import type { Database } from '@/types/supabase'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']

export default function EmployeeDashboard() {
  const { user } = useSupabaseAuth()
  const { toast } = useToast()
  const router = useRouter()
  const ws = useWebSocket()
  const [timeData, setTimeData] = useState({
    today: 0,
    week: 0,
    month: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Memoize the fetchTimeData function to prevent unnecessary recreations
  const fetchTimeData = useCallback(async () => {
    if (!user) return
    try {
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id) as { data: TimeEntry[] | null, error: any }

      if (timeError) throw timeError

      // Calculate time totals
      const today = new Date()
      const todayISO = today.toISOString().split("T")[0]
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
      const weekStartISO = weekStart.toISOString().split("T")[0]
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthStartISO = monthStart.toISOString().split("T")[0]

      const calculatedTimeData = {
        today: timeEntries?.filter(t => t.start_time.startsWith(todayISO))
          .reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0,
        week: timeEntries?.filter(t => t.start_time >= weekStartISO)
          .reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0,
        month: timeEntries?.filter(t => t.start_time >= monthStartISO)
          .reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0,
      }

      setTimeData(calculatedTimeData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load time data. Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Set up realtime subscription using the new manager
  useRealtimeSubscription('time_entries', user?.id, fetchTimeData)

  // Initial data fetch
  useEffect(() => {
    fetchTimeData()
  }, [fetchTimeData])

  // Set up WebSocket monitoring
  useEffect(() => {
    if (!user?.id || !ws) return

    let mounted = true

    const startMonitoring = async () => {
      try {
        if (!ws.getConnectionStatus() && mounted) {
          ws.startMonitoring()
        }
      } catch (error) {
        if (mounted) {
          toast({
            title: 'Warning',
            description: 'Failed to start activity monitoring. Some features may be limited.',
            variant: 'destructive',
          })
        }
      }
    }

    startMonitoring()

    return () => {
      mounted = false
      try {
        if (ws.getConnectionStatus()) {
          ws.stopMonitoring()
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }, [user?.id, ws, toast])

  return (
    <div className="container mx-auto px-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-400">Monitor your work progress and manage tasks</p>
      </div>

      {/* Time Summary */}
      <div className="mb-8">
        <WorkSummaryGrid timeData={timeData} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Tracking Section */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Current Session
            </CardTitle>
            <CardDescription>Track your current work session</CardDescription>
          </CardHeader>
          <CardContent>
            <TimeTrackingCard />
          </CardContent>
        </Card>

        {/* Recent Tasks Section */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-400" />
                <CardTitle>Recent Tasks</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/employee/tasks')}
                className="text-gray-400 hover:text-white"
              >
                View All
              </Button>
            </div>
            <CardDescription>Your latest assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList limit={3} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-700/50"
            onClick={() => router.push('/employee/time')}
          >
            <Clock className="h-6 w-6 text-blue-400" />
            <span className="text-gray-200">View Time Reports</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-700/50"
            onClick={() => router.push('/employee/tasks')}
          >
            <CheckSquare className="h-6 w-6 text-green-400" />
            <span className="text-gray-200">Manage Tasks</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-700/50"
            onClick={() => router.push('/employee/activity')}
          >
            <Activity className="h-6 w-6 text-purple-400" />
            <span className="text-gray-200">Activity Log</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
