"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ClipboardList, ClipboardPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { workflowRoleOf } from '@/constants/roles';
import { fetchMyMprs } from '@/lib/mprApi';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { MprList, StatusFilter } from '@/components/mpr/MprList';
import { MprQueue } from '@/components/mpr/MprQueue';
import { MPR_ENTRY_ROUTE } from '@/components/projects/detail/PiaActions';
import { DeadlineBanner } from '@/components/monitoring/DeadlinesBoard';
import { RegisterDownload } from '@/components/mpr/MprEvidence';
import { downloadMprRegister } from '@/lib/lifecycleApi';
import { useT } from '@/contexts/LanguageContext';

const MAKER_FILTERS = [
  { value: '', label: 'All' },
  { value: 'WITH_MAKER', label: 'Drafts & returned' },
  { value: 'AT_PIA', label: 'At PIA' },
  { value: 'AT_DISTRICT', label: 'At District' },
  { value: 'AT_HQ', label: 'At HQ' },
  { value: 'VERIFIED_BY_STATE', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];
const REVIEWER_FILTERS = MAKER_FILTERS.filter((filter) => filter.value !== 'WITH_MAKER').concat({ value: 'RETURNED_FOR_CORRECTION', label: 'Returned' });

const reportHref = (report) => `/dashboard/officer/mprs/report/${report.id}`;

/**
 * PIA: Monthly Progress Reports. The PIA Maker files and corrects them; the
 * PIA Checker verifies and the PIA Approver approves and submits them to the
 * district.
 */
export default function OfficerMPRsPage() {
  const { user } = useAuth();
  const maker = workflowRoleOf(user) === 'MAKER';
  const [status, setStatus] = useState('');
  const t = useT();
  const reports = useMasterList(() => fetchMyMprs({ status, limit: 100 }), `mine:${status}`);
  const withMaker = maker ? reports.items.filter((report) => ['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(report.status)) : [];

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true">{maker ? <ClipboardList className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t(maker ? 'My MPRs' : 'MPR Verification')}</h1>
            <p className="text-sm text-slate-500">
              {maker
                ? t('Monthly Progress Reports for the departments assigned to you. Submitted reports go to the PIA Checker.')
                : `Monthly Progress Reports of ${user?.department || 'your department'} in ${user?.district || 'your district'}.`}
            </p>
          </div>
        </div>
        {maker && (
          <Link href={MPR_ENTRY_ROUTE} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
            <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> {t('New Monthly Progress Report')}
          </Link>
        )}
      </div>

      {maker && <div className="mb-4"><DeadlineBanner /></div>}
      {!maker && <div className="mb-5"><MprQueue hrefFor={reportHref} /></div>}

      {withMaker.length > 0 && (
        <div className="mb-4">
          <Notice tone="warning" title={`${withMaker.length} report${withMaker.length === 1 ? ' needs' : 's need'} your action`}>
            Submit saved drafts and correct returned reports before filing another month for that department.
          </Notice>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{t(maker ? 'Reports' : 'All reports of the department')}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilter filters={maker ? MAKER_FILTERS : REVIEWER_FILTERS} value={status} onChange={setStatus} />
            <RegisterDownload label={t('Excel Register')} download={() => downloadMprRegister({ status })} />
          </div>
        </header>

        {reports.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!reports.loading && reports.error && <div className="p-5"><Notice tone="error" title="Unable to load the reports." action={<RetryButton onClick={reports.reload} />}>{reports.error}</Notice></div>}
        {!reports.loading && !reports.error && reports.items.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {t(status ? 'No report with this status.' : (maker ? 'You have not filed a monthly progress report yet.' : 'No report has been submitted for your department yet.'))}
          </p>
        )}
        {!reports.loading && !reports.error && reports.items.length > 0 && (
          <MprList
            reports={reports.items}
            showSubmitter={!maker}
            hrefFor={(report) => (maker && ['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(report.status) ? `${MPR_ENTRY_ROUTE}?mprId=${report.id}` : reportHref(report))}
            actionLabel={(report) => (maker ? ({ DRAFT: 'Continue', RETURNED_FOR_CORRECTION: 'Correct' }[report.status] || 'Open') : 'Open')}
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
