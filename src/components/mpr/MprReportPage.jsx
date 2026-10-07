"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ChevronLeft, Download, PencilLine, Printer, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { approveMpr, fetchMpr, returnMpr, stateReturnMpr, verifyMpr } from '@/lib/mprApi';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { downloadCsv } from '@/components/projects/detail/shared';
import { MprAnalysis } from './MprAnalysis';
import { MprReportDocument } from './MprReportDocument';
import { MprDownloads, MprEvidence } from './MprEvidence';

const STATUS_NOTES = {
  SUBMITTED: 'Submitted',
  DISTRICT_APPROVED: 'Approved by district',
  RETURNED_TO_PIA: 'Returned for correction',
  STATE_VERIFIED: 'Verified by State',
};

// Where the report is in its review: PIA → District → State.
const STAGES = [
  { key: 'SUBMITTED', label: 'Submitted by PIA' },
  { key: 'DISTRICT_APPROVED', label: 'Approved by District' },
  { key: 'STATE_VERIFIED', label: 'Verified by State' },
];
const STAGE_INDEX = { SUBMITTED: 1, RETURNED_TO_PIA: 0, DISTRICT_APPROVED: 2, STATE_VERIFIED: 3 };

const DIALOGS = {
  approve: { title: 'Approve this report?', description: 'Confirms the reported progress for the district. An approved report can no longer be changed.', confirm: 'Approve Report', noteLabel: 'Note', required: false, variant: 'success' },
  return: { title: 'Return this report for correction?', description: 'The PIA officer is notified with your reason and must correct and resubmit before filing another month.', confirm: 'Return Report', noteLabel: 'Reason for return', required: true, variant: 'primary' },
  stateReturn: { title: 'Return this report for correction?', description: 'The report goes back to the PIA officer with your reason. After it is corrected the district reviews it again before it returns to you.', confirm: 'Return Report', noteLabel: 'Reason for return', required: true, variant: 'primary' },
  verify: { title: 'Verify this report for the State?', description: 'Records State-level verification of a report the district has approved. This is the final step.', confirm: 'Verify Report', noteLabel: 'Verification note', required: false, variant: 'success' },
};

const TABS = [{ id: 'report', label: 'Report' }, { id: 'analysis', label: 'Analysis' }, { id: 'history', label: 'History' }];

const moment = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function Kpi({ label, value, sub, tone = 'default' }) {
  const tones = { default: 'text-slate-900', success: 'text-emerald-700', danger: 'text-red-700' };
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${tones[tone]}`}>{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-xs text-slate-500">{sub}</dd>}
    </div>
  );
}

function NavLink({ target, href, direction }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-[background-color,border-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40';
  const content = direction === 'previous'
    ? <><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {target ? target.period : 'No earlier report'}</>
    : <>{target ? target.period : 'No later report'} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></>;
  if (!target || !href) return <span className={`${base} cursor-default border-slate-100 bg-slate-50 text-slate-400`} aria-disabled="true">{content}</span>;
  return <Link href={href} className={`${base} border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50`} aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} report: ${target.period}`}>{content}</Link>;
}

/**
 * One filed Monthly Progress Report, for the PIA officer, the district, the
 * State admin and the M&E admin. What the viewer may do (resubmit / approve /
 * return / verify) is decided by the backend and arrives as `permissions`.
 *
 * `reportHref(id)` is where another report of the same department opens for
 * this role (previous / next month, and the trend table).
 */
export function MprReportPage({ mprId, backHref, backLabel = 'Back', correctionHref, reportHref, projectHref }) {
  const [box, setBox] = useState({ report: null, loading: true, error: '' });
  const [tab, setTab] = useState('report');
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const busyRef = useRef(false);

  const load = useCallback(() => {
    setBox((current) => ({ ...current, loading: true, error: '' }));
    return fetchMpr(mprId)
      .then((report) => setBox({ report, loading: false, error: '' }))
      .catch((err) => setBox({ report: null, loading: false, error: err?.message || 'Unable to load the report. Please try again.' }));
  }, [mprId]);
  useEffect(() => { load(); }, [load]);

  const { report } = box;
  const config = dialog ? DIALOGS[dialog] : null;
  const noteError = config?.required && !note.trim() ? 'A reason is required to return the report.' : '';

  const show = (name) => { setDialog(name); setNote(''); setTouched(false); setError(''); };

  const confirm = async () => {
    if (busyRef.current) return;
    setTouched(true);
    if (noteError) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const text = note.replace(/\s+/g, ' ').trim();
      if (dialog === 'approve') await approveMpr(mprId, text);
      else if (dialog === 'verify') await verifyMpr(mprId, text);
      else if (dialog === 'stateReturn') await stateReturnMpr(mprId, text);
      else await returnMpr(mprId, text);
      setDone({ approve: 'Report approved.', verify: 'Report verified for the State.', return: 'Report returned to the PIA officer for correction.', stateReturn: 'Report returned to the PIA officer for correction.' }[dialog]);
      setDialog(null);
      await load();
    } catch (err) {
      setError(err?.message || 'This action could not be completed. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (box.loading && !report) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6" role="status" aria-label="Loading report">
        <Skeleton className="h-14 w-96" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-20" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (box.error || !report) {
    return (
      <div className="mx-auto max-w-2xl p-6 pt-10">
        <Notice tone="error" title="Unable to load the report." action={<RetryButton onClick={load} />}>{box.error}</Notice>
        <Link href={backHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}</Link>
      </div>
    );
  }

  const { permissions, totals, funds, navigation } = report;
  const stage = STAGE_INDEX[report.status] ?? 0;
  const returned = report.status === 'RETURNED_TO_PIA';

  const exportCsv = () => downloadCsv(
    `${report.mprNo}_${report.period}.csv`.replace(/\s+/g, '_'),
    ['Activity Code', 'Activity', 'Unit', 'Physical Target', 'Physical upto Previous Month', 'Physical During Month', 'Physical Total',
      'Financial Target (Rs. Lakh)', 'Financial upto Previous Month', 'Financial During Month', 'Financial Total'],
    report.activities.map((a) => [a.activityCode, a.activityName, a.unit, a.hasPhysical ? a.physicalTarget : '', a.hasPhysical ? a.physicalPrevious : '',
      a.hasPhysical ? a.physicalCurrent : '', a.hasPhysical ? a.physicalTotal : '', a.financialTargetLakh, a.financialPreviousLakh, a.financialCurrentLakh, a.financialTotalLakh]),
  );

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16 sm:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link href={backHref} aria-label={backLabel} className="mt-0.5 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 print:hidden">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{report.departmentName} — {report.period}</h1>
              <Badge status={report.status} size="md" />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-mono font-semibold text-slate-700">{report.mprNo}</span>
              {' · '}
              {projectHref
                ? <Link href={projectHref(report)} className="font-medium text-navy hover:underline">{report.project.code || report.project.projectName}</Link>
                : <span className="font-medium text-slate-700">{report.project.code || report.project.projectName}</span>}
              {' · '}{report.project.district}
              {' · '}Submitted by {report.submittedBy?.name || '—'} on {moment(report.submittedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button type="button" onClick={exportCsv} aria-label="Export this report as CSV" title="Export CSV" className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 transition-[background-color,border-color] duration-150 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
          <MprDownloads report={report} />
          <button type="button" onClick={() => window.print()} aria-label="Print this report" title="Print" className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 transition-[background-color,border-color] duration-150 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
            <Printer className="h-4 w-4" aria-hidden="true" />
          </button>
          {permissions.canResubmit && correctionHref && (
            <Link href={correctionHref(report)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
              <PencilLine className="h-4 w-4" aria-hidden="true" /> Correct &amp; Resubmit
            </Link>
          )}
          {(permissions.canReturn || permissions.returnBlockedReason) && (
            <ActionButton variant="secondary" icon={RotateCcw} onClick={() => show('return')} disabled={!permissions.canReturn} disabledReason={permissions.returnBlockedReason || ''}>Return for Correction</ActionButton>
          )}
          {permissions.canApprove && <ActionButton variant="success" icon={CheckCircle2} onClick={() => show('approve')}>Approve</ActionButton>}
          {(permissions.canStateReturn || permissions.stateReturnBlockedReason) && (
            <ActionButton variant="secondary" icon={RotateCcw} onClick={() => show('stateReturn')} disabled={!permissions.canStateReturn} disabledReason={permissions.stateReturnBlockedReason || ''}>Return for Correction</ActionButton>
          )}
          {permissions.canVerify && <ActionButton variant="success" icon={BadgeCheck} onClick={() => show('verify')}>Verify for State</ActionButton>}
        </div>
      </header>

      <div className="space-y-5">
        {done && <Notice tone="success">{done}</Notice>}
        {returned && <Notice tone="warning" title={`Returned by the ${report.returnedByLevel === 'STATE' ? 'State' : 'district'} for correction`}>{report.returnReason || 'No reason was recorded.'}</Notice>}
        {permissions.returnBlockedReason && <Notice tone="info">{permissions.returnBlockedReason}</Notice>}
        {funds.spentBeyondReleaseLakh > 0 && (
          <Notice tone="warning" title="Expenditure is ahead of funds released">
            {report.departmentName} reports {formatLakh(funds.spentLakh)} spent, but the State has released {formatLakh(funds.releasedLakh)} so far.
          </Notice>
        )}

        {/* Review progress */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm print:hidden" aria-label="Review progress">
          {STAGES.map((item, index) => {
            const complete = index < stage;
            const current = index === stage && !returned;
            return (
              <li key={item.key} className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${complete ? 'bg-emerald-600 text-white' : current ? 'border-2 border-navy text-navy' : 'border-2 border-slate-200 text-slate-400'}`}>
                  {complete ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className={`text-xs font-semibold ${complete ? 'text-slate-900' : current ? 'text-navy' : 'text-slate-400'}`}>
                  {item.label}
                  <span className="sr-only">{complete ? ' (done)' : current ? ' (pending)' : ' (upcoming)'}</span>
                </span>
                {index < STAGES.length - 1 && <span className={`mx-1 hidden h-0.5 w-8 rounded-full sm:block ${index < stage - 1 || (complete && index + 1 <= stage) ? 'bg-emerald-600' : 'bg-slate-200'}`} aria-hidden="true" />}
              </li>
            );
          })}
          {returned && <li className="ml-auto rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Returned to PIA for correction</li>}
        </ol>

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Spent This Month" value={formatLakh(totals.financialCurrentLakh)} sub={`Previous total ${formatLakh(totals.financialPreviousLakh)}`} />
          <Kpi label="Cumulative Expenditure" value={formatLakh(totals.financialTotalLakh)} sub={`${totals.financialPercent}% of ${formatLakh(totals.financialTargetLakh)} target`} tone={totals.financialPercent >= 100 ? 'success' : 'default'} />
          <Kpi label="Physical Achievement" value={`${totals.physicalPercent}%`} sub={`${totals.activitiesCompleted} of ${totals.activities} activities completed`} tone={totals.physicalPercent >= 100 ? 'success' : 'default'} />
          <Kpi
            label="Funds Released by State"
            value={formatLakh(funds.releasedLakh)}
            sub={funds.releasedLakh > 0 ? `${funds.utilisationPercent}% utilised` : 'No installment released yet'}
            tone={funds.spentBeyondReleaseLakh > 0 ? 'danger' : 'default'}
          />
        </dl>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 print:hidden">
          <div role="tablist" aria-label="Report views" className="-mb-px flex gap-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`mpr-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`mpr-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40
                  ${tab === item.id ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mb-2 flex items-center gap-2">
            <NavLink direction="previous" target={navigation.previous} href={navigation.previous && reportHref ? reportHref(navigation.previous.id) : null} />
            <NavLink direction="next" target={navigation.next} href={navigation.next && reportHref ? reportHref(navigation.next.id) : null} />
          </div>
        </div>

        <div key={tab} role="tabpanel" id={`mpr-panel-${tab}`} aria-labelledby={`mpr-tab-${tab}`} className="wz-fade-in">
          {tab === 'report' && (
            <div className="space-y-5">
              <MprReportDocument report={report} />
              <MprEvidence report={report} onChanged={load} />
            </div>
          )}
          {tab === 'analysis' && <MprAnalysis report={report} reportHref={reportHref} />}
          {tab === 'history' && (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Report History</h2>
              <ol className="divide-y divide-slate-100">
                {report.revisionHistory.map((step, index) => (
                  <li key={`${step.changedAt}-${index}`} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{STATUS_NOTES[step.status] || step.status}</p>
                      <p className="text-xs text-slate-500">by {step.changedBy || 'System'}</p>
                      {step.note && <p className="mt-1 text-xs italic text-slate-600">“{step.note}”</p>}
                    </div>
                    <time className="whitespace-nowrap text-xs text-slate-400">{moment(step.changedAt)}</time>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(dialog)}
        onClose={() => { if (!busy) setDialog(null); }}
        title={config?.title || ''}
        description={config?.description}
        size="md"
        dismissible={!busy}
        footer={config && (
          <>
            <ActionButton variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={config.variant} loading={busy} onClick={confirm}>{busy ? 'Saving…' : config.confirm}</ActionButton>
          </>
        )}
      >
        {config && (
          <div className="space-y-4">
            <dl className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <dt className="text-xs text-slate-500">Report</dt>
              <dd className="font-semibold text-slate-900">{report.departmentName} — {report.period}</dd>
              <dd className="font-mono text-xs text-slate-500">{report.mprNo} · {report.project.code}</dd>
            </dl>
            <div>
              <label htmlFor="mpr-review-note" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                {config.noteLabel}
                {config.required ? <span className="text-red-600" aria-hidden="true">*</span> : <span className="text-xs font-normal text-slate-400">(optional)</span>}
              </label>
              <textarea
                id="mpr-review-note"
                rows={3}
                maxLength={1000}
                value={note}
                disabled={busy}
                onChange={(event) => setNote(event.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={Boolean(touched && noteError) || undefined}
                className={`${inputClass(Boolean(touched && noteError))} resize-none`}
              />
              <FieldError message={touched ? noteError : ''} />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
