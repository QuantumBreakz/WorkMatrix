"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Loader2, Users, Clock, Calendar, AlertTriangle } from "lucide-react"
import { format, subDays } from "date-fns"
import { ConnectionStatusCard } from "@/components/ui/connection-status"
import { useConnectionManager } from "@/hooks/use-connection-manager"

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalHours: number
  averageHours: number
  pendingTasks: number
  overdueTasks: number
  recentActivity: {
    type: string
    description: string
    timestamp: string
  }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const { user, userRole } = useAuth()
  const { isConnected } = useConnectionManager()

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      router.push('/login')
      return
    }
    fetchDashboardStats()
  }, [user, userRole, router])

  const fetchDashboardStats = async () => {
    if (!isConnected) {
      toast({
        title: "Connection Required",
        description: "Please ensure you are connected to the monitoring service to view dashboard statistics.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch employee counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, is_active')

      if (profilesError) throw profilesError

      // Fetch time tracking data for the last 7 days
      const sevenDaysAgo = subDays(new Date(), 7).toISOString()
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .gte('date', sevenDaysAgo)

      if (timeError) throw timeError

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'overdue'])

      if (tasksError) throw tasksError

      // Fetch recent activity
      const { data: activity, error: activityError } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (activityError) throw activityError

      // Calculate statistics
      const totalEmployees = profiles?.length || 0
      const activeEmployees = profiles?.filter(p => p.is_active)?.length || 0
      const totalHours = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0
      const averageHours = totalEmployees > 0 ? totalHours / totalEmployees : 0
      const pendingTasks = tasks?.filter(t => t.status === 'pending')?.length || 0
      const overdueTasks = tasks?.filter(t => t.status === 'overdue')?.length || 0

      setStats({
        totalEmployees,
        activeEmployees,
        totalHours,
        averageHours,
        pendingTasks,
        overdueTasks,
        recentActivity: activity?.map(a => ({
          type: a.type,
          description: a.description,
          timestamp: a.created_at
        })) || []
      })
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || userRole !== 'admin') {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading dashboard...</span>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load dashboard statistics
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <ConnectionStatusCard />

      {isConnected ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeEmployees} active employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours (7d)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  Avg. {stats.averageHours.toFixed(1)}h per employee
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overdueTasks} overdue tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">Operational</div>
                <p className="text-xs text-muted-foreground">
                  All systems running normally
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No recent activity</div>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Connection Required</h3>
            <p className="text-muted-foreground mb-4">
              Please connect to the monitoring service to view dashboard statistics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 