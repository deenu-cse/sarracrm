"use client";
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';
import { MonitoringAdminHome } from '@/components/home/MonitoringHome';

export default function Page() {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <MonitoringAdminHome />
    </RoleGuard>
  );
}
