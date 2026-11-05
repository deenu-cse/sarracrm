"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { MprReportPage } from '@/components/mpr/MprReportPage';

/** SARRA HQ view of a project Monthly Progress Report: compile, verify, final approval, return or reject. */
export default function AdminMprReportPage() {
  const { mprId } = useParams();
  return (
    <MprReportPage
      key={mprId}
      mprId={mprId}
      backHref="/dashboard/admin/mprs"
      backLabel="Back to MPR verification"
      reportHref={(reportId) => `/dashboard/admin/projects/mpr/${reportId}`}
      projectHref={(report) => `/dashboard/admin/projects/${report.project.id}`}
    />
  );
}
