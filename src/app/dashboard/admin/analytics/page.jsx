"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function AdminAnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin');
  }, [router]);

  return <FullPageSpinner />;
}
