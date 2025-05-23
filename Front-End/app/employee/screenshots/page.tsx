"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import ScreenshotCapture from "@/components/screenshot-capture"
import { format } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react"
import type { Screenshot } from "@/types/database"

export default function EmployeeScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { user, userRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login/employee")
      return
    }

    // If user is an admin, redirect to admin dashboard
    if (userRole === "admin" || userRole === "super_admin") {
      router.push("/admin/dashboard")
      return
    }

    fetchScreenshots()
  }, [user, userRole, router, selectedDate])

  const fetchScreenshots = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Get user ID from the users table
      const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

      if (!userData) {
        console.error("User not found in the database")
        return
      }

      const userId = userData.id

      // Get start and end of the selected date
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Fetch screenshots for the selected date
      const { data } = await supabase
        .from("screenshots")
        .select("*")
        .eq("user_id", userId)
        .gte("capture_time", startOfDay.toISOString())
        .lte("capture_time", endOfDay.toISOString())
        .order("capture_time", { ascending: false })

      setScreenshots(data as Screenshot[])
    } catch (error) {
      console.error("Error fetching screenshots:", error)
      toast({
        title: "Error",
        description: "Failed to load screenshots",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviousDay = () => {
    const prevDay = new Date(selectedDate)
    prevDay.setDate(prevDay.getDate() - 1)
    setSelectedDate(prevDay)
  }

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setSelectedDate(nextDay)
  }

  const handleDeleteScreenshot = async (id: string, filePath: string) => {
    try {
      // Delete from storage (in a real app)
      // await supabase.storage.from("screenshots").remove([filePath])

      // Delete from database
      const { error } = await supabase.from("screenshots").delete().eq("id", id)

      if (error) throw error

      // Update the UI
      setScreenshots((prev) => prev.filter((screenshot) => screenshot.id !== id))

      toast({
        title: "Screenshot deleted",
        description: "The screenshot has been removed",
      })
    } catch (error) {
      console.error("Error deleting screenshot:", error)
      toast({
        title: "Error",
        description: "Failed to delete the screenshot",
        variant: "destructive",
      })
    }
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Screenshots</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <ScreenshotCapture />
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Screenshots for {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextDay}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading screenshots...</div>
              ) : screenshots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No screenshots found for this date</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {screenshots.map((screenshot) => (
                    <Card key={screenshot.id} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <div className="text-gray-400">Screenshot Preview</div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{formatTime(screenshot.capture_time)}</div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteScreenshot(screenshot.id, screenshot.file_path)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {screenshot.notes && <div className="text-sm text-gray-500">{screenshot.notes}</div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
