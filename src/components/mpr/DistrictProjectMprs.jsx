"use client";
import { RegisterDownload } from './MprEvidence';
import { downloadMprRegister } from '@/lib/lifecycleApi';
import React, { useState } from 'react';
import { fetchDistrictMprs } from '@/lib/mprApi';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { MprList, StatusFilter } from './MprList';

const FILTERS = [
  { value: 'SUBMITTED', label: 'Awaiting review' },
  { value: 'RETURNED_TO_PIA', label: 'Returned' },
  { value: 'DISTRICT_APPROVED', label: 'Approved' },
  { value: 'STATE_VERIFIED', label: 'Verified by State' },
  { value: '', label: 'All' },
];

/** Project Monthly Progress Reports of the District Director's district. */
export function DistrictProjectMprs() {
  const [status, setStatus] = useState('SUBMITTED');
  const reports = useMasterList(() => fetchDistrictMprs({ status, limit: 100 }), `district:${status}`);

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Project Progress Reports</h2>
          <p className="text-xs text-slate-500">Filed by the PIA officer of each department. Open a report to approve it or return it for correction.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusFilter filters={FILTERS} value={status} onChange={setStatus} />
          <RegisterDownload download={() => downloadMprRegister({ status })} />
        </div>
      </header>
      {reports.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
      {!reports.loading && reports.error && <div className="p-5"><Notice tone="error" title="Unable to load district reports." action={<RetryButton onClick={reports.reload} />}>{reports.error}</Notice></div>}
      {!reports.loading && !reports.error && reports.items.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-500">{status === 'SUBMITTED' ? 'No report is waiting for your review.' : 'No report with this status.'}</p>
      )}
      {!reports.loading && !reports.error && reports.items.length > 0 && (
        <MprList
          reports={reports.items}
          showSubmitter
          hrefFor={(report) => `/dashboard/dd/mpr-review/project/${report.id}`}
          actionLabel={(report) => (report.status === 'SUBMITTED' ? 'Review' : 'Open')}
        />
      )}
    </section>
  );
}
