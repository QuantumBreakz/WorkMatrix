"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Users, Activity, BarChart, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui/loading"
import type { UserProfile } from "@/types/auth"

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalTimeTracked: number
  averageHoursPerDay: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalTimeTracked: 0,
    averageHoursPerDay: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch total employees
        const { count: totalEmployees, error: employeesError } = await supabase
          .from("profiles")
          .select("*", { count: 'exact', head: true })
          .eq("role", "employee")

        if (employeesError) throw employeesError

        // Fetch active employees (those who logged time today)
        const today = new Date().toISOString().split('T')[0]
        const { count: activeEmployees, error: activeError } = await supabase
          .from("time_entries")
          .select("*", { count: 'exact', head: true })
          .gte("start_time", today)

        if (activeError) throw activeError

        // Fetch total time tracked
        const { data: timeData, error: timeError } = await supabase
          .from("time_entries")
          .select("duration")

        if (timeError) throw timeError

        const totalTimeTracked = timeData?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0
        const averageHoursPerDay = totalTimeTracked / (totalEmployees || 1) / 3600 // Convert seconds to hours

        setStats({
          totalEmployees: totalEmployees || 0,
          activeEmployees: activeEmployees || 0,
          totalTimeTracked,
          averageHoursPerDay,
        })

        // Fetch admin profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData as UserProfile)

      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)
        setError(error.message || 'Failed to load dashboard data')
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, router, toast])

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/login')
    return null
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.full_name || 'Admin'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Employees logged time today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalTimeTracked / 3600).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Total time tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Hours/Day</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageHoursPerDay.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Per employee
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 