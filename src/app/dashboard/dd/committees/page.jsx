"use client";
import React, { Suspense } from 'react';
import { CommitteesHub } from '@/components/fieldforms/CommitteesHub';
import { Skeleton } from '@/components/projects/create/parts';

/** Committees: HPC, SLEC and DLEC meetings and the DNSS of each Gram Panchayat. */
export default function CommitteesPage() {
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><CommitteesHub /></Suspense>;
}
