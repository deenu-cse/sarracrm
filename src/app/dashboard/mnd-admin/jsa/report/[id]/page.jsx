"use client";
import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { JsaReportView } from '@/components/fieldforms/JsaReportView';
import { Skeleton } from '@/components/projects/create/parts';

/** One JSA village / block / district report and its weekly progress ("new" to start one). */
export default function JsaReportPage() {
  const { id } = useParams();
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><JsaReportView key={id} id={id} /></Suspense>;
}
