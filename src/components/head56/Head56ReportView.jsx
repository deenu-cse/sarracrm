"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Ban, CheckCircle2, ChevronLeft, LockOpen, PencilLine, RotateCcw, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { ChainTracker } from '@/components/mpr/MprReportPage';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { discardH56Report, downloadH56Report, fetchH56Report, forwardH56Report, rejectH56Report, reopenH56Report, returnH56Report } from '@/lib/head56Api';
import { Head56Table, rowsWithHeadings } from './Head56Table';
import { Head56Documents } from './Head56Documents';
import { DownloadButtons, LevelPill, Tabs, lakh, moment, pct, useH56Base } from './shared';

const DIALOGS = {
  forward: { title: 'Verify and forward this report?', confirm: 'Confirm', noteLabel: 'Remarks (optional)', min: 0, variant: 'success' },
  return: { title: 'Return this report to its Maker?', description: 'The Maker is told your remarks, corrects the report and resubmits it. It then goes through the whole approval chain again.', confirm: 'Return to Maker', noteLabel: 'Remarks for the Maker', min: 5, variant: 'primary' },
  reject: { title: 'Reject this report?', description: 'The report is void and stays on record with your reason. The month can then be reported afresh.', confirm: 'Reject Report', noteLabel: 'Reason for rejection', min: 5, variant: 'primary' },
  reopen: { title: 'Reopen this verified report?', description: 'Authorised reopening: the report goes back to its Maker for correction and through the whole approval chain again. The reason is recorded in the audit trail.', confirm: 'Reopen for Correction', noteLabel: 'Reason for reopening', min: 10, variant: 'primary' },
  discard: { title: 'Discard this draft?', description: 'The draft and its documents are deleted. Nothing was submitted yet.', confirm: 'Discard Draft', noteLabel: null, min: 0, variant: 'primary' },
};

function Kpi({ label, value, sub, tone = 'default' }) {
  const tones = { default: 'text-slate-900', success: 'text-emerald-700', danger: 'text-red-700', warning: 'text-amber-700' };
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${tones[tone]}`}>{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-xs text-slate-500">{sub}</dd>}
    </div>
  );
}

/** One Head 56 monthly report, for every tier. What the viewer may do arrives from the backend as `permissions`. */
export function Head56ReportView({ id }) {
  const base = useH56Base();
  const router = useRouter();
  const [box, setBox] = useState({ report: null, loading: true, error: '' });
  const [tab, setTab] = useState('report');
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState('');
  const [checks, setChecks] = useState([]);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const busyRef = useRef(false);

  const load = useCallback(() => {
    setBox((current) => ({ ...current, loading: true, error: '' }));
    return fetchH56Report(id)
      .then((report) => setBox({ report, loading: false, error: '' }))
      .catch((err) => setBox({ report: null, loading: false, error: err?.message || 'Unable to load the report.' }));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const { report } = box;
  const config = dialog ? DIALOGS[dialog] : null;
  const required = dialog === 'forward' ? report?.permissions?.checks || [] : [];
  const text = note.replace(/\s+/g, ' ').trim();
  const noteError = config?.min && text.length < config.min ? `Write at least ${config.min} characters.` : '';
  const checksError = required.some((check) => !checks.includes(check.key)) ? 'Confirm every check before forwarding.' : '';

  const show = (name) => { setDialog(name); setNote(''); setChecks([]); setTouched(false); setError(''); };
  const confirm = async () => {
    if (busyRef.current) return;
    setTouched(true);
    if (noteError || checksError) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      if (dialog === 'discard') { await discardH56Report(id); router.replace(`${base}?tab=reports`); return; }
      if (dialog === 'forward') await forwardH56Report(id, { note: text, checks });
      if (dialog === 'return') await returnH56Report(id, text);
      if (dialog === 'reject') await rejectH56Report(id, text);
      if (dialog === 'reopen') await reopenH56Report(id, text);
      setDone({ forward: `${report.permissions.forwardLabel}: done.`, return: 'Report returned to its Maker.', reject: 'Report rejected.', reopen: 'Report reopened and sent back to its Maker.' }[dialog]);
      setDialog(null);
      await load();
    } catch (err) {
      setError(err?.message || 'This action could not be completed.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (box.loading && !report) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6" role="status" aria-label="Loading report">
        <Skeleton className="h-14 w-96" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-20" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (box.error || !report) {
    return (
      <div className="mx-auto max-w-2xl p-6 pt-10">
        <Notice tone="error" title="Unable to load the report." action={<RetryButton onClick={load} />}>{box.error}</Notice>
        <Link href={`${base}?tab=reports`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to Head 56</Link>
      </div>
    );
  }

  const p = report.permissions;
  const { rows, total } = rowsWithHeadings(report.lines, report.parents);
  const t = report.totals || {};
  const nav = (target, direction) => {
    const cls = 'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold';
    if (!target) return <span className={`${cls} border-slate-100 bg-slate-50 text-slate-400`}>{direction === 'previous' ? 'No earlier report' : 'No later report'}</span>;
    return <Link href={`${base}/report/${target.id}`} className={`${cls} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>{direction === 'previous' ? <><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {target.period}</> : <>{target.period} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></>}</Link>;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href={`${base}?tab=reports`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Head 56 reports</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Budget Head 56 · Non-Salary Grant · Prarup-2</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-slate-900">{report.unitName} <span className="font-normal text-slate-400">·</span> {report.period}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="font-mono text-xs">{report.mprNo}</span><LevelPill level={report.level} /><Badge status={report.status} />
            {report.awaiting && <span className="text-xs text-slate-500">Waiting for {report.awaiting}</span>}
            {report.reopenCount > 0 && <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">Reopened {report.reopenCount}×</span>}
          </p>
        </div>
        <DownloadButtons onDownload={(format) => downloadH56Report(report.id, format, report.mprNo)} />
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Approved budget" value={lakh(t.budgetLakh)} sub={report.level === 'PIA' ? `Dept. share ${lakh(t.deptShareLakh)}` : `Allocation v${report.allocationVersion || '-'}`} />
        <Kpi label="Expenditure this month" value={lakh(t.expenditureCurrentLakh)} />
        <Kpi label="Up to this month" value={lakh(t.expenditureFyLakh)} sub={`Total since start ${lakh(t.expenditureTotalLakh)}`} />
        <Kpi label="Balance" value={lakh(t.balanceLakh)} tone={t.balanceLakh < 0 ? 'danger' : 'default'} />
        <Kpi label="Utilisation" value={pct(t.utilisationPercent)} tone={t.utilisationPercent > 100 ? 'danger' : t.utilisationPercent >= 90 ? 'warning' : 'success'} />
      </dl>

      <ChainTracker chain={report.chain} />

      {report.returnReason && <Notice tone="warning" title={`Returned by ${report.returnedByRole || 'a reviewer'}`}>{report.returnReason}</Notice>}
      {report.rejectionReason && <Notice tone="error" title={`Rejected by ${report.rejectedByRole || 'an Approver'}`}>{report.rejectionReason}</Notice>}
      {report.review && <Notice tone="info" title={`${report.period} reviewed by the ${report.review.designation}`}>The month is closed. {report.review.remarks}</Notice>}
      {done && <Notice tone="success">{done}</Notice>}

      {(p.canEdit || p.canDelete || p.canForward || p.canReturn || p.canReject || p.canReopen || p.returnBlockedReason || p.reopenBlockedReason) && (
        <section className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm" aria-label="Actions">
          {p.canEdit && <Link href={`${base}/new?id=${report.id}`} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"><PencilLine className="h-4 w-4" aria-hidden="true" />{report.status === 'DRAFT' ? 'Continue Draft' : 'Correct & Resubmit'}</Link>}
          {p.canDelete && <ActionButton variant="secondary" icon={Trash2} onClick={() => show('discard')}>Discard Draft</ActionButton>}
          {p.canForward && <ActionButton variant="success" icon={Send} onClick={() => show('forward')}>{p.forwardLabel}</ActionButton>}
          {p.canReturn && <ActionButton variant="secondary" icon={RotateCcw} onClick={() => show('return')}>Return to Maker</ActionButton>}
          {p.canReject && <ActionButton variant="secondary" icon={Ban} onClick={() => show('reject')}>Reject</ActionButton>}
          {p.canReopen && <ActionButton variant="secondary" icon={LockOpen} onClick={() => show('reopen')}>Reopen (authorised correction)</ActionButton>}
          {(p.returnBlockedReason || p.reopenBlockedReason) && <p className="text-xs text-slate-500">{p.returnBlockedReason || p.reopenBlockedReason}</p>}
        </section>
      )}

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'report', label: 'Prarup-2' }, { id: 'documents', label: `Documents (${report.documents.length})` }, { id: 'history', label: 'Verification & history' }]} />

      {tab === 'report' && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Head56Table rows={rows} total={total} variant={report.level === 'PIA' ? 'PIA' : 'UNIT'} caption={`Head 56 report ${report.mprNo}`} />
          {report.remarks && <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-700"><strong className="text-slate-900">Remarks:</strong> {report.remarks}</p>}
        </section>
      )}

      {tab === 'documents' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Head56Documents reportId={report.id} documents={report.documents} lines={report.lines} editable={false} />
          {p.canManageDocuments && <p className="mt-3 text-xs text-slate-500">To change the documents, open the report with <strong>{report.status === 'DRAFT' ? 'Continue Draft' : 'Correct & Resubmit'}</strong>.</p>}
        </section>
      )}

      {tab === 'history' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Verification checklists</h2>
            {report.checksDone.length === 0 ? <p className="mt-2 text-sm text-slate-500">No checklist confirmed in this cycle yet.</p> : (
              <ul className="mt-3 space-y-3">
                {report.checksDone.map((step) => (
                  <li key={step.step} className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />{step.by || 'Reviewer'} · {moment(step.at)}</p>
                    <p className="mt-1 text-xs text-emerald-800">{step.checks.map((key) => key.replace(/_/g, ' ').toLowerCase()).join(' · ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Audit trail</h2>
            <ol className="mt-3 space-y-3">
              {report.history.map((entry, index) => (
                <li key={index} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-xs font-semibold text-slate-900">{entry.action.replace(/_/g, ' ')} → {entry.statusLabel}</p>
                  <p className="text-xs text-slate-600">{entry.by || '—'} · {entry.role}{entry.designation && entry.designation !== entry.role ? ` (${entry.designation})` : ''} · {moment(entry.at)}</p>
                  {entry.note && <p className="mt-0.5 text-xs text-slate-500">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      <nav className="flex items-center justify-between gap-3" aria-label="Other months">{nav(report.navigation.previous, 'previous')}{nav(report.navigation.next, 'next')}</nav>

      <Dialog
        open={Boolean(dialog)}
        onClose={() => !busy && setDialog(null)}
        dismissible={!busy}
        title={dialog === 'forward' ? p.forwardLabel : config?.title}
        description={dialog === 'forward' ? `${report.unitName} · ${report.period}. ${required.length ? 'Confirm what you checked; it is recorded with your name.' : 'The report moves to the next level.'}` : config?.description}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={config?.variant} icon={dialog === 'forward' ? CheckCircle2 : undefined} loading={busy} onClick={confirm}>{dialog === 'forward' ? p.forwardLabel : config?.confirm}</ActionButton>
          </>
        )}
      >
        {dialog && (
          <div className="space-y-4">
            {required.length > 0 && (
              <fieldset>
                <legend className="text-sm font-medium text-slate-700">Verification checklist</legend>
                <div className="mt-2 space-y-2">
                  {required.map((check) => (
                    <label key={check.key} className="flex items-start gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={checks.includes(check.key)} onChange={(event) => setChecks((current) => (event.target.checked ? [...current, check.key] : current.filter((key) => key !== check.key)))} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />
                      {check.label}
                    </label>
                  ))}
                </div>
                {touched && <FieldError id="h56-checks-error" message={checksError} />}
              </fieldset>
            )}
            {config?.noteLabel && (
              <div>
                <label htmlFor="h56-note" className="mb-1.5 block text-sm font-medium text-slate-700">{config.noteLabel}{config.min ? <span className="text-red-600"> *</span> : null}</label>
                <textarea id="h56-note" rows={3} maxLength={1000} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} className={`${inputClass(Boolean(touched && noteError))} resize-none`} />
                {touched && <FieldError id="h56-note-error" message={noteError} />}
              </div>
            )}
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
