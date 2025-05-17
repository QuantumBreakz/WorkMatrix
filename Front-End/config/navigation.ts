export interface NavItem {
  name: string;
  href: string;
  icon?: string;
}

export type NavSection = {
  name?: string;
  items: NavItem[];
};

export const employeeNavigation: NavSection[] = [
  {
    items: [
      {
        href: '/dashboard',
        name: 'Overview',
        icon: 'layout-dashboard',
      },
      {
        href: '/time-tracking',
        name: 'Time Tracking',
        icon: 'clock',
      },
      {
        href: '/tasks',
        name: 'Tasks',
        icon: 'check-square',
      },
      {
        href: '/activity',
        name: 'Activity',
        icon: 'activity',
      },
    ],
  },
  {
    name: 'Reports',
    items: [
      {
        href: '/reports/time',
        name: 'Time Reports',
        icon: 'bar-chart',
      },
      {
        href: '/reports/productivity',
        name: 'Productivity',
        icon: 'trending-up',
      },
      {
        href: '/reports/screenshots',
        name: 'Screenshots',
        icon: 'image',
      },
    ],
  },
];

export const adminNavigation: NavSection[] = [
  {
    items: [
      {
        href: '/admin',
        name: 'Admin Dashboard',
        icon: 'layout-dashboard',
      },
      {
        href: '/admin/employees',
        name: 'Employees',
        icon: 'users',
      },
      {
        href: '/admin/projects',
        name: 'Projects',
        icon: 'folder',
      },
    ],
  },
  {
    name: 'Management',
    items: [
      {
        href: '/admin/teams',
        name: 'Teams',
        icon: 'users-2',
      },
      {
        href: '/admin/reports',
        name: 'Reports',
        icon: 'file-text',
      },
      {
        href: '/admin/settings',
        name: 'Settings',
        icon: 'settings',
      },
    ],
  },
];

export const profileNavigation: NavItem[] = [
  {
    name: 'Profile',
    href: '/profile',
    icon: 'User'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: 'Settings'
  },
]; 