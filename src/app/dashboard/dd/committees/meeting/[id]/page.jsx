"use client";
import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { MeetingView } from '@/components/fieldforms/MeetingView';
import { Skeleton } from '@/components/projects/create/parts';

/** One committee meeting ("new" to enter one). */
export default function MeetingPage() {
  const { id } = useParams();
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><MeetingView key={id} id={id} /></Suspense>;
}
