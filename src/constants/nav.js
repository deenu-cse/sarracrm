import {
  BarChart3, Bell, CalendarClock, ClipboardCheck, ClipboardList, ClipboardPen, CloudRain, Droplets, FilePlus2, FileSpreadsheet, FolderKanban,
  GraduationCap, Landmark, LayoutDashboard, ListChecks, Mountain, ScrollText, Settings, Users, Wallet, Waves, Waypoints,
} from 'lucide-react';
import { USER_ROLES, WORKFLOW_ROLES, isSystemAdmin, workflowRoleOf } from './roles';

const { MAKER, CHECKER, APPROVER } = WORKFLOW_ROLES;
const is = (...roles) => (user) => roles.includes(workflowRoleOf(user));

/**
 * Sidebar menu of each account role, in categories with sub-items.
 *
 * An entry is a link `{ label, href, icon, badge?, show? }` or a category
 * `{ label, icon, tone, children: [links] }`. `show(user)` limits an entry to some
 * workflow roles of the tier (Maker, Checker, Approver, or the HQ administrator).
 * `badge` names a counter shown next to the link (notifications, queue, h56, meetings).
 * `tone` colours the category's icon.
 */
export const NAV_MENU = {
  [USER_ROLES.PIA_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/officer', icon: LayoutDashboard, tone: 'sky' },
    {
      label: 'Project Management', icon: FolderKanban, tone: 'blue', children: [
        { label: 'My Projects', href: '/dashboard/officer/projects', icon: FolderKanban },
        { label: 'Deadlines', href: '/dashboard/officer/deadlines', icon: CalendarClock },
      ],
    },
    {
      label: 'Monthly Progress (MPR)', icon: ClipboardList, tone: 'emerald', children: [
        { label: 'My MPRs', href: '/dashboard/officer/mprs', icon: ClipboardList, show: is(MAKER) },
        { label: 'MPR Verification', href: '/dashboard/officer/mprs', icon: ClipboardCheck, show: is(CHECKER, APPROVER), badge: 'queue' },
      ],
    },
    { label: 'Budget Head 56', href: '/dashboard/officer/head56', icon: Wallet, badge: 'h56', tone: 'amber' },
    { label: 'Training & Workshop', href: '/dashboard/officer/training', icon: GraduationCap, tone: 'violet' },
    { label: 'Notifications', href: '/dashboard/officer/notifications', icon: Bell, badge: 'notifications', tone: 'rose' },
  ],
  [USER_ROLES.MND_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/mnd', icon: LayoutDashboard, tone: 'sky' },
    {
      label: 'Reports & Analytics', icon: BarChart3, tone: 'blue', children: [
        { label: 'MPR Reports', href: '/dashboard/mnd/mpr', icon: ClipboardList },
        { label: 'Abstract 55', href: '/dashboard/mnd/abstract55', icon: FileSpreadsheet },
        { label: 'Analytics', href: '/dashboard/mnd/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Head 55 Forms', icon: Droplets, tone: 'emerald', children: [
        { label: '55-01 Spring', href: '/dashboard/mnd/head55-01', icon: Droplets },
        { label: '55-02 River', href: '/dashboard/mnd/head55-02', icon: Waves },
        { label: '55-03 Major River', href: '/dashboard/mnd/head55-03', icon: Waypoints },
        { label: '55-04 Ground Water', href: '/dashboard/mnd/head55-04', icon: Mountain },
      ],
    },
    { label: 'Budget Head 56', href: '/dashboard/mnd/head56', icon: Wallet, tone: 'amber' },
    {
      label: 'Committees & Campaigns', icon: Landmark, tone: 'violet', children: [
        { label: 'Committees (HPC, SLEC, DLEC, DNSS)', href: '/dashboard/mnd/committees', icon: Landmark },
        { label: 'Jal Sanrakshan Abhiyan', href: '/dashboard/mnd/jsa', icon: CloudRain },
        { label: 'Training & Workshop', href: '/dashboard/mnd/training', icon: GraduationCap },
      ],
    },
    { label: 'Notifications', href: '/dashboard/mnd/notifications', icon: Bell, badge: 'notifications', tone: 'rose' },
  ],
  [USER_ROLES.DD_LEVEL]: [
    { label: 'Dashboard', href: '/dashboard/dd', icon: LayoutDashboard, tone: 'sky' },
    {
      label: 'Project Management', icon: FolderKanban, tone: 'blue', children: [
        { label: 'District Projects', href: '/dashboard/dd/projects', icon: FolderKanban },
        { label: 'Deadlines', href: '/dashboard/dd/deadlines', icon: CalendarClock },
      ],
    },
    {
      label: 'Monthly Progress (MPR)', icon: ClipboardCheck, tone: 'emerald', children: [
        { label: 'MPR Verification', href: '/dashboard/dd/mpr-review', icon: ClipboardCheck, badge: 'queue' },
        { label: 'District Entry MPRs', href: '/dashboard/dd/mprs', icon: ClipboardPen, show: is(MAKER) },
      ],
    },
    { label: 'Budget Head 56', href: '/dashboard/dd/head56', icon: Wallet, badge: 'h56', tone: 'amber' },
    {
      label: 'Committees & Campaigns', icon: Landmark, tone: 'violet', children: [
        { label: 'Committees (DLEC, DNSS)', href: '/dashboard/dd/committees', icon: Landmark },
        { label: 'Jal Sanrakshan Abhiyan', href: '/dashboard/dd/jsa', icon: CloudRain },
        { label: 'Training & Workshop', href: '/dashboard/dd/training', icon: GraduationCap },
      ],
    },
    { label: 'User Management', href: '/dashboard/dd/users', icon: Users, show: is(MAKER, APPROVER), tone: 'cyan' },
    { label: 'Notifications', href: '/dashboard/dd/notifications', icon: Bell, badge: 'notifications', tone: 'rose' },
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard, tone: 'sky' },
    {
      label: 'Project Management', icon: FolderKanban, tone: 'blue', children: [
        { label: 'New Project Entry', href: '/dashboard/admin/projects/create', icon: FilePlus2, show: is(MAKER) },
        { label: 'Project Status', href: '/dashboard/admin/projects', icon: ListChecks },
        { label: 'Deadlines', href: '/dashboard/admin/deadlines', icon: CalendarClock },
      ],
    },
    {
      label: 'Monthly Progress (MPR)', icon: ClipboardCheck, tone: 'emerald', children: [
        { label: 'MPR Verification', href: '/dashboard/admin/mprs', icon: ClipboardCheck, badge: 'queue' },
      ],
    },
    { label: 'Budget Head 56', href: '/dashboard/admin/head56', icon: Wallet, badge: 'h56', tone: 'amber' },
    {
      label: 'Committees & Campaigns', icon: Landmark, tone: 'violet', children: [
        { label: 'Committees (HPC, SLEC, DLEC, DNSS)', href: '/dashboard/admin/committees', icon: Landmark, badge: 'meetings' },
        { label: 'Jal Sanrakshan Abhiyan', href: '/dashboard/admin/jsa', icon: CloudRain },
        { label: 'Training & Workshop', href: '/dashboard/admin/training', icon: GraduationCap },
      ],
    },
    { label: 'Reports & Analytics', href: '/dashboard/admin/analytics', icon: BarChart3, tone: 'indigo' },
    {
      label: 'Administration', icon: Settings, tone: 'cyan', children: [
        { label: 'User Management', href: '/dashboard/admin/users', icon: Users, show: (user) => isSystemAdmin(user) || is(MAKER, APPROVER)(user) },
        { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ScrollText },
      ],
    },
    { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell, badge: 'notifications', tone: 'rose' },
  ],
  [USER_ROLES.MND_SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/mnd-admin', icon: LayoutDashboard, tone: 'sky' },
    {
      label: 'Reports & Analytics', icon: BarChart3, tone: 'blue', children: [
        { label: 'All Reports', href: '/dashboard/mnd-admin/mpr', icon: ClipboardList },
        { label: 'Advanced Analytics', href: '/dashboard/mnd-admin/analytics', icon: BarChart3 },
        { label: 'Deadlines', href: '/dashboard/mnd-admin/deadlines', icon: CalendarClock },
      ],
    },
    { label: 'Budget Head 56', href: '/dashboard/mnd-admin/head56', icon: Wallet, tone: 'amber' },
    {
      label: 'Committees & Campaigns', icon: Landmark, tone: 'violet', children: [
        { label: 'Committees (HPC, SLEC, DLEC, DNSS)', href: '/dashboard/mnd-admin/committees', icon: Landmark },
        { label: 'Jal Sanrakshan Abhiyan', href: '/dashboard/mnd-admin/jsa', icon: CloudRain },
        { label: 'Training & Workshop', href: '/dashboard/mnd-admin/training', icon: GraduationCap },
      ],
    },
    { label: 'Notifications', href: '/dashboard/mnd-admin/notifications', icon: Bell, badge: 'notifications', tone: 'rose' },
  ],
};

const visible = (user) => (entry) => !entry.show || entry.show(user);

/** Menu of a user: categories keep only the sub-items that apply to their workflow role; empty categories are dropped. */
export const navMenuFor = (user) => {
  if (!user?.role) return [];
  return (NAV_MENU[user.role] || [])
    .filter(visible(user))
    .map((entry) => (entry.children ? { ...entry, children: entry.children.filter(visible(user)) } : entry))
    .filter((entry) => !entry.children || entry.children.length);
};

/** Every link of a user, flat. */
export const navLinksFor = (user) => navMenuFor(user).flatMap((entry) => entry.children || [entry]);

/** Where a role's notification page lives. */
export const notificationsRoute = (role) => (NAV_MENU[role] || []).flatMap((entry) => entry.children || [entry]).find((link) => link.badge === 'notifications')?.href || '/dashboard';
