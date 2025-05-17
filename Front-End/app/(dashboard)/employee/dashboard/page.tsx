"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Clock, Activity, Calendar as CalendarIcon, FileText, Briefcase, Target, Moon } from "lucide-react"
import { useRouter } from "next/navigation"

interface ActivityLog {
  id: string
  description: string
  created_at: string
  user_id: string
}

interface LeaveBalance {
  leave_type: string
  total_allotted: number
  total_taken: number
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchExtraStats()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // Fetch time tracking data
      const { data: timeTrackingData } = await supabase
        .from("time_tracking")
        .select("date, duration")
        .eq("user_id", user.id)

      // Calculate time totals
      const today = new Date()
      const todayISO = today.toISOString().split("T")[0]
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
      const weekStartISO = weekStart.toISOString().split("T")[0]
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthStartISO = monthStart.toISOString().split("T")[0]

      const calculatedTimeData = {
        today: timeTrackingData?.filter(t => t.date === todayISO).reduce((acc, curr) => acc + curr.duration, 0) || 0,
        week: timeTrackingData?.filter(t => t.date >= weekStartISO).reduce((acc, curr) => acc + curr.duration, 0) || 0,
        month: timeTrackingData?.filter(t => t.date >= monthStartISO).reduce((acc, curr) => acc + curr.duration, 0) || 0,
      }

      setTimeData(calculatedTimeData)

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from("activity_logs")
        .select("id, description, created_at, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      setRecentActivity(activityData as ActivityLog[] || [])
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
      // TODO: Fetch Target Monthly Hours from 'company_settings' table
      // const { data: settingsData, error: settingsError } = await supabase
      //   .from("company_settings")
      //   .select("setting_value")
      //   .eq("setting_name", "target_monthly_hours")
      //   .single()
      // if (settingsError) console.error("Error fetching target hours:", settingsError)
      // setTargetMonthlyHours(settingsData ? parseFloat(settingsData.setting_value) : 160) // Default 160
      setTargetMonthlyHours(160) // Mock value

      // TODO: Fetch Leave Balances from 'leave_balances' table for the current user
      // const currentYear = new Date().getFullYear()
      // const { data: balancesData, error: balancesError } = await supabase
      //   .from("leave_balances")
      //   .select("leave_type, total_allotted, total_taken")
      //   .eq("user_id", user.id)
      //   .eq("year", currentYear)
      // if (balancesError) console.error("Error fetching leave balances:", balancesError)
      // setLeaveBalances(balancesData || [])
      setLeaveBalances([ // Mock values
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        <Button onClick={() => { fetchDashboardData()
          fetchExtraStats()
        }} disabled={isLoading || isLoadingExtraStats}>
          { (isLoading || isLoadingExtraStats) ? "Refreshing..." : "Refresh"}
          </Button>
      </div>

      {/* Top Row: Time Tracking Overview & Monthly Work/Leave Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Tracking Cards (col-span-2 on lg) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(timeData.today)}</div>
              <p className="text-xs text-muted-foreground">Total time tracked today</p>
                        </CardContent>
                      </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
              <div className="text-2xl font-bold">{formatTime(timeData.week)}</div>
              <p className="text-xs text-muted-foreground">Total time this week</p>
                        </CardContent>
                      </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
              <div className="text-2xl font-bold">{formatTime(timeData.month)}</div>
              <p className="text-xs text-muted-foreground">Total time this month</p>
            </CardContent>
          </Card>
      </div>

        {/* Monthly Work & Leave Status Card (col-span-1 on lg) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Status</CardTitle>
            <CardDescription>Your work hours and leave balance for this month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingExtraStats ? (
              <p>Loading monthly stats...</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Target Monthly Hours:</span>
                  <span className="text-sm font-semibold">{monthlyTarget} hrs</span>
                  </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Hours Worked This Month:</span>
                  <span className="text-sm font-semibold">{workedThisMonth.hours}h {workedThisMonth.minutes}m</span>
                    </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Leaves Allotted:</span>
                  <span className="text-sm font-semibold">{leavesAvailableText}</span>
                  </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Leaves Remaining:</span>
                  <span className="text-sm font-semibold">{leavesRemainingText}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar View & Daily Time - TODO */}
      {/* This section will be for the calendar and daily time display */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Time Breakdown & Calendar</CardTitle>
          <CardDescription>View your tracked time per day. (Calendar coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Calendar and detailed daily time view will be implemented here.</p>
          {/* Placeholder for calendar component and daily time list */}
        </CardContent>
        </Card>

      {/* Recent Activity & Quick Actions (existing sections) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
            <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 md:h-24 flex flex-col items-center justify-center space-y-1" onClick={() => router.push("/employee/profile")}>
              <FileText className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-xs md:text-sm">View Profile</span>
            </Button>
            <Button variant="outline" className="h-20 md:h-24 flex flex-col items-center justify-center space-y-1" onClick={() => router.push("/employee/leaves")}>
              <Moon className="h-5 w-5 md:h-6 md:w-6" /> 
              <span className="text-xs md:text-sm">Apply for Leave</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
