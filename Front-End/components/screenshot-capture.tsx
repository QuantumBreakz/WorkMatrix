"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Camera } from "lucide-react"

export default function ScreenshotCapture() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [notes, setNotes] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  const captureScreenshot = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to capture screenshots",
        variant: "destructive",
      })
      return
    }

    setIsCapturing(true)

    try {
      // Get user ID from the users table
      const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single()

      if (!userData) {
        throw new Error("User not found in the database")
      }

      const userId = userData.id

      // In a real application, you would use a browser extension or desktop app
      // to capture the actual screenshot. For this demo, we'll simulate it.
      toast({
        title: "Screenshot captured",
        description: "Your screenshot has been saved",
      })

      // Simulate saving a screenshot
      const timestamp = new Date().getTime()
      const filename = `screenshot_${timestamp}.png`
      const filePath = `${userId}/${filename}`

      // Create a record in the screenshots table
      await supabase.from("screenshots").insert({
        user_id: userId,
        filename: filename,
        file_path: filePath,
        content_type: "image/png",
        file_size: 100000, // Simulated file size
        capture_time: new Date().toISOString(),
        notes: notes || null,
      })

      setNotes("")
    } catch (error) {
      console.error("Error capturing screenshot:", error)
      toast({
        title: "Error",
        description: "Failed to capture screenshot",
        variant: "destructive",
      })
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Screenshot Capture
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="Add notes about this screenshot (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
          />

          <Button onClick={captureScreenshot} className="bg-blue-600 hover:bg-blue-700" disabled={isCapturing}>
            {isCapturing ? "Capturing..." : "Capture Screenshot"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
