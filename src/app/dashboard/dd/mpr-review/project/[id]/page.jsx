"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { MprReportPage } from '@/components/mpr/MprReportPage';

/** District review of a project Monthly Progress Report: approve it or return it for correction. */
export default function DistrictMprReviewPage() {
  const { id } = useParams();
  return (
    <MprReportPage
      key={id}
      mprId={id}
      backHref="/dashboard/dd/mpr-review"
      backLabel="Back to MPR review"
      reportHref={(reportId) => `/dashboard/dd/mpr-review/project/${reportId}`}
      projectHref={(report) => `/dashboard/dd/projects/${report.project.id}`}
    />
  );
}
