"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import { Loader2, Clock, Activity, CheckSquare, BarChart2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWebSocket } from '@/lib/services/websocket-service'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { TimeTrackingCard } from '@/components/employee/TimeTrackingCard'
import { ActivityFeed } from '@/components/employee/ActivityFeed'
import { TaskList } from '@/components/employee/TaskList'
import { WorkSummaryGrid } from '@/components/employee/WorkSummaryGrid'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type TimeEntry = Database['public']['Tables']['time_entries']['Row']
type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

interface LeaveBalance {
  leave_type: string
  total_allotted: number
  total_taken: number
}

interface UserProfile {
  id: string;
  full_name: string;
  department: string;
  role: string;
}

interface TimeTrackingData {
  date: string;
  duration: number;
}

export default function EmployeeDashboard() {
  const { user } = useSupabaseAuth()
  const { toast } = useToast()
  const [timeData, setTimeData] = useState({
    today: 0,
    week: 0,
    month: 0
  })
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // New state for dashboard enhancements
  const [targetMonthlyHours, setTargetMonthlyHours] = useState<number | null>(null)
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [isLoadingExtraStats, setIsLoadingExtraStats] = useState(true)

  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)

  const ws = useWebSocket()

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile) {
          throw new Error('Profile not found');
        }

        if (profile.role !== 'employee') {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive',
          });
          router.push('/login');
          return;
        }

        setProfile(profile);
      } catch (error: any) {
        console.error('Dashboard error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load dashboard',
          variant: 'destructive',
        });
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [router, toast]);

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchExtraStats()
    }
  }, [user])

  useEffect(() => {
    if (!user?.id || !ws) return;

    try {
      if (!ws.getConnectionStatus()) {
        ws.startMonitoring();
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast({
        title: 'Warning',
        description: 'Failed to start activity monitoring. Some features may be limited.',
        variant: 'destructive',
      });
    }

    return () => {
      try {
        if (ws.getConnectionStatus()) {
          ws.stopMonitoring();
        }
      } catch (error) {
        console.error('Error stopping monitoring:', error);
      }
    };
  }, [user?.id, ws, toast]);

  const fetchDashboardData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // Fetch time tracking data
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id) as { data: TimeEntry[] | null, error: any };

      if (timeError) throw timeError;

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

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5) as { data: ActivityLog[] | null, error: any };

      if (activityError) throw activityError;

      setRecentActivity(activityData || [])
    } catch (error) {
      console.error("Error fetching core dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load core dashboard data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExtraStats = async () => {
    if (!user) return
    setIsLoadingExtraStats(true)
    try {
      setTargetMonthlyHours(160) // Mock value for now
      setLeaveBalances([ // Mock values for now
        { leave_type: "Vacation", total_allotted: 15, total_taken: 5 },
        { leave_type: "Sick Leave", total_allotted: 10, total_taken: 2 },
      ])
    } catch (error) {
      console.error("Error fetching extra stats:", error)
      toast({
        title: "Error",
        description: "Failed to load monthly targets or leave balances.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingExtraStats(false)
    }
  }

  const formatTime = (minutes: number) => {
    if (isNaN(minutes) || minutes === null) return "0h 0m"
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60) // Round minutes for cleaner display
    return `${hours}h ${mins}m`
  }
  
  const minutesToHoursAndMinutes = (minutes: number) => {
    if (isNaN(minutes) || minutes === null) return { hours: 0, minutes: 0 }
    return {
        hours: Math.floor(minutes / 60),
        minutes: Math.round(minutes % 60)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }
  
  if (!profile) {
    return null;
  }

  const workedThisMonth = minutesToHoursAndMinutes(timeData.month)
  const monthlyTarget = targetMonthlyHours || 0
  const leavesAvailableText = leaveBalances.map(lb => 
    `${lb.total_allotted} days ${lb.leave_type}`
  ).join(", ") || "N/A"
  const leavesRemainingText = leaveBalances.map(lb => 
    `${lb.total_allotted - lb.total_taken} days ${lb.leave_type}`
  ).join(", ") || "N/A"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200">
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-white">WorkMatrix</h1>
              <div className="hidden md:flex space-x-6">
                <a href="/employee/dashboard" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                  Dashboard
                </a>
                <a href="/employee/time" className="text-gray-400 hover:text-blue-300 transition-colors duration-200">
                  Time Tracking
                </a>
                <a href="/employee/tasks" className="text-gray-400 hover:text-blue-300 transition-colors duration-200">
                  Tasks
                </a>
                <a href="/employee/reports" className="text-gray-400 hover:text-blue-300 transition-colors duration-200">
                  Reports
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">{profile.full_name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-24 pb-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-semibold text-white mb-2">Welcome back, {profile.full_name}</h2>
          <p className="text-gray-400">Track your work, manage tasks, and stay productive.</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Time Tracking Card */}
          <div className="col-span-1 animate-fade-in [animation-delay:200ms]">
            <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <TimeTrackingCard />
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="col-span-1 animate-fade-in [animation-delay:400ms]">
            <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <ActivityFeed activities={recentActivity} />
            </Card>
          </div>

          {/* Task List */}
          <div className="col-span-1 animate-fade-in [animation-delay:600ms]">
            <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl hover:shadow-2xl transition-shadow duration-200">
              <TaskList />
            </Card>
          </div>
        </div>

        {/* Time Summary Grid */}
        <div className="animate-fade-in [animation-delay:800ms]">
          <WorkSummaryGrid timeData={timeData} />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          Powered by WorkMatrix
        </footer>
      </main>
    </div>
  )
}
