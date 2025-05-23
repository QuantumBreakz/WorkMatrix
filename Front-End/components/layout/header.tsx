'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { UserNav } from '@/components/dashboard/user-nav'
import { MainNav } from '@/components/dashboard/main-nav'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface HeaderProps {
  showNav?: boolean
  showUserNav?: boolean
  className?: string
}

export function Header({ showNav = true, showUserNav = true, className }: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-16 items-center">
        <div className="flex items-center space-x-2 mr-4">
          <Image
            src="/logo.png"
            alt="WorkMatrix Logo"
            width={32}
            height={32}
            priority
            className="rounded-lg"
          />
          <span className="hidden md:inline-block font-bold">
            WorkMatrix
          </span>
        </div>
        {showNav && (
          <>
            <div className="hidden md:block">
              <MainNav className="mx-6" />
            </div>
            <div className="md:hidden">
              <MobileNav />
            </div>
          </>
        )}
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          {showUserNav && <UserNav />}
        </div>
      </div>
    </header>
  )
} 