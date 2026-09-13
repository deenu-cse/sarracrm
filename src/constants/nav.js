import { USER_ROLES } from './roles';

export const NAV_LINKS = {
  [USER_ROLES.PIA_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/officer' },
    { label: 'My Projects', href: '/dashboard/officer/projects' },
    { label: 'My MPRs', href: '/dashboard/officer/mprs' },
    { label: 'Notifications', href: '/dashboard/officer/notifications' },
  ],
  [USER_ROLES.MND_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/mnd' },
    { label: 'MPR Reports', href: '/dashboard/mnd/mpr' },
    { label: 'Head 55-01 (Spring)', href: '/dashboard/mnd/head55-01' },
    { label: 'Head 55-02 (River)', href: '/dashboard/mnd/head55-02' },
    { label: 'Head 55-03 (Major River)', href: '/dashboard/mnd/head55-03' },
    { label: 'Head 55-04 (Ground Water)', href: '/dashboard/mnd/head55-04' },
    { label: 'Analytics', href: '/dashboard/mnd/analytics' },
  ],
  [USER_ROLES.DD_LEVEL]: [
    { label: 'Dashboard', href: '/dashboard/dd' },
    { label: 'District Projects', href: '/dashboard/dd/projects' },
    { label: 'Review MPRs', href: '/dashboard/dd/mpr-review' },
    { label: 'Notifications', href: '/dashboard/dd/notifications' },
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'Projects', href: '/dashboard/admin/projects' },
    { label: 'Users', href: '/dashboard/admin/users' },
    { label: 'Audit Logs', href: '/dashboard/admin/audit-logs' },
    { label: 'Notifications', href: '/dashboard/admin/notifications' },
  ],
  [USER_ROLES.MND_SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/mnd-admin' },
    { label: 'All Reports', href: '/dashboard/mnd-admin/mpr' },
    { label: 'Advanced Analytics', href: '/dashboard/mnd-admin/analytics' },
    { label: 'Notifications', href: '/dashboard/mnd-admin/notifications' },
  ],
};
