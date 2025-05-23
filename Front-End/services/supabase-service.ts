import { supabase } from "@/lib/supabase"

export interface User {
  id: string
  email: string
  role: string
  created_at: string
  name?: string
}

export interface TimeLog {
  id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration: number | null
  task_description: string | null
}

export interface Screenshot {
  id: string
  user_id: string
  image_url: string
  timestamp: string
  activity_level: number | null
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

export async function getTimeLogs(userId: string): Promise<TimeLog[]> {
  const { data, error } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching time logs:", error)
    return []
  }

  return data || []
}

export async function getScreenshots(userId: string): Promise<Screenshot[]> {
  const { data, error } = await supabase
    .from("screenshots")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })

  if (error) {
    console.error("Error fetching screenshots:", error)
    return []
  }

  return data || []
}

export async function startTimeTracking(userId: string, taskDescription: string | null = null) {
  const { data, error } = await supabase
    .from("time_logs")
    .insert([
      {
        user_id: userId,
        start_time: new Date().toISOString(),
        task_description: taskDescription,
      },
    ])
    .select()

  if (error) {
    console.error("Error starting time tracking:", error)
    return null
  }

  return data?.[0] || null
}

export async function stopTimeTracking(timeLogId: string) {
  const endTime = new Date().toISOString()

  // First get the current time log to calculate duration
  const { data: timeLog } = await supabase.from("time_logs").select("start_time").eq("id", timeLogId).single()

  if (!timeLog) return null

  // Calculate duration in seconds
  const startTime = new Date(timeLog.start_time)
  const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)

  // Update the time log
  const { data, error } = await supabase
    .from("time_logs")
    .update({
      end_time: endTime,
      duration: duration,
    })
    .eq("id", timeLogId)
    .select()

  if (error) {
    console.error("Error stopping time tracking:", error)
    return null
  }

  return data?.[0] || null
}

export async function saveScreenshot(userId: string, imageUrl: string, activityLevel: number | null = null) {
  const { data, error } = await supabase
    .from("screenshots")
    .insert([
      {
        user_id: userId,
        image_url: imageUrl,
        timestamp: new Date().toISOString(),
        activity_level: activityLevel,
      },
    ])
    .select()

  if (error) {
    console.error("Error saving screenshot:", error)
    return null
  }

  return data?.[0] || null
}
