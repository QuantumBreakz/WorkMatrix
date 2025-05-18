"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeTrackingCard } from "@/components/employee/TimeTrackingCard"
import { WorkSummaryGrid } from "@/components/employee/WorkSummaryGrid"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { supabase } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"
import type { TimeEntry } from "@/lib/supabase-client"

export default function TimePage() {
  const { user } = useSupabaseAuth()
  const [timeData, setTimeData] = useState({
    today: 0,
    week: 0,
    month: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTimeData = async () => {
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
        console.error("Error fetching time data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeData()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Time Tracking</h1>
        <p className="text-muted-foreground">Track and manage your work hours</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>Track your current work session</CardDescription>
          </CardHeader>
          <CardContent>
            <TimeTrackingCard />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Summary</CardTitle>
            <CardDescription>Overview of your tracked time</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkSummaryGrid timeData={timeData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 