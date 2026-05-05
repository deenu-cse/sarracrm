"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardRoute } from '@/lib/routes';

export function Breadcrumb() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (!pathname.startsWith('/dashboard')) return null;

  const paths = pathname.split('/').filter(p => p && p !== 'dashboard');
  
  // Remove the role segment (officer, dd, admin) for cleaner breadcrumbs
  const roleSegment = paths[0];
  const displayPaths = paths.slice(1);
  
  const homeRoute = user ? getDashboardRoute(user.role) : '/dashboard';

  return (
    <div className="h-10 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 text-sm">
      <div className="flex items-center text-slate-500">
        <Link href={homeRoute} className="hover:text-navy transition-colors flex items-center">
          <Home className="w-4 h-4" />
          <span className="sr-only">Home</span>
        </Link>
        
        {displayPaths.length > 0 && (
          <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0 text-slate-400" />
        )}
        
        {displayPaths.map((path, index) => {
          const isLast = index === displayPaths.length - 1;
          
          // format path: capitalize and replace hyphens
          let label = path.replace(/-/g, ' ');
          label = label.charAt(0).toUpperCase() + label.slice(1);
          
          // if it's an ID (like a long alphanumeric string), truncate or replace with 'Detail'
          if (path.length > 15 && !path.includes(' ')) {
            label = 'Details';
          }

          const href = `/dashboard/${roleSegment}/${displayPaths.slice(0, index + 1).join('/')}`;

          return (
            <React.Fragment key={path}>
              {isLast ? (
                <span className="font-medium text-slate-800" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link href={href} className="hover:text-navy transition-colors">
                  {label}
                </Link>
              )}
              {!isLast && <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0 text-slate-400" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
