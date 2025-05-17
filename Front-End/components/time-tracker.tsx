"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks"
import { getCurrentUser } from "@/services/user-service"
import { startTimeTracking, stopTimeTracking, getCurrentTimeLog } from "@/services/time-tracking-service"
import type { TimeLog } from "@/types/database"
import { Play, Pause, Clock } from "lucide-react"

export default function TimeTracker() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLog, setCurrentLog] = useState<TimeLog | null>(null)
  const [notes, setNotes] = useState("")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        const userData = await getCurrentUser()
        if (userData) {
          setUserId(userData.id)
          checkForActiveTimeLog(userData.id)
        }
      }
    }

    fetchUser()
  }, [user])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTracking && currentLog) {
      interval = setInterval(() => {
        const startTime = new Date(currentLog.start_time).getTime()
        const now = new Date().getTime()
        const elapsed = Math.floor((now - startTime) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isTracking, currentLog])

  const checkForActiveTimeLog = async (id: string) => {
    const activeLog = await getCurrentTimeLog(id)
    if (activeLog) {
      setCurrentLog(activeLog)
      setIsTracking(true)
    }
  }

  const handleStartTracking = async () => {
    if (!userId) return

    try {
      const log = await startTimeTracking(userId)
      if (log) {
        setCurrentLog(log)
        setIsTracking(true)
        toast({
          title: "Time tracking started",
          description: "Your time is now being tracked",
        })
      }
    } catch (error) {
      console.error("Error starting time tracking:", error)
      toast({
        title: "Error",
        description: "Failed to start time tracking",
        variant: "destructive",
      })
    }
  }

  const handleStopTracking = async () => {
    if (!userId) return

    try {
      const log = await stopTimeTracking(userId, notes)
      if (log) {
        setCurrentLog(null)
        setIsTracking(false)
        setNotes("")
        setElapsedTime(0)
        toast({
          title: "Time tracking stopped",
          description: `You tracked ${Math.round(log.duration_minutes || 0)} minutes`,
        })
      }
    } catch (error) {
      console.error("Error stopping time tracking:", error)
      toast({
        title: "Error",
        description: "Failed to stop time tracking",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full border-blue-100 dark:border-blue-900/30 shadow-md">
      <CardHeader className="border-b border-blue-50 dark:border-blue-900/20">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="text-4xl font-bold text-center text-blue-600">{formatTime(elapsedTime)}</div>

          {isTracking && (
            <Textarea
              placeholder="What are you working on? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500"
            />
          )}

          <Button
            onClick={isTracking ? handleStopTracking : handleStartTracking}
            className={isTracking ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}
            size="lg"
          >
            {isTracking ? (
              <>
                <Pause className="mr-2 h-5 w-5" /> Stop Tracking
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" /> Start Tracking
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
