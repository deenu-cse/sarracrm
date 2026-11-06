"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { fetchH56Queue, fetchH56Reports } from '@/lib/head56Api';
import { DISTRICTS } from '@/constants/districts';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES, workflowRoleOf } from '@/constants/roles';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { FilterSelect, FY_MONTHS, LevelPill, amount, fyOptions, moment, pct, useH56Base } from './shared';

const STATUS_FILTERS = [
  { value: 'WITH_MAKER', label: 'Drafts & returned' },
  { value: 'AT_PIA', label: 'At PIA verification' },
  { value: 'AT_DISTRICT', label: 'At District verification' },
  { value: 'AT_HQ', label: 'At HQ verification' },
  { value: 'VERIFIED_BY_STATE', label: 'Verified by State' },
  { value: 'REJECTED', label: 'Rejected' },
];

function ReportTable({ items, base, showUnit = true }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-2.5">Report</th>
            {showUnit && <th scope="col" className="px-3 py-2.5">Unit</th>}
            <th scope="col" className="px-3 py-2.5">Status</th>
            <th scope="col" className="px-3 py-2.5 text-right">This month (₹ L)</th>
            <th scope="col" className="px-3 py-2.5 text-right">Year to date (₹ L)</th>
            <th scope="col" className="px-3 py-2.5 text-right">Utilised</th>
            <th scope="col" className="px-5 py-2.5 text-right">Since</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/60">
              <th scope="row" className="px-5 py-3 text-left font-normal">
                <Link href={`${base}/report/${r.id}`} className="font-semibold text-navy hover:underline">{r.period}</Link>
                <span className="block font-mono text-xs text-slate-500">{r.mprNo}</span>
              </th>
              {showUnit && <td className="px-3 py-3"><span className="block font-medium text-slate-900">{r.unitName}</span><LevelPill level={r.level} label={r.levelLabel} /></td>}
              <td className="px-3 py-3"><Badge status={r.status} />{r.awaiting && <span className="mt-1 block text-xs text-slate-500">With {r.awaiting}</span>}</td>
              <td className="px-3 py-3 text-right tabular-nums">{amount(r.expenditureCurrentLakh)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{amount(r.expenditureFyLakh)}<span className="block text-xs text-slate-500">of {amount(r.budgetLakh)}</span></td>
              <td className="px-3 py-3 text-right tabular-nums">{pct(r.utilisationPercent)}</td>
              <td className="px-5 py-3 text-right text-xs text-slate-500">{moment(r.stageEnteredAt || r.updatedAt)}{r.submittedBy && <span className="block">by {r.submittedBy}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Head 56 reports: what waits for the signed-in user's step, and every report they may see. */
export function Head56Reports({ financialYear, onYearChange, isMaker, onQueueCount }) {
  const base = useH56Base();
  const { user } = useAuth();
  const stateWide = [USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(user?.role);
  // Everyone in the three tiers takes a review step, except the PIA Maker (it only prepares reports).
  const reviewer = [USER_ROLES.SUPER_ADMIN, USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER].includes(user?.role)
    && !(user?.role === USER_ROLES.PIA_OFFICER && workflowRoleOf(user) === 'MAKER');
  const [queue, setQueue] = useState({ items: [], total: 0, loading: reviewer, error: '' });
  const [filters, setFilters] = useState({ status: '', month: '', district: '', level: '', mine: false });
  const [page, setPage] = useState(1);
  const [box, setBox] = useState({ items: [], pagination: {}, loading: true, error: '', attempt: 0 });

  useEffect(() => {
    if (!reviewer) return;
    fetchH56Queue().then((result) => { setQueue({ ...result, loading: false, error: '' }); onQueueCount?.(result.total); })
      .catch((err) => setQueue({ items: [], total: 0, loading: false, error: err?.message }));
  }, [reviewer, box.attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let live = true;
    setBox((current) => ({ ...current, loading: true, error: '' }));
    fetchH56Reports({ financialYear, ...filters, mine: filters.mine ? 'true' : '', page, limit: 20 })
      .then((result) => live && setBox((current) => ({ ...current, ...result, loading: false })))
      .catch((err) => live && setBox((current) => ({ ...current, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [financialYear, filters, page, box.attempt]);

  const set = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };

  return (
    <div className="space-y-5">
      {reviewer && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Inbox className="h-4 w-4 text-navy" aria-hidden="true" />Awaiting your action{queue.total > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{queue.total}</span>}</h2>
          </header>
          {queue.loading && <div className="p-5"><Skeleton className="h-16" /></div>}
          {queue.error && <div className="p-5"><Notice tone="error">{queue.error}</Notice></div>}
          {!queue.loading && !queue.error && (queue.items.length ? <ReportTable items={queue.items} base={base} /> : <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing is waiting for your verification.</p>)}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-3">
          <FilterSelect id="rp-fy" label="Financial year" value={financialYear} onChange={onYearChange} options={fyOptions()} />
          <FilterSelect id="rp-month" label="Month" value={filters.month} onChange={(v) => set('month', v)} allLabel="All months" options={FY_MONTHS} />
          <FilterSelect id="rp-status" label="Status" value={filters.status} onChange={(v) => set('status', v)} allLabel="All statuses" options={STATUS_FILTERS} />
          {stateWide && <FilterSelect id="rp-district" label="District" value={filters.district} onChange={(v) => set('district', v)} allLabel="All districts" options={DISTRICTS} />}
          {user?.role !== USER_ROLES.PIA_OFFICER && <FilterSelect id="rp-level" label="Level" value={filters.level} onChange={(v) => set('level', v)} allLabel="All levels" options={[{ value: 'HQ', label: 'SARRA HQ' }, { value: 'DISTRICT', label: 'District SARRA Centres' }, { value: 'PIA', label: 'PIAs' }]} />}
          {isMaker && <label className="flex items-center gap-2 pb-2 text-sm text-slate-700"><input type="checkbox" checked={filters.mine} onChange={(event) => set('mine', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />Prepared by me</label>}
        </header>
        {box.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" title="Unable to load reports." action={<RetryButton onClick={() => setBox((current) => ({ ...current, attempt: current.attempt + 1 }))} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && (box.items.length ? <ReportTable items={box.items} base={base} /> : <p className="px-5 py-12 text-center text-sm text-slate-500">No Head 56 report for these filters.{isMaker ? ' Use “New Monthly Report” to file one.' : ''}</p>)}
      </section>
      {box.pagination?.totalPages > 1 && <Pagination currentPage={box.pagination.page} totalPages={box.pagination.totalPages} totalItems={box.pagination.total} limit={20} onPageChange={setPage} />}
    </div>
  );
}
