"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { getDashboardRoute } from '@/lib/routes';

/**
 * RoleGuard component to restrict access based on user roles.
 * @param {Object} props
 * @param {string[]} props.allowedRoles - List of roles allowed to access the children.
 * @param {React.ReactNode} props.children - The components to render if authorized.
 * @param {string} props.fallbackPath - Optional custom fallback path if unauthorized.
 */
export const RoleGuard = ({ allowedRoles, children, fallbackPath }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user && !allowedRoles.includes(user.role)) {
        // Redirect to their own dashboard if they are in the wrong place
        const target = fallbackPath || getDashboardRoute(user.role);
        router.replace(target);
      }
    }
  }, [user, isLoading, isAuthenticated, allowedRoles, router, fallbackPath]);

  if (isLoading || !isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return <FullPageSpinner />;
  }

  return <>{children}</>;
};
