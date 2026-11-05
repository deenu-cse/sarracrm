"use client";
import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { fetchMprQueue } from '@/lib/mprApi';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { MprList } from './MprList';

/**
 * Reports waiting for the signed-in user's own review step (PIA Checker,
 * District Maker, HQ Approver …), oldest first. The backend decides which.
 */
export function MprQueue({ hrefFor, title = 'Awaiting your action', emptyText = 'Nothing is waiting for your action.' }) {
  const box = useMasterList(async () => (await fetchMprQueue({ limit: 200 })).items, 'mpr-queue');

  return (
    <section className="rounded-xl border border-amber-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-amber-700" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {!box.loading && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-800">{box.items.length}</span>}
        </div>
        <p className="text-xs text-slate-500">Open a report to verify and forward it, return it to its Maker, or (Approvers) reject it.</p>
      </header>
      {box.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
      {!box.loading && box.error && <div className="p-5"><Notice tone="error" title="Unable to load the reports waiting for you." action={<RetryButton onClick={box.reload} />}>{box.error}</Notice></div>}
      {!box.loading && !box.error && box.items.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">{emptyText}</p>}
      {!box.loading && !box.error && box.items.length > 0 && <MprList reports={box.items} hrefFor={hrefFor} showSubmitter actionLabel="Review" />}
    </section>
  );
}
