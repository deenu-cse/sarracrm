"use client";
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Layers } from 'lucide-react';
import { ProjectDetailView } from '@/components/projects/detail/ProjectDetailView';
import { WorkflowActions } from '@/components/projects/detail/WorkflowActions';

const PROJECTS_ROUTE = '/dashboard/admin/projects';

/** State-level project detail: review, sanction, forward to district and budget allocation. */
export default function AdminProjectDetailPage() {
  const { id } = useParams();
  return (
    <ProjectDetailView
      projectId={id}
      backHref={PROJECTS_ROUTE}
      renderActions={({ project, budget, user, refresh }) => (
        <WorkflowActions project={project} budget={budget} user={user} onDone={refresh} />
      )}
      renderBudgetAction={({ project, budget, user }) => (budget?.eligible && user?.workflowRole === 'MAKER' ? (
        <Link
          href={`${PROJECTS_ROUTE}/budget-allocation?projectId=${project._id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-1"
        >
          <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Allocate Next Installment
        </Link>
      ) : null)}
      mprHref={(mpr) => `${PROJECTS_ROUTE}/mpr/${mpr.id}`}
    />
  );
}
