"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { MprReportPage } from '@/components/mpr/MprReportPage';

/** A project Monthly Progress Report at district level: receive, verify, approve and forward to HQ, or return it. */
export default function DistrictMprReviewPage() {
  const { id } = useParams();
  return (
    <MprReportPage
      key={id}
      mprId={id}
      backHref="/dashboard/dd/mpr-review"
      backLabel="Back to MPR verification"
      // District Technical Staff corrects its own district-entry reports.
      correctionHref={(report) => `/dashboard/dd/mprs/new?mprId=${report.id}`}
      reportHref={(reportId) => `/dashboard/dd/mpr-review/project/${reportId}`}
      projectHref={(report) => `/dashboard/dd/projects/${report.project.id}`}
    />
  );
}
