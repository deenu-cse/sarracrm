"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { MprReportPage } from '@/components/mpr/MprReportPage';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

/** M&E admin: a project Monthly Progress Report, with State verification once the district has approved it. */
export default function MneAdminProjectMprPage() {
  const { id } = useParams();
  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <MprReportPage
        key={id}
        mprId={id}
        backHref="/dashboard/mnd-admin/mpr"
        backLabel="Back to MPR hub"
        reportHref={(reportId) => `/dashboard/mnd-admin/mpr/project/${reportId}`}
      />
    </RoleGuard>
  );
}
