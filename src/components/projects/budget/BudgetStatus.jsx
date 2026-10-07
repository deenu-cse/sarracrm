"use client";
import React from 'react';
import Link from 'next/link';
import { Check, IndianRupee } from 'lucide-react';
import { formatIndian } from '@/lib/numeric';

export const BUDGET_ALLOCATION_ROUTE = '/dashboard/admin/projects/budget-allocation';

export const ORDINALS = ['', '1st', '2nd', '3rd', '4th'];
export const ordinal = (n) => ORDINALS[n] || `${n}th`;

/** Small animated tick used wherever something becomes fully allocated. */
export function AllocatedTick({ className = 'h-4 w-4' }) {
  return (
    <span className={`wz-pop-in inline-flex flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path className="wz-check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

export function ProgressBar({ percent, complete = false, pendingPercent = 0, label }) {
  const done = Math.max(0, Math.min(100, percent || 0));
  const pending = Math.max(0, Math.min(100 - done, pendingPercent || 0));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(done)}
      className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div className={`h-full transition-[width] duration-500 ease-out ${complete ? 'bg-emerald-600' : 'bg-navy'}`} style={{ width: `${done}%` }} />
      {pending > 0 && <div className="h-full bg-navy/35 transition-[width] duration-300 ease-out" style={{ width: `${pending}%` }} />}
    </div>
  );
}

/**
 * Budget column for the projects list. Everything shown comes from the
 * backend-calculated `project.budget`.
 */
export function ProjectBudgetCell({ project, canAllocate }) {
  const budget = project.budget;
  if (!budget || budget.ineligibleCode === 'NO_DEPARTMENTS') return <span className="text-slate-300">—</span>;

  const full = budget.allocationStatus === 'FULLY_ALLOCATED';
  const figures = `₹${formatIndian(budget.totalAllocatedLakh, { minDecimals: 2 })} / ₹${formatIndian(budget.totalBudgetLakh, { minDecimals: 2 })} L`;

  return (
    <div className="min-w-[11rem]">
      <p className="text-xs font-semibold tabular-nums text-slate-700">{figures}</p>
      <div className="mt-1.5 w-36">
        <ProgressBar percent={budget.percentAllocated} complete={full} label={`Budget allocated for ${project.projectTitle || 'project'}`} />
      </div>
      <div className="mt-2">
        {full ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
            <AllocatedTick className="h-3.5 w-3.5" /> Budget Fully Allocated
          </span>
        ) : budget.eligible ? (
          canAllocate ? (
            <Link
              href={`${BUDGET_ALLOCATION_ROUTE}?projectId=${project._id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-1"
            >
              <IndianRupee className="h-3 w-3" aria-hidden="true" /> Budget Allocate
            </Link>
          ) : (
            <span className="text-xs font-medium text-slate-500">
              {budget.allocationStatus === 'PARTIALLY_ALLOCATED' ? 'Partially allocated' : 'Not allocated yet'}
            </span>
          )
        ) : (
          <span className="text-xs font-medium text-slate-400" title="Budget can be allocated after the project is approved">
            {budget.ineligibleCode === 'REJECTED' ? 'Project rejected' : 'Available after approval'}
          </span>
        )}
      </div>
    </div>
  );
}

/** Check icon for inline text such as "₹100 / ₹100 ✓". */
export function InlineCheck() {
  return <Check className="wz-pop-in inline h-4 w-4 text-emerald-600" strokeWidth={3} aria-hidden="true" />;
}
