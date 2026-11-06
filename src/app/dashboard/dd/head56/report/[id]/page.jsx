"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { Head56ReportView } from '@/components/head56/Head56ReportView';

/** One Head 56 monthly report: validate, verify and approve at district level. */
export default function Head56ReportPage() {
  const { id } = useParams();
  return <Head56ReportView key={id} id={id} />;
}
