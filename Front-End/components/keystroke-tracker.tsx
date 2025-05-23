"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Keyboard } from "lucide-react"

export default function KeystrokeTracker() {
  const [keystrokeCount, setKeystrokeCount] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [currentApp, setCurrentApp] = useState("Browser")
  const [currentWindow, setCurrentWindow] = useState("WorkMatrix")
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    // Start tracking when component mounts
    startTracking()

    // Set up keystroke event listener
    document.addEventListener("keydown", handleKeyPress)

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyPress)
      saveKeystrokeData()
    }
  }, [])

  const startTracking = () => {
    setIsTracking(true)
    setKeystrokeCount(0)

    // Set up interval to save keystroke data every minute
    const interval = setInterval(() => {
      saveKeystrokeData()
      setKeystrokeCount(0)
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }

  const handleKeyPress = () => {
    if (isTracking) {
      setKeystrokeCount((prev) => prev + 1)
    }
  }

  const saveKeystrokeData = async () => {
    if (!user || keystrokeCount === 0) return

    try {
      // Get user ID from the users table
      const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

      if (!userData) {
        throw new Error("User not found in the database")
      }

      const userId = userData.id

      // Save keystroke data
      await supabase.from("keystrokes").insert({
        user_id: userId,
        application_name: currentApp,
        window_title: currentWindow,
        count: keystrokeCount,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error saving keystroke data:", error)
      toast({
        title: "Error",
        description: "Failed to save keystroke data",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Keystroke Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Application</p>
              <p className="text-lg font-semibold">{currentApp}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Current Window</p>
              <p className="text-lg font-semibold">{currentWindow}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Keystrokes (current session)</p>
            <p className="text-3xl font-bold">{keystrokeCount}</p>
          </div>

          <div className="text-xs text-gray-500">
            {isTracking ? "Tracking active" : "Tracking paused"} • Data saved every minute
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
