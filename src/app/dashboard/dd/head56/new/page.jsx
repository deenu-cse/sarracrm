"use client";
import React, { Suspense } from 'react';
import { Head56Entry } from '@/components/head56/Head56Entry';
import { Skeleton } from '@/components/projects/create/parts';

/** District Maker: new or continued Head 56 monthly report of the unit. */
export default function Head56NewReportPage() {
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><Head56Entry /></Suspense>;
}
