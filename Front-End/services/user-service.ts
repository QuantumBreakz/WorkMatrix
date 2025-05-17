import { getSupabaseBrowser } from "@/lib/supabase"
import type { User, Employee } from "@/types/database"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseBrowser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase.from("users").select("*").eq("auth_id", user.id).single()

  return data
}

export async function getUserProfile(userId: string): Promise<Employee | null> {
  const supabase = getSupabaseBrowser()

  const { data } = await supabase.from("employees").select("*").eq("user_id", userId).single()

  return data
}

export async function updateUserProfile(userId: string, profile: Partial<Employee>): Promise<Employee | null> {
  const supabase = getSupabaseBrowser()

  const { data } = await supabase
    .from("employees")
    .update({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single()

  return data
}

export async function createUserProfile(profile: Partial<Employee>): Promise<Employee | null> {
  const supabase = getSupabaseBrowser()

  const { data } = await supabase
    .from("employees")
    .insert({
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  return data
}
