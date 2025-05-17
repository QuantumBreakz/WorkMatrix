'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { adminNavigation, employeeNavigation } from '@/config/navigation';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export function MobileNav() {
  const [open, setOpen] = useState(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Icons.Menu className="h-6 w-6" />
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
                        {item.icon && getIcon(item.icon)}
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
