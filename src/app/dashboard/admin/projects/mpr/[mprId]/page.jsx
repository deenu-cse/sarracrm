"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { MprReportPage } from '@/components/mpr/MprReportPage';

/** State view of a project Monthly Progress Report (read-only). */
export default function AdminMprReportPage() {
  const { mprId } = useParams();
  return (
    <MprReportPage
      key={mprId}
      mprId={mprId}
      backHref="/dashboard/admin/projects"
      backLabel="Back to projects"
      reportHref={(reportId) => `/dashboard/admin/projects/mpr/${reportId}`}
      projectHref={(report) => `/dashboard/admin/projects/${report.project.id}`}
    />
  );
}
