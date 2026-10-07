"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { ProjectDetailView } from '@/components/projects/detail/ProjectDetailView';
import { DistrictActions } from '@/components/projects/detail/DistrictActions';

/** District-level project detail: accept the project, assign a PIA officer to each department, follow progress. */
export default function DDProjectDetailPage() {
  const { id } = useParams();
  return (
    <ProjectDetailView
      projectId={id}
      backHref="/dashboard/dd/projects"
      renderActions={({ project, budget, refresh }) => <DistrictActions project={project} budget={budget} onDone={refresh} />}
      mprHref={(mpr) => `/dashboard/dd/mpr-review/project/${mpr.id}`}
    />
  );
}
