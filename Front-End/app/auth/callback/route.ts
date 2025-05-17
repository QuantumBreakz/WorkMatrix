import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session) {
      // Check user role from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profile) {
        const redirectUrl = profile.role === 'admin' 
          ? new URL("/admin/dashboard", request.url)
          : new URL("/employee/dashboard", request.url)
        
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Default redirect to login if no valid session or profile
  return NextResponse.redirect(new URL("/login", request.url))
}
