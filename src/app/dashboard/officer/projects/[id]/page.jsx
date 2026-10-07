"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { ProjectDetailView } from '@/components/projects/detail/ProjectDetailView';
import { PiaActions } from '@/components/projects/detail/PiaActions';

/** PIA officer's view of an assigned project: accept it, then file monthly progress for the assigned department. */
export default function OfficerProjectDetailPage() {
  const { id } = useParams();
  return (
    <ProjectDetailView
      projectId={id}
      backHref="/dashboard/officer/projects"
      renderActions={({ project, user, refresh }) => <PiaActions project={project} user={user} onDone={refresh} />}
      mprHref={(mpr) => `/dashboard/officer/mprs/report/${mpr.id}`}
    />
  );
}
