"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { ProjectDetailView } from '@/components/projects/detail/ProjectDetailView';
import { WorkflowActions } from '@/components/projects/detail/WorkflowActions';

const PROJECTS_ROUTE = '/dashboard/admin/projects';

/** SARRA HQ project detail: verify, sanction, return to the Maker, forward to the district, revise targets, close. */
export default function AdminProjectDetailPage() {
  const { id } = useParams();
  return (
    <ProjectDetailView
      projectId={id}
      backHref={PROJECTS_ROUTE}
      renderActions={({ project, user, refresh }) => (
        <WorkflowActions project={project} user={user} onDone={refresh} />
      )}
      mprHref={(mpr) => `${PROJECTS_ROUTE}/mpr/${mpr.id}`}
    />
  );
}
