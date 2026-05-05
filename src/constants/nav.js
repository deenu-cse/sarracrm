import { USER_ROLES } from './roles';

export const NAV_LINKS = {
  [USER_ROLES.PIA_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/officer' },
    { label: 'My Forms', href: '/dashboard/officer/forms' },
    { label: 'New DPR', href: '/dashboard/officer/forms/new' },
    { label: 'Analytics', href: '/dashboard/officer/analytics' },
    { label: 'Notifications', href: '/dashboard/officer/notifications' },
  ],
  [USER_ROLES.MND_OFFICER]: [
    { label: 'Dashboard', href: '/dashboard/mnd' },
    { label: 'MPR Reports', href: '/dashboard/mnd/mpr' },
    { label: 'Analytics', href: '/dashboard/mnd/analytics' },
    { label: 'Notifications', href: '/dashboard/mnd/notifications' },
  ],
  [USER_ROLES.DD_LEVEL]: [
    { label: 'Dashboard', href: '/dashboard/dd' },
    { label: 'Review Forms', href: '/dashboard/dd/review' },
    { label: 'Analytics', href: '/dashboard/dd/analytics' },
    { label: 'Notifications', href: '/dashboard/dd/notifications' },
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'All Forms', href: '/dashboard/admin/forms' },
    { label: 'Analytics', href: '/dashboard/admin/analytics' },
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
