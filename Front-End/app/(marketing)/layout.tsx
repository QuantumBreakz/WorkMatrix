"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isHomePage, setIsHomePage] = useState(false)

  useEffect(() => {
    setIsHomePage(pathname === "/home")
  }, [pathname])

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (isHomePage) {
      e.preventDefault()
      const section = document.getElementById(sectionId)
      if (section) {
        section.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center">
            <Link href="/home" className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="text-xl font-bold">WorkMatrix</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href={isHomePage ? "#features" : "/home#features"}
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => scrollToSection(e, "features")}
            >
              Features
            </Link>
            <Link
              href={isHomePage ? "#about" : "/home#about"}
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => scrollToSection(e, "about")}
            >
              About
            </Link>
            <Link
              href={isHomePage ? "#demo" : "/home#demo"}
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => scrollToSection(e, "demo")}
            >
              Demo
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ThemeToggle />
            <Link href="/login/employee">
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Login
              </Button>
            </Link>
            <Link href="/register/employee">
              <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
            </Link>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
