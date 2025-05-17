"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type UserRole = "employee" | "admin" | "super_admin"

type AuthContextType = {
  user: User | null
  session: Session | null
  userRole: UserRole | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  requestAdminAccess: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const handleAuthError = useCallback((error: any) => {
    console.error('Auth error:', error)
    toast({
      title: "Authentication Error",
      description: error.message || "An error occurred during authentication",
      variant: "destructive",
    })
  }, [toast])

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("role").eq("auth_id", userId).single()

      if (error) throw error

      if (data) {
        setUserRole(data.role as UserRole)
      }
    } catch (error: any) {
      console.error('Error fetching user role:', error)
      handleAuthError(error)
    }
  }, [supabase, handleAuthError])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserRole(session.user.id)
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchUserRole(session.user.id)
          } else {
            setUserRole(null)
          }
        })

        return () => subscription.unsubscribe()
      } catch (error: any) {
        console.error('Session error:', error)
        handleAuthError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [fetchUserRole, handleAuthError, supabase])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const redirectTo = searchParams.get('redirectedFrom') || '/dashboard'
      router.push(redirectTo)
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [supabase, router, searchParams, handleAuthError])

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      // First, check if the email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .limit(1)

      if (checkError) throw checkError

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("Email already in use. Please use a different email or try to log in.")
      }

      // Proceed with signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })

      if (error) throw error

      // Create user record in our users table
      const { error: profileError } = await supabase.from("users").insert([
        {
          email: email,
          full_name: fullName,
          role: role,
          created_at: new Date().toISOString(),
        },
      ])

      if (profileError) throw profileError

      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [supabase, handleAuthError, toast])

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [supabase, handleAuthError])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/")
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [supabase, router, handleAuthError])

  const requestAdminAccess = useCallback(async () => {
    if (!user) throw new Error("User not authenticated")

    try {
      const { error } = await supabase.from("admin_requests").insert({
        user_id: user.id,
        status: "pending",
        requested_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Request Submitted",
        description: "Your admin access request has been submitted for review.",
      })
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [user, supabase, handleAuthError, toast])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        requestAdminAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
