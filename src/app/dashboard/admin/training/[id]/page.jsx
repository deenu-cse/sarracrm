"use client";
import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { TrainingView } from '@/components/fieldforms/TrainingView';
import { Skeleton } from '@/components/projects/create/parts';

/** One training programme ("new" to record one). */
export default function TrainingProgrammePage() {
  const { id } = useParams();
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><TrainingView key={id} id={id} /></Suspense>;
}
