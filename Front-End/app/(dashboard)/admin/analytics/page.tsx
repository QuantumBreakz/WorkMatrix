"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { CalendarIcon, Users, Clock, BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface AnalyticsData {
  productivity: {
    daily: number
    weekly: number
    monthly: number
    trend: number
  }
  timeTracking: {
    totalHours: number
    activeHours: number
    breakHours: number
    idleHours: number
  }
  projects: {
    total: number
    active: number
    completed: number
    onHold: number
  }
  tasks: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  team: {
    total: number
    active: number
    onBreak: number
    offline: number
  }
}

interface TimeLog {
  id: string
  userId: string
  startTime: Date
  endTime: Date | null
  type: "work" | "break" | "idle"
  duration: number
}

interface Project {
  id: string
  name: string
  status: "active" | "completed" | "on-hold"
  progress: number
  startDate: Date
  endDate: Date
}

interface Task {
  id: string
  title: string
  status: "todo" | "in-progress" | "completed" | "overdue"
  dueDate: Date
  assignee: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("week")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login/admin")
      return
    }
    loadAnalyticsData()
  }, [user, router, timeRange])

  const loadAnalyticsData = async () => {
    try {
      const startDate = startOfDay(subDays(new Date(), timeRange === "week" ? 7 : 30))
      const endDate = endOfDay(new Date())

      // Load time logs
      const { data: timeLogData, error: timeLogError } = await supabase
        .from("time_logs")
        .select("*")
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())

      if (timeLogError) throw timeLogError

      // Load projects
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")

      if (projectError) throw projectError

      // Load tasks
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")

      if (taskError) throw taskError

      // Load team members
      const { data: teamData, error: teamError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")

      if (teamError) throw teamError

      // Process time logs
      const processedTimeLogs = timeLogData.map((log: any) => ({
        ...log,
        startTime: new Date(log.start_time),
        endTime: log.end_time ? new Date(log.end_time) : null,
      }))

      // Process projects
      const processedProjects = projectData.map((proj: any) => ({
        ...proj,
        startDate: new Date(proj.start_date),
        endDate: new Date(proj.end_date),
      }))

      // Process tasks
      const processedTasks = taskData.map((task: any) => ({
        ...task,
        dueDate: new Date(task.due_date),
      }))

      // Calculate analytics data
      const analytics: AnalyticsData = {
        productivity: {
          daily: calculateDailyProductivity(processedTimeLogs),
          weekly: calculateWeeklyProductivity(processedTimeLogs),
          monthly: calculateMonthlyProductivity(processedTimeLogs),
          trend: calculateProductivityTrend(processedTimeLogs),
        },
        timeTracking: {
          totalHours: calculateTotalHours(processedTimeLogs),
          activeHours: calculateActiveHours(processedTimeLogs),
          breakHours: calculateBreakHours(processedTimeLogs),
          idleHours: calculateIdleHours(processedTimeLogs),
        },
        projects: {
          total: processedProjects.length,
          active: processedProjects.filter((p) => p.status === "active").length,
          completed: processedProjects.filter((p) => p.status === "completed").length,
          onHold: processedProjects.filter((p) => p.status === "on-hold").length,
        },
        tasks: {
          total: processedTasks.length,
          completed: processedTasks.filter((t) => t.status === "completed").length,
          inProgress: processedTasks.filter((t) => t.status === "in-progress").length,
          overdue: processedTasks.filter((t) => t.status === "overdue").length,
        },
        team: {
          total: teamData.length,
          active: teamData.filter((m: any) => m.status === "online").length,
          onBreak: teamData.filter((m: any) => m.status === "break").length,
          offline: teamData.filter((m: any) => m.status === "offline").length,
        },
      }

      setAnalyticsData(analytics)
      setTimeLogs(processedTimeLogs)
      setProjects(processedProjects)
      setTasks(processedTasks)
    } catch (error) {
      console.error("Error loading analytics data:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateDailyProductivity = (logs: TimeLog[]) => {
    const today = startOfDay(new Date())
    const todayLogs = logs.filter(
      (log) => startOfDay(log.startTime).getTime() === today.getTime()
    )
    return calculateProductivity(todayLogs)
  }

  const calculateWeeklyProductivity = (logs: TimeLog[]) => {
    const weekStart = startOfDay(subDays(new Date(), 7))
    const weekLogs = logs.filter(
      (log) => log.startTime.getTime() >= weekStart.getTime()
    )
    return calculateProductivity(weekLogs)
  }

  const calculateMonthlyProductivity = (logs: TimeLog[]) => {
    const monthStart = startOfDay(subDays(new Date(), 30))
    const monthLogs = logs.filter(
      (log) => log.startTime.getTime() >= monthStart.getTime()
    )
    return calculateProductivity(monthLogs)
  }

  const calculateProductivity = (logs: TimeLog[]) => {
    const workLogs = logs.filter((log) => log.type === "work")
    const totalDuration = workLogs.reduce((acc, log) => acc + log.duration, 0)
    const idleDuration = logs
      .filter((log) => log.type === "idle")
      .reduce((acc, log) => acc + log.duration, 0)
    return totalDuration > 0
      ? Math.round(((totalDuration - idleDuration) / totalDuration) * 100)
      : 0
  }

  const calculateProductivityTrend = (logs: TimeLog[]) => {
    const currentWeek = calculateWeeklyProductivity(logs)
    const previousWeek = calculateWeeklyProductivity(
      logs.filter((log) => log.startTime < subDays(new Date(), 7))
    )
    return previousWeek > 0
      ? Math.round(((currentWeek - previousWeek) / previousWeek) * 100)
      : 0
  }

  const calculateTotalHours = (logs: TimeLog[]) => {
    return Math.round(
      logs.reduce((acc, log) => acc + log.duration, 0) / 3600
    )
  }

  const calculateActiveHours = (logs: TimeLog[]) => {
    return Math.round(
      logs
        .filter((log) => log.type === "work")
        .reduce((acc, log) => acc + log.duration, 0) / 3600
    )
  }

  const calculateBreakHours = (logs: TimeLog[]) => {
    return Math.round(
      logs
        .filter((log) => log.type === "break")
        .reduce((acc, log) => acc + log.duration, 0) / 3600
    )
  }

  const calculateIdleHours = (logs: TimeLog[]) => {
    return Math.round(
      logs
        .filter((log) => log.type === "idle")
        .reduce((acc, log) => acc + log.duration, 0) / 3600
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Analytics Data Available</h1>
          <Button onClick={() => router.push("/admin/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.productivity.daily}%</div>
            <div className="flex items-center gap-2 mt-2">
              {analyticsData.productivity.trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm ${
                  analyticsData.productivity.trend > 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {Math.abs(analyticsData.productivity.trend)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.timeTracking.totalHours}h</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {analyticsData.timeTracking.activeHours}h active
              </span>
              <span className="text-sm text-muted-foreground">
                {analyticsData.timeTracking.breakHours}h break
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.team.active}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {analyticsData.team.onBreak} on break
              </span>
              <span className="text-sm text-muted-foreground">
                {analyticsData.team.offline} offline
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Productivity Trends</CardTitle>
                <CardDescription>Daily productivity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Productivity chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
                <CardDescription>Breakdown of time spent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Active Time</span>
                      <span>{analyticsData.timeTracking.activeHours}h</span>
                    </div>
                    <Progress
                      value={
                        (analyticsData.timeTracking.activeHours /
                          analyticsData.timeTracking.totalHours) *
                        100
                      }
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Break Time</span>
                      <span>{analyticsData.timeTracking.breakHours}h</span>
                    </div>
                    <Progress
                      value={
                        (analyticsData.timeTracking.breakHours /
                          analyticsData.timeTracking.totalHours) *
                        100
                      }
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Idle Time</span>
                      <span>{analyticsData.timeTracking.idleHours}h</span>
                    </div>
                    <Progress
                      value={
                        (analyticsData.timeTracking.idleHours /
                          analyticsData.timeTracking.totalHours) *
                        100
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>Project status and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.projects.active}</div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.projects.completed}</div>
                  <p className="text-sm text-muted-foreground">Completed Projects</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.projects.onHold}</div>
                  <p className="text-sm text-muted-foreground">On Hold Projects</p>
                </div>
              </div>
              <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Project progress chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
              <CardDescription>Task completion and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.tasks.total}</div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.tasks.completed}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.tasks.inProgress}</div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.tasks.overdue}</div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
              <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Task status chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Individual and team productivity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.team.active}</div>
                  <p className="text-sm text-muted-foreground">Active Team Members</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{analyticsData.team.total}</div>
                  <p className="text-sm text-muted-foreground">Total Team Members</p>
                </div>
              </div>
              <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Team performance chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
