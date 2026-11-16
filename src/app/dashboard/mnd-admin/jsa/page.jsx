"use client";
import React, { Suspense } from 'react';
import { JsaHub } from '@/components/fieldforms/JsaHub';
import { Skeleton } from '@/components/projects/create/parts';

/** Jal Sanrakshan Abhiyan progress (Prarup-03). */
export default function JsaPage() {
  return <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}><JsaHub /></Suspense>;
}
