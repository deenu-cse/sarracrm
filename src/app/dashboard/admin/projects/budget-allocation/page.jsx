"use client";
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BudgetAllocationWorkspace } from '@/components/projects/budget/BudgetAllocationWorkspace';
import { Notice, Skeleton } from '@/components/projects/create/parts';

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6" role="status" aria-label="Loading budget allocation">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}

function BudgetAllocationContent() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  // Present when the user came from a project row: that project is then fixed.
  const lockedProjectId = searchParams.get('projectId') || null;

  if (isLoading) return <PageSkeleton />;

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Notice tone="warning" title="You cannot view budget allocation">
          Budget allocation is available to state-level administrators only.
        </Notice>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <BudgetAllocationWorkspace
      key={lockedProjectId || 'select'}
      lockedProjectId={lockedProjectId}
      canAllocate={user.workflowRole === 'MAKER'}
    />
  );
}

export default function BudgetAllocationPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BudgetAllocationContent />
    </Suspense>
  );
}
