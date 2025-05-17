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
      // Check user role and redirect accordingly
      const { data: employee } = await supabase
        .from("employees")
        .select("role")
        .eq("email", session.user.email)
        .single()

      if (employee) {
        return NextResponse.redirect(new URL("/employee/dashboard", request.url))
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("role")
        .eq("email", session.user.email)
        .eq("approved", true)
        .single()

      if (admin) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      }
    }
  }

  // Default redirect to dashboard if no specific role is found
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
