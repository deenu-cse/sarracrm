"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { Head56AllocationEditor } from '@/components/head56/Head56AllocationEditor';

/** One unit's Head 56 allocation: read. */
export default function Head56AllocationPage() {
  const { id } = useParams();
  return <Head56AllocationEditor key={id} id={id} />;
}
