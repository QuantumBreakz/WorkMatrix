'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { Menu } from 'lucide-react';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Profile['role'];

interface NavItem {
  name: string;
  href: string;
}

interface NavSection {
  name?: string;
  items: NavItem[];
}

const adminNavigation: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/admin/dashboard' },
      { name: 'Employees', href: '/admin/employees' },
      { name: 'Reports', href: '/admin/reports' },
      { name: 'Settings', href: '/admin/settings' },
    ],
  },
];

const employeeNavigation: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/employee/dashboard' },
      { name: 'Time Tracking', href: '/employee/time' },
      { name: 'Tasks', href: '/employee/tasks' },
      { name: 'Reports', href: '/employee/reports' },
    ],
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { userRole } = useAuth();

  // Get the appropriate navigation based on user role
  const navigation = userRole === 'admin' ? adminNavigation : employeeNavigation;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
          <div className="flex flex-col space-y-4">
            {navigation.map((section, i) => (
              <div key={i} className="flex flex-col space-y-3">
                {section.name && (
                  <h4 className="font-medium text-muted-foreground px-4">
                    {section.name}
                  </h4>
                )}
                <div className="flex flex-col space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || 
                                   pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 
