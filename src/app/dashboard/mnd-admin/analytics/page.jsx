"use client";
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';
import { ProjectAnalyticsDashboard } from '@/components/analytics/ProjectAnalyticsDashboard';
import { Skeleton } from '@/components/projects/create/parts';

const FILTER_KEYS = ['financialYear', 'month', 'district', 'department', 'headCode', 'projectStatus', 'mprStatus'];

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-6" role="status" aria-label="Loading analytics">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-24" />
      <Skeleton className="h-80" />
    </div>
  );
}

function AnalyticsContent() {
  const params = useSearchParams();
  // Filters carried in the link (bookmark or shared view).
  const initialFilters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) || '']));
  return <ProjectAnalyticsDashboard initialFilters={initialFilters} legacyHref="/dashboard/mnd-admin/analytics/legacy" />;
}

/** M&E admin: State-wide analytics across every district. */
export default function MneAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <Suspense fallback={<PageSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </RoleGuard>
  );
}
