import { getSupabaseBrowser } from "@/lib/supabase"
import type { Screenshot } from "@/types/database"

export async function uploadScreenshot(userId: string, file: File, notes?: string): Promise<Screenshot | null> {
  const supabase = getSupabaseBrowser()

  // Generate a unique filename
  const timestamp = new Date().getTime()
  const filePath = `${userId}/${timestamp}_${file.name}`

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage.from("screenshots").upload(filePath, file)

  if (uploadError) {
    console.error("Error uploading screenshot:", uploadError)
    return null
  }

  // Create screenshot record
  const { data } = await supabase
    .from("screenshots")
    .insert({
      user_id: userId,
      filename: file.name,
      file_path: filePath,
      content_type: file.type,
      file_size: file.size,
      capture_time: new Date().toISOString(),
      notes: notes,
    })
    .select()
    .single()

  return data
}

export async function getScreenshots(userId: string, startDate?: Date, endDate?: Date): Promise<Screenshot[]> {
  const supabase = getSupabaseBrowser()

  let query = supabase.from("screenshots").select("*").eq("user_id", userId).order("capture_time", { ascending: false })

  if (startDate) {
    query = query.gte("capture_time", startDate.toISOString())
  }

  if (endDate) {
    query = query.lte("capture_time", endDate.toISOString())
  }

  const { data } = await query

  return data || []
}

export async function getScreenshotUrl(filePath: string): Promise<string | null> {
  const supabase = getSupabaseBrowser()

  const { data } = await supabase.storage.from("screenshots").createSignedUrl(filePath, 60) // 60 seconds expiry

  return data?.signedUrl || null
}

export async function deleteScreenshot(id: string, filePath: string): Promise<boolean> {
  const supabase = getSupabaseBrowser()

  // Delete from storage
  const { error: storageError } = await supabase.storage.from("screenshots").remove([filePath])

  if (storageError) {
    console.error("Error deleting screenshot from storage:", storageError)
    return false
  }

  // Delete from database
  const { error: dbError } = await supabase.from("screenshots").delete().eq("id", id)

  if (dbError) {
    console.error("Error deleting screenshot from database:", dbError)
    return false
  }

  return true
}
