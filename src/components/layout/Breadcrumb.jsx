"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardRoute } from '@/lib/routes';

// Words that read wrongly when a path segment is simply capitalised.
const WORDS = { mpr: 'MPR', mprs: 'MPRs', dpr: 'DPR', dd: 'District', 'mpr-review': 'Review MPRs', 'audit-logs': 'Audit Logs', 'budget-allocation': 'Budget Allocation' };
const looksLikeId = (segment) => /^[a-f0-9]{24}$/i.test(segment) || (segment.length > 15 && !/^[a-z]+(-[a-z]+)+$/.test(segment));
const labelOf = (segment) => {
  if (WORDS[segment]) return WORDS[segment];
  if (looksLikeId(segment)) return 'Details';
  const text = segment.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Where the current page sits: Home, then each level down to this page. */
export function Breadcrumb() {
  const pathname = usePathname() || '';
  const { user } = useAuth();
  if (!pathname.startsWith('/dashboard')) return null;

  const [roleSegment, ...rest] = pathname.split('/').filter((part) => part && part !== 'dashboard');
  const home = user ? getDashboardRoute(user.role) : '/dashboard';

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center text-sm text-slate-500">
      <Link href={home} className="flex flex-shrink-0 items-center rounded p-1 transition-colors hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40" aria-label="Home">
        <Home className="h-4 w-4" aria-hidden="true" />
      </Link>
      {rest.length === 0 && <span className="ml-2 truncate font-medium text-slate-800" aria-current="page">Dashboard</span>}
      {rest.map((segment, index) => {
        const last = index === rest.length - 1;
        const href = `/dashboard/${roleSegment}/${rest.slice(0, index + 1).join('/')}`;
        return (
          <React.Fragment key={href}>
            <ChevronRight className="mx-1.5 h-4 w-4 flex-shrink-0 text-slate-300" aria-hidden="true" />
            {last
              ? <span className="truncate font-medium text-slate-800" aria-current="page">{labelOf(segment)}</span>
              : <Link href={href} className={`truncate rounded transition-colors hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${index < rest.length - 2 ? 'hidden sm:inline' : ''}`}>{labelOf(segment)}</Link>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
