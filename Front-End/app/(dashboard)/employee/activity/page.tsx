"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { format } from "date-fns"

interface ActivityLog {
  id: string
  created_at: string
  activity_type: string
  details: string
  duration: number
}

export default function EmployeeActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error
        setActivities(data || [])
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [user, supabase])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Activity History</CardTitle>
          <CardDescription>View your recent work activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No activities found</div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{activity.activity_type}</h3>
                      <span className="text-sm text-gray-500">
                        {format(new Date(activity.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.details}</p>
                    {activity.duration > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        Duration: {formatDuration(activity.duration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
