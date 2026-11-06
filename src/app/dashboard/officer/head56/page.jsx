"use client";
import React, { Suspense } from 'react';
import { Head56Hub } from '@/components/head56/Head56Hub';
import { Skeleton } from '@/components/projects/create/parts';

/** Budget Head 56 — Non-Salary Grant: PIA — its own reports and allocation. */
export default function Head56Page() {
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><Head56Hub /></Suspense>;
}
