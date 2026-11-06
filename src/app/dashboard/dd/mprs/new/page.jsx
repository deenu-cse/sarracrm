"use client";
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MprEntryWorkspace } from '@/components/mpr/MprEntryWorkspace';
import { Skeleton } from '@/components/projects/create/parts';

const DISTRICT_ROUTES = {
  list: '/dashboard/dd/mprs',
  projects: '/dashboard/dd/projects',
  entry: '/dashboard/dd/mprs/new',
  report: (id) => `/dashboard/dd/mpr-review/project/${id}`,
};

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6" role="status" aria-label="Loading MPR form">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-44" />
      <Skeleton className="h-72" />
    </div>
  );
}

function EntryContent() {
  const params = useSearchParams();
  const initialQuery = {
    projectId: params.get('projectId') || '',
    departmentId: params.get('departmentId') || '',
    fy: params.get('fy') || '',
    month: params.get('month') || '',
    mprId: params.get('mprId') || '',
  };
  return <MprEntryWorkspace key={initialQuery.mprId} initialQuery={initialQuery} routes={DISTRICT_ROUTES} />;
}

/**
 * District-entry Monthly Progress Report: District Technical Staff reports a
 * department on behalf of its PIA. It goes to the District Checker; the PIA
 * approval chain is bypassed for it.
 */
export default function DistrictMprEntryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EntryContent />
    </Suspense>
  );
}
