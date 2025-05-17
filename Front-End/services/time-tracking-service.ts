import { getSupabaseBrowser } from "@/lib/supabase"
import type { TimeLog } from "@/types/database"

export async function startTimeTracking(userId: string): Promise<TimeLog | null> {
  const supabase = getSupabaseBrowser()

  // Check if there's already an active time log
  const { data: activeLog } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", userId)
    .is("end_time", null)
    .single()

  if (activeLog) {
    return activeLog
  }

  // Create new time log
  const { data } = await supabase
    .from("time_logs")
    .insert({
      user_id: userId,
      start_time: new Date().toISOString(),
      activity_type: "work",
    })
    .select()
    .single()

  return data
}

export async function stopTimeTracking(userId: string, notes?: string): Promise<TimeLog | null> {
  const supabase = getSupabaseBrowser()

  // Find active time log
  const { data: activeLog } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", userId)
    .is("end_time", null)
    .single()

  if (!activeLog) {
    return null
  }

  const endTime = new Date()
  const startTime = new Date(activeLog.start_time)
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000

  // Update time log
  const { data } = await supabase
    .from("time_logs")
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      notes: notes,
    })
    .eq("id", activeLog.id)
    .select()
    .single()

  return data
}

export async function getTimeLogs(userId: string, startDate?: Date, endDate?: Date): Promise<TimeLog[]> {
  const supabase = getSupabaseBrowser()

  let query = supabase.from("time_logs").select("*").eq("user_id", userId).order("start_time", { ascending: false })

  if (startDate) {
    query = query.gte("start_time", startDate.toISOString())
  }

  if (endDate) {
    query = query.lte("start_time", endDate.toISOString())
  }

  const { data } = await query

  return data || []
}

export async function getCurrentTimeLog(userId: string): Promise<TimeLog | null> {
  const supabase = getSupabaseBrowser()

  const { data } = await supabase.from("time_logs").select("*").eq("user_id", userId).is("end_time", null).single()

  return data
}
