"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Ban, CheckCircle2, ChevronLeft, Download, PencilLine, Printer, RotateCcw, Send, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { discardMprDraft, fetchMpr, forwardMpr, rejectMpr, returnMpr } from '@/lib/mprApi';
import { ENTRY_MODE_LABELS } from '@/constants/status';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { downloadCsv } from '@/components/projects/detail/shared';
import { MprAnalysis } from './MprAnalysis';
import { MprReportDocument } from './MprReportDocument';
import { MprDownloads, MprEvidence } from './MprEvidence';

const DIALOGS = {
  forward: { title: 'Verify and forward this report?', confirm: 'Confirm', noteLabel: 'Remarks', required: false, variant: 'success' },
  return: { title: 'Return this report to its Maker?', description: 'The reporting Maker is notified with your remarks, corrects the report and resubmits it. It then goes through the whole approval chain again.', confirm: 'Return to Maker', noteLabel: 'Remarks for the Maker', required: true, variant: 'primary' },
  reject: { title: 'Reject this report?', description: 'The report is void and stays on record with your reason. The month can then be reported afresh.', confirm: 'Reject Report', noteLabel: 'Reason for rejection', required: true, variant: 'primary' },
  discard: { title: 'Discard this draft?', description: 'The draft and its evidence are deleted. Nothing was submitted yet.', confirm: 'Discard Draft', noteLabel: null, required: false, variant: 'primary' },
};

const TIER_TONE = { PIA: 'text-amber-700', DISTRICT: 'text-cyan-700', HQ: 'text-indigo-700' };

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

/** The approval chain of the report, step by step, with who took each step. */
function ChainTracker({ chain }) {
  return (
    <ol className="flex items-start overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm print:hidden" aria-label="Approval chain">
      {chain.map((step, index) => {
        const done = step.state === 'done';
        const current = step.state === 'current';
        return (
          <li key={step.key} className="flex min-w-[8.5rem] flex-1 items-start last:flex-none" aria-current={current ? 'step' : undefined}>
            <div className="flex flex-col items-start gap-1.5 pr-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-emerald-600 text-white' : current ? 'border-2 border-navy text-navy ring-4 ring-navy/10' : 'border-2 border-slate-200 text-slate-400'}`}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className={`text-xs font-semibold ${done ? 'text-slate-900' : current ? 'text-navy' : 'text-slate-400'}`}>
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${done || current ? TIER_TONE[step.tier] || '' : 'text-slate-300'}`}>{step.tier}</span>
                {step.label}
                <span className="sr-only">{done ? ' (done)' : current ? ' (pending)' : ' (upcoming)'}</span>
              </span>
              {done && step.by && <span className="text-[11px] text-slate-500">{step.by}{step.at ? ` · ${moment(step.at)}` : ''}</span>}
              {current && <span className="text-[11px] font-medium text-navy">Pending</span>}
            </div>
            {index < chain.length - 1 && <span aria-hidden="true" className={`mt-3 h-0.5 min-w-[1rem] flex-1 rounded-full ${done ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One Monthly Progress Report, for every tier. What the viewer may do (edit,
 * verify and forward, return to the Maker, reject) is decided by the backend
 * and arrives as `permissions`.
 *
 * `reportHref(id)` is where another report of the same department opens for
 * this role (previous / next month, and the trend table).
 */
export function MprReportPage({ mprId, backHref, backLabel = 'Back', correctionHref, reportHref, projectHref }) {
  const router = useRouter();
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
  const noteError = config?.required && note.replace(/\s+/g, ' ').trim().length < 5 ? 'Write at least 5 characters. Remarks are required.' : '';

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
      if (dialog === 'discard') {
        await discardMprDraft(mprId);
        router.replace(backHref);
        return;
      }
      if (dialog === 'forward') await forwardMpr(mprId, text);
      else if (dialog === 'reject') await rejectMpr(mprId, text);
      else await returnMpr(mprId, text);
      setDone({ forward: `${box.report?.permissions?.forwardLabel || 'Forwarded'}: done.`, return: 'Report returned to its Maker for correction.', reject: 'Report rejected.' }[dialog]);
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
  const returned = report.status === 'RETURNED_FOR_CORRECTION';
  const forwardDescription = permissions.forwardLabel
    ? `${permissions.forwardLabel}. Your name, role and remarks are recorded in the report's history.`
    : '';

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
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${report.entryMode === 'DISTRICT' ? 'bg-cyan-50 text-cyan-800' : 'bg-slate-100 text-slate-700'}`}>{ENTRY_MODE_LABELS[report.entryMode] || ENTRY_MODE_LABELS.PIA}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-mono font-semibold text-slate-700">{report.mprNo}</span>
              {' · '}
              {projectHref
                ? <Link href={projectHref(report)} className="font-medium text-navy hover:underline">{report.project.code || report.project.projectName}</Link>
                : <span className="font-medium text-slate-700">{report.project.code || report.project.projectName}</span>}
              {report.project.sanctionId && <>{' · '}<span className="font-mono text-xs">{report.project.sanctionId}</span></>}
              {' · '}{[report.project.village, report.project.gramPanchayat, report.project.block, report.project.district].filter(Boolean).join(', ')}
              {' · '}{report.submittedAt ? `Submitted by ${report.submittedBy?.name || '—'} on ${moment(report.submittedAt)}` : `Draft by ${report.submittedBy?.name || '—'}`}
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
          {permissions.canEdit && correctionHref && (
            <Link href={correctionHref(report)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
              <PencilLine className="h-4 w-4" aria-hidden="true" /> {returned ? 'Correct & Resubmit' : 'Continue Draft'}
            </Link>
          )}
          {permissions.canDelete && <ActionButton variant="secondary" icon={Trash2} onClick={() => show('discard')}>Discard Draft</ActionButton>}
          {(permissions.canReturn || permissions.returnBlockedReason) && (
            <ActionButton variant="secondary" icon={RotateCcw} onClick={() => show('return')} disabled={!permissions.canReturn} disabledReason={permissions.returnBlockedReason || ''}>Return to Maker</ActionButton>
          )}
          {permissions.canReject && <ActionButton variant="secondary" icon={Ban} onClick={() => show('reject')} className="!border-red-300 !text-red-700 hover:!bg-red-50">Reject</ActionButton>}
          {permissions.canForward && <ActionButton variant="success" icon={Send} onClick={() => show('forward')}>{permissions.forwardLabel}</ActionButton>}
        </div>
      </header>

      <div className="space-y-5">
        {done && <Notice tone="success">{done}</Notice>}
        {returned && <Notice tone="warning" title={`Returned for correction by the ${report.returnedByRole || 'reviewer'}`}>{report.returnReason || 'No remarks were recorded.'}</Notice>}
        {report.status === 'REJECTED' && <Notice tone="error" title={`Rejected by the ${report.rejectedByRole || 'Approver'}`}>{report.rejectionReason || 'No reason was recorded.'} The month can be reported afresh.</Notice>}
        {report.status === 'DRAFT' && <Notice tone="info" title="Draft">This report has not been submitted. Only its Maker can see it.</Notice>}
        {!permissions.canForward && permissions.awaiting && <Notice tone="info">Waiting for the <strong>{permissions.awaiting}</strong>.</Notice>}
        {permissions.returnBlockedReason && <Notice tone="info">{permissions.returnBlockedReason}</Notice>}

        <ChainTracker chain={report.chain || []} />

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Spent This Month" value={formatLakh(totals.financialCurrentLakh)} sub={`Previous total ${formatLakh(totals.financialPreviousLakh)}`} />
          <Kpi label="Cumulative Expenditure" value={formatLakh(totals.financialTotalLakh)} sub={`${totals.financialPercent}% of ${formatLakh(totals.financialTargetLakh)} target`} tone={totals.financialPercent >= 100 ? 'success' : 'default'} />
          <Kpi label="Physical Achievement" value={`${totals.physicalPercent}%`} sub={`${totals.activitiesCompleted} of ${totals.activities} activities completed`} tone={totals.physicalPercent >= 100 ? 'success' : 'default'} />
          <Kpi
            label="Sanctioned Allocation"
            value={formatLakh(funds.departmentBudgetLakh)}
            sub={`${funds.utilisationPercent}% spent · balance ${formatLakh(funds.balanceLakh)}`}
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
              <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Workflow History <span className="font-normal text-slate-500">— every action with user, designation, date, time and remarks</span></h2>
              <ol className="divide-y divide-slate-100">
                {report.revisionHistory.map((step, index) => (
                  <li key={`${step.changedAt}-${index}`} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{step.statusLabel || step.status}</p>
                      <p className="text-xs text-slate-500">
                        by {step.changedBy || 'System'}
                        {step.role && <span className="text-slate-400"> · {step.role}</span>}
                        {step.designation && step.designation !== step.role && <span className="text-slate-400"> · {step.designation}</span>}
                      </p>
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
        description={dialog === 'forward' ? forwardDescription : config?.description}
        size="md"
        dismissible={!busy}
        footer={config && (
          <>
            <ActionButton variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={config.variant} loading={busy} onClick={confirm}>{busy ? 'Saving…' : (dialog === 'forward' ? report?.permissions?.forwardLabel : config.confirm)}</ActionButton>
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
            {config.noteLabel && (
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
            )}
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
