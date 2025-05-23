"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase-client"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type UserRole = "employee" | "admin" | "manager"

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
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getDashboardPath = (role: UserRole | null): string => {
  switch (role) {
    case "admin":
    case "manager":
      return "/admin/dashboard"
    case "employee":
      return "/employee/dashboard"
    default:
      return "/login"
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (error) throw error

      if (data) {
        const role = data.role as UserRole
        setUserRole(role)
        return role
      }
      return null
    } catch (error: any) {
      console.error('Error fetching user role:', error)
      handleAuthError(error)
      return null
    }
  }, [handleAuthError])

  useEffect(() => {
    let mounted = true
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)

          if (initialSession?.user) {
            const role = await fetchUserRole(initialSession.user.id)
            const currentPath = window.location.pathname
            if (currentPath === '/dashboard' || currentPath === '/') {
              router.push(getDashboardPath(role))
            }
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!mounted) return

          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (newSession?.user) {
            const role = await fetchUserRole(newSession.user.id)
            if (event === 'SIGNED_IN') {
              router.push(getDashboardPath(role))
            }
          } else {
            setUserRole(null)
            if (event === 'SIGNED_OUT') {
              router.push('/login')
            }
          }
        })

        return () => {
          mounted = false
          subscription.unsubscribe()
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error)
        handleAuthError(error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()
  }, [fetchUserRole, handleAuthError, router])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [handleAuthError])

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email)
        .limit(1)

      if (checkError) throw checkError

      if (existingProfile && existingProfile.length > 0) {
        throw new Error("Email already in use. Please use a different email or try to log in.")
      }

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

      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [handleAuthError, toast])

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
  }, [handleAuthError])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/login")
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [router, handleAuthError])

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
  }, [user, handleAuthError, toast])

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
        if (newSession.user) {
          await fetchUserRole(newSession.user.id)
        }
      }
    } catch (error: any) {
      handleAuthError(error)
      throw error
    }
  }, [fetchUserRole, handleAuthError])

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
        refreshSession,
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
