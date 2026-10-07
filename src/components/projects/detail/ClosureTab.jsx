"use client";
import React, { useRef, useState } from 'react';
import { BadgeCheck, CheckCircle2, FileCheck2, Lock, RotateCcw, Upload, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { closeProject, fetchCompletionState, recordRefund, reviewCompletion, submitCompletion } from '@/lib/lifecycleApi';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass, useMasterList } from '@/components/projects/create/parts';
import { DataItem, DocumentLink, EmptyNote, Panel, StatTile, formatDay, formatMoment } from './shared';

const STATUS = {
  SUBMITTED: { label: 'With district for verification', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  DISTRICT_VERIFIED: { label: 'Verified by district', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  RETURNED: { label: 'Returned for correction', cls: 'border-red-200 bg-red-50 text-red-800' },
  NONE: { label: 'Not filed', cls: 'border-slate-200 bg-slate-50 text-slate-600' },
};

const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024;
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const fileProblem = (file) => {
  if (!file) return '';
  if (!FILE_TYPES.includes(file.type)) return 'Upload a PDF, JPG or PNG file.';
  if (file.size > MAX_BYTES) return 'The file is too large. Maximum size is 10 MB.';
  return '';
};

function FilePicker({ id, label, file, onChange, existing, required, error, disabled }) {
  const input = useRef(null);
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
      </p>
      <input ref={input} id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={disabled} aria-label={label}
        onChange={(event) => { onChange(event.target.files?.[0] || null); event.target.value = ''; }} />
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
          <span className="min-w-0 truncate font-medium text-slate-800">{file.name} <span className="font-normal text-slate-500">({Math.max(1, Math.round(file.size / 1024))} KB)</span></span>
          <button type="button" onClick={() => onChange(null)} disabled={disabled} aria-label={`Remove ${label}`} className="rounded p-1 text-slate-500 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} disabled={disabled}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${error ? 'border-red-400 text-red-700' : 'border-slate-300 text-slate-600 hover:border-navy/50 hover:bg-slate-50'}`}>
          <Upload className="h-4 w-4" aria-hidden="true" /> {existing ? 'Replace file' : 'Choose file'}
        </button>
      )}
      {existing && !file && <p className="mt-1 text-xs text-slate-500">Already attached: {existing.name}. Leave empty to keep it.</p>}
      <FieldError message={error} />
    </div>
  );
}

function Money({ label, value, tone }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-sm font-semibold tabular-nums ${tone || 'text-slate-900'}`}>{formatLakh(value)}</dd>
    </div>
  );
}

/**
 * Completion and closure of a project.
 * PIA officer files the completion report of the department, the district
 * verifies it, and the State Approver closes the project.
 */
export function ClosureTab({ project, onChanged }) {
  const box = useMasterList(async () => [await fetchCompletionState(project._id)], `closure:${project._id}:${project.updatedAt || ''}`);
  const state = box.items[0];

  const [filing, setFiling] = useState(null); // department being filed
  const [form, setForm] = useState({ completionDate: '', remarks: '', certificate: null, utilisation: null });
  const [review, setReview] = useState(null); // { action, department }
  const [closing, setClosing] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [text, setText] = useState('');
  const [reference, setReference] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const busyRef = useRef(false);

  const run = async (work, message) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
      setFiling(null); setReview(null); setClosing(false); setRefunding(false);
      setDone(message);
      box.reload();
      await onChanged?.();
    } catch (err) {
      setError(err?.message || 'This action could not be completed. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const reset = () => { setAttempted(false); setError(''); setText(''); setReference(''); setDone(''); };

  if (!(project.departmentAllocations || []).length) return <EmptyNote>Completion is reported department-wise. This project has no departments.</EmptyNote>;
  if (!state && !box.error) return <div className="space-y-3" role="status" aria-label="Loading completion status"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>;
  if (box.error || !state) return <Notice tone="error" title="Unable to load the completion status." action={<RetryButton onClick={box.reload} />}>{box.error}</Notice>;

  const closed = state.closure.status === 'CLOSED';
  const { totals, progress } = state;

  // ── Filing form ────────────────────────────────────────────────────────────
  const existing = filing?.completion || null;
  const fileErrors = {
    date: !form.completionDate ? 'Enter the date the works were completed.' : form.completionDate > today() ? 'The completion date cannot be in the future.' : '',
    certificate: fileProblem(form.certificate) || (!form.certificate && !existing?.completionCertificate ? 'Attach the Completion Certificate.' : ''),
    utilisation: fileProblem(form.utilisation) || (!form.utilisation && !existing?.utilisationCertificate ? 'Attach the Utilisation Certificate.' : ''),
  };
  const openFiling = (department) => {
    reset();
    setForm({ completionDate: department.completion?.completionDate ? String(department.completion.completionDate).slice(0, 10) : '', remarks: department.completion?.remarks || '', certificate: null, utilisation: null });
    setFiling(department);
  };
  const file = () => {
    setAttempted(true);
    if (fileErrors.date || fileErrors.certificate || fileErrors.utilisation) return;
    run(() => submitCompletion(project._id, { departmentId: filing.departmentId, completionDate: form.completionDate, remarks: form.remarks.trim() }, { completionCertificate: form.certificate, utilisationCertificate: form.utilisation }),
      `Completion report of ${filing.name} filed with the district.`);
  };

  // ── Review / close / refund ────────────────────────────────────────────────
  const reviewError = review?.action === 'return' && text.replace(/\s+/g, ' ').trim().length < 5 ? 'Give the reason for returning the completion report.' : '';
  const closeError = text.replace(/\s+/g, ' ').trim().length < 10 ? 'Write a closure note (at least 10 characters).' : '';
  const refundError = reference.trim().length < 3 ? 'Enter the challan or treasury reference of the refund.' : '';

  return (
    <div className="space-y-5">
      {done && <Notice tone="success">{done}</Notice>}

      {closed ? (
        <Panel title="Project Closed" description={`Closed by ${state.closure.closedBy || 'the Approver'} on ${formatMoment(state.closure.closedAt, true)}.`} aside={<span className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"><Lock className="h-3.5 w-3.5" aria-hidden="true" /> Closed</span>}>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Money label="Sanctioned" value={state.closure.sanctionedLakh} />
            <Money label="Released" value={state.closure.releasedLakh} />
            <Money label="Final expenditure" value={state.closure.expenditureLakh} />
            <Money label="Unspent balance (to refund)" value={state.closure.unspentLakh} tone={state.closure.unspentLakh > 0 ? 'text-amber-700' : undefined} />
            <Money label="Never released (saving)" value={state.closure.unreleasedLakh} />
          </dl>
          <dl className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
            <DataItem label="Closure note" value={state.closure.note} />
            <DataItem
              label="Refund of unspent balance"
              value={{ NOT_APPLICABLE: 'Nothing to refund', PENDING: 'Pending', RECORDED: `Recorded: ${state.closure.refundReference}${state.closure.refundRecordedAt ? ` (${formatMoment(state.closure.refundRecordedAt)})` : ''}` }[state.closure.refundStatus] || '—'}
            />
          </dl>
          {state.closure.refundStatus === 'PENDING' && (
            <div className="mt-4">
              <Notice tone="warning" title={`${formatLakh(state.closure.unspentLakh)} is to be refunded to the State`}
                action={state.canRecordRefund ? <ActionButton size="sm" onClick={() => { reset(); setRefunding(true); }}>Record Refund</ActionButton> : null}>
                Record the challan or treasury reference once the amount is deposited.
              </Notice>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">No budget release, monthly report, revision or change of officer is possible on a closed project. Outcomes can still be measured.</p>
        </Panel>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Completion reports verified" value={`${progress.verified} of ${progress.departments}`} sub={progress.filed > progress.verified ? `${progress.filed - progress.verified} with the district` : ''} tone={progress.verified === progress.departments ? 'success' : 'default'} />
            <StatTile label="Released" value={formatLakh(totals.releasedLakh)} sub={`of ${formatLakh(totals.sanctionedLakh)} sanctioned`} />
            <StatTile label="Reported expenditure" value={formatLakh(totals.expenditureLakh)} />
            <StatTile label="Unspent balance" value={formatLakh(totals.unspentLakh)} sub="Released but not spent" tone={totals.unspentLakh > 0 ? 'warning' : 'default'} />
          </dl>

          {state.canClose && (
            <Notice tone="success" title="Every department's completion report is verified" action={<ActionButton variant="success" size="sm" icon={Lock} onClick={() => { reset(); setClosing(true); }}>Close Project</ActionButton>}>
              Review the final figures below, then close the project.
            </Notice>
          )}
          {!state.canClose && state.closeBlockedReason && (
            <Notice tone="info" title="Not ready to be closed">{state.closeBlockedReason}</Notice>
          )}
          {!state.canClose && state.closeBlockedReason === null && progress.verified === progress.departments && progress.departments > 0 && (
            <Notice tone="info">Every completion report is verified. The Approver can now close the project.</Notice>
          )}
        </>
      )}

      <Panel title="Completion Reports" description="Filed by the PIA officer of each department when its works are finished, then verified by the district." padded={false}>
        <ul className="divide-y divide-slate-100">
          {state.departments.map((department) => {
            const completion = department.completion;
            const status = STATUS[completion?.status || 'NONE'];
            return (
              <li key={department.departmentId} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      {department.name}
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {department.officer?.name ? `PIA officer: ${department.officer.name}` : 'No PIA officer assigned'}
                      {department.reports.total > 0 ? ` · ${department.reports.total} monthly report${department.reports.total === 1 ? '' : 's'}, last ${department.reports.lastPeriod}` : ' · no monthly report yet'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {department.canSubmit && <ActionButton size="sm" icon={FileCheck2} onClick={() => openFiling(department)}>{completion ? 'Correct & File Again' : 'File Completion Report'}</ActionButton>}
                    {department.canReturn && <ActionButton variant="secondary" size="sm" icon={RotateCcw} onClick={() => { reset(); setReview({ action: 'return', department }); }}>Return</ActionButton>}
                    {department.canVerify && <ActionButton variant="success" size="sm" icon={BadgeCheck} onClick={() => { reset(); setReview({ action: 'verify', department }); }}>Verify</ActionButton>}
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 lg:grid-cols-6">
                  <Money label="Sanctioned" value={department.sanctionedLakh} />
                  <Money label="Released" value={department.releasedLakh} />
                  <Money label="Expenditure" value={department.expenditureLakh} />
                  <Money label="Unspent" value={department.unspentLakh} tone={department.unspentLakh > 0 ? 'text-amber-700' : undefined} />
                  <div><dt className="text-xs text-slate-500">Physical progress</dt><dd className="text-sm font-semibold tabular-nums text-slate-900">{department.physicalPercent}%</dd></div>
                  <div><dt className="text-xs text-slate-500">Financial progress</dt><dd className="text-sm font-semibold tabular-nums text-slate-900">{department.financialPercent}%</dd></div>
                </dl>
                {department.excessLakh > 0 && <p className="mt-2 text-xs font-medium text-red-700">Reported expenditure is {formatLakh(department.excessLakh)} more than the amount released.</p>}
                {!completion && department.submitBlockedReason && <p className="mt-2 text-xs text-amber-800">{department.submitBlockedReason}</p>}

                {completion && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    {completion.status === 'RETURNED' && <div className="mb-3"><Notice tone="warning" title="Returned by the district">{completion.returnReason}</Notice></div>}
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <DataItem label="Works completed on" value={formatDay(completion.completionDate)} />
                      <DataItem label="Filed by" value={`${completion.submittedBy || '—'}, ${formatMoment(completion.submittedAt, true)}`} />
                      <DataItem label="District review" value={completion.reviewedAt ? `${completion.reviewedBy || '—'}, ${formatMoment(completion.reviewedAt, true)}` : 'Pending'} />
                    </dl>
                    {completion.remarks && <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Remarks:</span> {completion.remarks}</p>}
                    {completion.reviewNote && <p className="mt-1 text-sm text-slate-700"><span className="font-medium">District note:</span> {completion.reviewNote}</p>}
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {completion.completionCertificate && <DocumentLink url={completion.completionCertificate.url} name="Completion Certificate" meta={completion.completionCertificate.name} />}
                      {completion.utilisationCertificate && <DocumentLink url={completion.utilisationCertificate.url} name="Utilisation Certificate" meta={completion.utilisationCertificate.name} />}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* File / correct a completion report */}
      <Dialog
        open={Boolean(filing)}
        onClose={() => { if (!busy) setFiling(null); }}
        title={`Completion report: ${filing?.name || ''}`}
        description="After filing, no further monthly report can be submitted for this department unless the district returns it."
        size="lg"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setFiling(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton icon={CheckCircle2} loading={busy} onClick={file}>{busy ? 'Filing…' : 'File with District'}</ActionButton>
          </>
        )}
      >
        {filing && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-4">
              <Money label="Released" value={filing.releasedLakh} />
              <Money label="Final expenditure" value={filing.expenditureLakh} />
              <Money label="Unspent balance" value={filing.unspentLakh} tone={filing.unspentLakh > 0 ? 'text-amber-700' : undefined} />
              <div><dt className="text-xs text-slate-500">Physical progress</dt><dd className="text-sm font-semibold tabular-nums text-slate-900">{filing.physicalPercent}%</dd></div>
            </dl>
            <p className="text-xs text-slate-500">These figures come from the budget releases and your approved monthly reports. They cannot be typed in.</p>
            <div>
              <label htmlFor="completion-date" className="mb-1.5 block text-sm font-medium text-slate-700">Date works were completed <span className="text-red-600" aria-hidden="true">*</span></label>
              <input id="completion-date" type="date" max={today()} value={form.completionDate} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, completionDate: event.target.value }))}
                aria-invalid={Boolean(attempted && fileErrors.date) || undefined} className={`${inputClass(Boolean(attempted && fileErrors.date))} sm:max-w-xs`} />
              <FieldError message={attempted ? fileErrors.date : ''} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FilePicker id="completion-certificate" label="Completion Certificate" required={!existing?.completionCertificate} existing={existing?.completionCertificate} file={form.certificate} disabled={busy}
                onChange={(value) => setForm((current) => ({ ...current, certificate: value }))} error={attempted || form.certificate ? fileErrors.certificate : ''} />
              <FilePicker id="utilisation-certificate" label="Utilisation Certificate" required={!existing?.utilisationCertificate} existing={existing?.utilisationCertificate} file={form.utilisation} disabled={busy}
                onChange={(value) => setForm((current) => ({ ...current, utilisation: value }))} error={attempted || form.utilisation ? fileErrors.utilisation : ''} />
            </div>
            <div>
              <label htmlFor="completion-remarks" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">Remarks <span className="text-xs font-normal text-slate-400">(optional)</span></label>
              <textarea id="completion-remarks" rows={3} maxLength={2000} value={form.remarks} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} className={`${inputClass(false)} resize-none`} />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>

      {/* District: verify / return */}
      <Dialog
        open={Boolean(review)}
        onClose={() => { if (!busy) setReview(null); }}
        title={review?.action === 'verify' ? 'Verify this completion report?' : 'Return this completion report?'}
        description={review?.action === 'verify' ? 'Confirm that the works are complete and the certificates are in order.' : 'It goes back to the PIA officer with your reason. Monthly reporting opens again for the department.'}
        size="md"
        dismissible={!busy}
        footer={review && (
          <>
            <ActionButton variant="secondary" onClick={() => setReview(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={review.action === 'verify' ? 'success' : 'primary'} loading={busy}
              onClick={() => { setAttempted(true); if (reviewError) return; run(() => reviewCompletion(project._id, review.department.departmentId, review.action, text.replace(/\s+/g, ' ').trim()), review.action === 'verify' ? `Completion report of ${review.department.name} verified.` : `Completion report of ${review.department.name} returned to the PIA officer.`); }}>
              {busy ? 'Saving…' : review.action === 'verify' ? 'Verify' : 'Return Report'}
            </ActionButton>
          </>
        )}
      >
        {review && (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <Money label="Released" value={review.department.completion.releasedLakh} />
              <Money label="Expenditure" value={review.department.completion.expenditureLakh} />
              <Money label="Unspent" value={review.department.completion.unspentLakh} />
            </dl>
            <div>
              <label htmlFor="completion-review-note" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                {review.action === 'verify' ? 'Verification note' : 'Reason for return'}
                {review.action === 'verify' ? <span className="text-xs font-normal text-slate-400">(optional)</span> : <span className="text-red-600" aria-hidden="true">*</span>}
              </label>
              <textarea id="completion-review-note" rows={3} maxLength={1000} value={text} disabled={busy} onChange={(event) => setText(event.target.value)} className={`${inputClass(Boolean(attempted && reviewError))} resize-none`} />
              <FieldError message={attempted ? reviewError : ''} />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>

      {/* State Approver: close */}
      <Dialog
        open={closing}
        onClose={() => { if (!busy) setClosing(false); }}
        title="Close this project?"
        description="This is final. After closure no budget can be released, no monthly report filed, and the project cannot be revised."
        size="lg"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setClosing(false)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant="success" icon={Lock} loading={busy}
              onClick={() => { setAttempted(true); if (closeError) return; run(() => closeProject(project._id, { note: text.replace(/\s+/g, ' ').trim(), refundReference: reference.trim() }), 'Project closed.'); }}>
              {busy ? 'Closing…' : 'Close Project'}
            </ActionButton>
          </>
        )}
      >
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-5">
            <Money label="Sanctioned" value={totals.sanctionedLakh} />
            <Money label="Released" value={totals.releasedLakh} />
            <Money label="Final expenditure" value={totals.expenditureLakh} />
            <Money label="Unspent (to refund)" value={totals.unspentLakh} tone={totals.unspentLakh > 0 ? 'text-amber-700' : undefined} />
            <Money label="Never released" value={totals.unreleasedLakh} />
          </dl>
          <div>
            <label htmlFor="closure-note" className="mb-1.5 block text-sm font-medium text-slate-700">Closure note <span className="text-red-600" aria-hidden="true">*</span></label>
            <textarea id="closure-note" rows={3} maxLength={1000} value={text} disabled={busy} onChange={(event) => setText(event.target.value)} placeholder="e.g. All works completed and verified by the district. Assets handed over to the Gram Panchayat."
              className={`${inputClass(Boolean(attempted && closeError))} resize-none`} />
            <FieldError message={attempted ? closeError : ''} />
          </div>
          {totals.unspentLakh > 0 && (
            <div>
              <label htmlFor="closure-refund" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">Refund challan / treasury reference <span className="text-xs font-normal text-slate-400">(optional, can be recorded later)</span></label>
              <input id="closure-refund" type="text" maxLength={200} value={reference} disabled={busy} onChange={(event) => setReference(event.target.value)} className={inputClass(false)} />
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Dialog>

      {/* Record the refund later */}
      <Dialog
        open={refunding}
        onClose={() => { if (!busy) setRefunding(false); }}
        title="Record the refund"
        size="md"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setRefunding(false)} disabled={busy}>Cancel</ActionButton>
            <ActionButton loading={busy} onClick={() => { setAttempted(true); if (refundError) return; run(() => recordRefund(project._id, reference.trim()), 'Refund recorded.'); }}>{busy ? 'Saving…' : 'Record Refund'}</ActionButton>
          </>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Unspent balance refunded: <strong className="tabular-nums text-slate-900">{formatLakh(state.closure.unspentLakh)}</strong></p>
          <div>
            <label htmlFor="refund-reference" className="mb-1.5 block text-sm font-medium text-slate-700">Challan / treasury reference <span className="text-red-600" aria-hidden="true">*</span></label>
            <input id="refund-reference" type="text" maxLength={200} value={reference} disabled={busy} onChange={(event) => setReference(event.target.value)} className={inputClass(Boolean(attempted && refundError))} />
            <FieldError message={attempted ? refundError : ''} />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Dialog>
    </div>
  );
}
