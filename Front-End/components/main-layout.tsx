"use client"

import React from "react"

import { useState, useEffect, memo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Clock,
  Camera,
  Keyboard,
  BarChart2,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
  CheckSquare,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface MainLayoutProps {
  children: React.ReactNode
}

function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, userRole, signOut } = useAuth()

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isAdmin = userRole === "admin" || userRole === "super_admin"
  const isSuperAdmin = userRole === "super_admin"

  // Memoize navigation items to prevent unnecessary re-renders
  const employeeNavItems = React.useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/employee/dashboard",
        icon: <Home className="h-5 w-5" />,
      },
      {
        name: "Time Tracking",
        href: "/employee/time-tracking",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        name: "Screenshots",
        href: "/employee/screenshots",
        icon: <Camera className="h-5 w-5" />,
      },
      {
        name: "Activity",
        href: "/employee/activity",
        icon: <Keyboard className="h-5 w-5" />,
      },
      {
        name: "Reports",
        href: "/employee/reports",
        icon: <BarChart2 className="h-5 w-5" />,
      },
      {
        name: "Settings",
        href: "/employee/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ],
    [],
  )

  const adminNavItems = React.useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: <Home className="h-5 w-5" />,
      },
      {
        name: "Employees",
        href: "/admin/employees",
        icon: <Users className="h-5 w-5" />,
      },
      {
        name: "Time Tracking",
        href: "/admin/time-tracking",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        name: "Screenshots",
        href: "/admin/screenshots",
        icon: <Camera className="h-5 w-5" />,
      },
      {
        name: "Reports",
        href: "/admin/reports",
        icon: <BarChart2 className="h-5 w-5" />,
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ],
    [],
  )

  if (isSuperAdmin) {
    adminNavItems.push({
      name: "Admin Requests",
      href: "/admin/approval-requests",
      icon: <CheckSquare className="h-5 w-5" />,
    })
  }

  const navItems = isAdmin ? adminNavItems : employeeNavItems

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-card md:border-r">
        <div className="flex items-center justify-between h-16 border-b px-4">
          <Link href={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground mr-2">
              {isAdmin ? <Shield className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <span className="text-xl font-bold">WorkMatrix</span>
          </Link>
          <ThemeToggle />
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-md ${
                    pathname === item.href ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-5 w-5 mr-2" />
                <span className="truncate">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={isAdmin ? "/admin/profile" : "/employee/profile"}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={isAdmin ? "/admin/settings" : "/employee/settings"}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background border-b z-10">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground mr-2">
              {isAdmin ? <Shield className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <span className="text-lg font-bold">WorkMatrix</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-20">
          <div className="fixed inset-y-0 left-0 w-64 bg-card p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Link href={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground mr-2">
                  {isAdmin ? <Shield className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <span className="text-lg font-bold">WorkMatrix</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav>
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm rounded-md ${
                        pathname === item.href
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{user?.email}</span>
              </div>
              <Button variant="outline" className="w-full justify-start" onClick={() => signOut()}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
      </div>
    </div>
  )
}

export default memo(MainLayout)
