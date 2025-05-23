'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Profile['role'];

interface NavItem {
  name: string;
  href: string;
  icon?: string;
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

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

export function MainNav({ className, ...props }: MainNavProps) {
  const pathname = usePathname();
  const { userRole } = useAuth();

  // Get the appropriate navigation based on user role
  const navigation = userRole === 'admin' ? adminNavigation : employeeNavigation;

  return (
    <nav
      className={cn('flex items-center space-x-6', className)}
      {...props}
    >
      {navigation.map((section, index) => (
        <div key={section.name || index} className="flex items-center space-x-6">
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
} 
