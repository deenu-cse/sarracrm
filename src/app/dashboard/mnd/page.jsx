"use client";
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';
import { MonitoringOfficerHome } from '@/components/home/MonitoringHome';

export default function Page() {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_OFFICER]}>
      <MonitoringOfficerHome />
    </RoleGuard>
  );
}
