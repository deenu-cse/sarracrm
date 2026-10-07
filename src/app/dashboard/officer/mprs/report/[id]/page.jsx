"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { MprReportPage } from '@/components/mpr/MprReportPage';

/** PIA officer: one of my reports. A returned report can be corrected and resubmitted from here. */
export default function OfficerMprReportPage() {
  const { id } = useParams();
  return (
    <MprReportPage
      key={id}
      mprId={id}
      backHref="/dashboard/officer/mprs"
      backLabel="Back to my MPRs"
      correctionHref={(report) => `/dashboard/officer/forms/new?mprId=${report.id}`}
      reportHref={(reportId) => `/dashboard/officer/mprs/report/${reportId}`}
      projectHref={(report) => `/dashboard/officer/projects/${report.project.id}`}
    />
  );
}
