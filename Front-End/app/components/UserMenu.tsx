"use client";

import { useAuth } from '@/hooks';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Settings,
  LogOut,
  Bell,
  Shield,
  Clock,
  Activity,
  Zap,
  Coffee,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
}

export default function UserMenu() {
  const { user, userRole, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load notifications
    loadNotifications();

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    // TODO: Load notifications from API
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'info',
        message: 'New task assigned: Project Review',
        timestamp: '5 minutes ago',
        read: false,
      },
      {
        id: '2',
        type: 'warning',
        message: 'Break reminder: Take a 5-minute break',
        timestamp: '10 minutes ago',
        read: false,
      },
      {
        id: '3',
        type: 'success',
        message: 'Task completed: Weekly Report',
        timestamp: '1 hour ago',
        read: true,
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
              <AvatarFallback>{getInitials(user.user_metadata?.full_name || user.email || '')}</AvatarFallback>
            </Avatar>
            <div className="ml-2 flex flex-col items-start">
              <span className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</span>
              <span className="text-xs text-muted-foreground">{userRole}</span>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Quick Actions */}
          <div className="px-2 py-1.5">
            <div className="text-xs font-medium text-muted-foreground mb-1">Quick Actions</div>
            <div className="grid grid-cols-2 gap-1">
              <Button variant="ghost" size="sm" className="justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Start Work
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Coffee className="mr-2 h-4 w-4" />
                Take Break
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Activity className="mr-2 h-4 w-4" />
                View Stats
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Zap className="mr-2 h-4 w-4" />
                Quick Task
              </Button>
            </div>
          </div>
          
          <DropdownMenuSeparator />

          {/* Notifications */}
          <div className="px-2 py-1.5">
            <div className="text-xs font-medium text-muted-foreground mb-1">Recent Notifications</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`text-xs p-2 rounded cursor-pointer hover:bg-muted ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    {notification.type === 'info' && <Bell className="h-4 w-4 text-blue-500" />}
                    {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {notification.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <div>
                      <p className="font-medium">{notification.message}</p>
                      <p className="text-muted-foreground">{notification.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Navigation Items */}
          <DropdownMenuItem asChild>
            <Link href={userRole === 'admin' ? '/admin/profile' : '/employee/profile'}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={userRole === 'admin' ? '/admin/settings' : '/employee/settings'}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>

          {/* Admin-specific items */}
          {userRole === 'admin' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/team">
                  <User className="mr-2 h-4 w-4" />
                  Team Management
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 
