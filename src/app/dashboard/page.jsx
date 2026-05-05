"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { getDashboardRoute } from '@/lib/routes';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        router.replace(getDashboardRoute(user.role));
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, isAuthenticated, router]);

  return <FullPageSpinner />;
}
