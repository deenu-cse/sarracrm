"use client";
import { RegisterDownload } from './MprEvidence';
import { downloadMprRegister } from '@/lib/lifecycleApi';
import React, { useState } from 'react';
import { fetchDistrictMprs } from '@/lib/mprApi';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { MprList, StatusFilter } from './MprList';
import { MprQueue } from './MprQueue';

const FILTERS = [
  { value: 'AT_PIA', label: 'At PIA' },
  { value: 'AT_DISTRICT', label: 'At District' },
  { value: 'AT_HQ', label: 'At HQ' },
  { value: 'RETURNED_FOR_CORRECTION', label: 'Returned' },
  { value: 'VERIFIED_BY_STATE', label: 'Verified by State' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
];

const href = (report) => `/dashboard/dd/mpr-review/project/${report.id}`;

/**
 * Project Monthly Progress Reports of the district: first what waits for the
 * signed-in user's own step (District Maker receives, Checker verifies,
 * Approver approves and forwards to HQ), then every report of the district.
 */
export function DistrictProjectMprs() {
  const [status, setStatus] = useState('AT_DISTRICT');
  const reports = useMasterList(() => fetchDistrictMprs({ status, limit: 100 }), `district:${status}`);

  return (
    <div className="space-y-4">
      <MprQueue hrefFor={href} />
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">All Project Progress Reports of the District</h2>
            <p className="text-xs text-slate-500">PIA-entered and district-entered reports, wherever they are in the approval chain.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilter filters={FILTERS} value={status} onChange={setStatus} />
            <RegisterDownload download={() => downloadMprRegister({ status })} />
          </div>
        </header>
        {reports.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!reports.loading && reports.error && <div className="p-5"><Notice tone="error" title="Unable to load district reports." action={<RetryButton onClick={reports.reload} />}>{reports.error}</Notice></div>}
        {!reports.loading && !reports.error && reports.items.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No report with this status.</p>
        )}
        {!reports.loading && !reports.error && reports.items.length > 0 && (
          <MprList reports={reports.items} showSubmitter hrefFor={href} actionLabel="Open" />
        )}
      </section>
    </div>
  );
}
