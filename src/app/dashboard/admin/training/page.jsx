"use client";
import React, { Suspense } from 'react';
import { TrainingHub } from '@/components/fieldforms/TrainingHub';
import { Skeleton } from '@/components/projects/create/parts';

/** Training and capacity development programmes. */
export default function TrainingPage() {
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><TrainingHub /></Suspense>;
}
