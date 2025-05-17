'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { adminNavigation, employeeNavigation } from '@/config/navigation';
import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

export function MainNav({ className, ...props }: MainNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Get the appropriate navigation based on user role
  const navigation = isAdmin ? adminNavigation : employeeNavigation;

  // Helper function to get icon component
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = Icons[iconName as keyof typeof Icons] as LucideIcon;
    return Icon ? <Icon className="h-4 w-4 mr-2" /> : null;
  };

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
                  'flex items-center text-sm font-medium transition-colors hover:text-primary',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {item.icon && getIcon(item.icon)}
                {item.name}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
} 
