import {
  BarChart3, Bell, CalendarClock, ClipboardCheck, ClipboardList, Droplets, FileSpreadsheet, FolderKanban,
  LayoutDashboard, Mountain, ScrollText, Users, Waves, Waypoints,
} from 'lucide-react';
import { USER_ROLES } from './roles';

/**
 * Sidebar links of each role. `icon` is the lucide icon shown in the rail.
 * `adminOnly` links are for State administrators without a workflow role.
 */
export const NAV_LINKS = {
  [USER_ROLES.PIA_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/officer', icon: LayoutDashboard },
    { label: 'My Projects', href: '/dashboard/officer/projects', icon: FolderKanban },
    { label: 'My MPRs', href: '/dashboard/officer/mprs', icon: ClipboardList },
    { label: 'Deadlines', href: '/dashboard/officer/deadlines', icon: CalendarClock },
    { label: 'Notifications', href: '/dashboard/officer/notifications', icon: Bell, badge: 'notifications' },
  ],
  [USER_ROLES.MND_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/mnd', icon: LayoutDashboard },
    { label: 'MPR Reports', href: '/dashboard/mnd/mpr', icon: ClipboardList },
    { label: 'Abstract 55', href: '/dashboard/mnd/abstract55', icon: FileSpreadsheet },
    { label: '55-01 Spring', href: '/dashboard/mnd/head55-01', icon: Droplets },
    { label: '55-02 River', href: '/dashboard/mnd/head55-02', icon: Waves },
    { label: '55-03 Major River', href: '/dashboard/mnd/head55-03', icon: Waypoints },
    { label: '55-04 Ground Water', href: '/dashboard/mnd/head55-04', icon: Mountain },
    { label: 'Analytics', href: '/dashboard/mnd/analytics', icon: BarChart3 },
    { label: 'Notifications', href: '/dashboard/mnd/notifications', icon: Bell, badge: 'notifications' },
  ],
  [USER_ROLES.DD_LEVEL]: [
    { label: 'Dashboard', href: '/dashboard/dd', icon: LayoutDashboard },
    { label: 'District Projects', href: '/dashboard/dd/projects', icon: FolderKanban },
    { label: 'Review MPRs', href: '/dashboard/dd/mpr-review', icon: ClipboardCheck },
    { label: 'Deadlines', href: '/dashboard/dd/deadlines', icon: CalendarClock },
    { label: 'Notifications', href: '/dashboard/dd/notifications', icon: Bell, badge: 'notifications' },
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Projects', href: '/dashboard/admin/projects', icon: FolderKanban },
    { label: 'Deadlines', href: '/dashboard/admin/deadlines', icon: CalendarClock },
    { label: 'Users', href: '/dashboard/admin/users', icon: Users, adminOnly: true },
    { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ScrollText },
    { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell, badge: 'notifications' },
  ],
  [USER_ROLES.MND_SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/mnd-admin', icon: LayoutDashboard },
    { label: 'All Reports', href: '/dashboard/mnd-admin/mpr', icon: ClipboardList },
    { label: 'Advanced Analytics', href: '/dashboard/mnd-admin/analytics', icon: BarChart3 },
    { label: 'Deadlines', href: '/dashboard/mnd-admin/deadlines', icon: CalendarClock },
    { label: 'Notifications', href: '/dashboard/mnd-admin/notifications', icon: Bell, badge: 'notifications' },
  ],
};

/** Links of a user, with administrator-only links removed for workflow roles. */
export const navLinksFor = (user) => {
  if (!user?.role) return [];
  const pure = user.role === USER_ROLES.SUPER_ADMIN && (user.workflowRole == null || user.workflowRole === '');
  return (NAV_LINKS[user.role] || []).filter((link) => !link.adminOnly || pure);
};

/** Where a role's notification page lives. */
export const notificationsRoute = (role) => (NAV_LINKS[role] || []).find((link) => link.badge === 'notifications')?.href || '/dashboard';
