import {
  BarChart3, Bell, CalendarClock, ClipboardCheck, ClipboardList, ClipboardPen, Droplets, FileSpreadsheet, FolderKanban,
  LayoutDashboard, Mountain, ScrollText, Users, Wallet, Waves, Waypoints,
} from 'lucide-react';
import { USER_ROLES, WORKFLOW_ROLES, isSystemAdmin, workflowRoleOf } from './roles';

const { MAKER, CHECKER, APPROVER } = WORKFLOW_ROLES;
const is = (...roles) => (user) => roles.includes(workflowRoleOf(user));

/**
 * Sidebar links of each account role. `icon` is the lucide icon shown in the
 * rail. `show(user)` limits a link to some workflow roles of the tier (Maker,
 * Checker, Approver, or the HQ administrator).
 */
export const NAV_LINKS = {
  [USER_ROLES.PIA_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/officer', icon: LayoutDashboard },
    { label: 'My Projects', href: '/dashboard/officer/projects', icon: FolderKanban },
    { label: 'My MPRs', href: '/dashboard/officer/mprs', icon: ClipboardList, show: is(MAKER) },
    { label: 'MPR Verification', href: '/dashboard/officer/mprs', icon: ClipboardCheck, show: is(CHECKER, APPROVER), badge: 'queue' },
    { label: 'Head 56', href: '/dashboard/officer/head56', icon: Wallet, badge: 'h56' },
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
    { label: 'Head 56', href: '/dashboard/mnd/head56', icon: Wallet },
    { label: 'Analytics', href: '/dashboard/mnd/analytics', icon: BarChart3 },
    { label: 'Notifications', href: '/dashboard/mnd/notifications', icon: Bell, badge: 'notifications' },
  ],
  [USER_ROLES.DD_LEVEL]: [
    { label: 'Dashboard', href: '/dashboard/dd', icon: LayoutDashboard },
    { label: 'District Projects', href: '/dashboard/dd/projects', icon: FolderKanban },
    { label: 'MPR Verification', href: '/dashboard/dd/mpr-review', icon: ClipboardCheck, badge: 'queue' },
    { label: 'District Entry MPRs', href: '/dashboard/dd/mprs', icon: ClipboardPen, show: is(MAKER) },
    { label: 'Head 56', href: '/dashboard/dd/head56', icon: Wallet, badge: 'h56' },
    { label: 'Deadlines', href: '/dashboard/dd/deadlines', icon: CalendarClock },
    { label: 'Users', href: '/dashboard/dd/users', icon: Users, show: is(MAKER, APPROVER) },
    { label: 'Notifications', href: '/dashboard/dd/notifications', icon: Bell, badge: 'notifications' },
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Projects', href: '/dashboard/admin/projects', icon: FolderKanban },
    { label: 'MPR Verification', href: '/dashboard/admin/mprs', icon: ClipboardCheck, badge: 'queue' },
    { label: 'Head 56', href: '/dashboard/admin/head56', icon: Wallet, badge: 'h56' },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    { label: 'Deadlines', href: '/dashboard/admin/deadlines', icon: CalendarClock },
    { label: 'Users', href: '/dashboard/admin/users', icon: Users, show: (user) => isSystemAdmin(user) || is(MAKER, APPROVER)(user) },
    { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ScrollText },
    { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell, badge: 'notifications' },
  ],
  [USER_ROLES.MND_SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/mnd-admin', icon: LayoutDashboard },
    { label: 'All Reports', href: '/dashboard/mnd-admin/mpr', icon: ClipboardList },
    { label: 'Head 56', href: '/dashboard/mnd-admin/head56', icon: Wallet },
    { label: 'Advanced Analytics', href: '/dashboard/mnd-admin/analytics', icon: BarChart3 },
    { label: 'Deadlines', href: '/dashboard/mnd-admin/deadlines', icon: CalendarClock },
    { label: 'Notifications', href: '/dashboard/mnd-admin/notifications', icon: Bell, badge: 'notifications' },
  ],
};

/** Links of a user: the links of their account role that apply to their workflow role. */
export const navLinksFor = (user) => {
  if (!user?.role) return [];
  return (NAV_LINKS[user.role] || []).filter((link) => !link.show || link.show(user));
};

/** Where a role's notification page lives. */
export const notificationsRoute = (role) => (NAV_LINKS[role] || []).find((link) => link.badge === 'notifications')?.href || '/dashboard';
