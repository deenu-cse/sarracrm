"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, ClipboardPlus } from 'lucide-react';
import { fetchMyMprs } from '@/lib/mprApi';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { MprList, StatusFilter } from '@/components/mpr/MprList';
import { MPR_ENTRY_ROUTE } from '@/components/projects/detail/PiaActions';
import { DeadlineBanner } from '@/components/monitoring/DeadlinesBoard';
import { RegisterDownload } from '@/components/mpr/MprEvidence';
import { downloadMprRegister } from '@/lib/lifecycleApi';
import { useT } from '@/contexts/LanguageContext';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'SUBMITTED', label: 'With district' },
  { value: 'RETURNED_TO_PIA', label: 'Returned' },
  { value: 'DISTRICT_APPROVED', label: 'Approved' },
  { value: 'STATE_VERIFIED', label: 'Verified' },
];

/** PIA officer: my Monthly Progress Reports. */
export default function OfficerMPRsPage() {
  const [status, setStatus] = useState('');
  const t = useT();
  const reports = useMasterList(() => fetchMyMprs({ status, limit: 100 }), `mine:${status}`);
  const returned = reports.items.filter((report) => report.status === 'RETURNED_TO_PIA');

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><ClipboardList className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('My MPRs')}</h1>
            <p className="text-sm text-slate-500">{t('Monthly Progress Reports for the departments assigned to you.')}</p>
          </div>
        </div>
        <Link href={MPR_ENTRY_ROUTE} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
          <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> {t('New Monthly Progress Report')}
        </Link>
      </div>

      <div className="mb-4"><DeadlineBanner /></div>

      {returned.length > 0 && (
        <div className="mb-4">
          <Notice tone="warning" title={`${returned.length} report${returned.length === 1 ? ' was' : 's were'} returned for correction`}>
            Correct and resubmit {returned.length === 1 ? 'it' : 'them'} before filing another month for that department.
          </Notice>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{t('Reports')}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilter filters={FILTERS} value={status} onChange={setStatus} />
            <RegisterDownload label={t('Excel Register')} download={() => downloadMprRegister({ status })} />
          </div>
        </header>

        {reports.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!reports.loading && reports.error && <div className="p-5"><Notice tone="error" title="Unable to load your reports." action={<RetryButton onClick={reports.reload} />}>{reports.error}</Notice></div>}
        {!reports.loading && !reports.error && reports.items.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {t(status ? 'No report with this status.' : 'You have not filed a monthly progress report yet.')}
          </p>
        )}
        {!reports.loading && !reports.error && reports.items.length > 0 && (
          <MprList
            reports={reports.items}
            hrefFor={(report) => `/dashboard/officer/mprs/report/${report.id}`}
            actionLabel={(report) => (report.status === 'RETURNED_TO_PIA' ? 'Correct' : 'Open')}
          />
        )}
      </section>

      <p className="mt-4 text-xs text-slate-500">
        Reports filed in the earlier Praroop format are still available under{' '}
        <Link href="/dashboard/officer/mprs/all" className="font-semibold text-navy hover:underline">older reports</Link>.
      </p>
    </div>
  );
}
