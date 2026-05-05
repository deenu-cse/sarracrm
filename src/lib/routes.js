import { USER_ROLES } from '@/constants/roles';

export const getDashboardRoute = (role) => {
  switch (role) {
    case USER_ROLES.PIA_OFFICER:
      return '/dashboard/officer';
    case USER_ROLES.DD_LEVEL:
      return '/dashboard/dd';
    case USER_ROLES.SUPER_ADMIN:
      return '/dashboard/admin';
    case USER_ROLES.MND_OFFICER:
      return '/dashboard/mnd';
    case USER_ROLES.MND_SUPER_ADMIN:
      return '/dashboard/mnd-admin';
    default:
      return '/login';
  }
};
