"use client";
import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isSystemAdmin } from '@/constants/roles';
import { DISTRICTS } from '@/constants/districts';
import { fetchStateMprs } from '@/lib/mprApi';
import { downloadMprRegister } from '@/lib/lifecycleApi';
import { Notice, RetryButton, Skeleton, inputClass, useMasterList } from '@/components/projects/create/parts';
import { MprList, StatusFilter } from '@/components/mpr/MprList';
import { MprQueue } from '@/components/mpr/MprQueue';
import { RegisterDownload } from '@/components/mpr/MprEvidence';
import { useDebounce } from '@/hooks/useDebounce';

const FILTERS = [
  { value: 'AT_HQ', label: 'At HQ' },
  { value: 'AT_DISTRICT', label: 'At District' },
  { value: 'AT_PIA', label: 'At PIA' },
  { value: 'RETURNED_FOR_CORRECTION', label: 'Returned' },
  { value: 'VERIFIED_BY_STATE', label: 'Verified by State' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
];

const sumOf = (counts, keys) => keys.reduce((total, key) => total + (counts?.[key] || 0), 0);
const href = (report) => `/dashboard/admin/projects/mpr/${report.id}`;

/**
 * SARRA HQ: Monthly Progress Reports of the whole State. The HQ Maker
 * receives and compiles a report approved by the district, the HQ Checker
 * verifies State-level reporting and data consistency, and the HQ Approver
 * gives the final approval that puts it on the State dashboard.
 */
export default function AdminMprsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('AT_HQ');
  const [district, setDistrict] = useState('');
  const [entryMode, setEntryMode] = useState('');
  const [search, setSearch] = useState('');
  const term = useDebounce(search, 350);
  const box = useMasterList(async () => [await fetchStateMprs({ status, district, entryMode, search: term, limit: 100 })], `state:${status}:${district}:${entryMode}:${term}`);
  const result = box.items[0];
  const counts = result?.summary?.counts;

  return (
    <div className="mx-auto max-w-7xl p-4 pb-16 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><ClipboardCheck className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">MPR Verification — SARRA HQ</h1>
            <p className="text-sm text-slate-500">HQ Maker compiles → HQ Checker verifies → HQ Approver gives final approval (Verified by State).</p>
          </div>
        </div>
        <RegisterDownload label="Excel Register" download={() => downloadMprRegister({ status, district, search: term })} />
      </div>

      {!isSystemAdmin(user) && <div className="mb-5"><MprQueue hrefFor={href} /></div>}

      {counts && (
        <dl className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          {[
            ['All reports', result.summary.total],
            ['At PIA', sumOf(counts, ['PENDING_PIA_CHECKER', 'PENDING_PIA_APPROVER'])],
            ['At District', sumOf(counts, ['SUBMITTED_TO_DISTRICT', 'PENDING_DISTRICT_CHECKER', 'PENDING_DISTRICT_APPROVER'])],
            ['At HQ', sumOf(counts, ['SUBMITTED_TO_HQ', 'PENDING_HQ_CHECKER', 'PENDING_HQ_APPROVER'])],
            ['Verified by State', counts.VERIFIED_BY_STATE || 0],
            ['Returned / Rejected', sumOf(counts, ['RETURNED_FOR_CORRECTION', 'REJECTED'])],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-medium text-slate-500">{label}</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="space-y-3 border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">All Project Progress Reports</h2>
            <StatusFilter filters={FILTERS} value={status} onChange={setStatus} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input type="search" aria-label="Search reports" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Report no., Project ID, project or department…" className={inputClass(false)} />
            <select aria-label="Filter by district" value={district} onChange={(event) => setDistrict(event.target.value)} className={inputClass(false)}>
              <option value="">All 13 districts</option>
              {DISTRICTS.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <select aria-label="Filter by entry mode" value={entryMode} onChange={(event) => setEntryMode(event.target.value)} className={inputClass(false)}>
              <option value="">PIA and District entry</option>
              <option value="PIA">PIA entry</option>
              <option value="DISTRICT">District Technical Staff entry</option>
            </select>
          </div>
        </header>
        {box.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" title="Unable to load the reports." action={<RetryButton onClick={box.reload} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && result?.items.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No report matches these filters.</p>}
        {!box.loading && !box.error && result?.items.length > 0 && <MprList reports={result.items} showSubmitter hrefFor={href} actionLabel="Open" />}
      </section>
    </div>
  );
}
