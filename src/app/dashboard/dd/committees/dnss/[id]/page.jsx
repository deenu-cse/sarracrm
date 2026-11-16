"use client";
import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DnssView } from '@/components/fieldforms/DnssView';
import { Skeleton } from '@/components/projects/create/parts';

/** One Dhara Naula Sanrakshan Samiti ("new" to enter one). */
export default function DnssPage() {
  const { id } = useParams();
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><DnssView key={id} id={id} /></Suspense>;
}
