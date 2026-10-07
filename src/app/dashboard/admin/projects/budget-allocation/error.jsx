"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

/** Error boundary: a rendering fault never shows a blank page or a stack trace. */
export default function BudgetAllocationError({ error, reset }) {
  useEffect(() => {
    console.error('Budget Allocation page error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl p-6 pt-12">
      <div role="alert" className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong on this page</h1>
        <p className="mt-2 text-sm text-slate-600">
          No budget was allocated by this error. Reload to see the current position saved on the server.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-light focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reload
          </button>
          <Link
            href="/dashboard/admin/projects"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2"
          >
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}
