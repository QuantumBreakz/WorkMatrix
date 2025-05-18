"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import { Loader2, Home, Clock, CheckSquare, BarChart2, LogOut } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
}

const navLinks: NavLink[] = [
  { href: "/employee/dashboard", label: "Dashboard", icon: <Home className="h-4 w-4" /> },
  { href: "/employee/time", label: "Time", icon: <Clock className="h-4 w-4" /> },
  { href: "/employee/tasks", label: "Tasks", icon: <CheckSquare className="h-4 w-4" /> },
  { href: "/employee/reports", label: "Reports", icon: <BarChart2 className="h-4 w-4" /> },
]

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useSupabaseAuth()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (!session) {
          router.push('/login')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) throw profileError

        if (!profile) {
          throw new Error('Profile not found')
        }

        if (profile.role !== 'employee') {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive',
          })
          router.push('/login')
          return
        }

        setProfile(profile)
      } catch (error: any) {
        console.error('Dashboard error:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to load dashboard',
          variant: 'destructive',
        })
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndLoadProfile()
  }, [router, toast])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
          </div>
          <p className="text-gray-400 animate-pulse">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 sm:space-x-8">
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                  <span className="text-white font-bold">W</span>
                </div>
                <h1 className="text-xl font-bold text-white hidden sm:block">WorkMatrix</h1>
              </div>
              <div className="hidden md:flex space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Button
                      key={link.href}
                      variant={isActive ? "secondary" : "ghost"}
                      className={`flex items-center space-x-2 transition-all duration-200 ${
                        isActive 
                          ? "bg-gray-800/60 text-white shadow-inner" 
                          : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                      }`}
                      onClick={() => router.push(link.href)}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gray-800/40 border border-gray-700 hover:bg-gray-800/60 transition-all duration-200 cursor-pointer group">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center ring-1 ring-blue-500/50 group-hover:ring-blue-400 transition-all duration-200">
                  <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300">
                    {getInitials(profile?.full_name)}
                  </span>
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">{profile?.full_name || 'User'}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-gray-700 relative group transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span className="absolute hidden group-hover:block right-0 translate-x-full px-2 py-1 ml-2 text-xs text-gray-300 bg-gray-800 rounded-md whitespace-nowrap">
                  Logout
                </span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-900/90 backdrop-blur-sm border-t border-gray-700 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-around">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Button
                  key={link.href}
                  variant="ghost"
                  className={`flex flex-col items-center py-2 px-3 transition-all duration-200 ${
                    isActive 
                      ? "text-blue-400 bg-blue-500/10 shadow-inner" 
                      : "text-gray-400 hover:text-blue-400 hover:bg-gray-800/40"
                  }`}
                  onClick={() => router.push(link.href)}
                >
                  {link.icon}
                  <span className="text-xs mt-1 font-medium">{link.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-24 md:pb-8 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
} 