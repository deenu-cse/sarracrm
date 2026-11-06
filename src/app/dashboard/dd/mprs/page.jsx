"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ClipboardPen, ClipboardPlus } from 'lucide-react';
import { fetchMyMprs } from '@/lib/mprApi';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { MprList, StatusFilter } from '@/components/mpr/MprList';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'WITH_MAKER', label: 'Drafts & returned' },
  { value: 'AT_DISTRICT', label: 'At District' },
  { value: 'AT_HQ', label: 'At HQ' },
  { value: 'VERIFIED_BY_STATE', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

/** District Technical Staff: reports of the departments the district reports on (Option B of the workflow). */
export default function DistrictEntryMprsPage() {
  const [status, setStatus] = useState('');
  const reports = useMasterList(() => fetchMyMprs({ status, limit: 100 }), `district-entry:${status}`);
  const needAction = reports.items.filter((report) => ['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(report.status));

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><ClipboardPen className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">District Entry MPRs</h1>
            <p className="text-sm text-slate-500">Monthly progress you report as District Technical Staff, on behalf of the PIA. Submitted reports go to the District Checker.</p>
          </div>
        </div>
        <Link href="/dashboard/dd/mprs/new" className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
          <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> New District Entry MPR
        </Link>
      </div>

      {needAction.length > 0 && (
        <div className="mb-4">
          <Notice tone="warning" title={`${needAction.length} report${needAction.length === 1 ? ' needs' : 's need'} your action`}>
            Submit saved drafts and correct returned reports before filing another month for that department.
          </Notice>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Reports</h2>
          <StatusFilter filters={FILTERS} value={status} onChange={setStatus} />
        </header>
        {reports.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!reports.loading && reports.error && <div className="p-5"><Notice tone="error" title="Unable to load your reports." action={<RetryButton onClick={reports.reload} />}>{reports.error}</Notice></div>}
        {!reports.loading && !reports.error && reports.items.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {status ? 'No report with this status.' : 'No district-entry report yet. Reports appear here for departments where the District Maker has given the reporting responsibility to you.'}
          </p>
        )}
        {!reports.loading && !reports.error && reports.items.length > 0 && (
          <MprList
            reports={reports.items}
            hrefFor={(report) => (['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(report.status) ? `/dashboard/dd/mprs/new?mprId=${report.id}` : `/dashboard/dd/mpr-review/project/${report.id}`)}
            actionLabel={(report) => ({ DRAFT: 'Continue', RETURNED_FOR_CORRECTION: 'Correct' }[report.status] || 'Open')}
          />
        )}
      </section>
    </div>
  );
}
