"use client";
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MprEntryWorkspace } from '@/components/mpr/MprEntryWorkspace';
import { Skeleton } from '@/components/projects/create/parts';

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6" role="status" aria-label="Loading MPR form">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-44" />
      <Skeleton className="h-72" />
    </div>
  );
}

function MprEntryContent() {
  const params = useSearchParams();
  const initialQuery = {
    projectId: params.get('projectId') || '',
    departmentId: params.get('departmentId') || '',
    fy: params.get('fy') || '',
    month: params.get('month') || '',
    mprId: params.get('mprId') || '',
  };
  // A different report or project opened from a link starts a fresh form.
  return <MprEntryWorkspace key={`${initialQuery.mprId}`} initialQuery={initialQuery} />;
}

/**
 * Monthly Progress Report entry for PIA officers (forms 55-(1-3) and 55(4)).
 * The Head of the selected project decides which form structure is shown.
 */
export default function MprEntryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MprEntryContent />
    </Suspense>
  );
}
