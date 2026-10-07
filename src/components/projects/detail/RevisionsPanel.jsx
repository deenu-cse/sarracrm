"use client";
import React, { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { fetchRevisions, reviewRevision } from '@/lib/projectApi';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass, useMasterList } from '@/components/projects/create/parts';
import { EmptyNote, Panel, formatMoment } from './shared';

const STATUS = {
  PENDING_CHECKER: { label: 'Awaiting Checker', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  PENDING_APPROVER: { label: 'Awaiting Approver', cls: 'border-orange-200 bg-orange-50 text-orange-800' },
  APPROVED: { label: 'Approved & applied', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  REJECTED: { label: 'Rejected', cls: 'border-red-200 bg-red-50 text-red-800' },
};

const DIALOGS = {
  verify: { title: 'Verify this revision?', confirm: 'Verify & Send to Approver', label: 'Verification note', required: false, variant: 'primary' },
  approve: { title: 'Approve this revision?', confirm: 'Approve & Apply', label: 'Approval note', required: false, variant: 'success', text: 'The project takes the revised shares and targets immediately.' },
  reject: { title: 'Reject this revision?', confirm: 'Reject Revision', label: 'Reason for rejection', required: true, variant: 'primary', text: 'The project keeps its current figures.' },
};

const delta = (before, after) => {
  const change = Math.round((after - before) * 100000) / 100000;
  if (change === 0) return null;
  return <span className={`ml-1 text-xs font-semibold ${change > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{change > 0 ? '+' : '−'}{formatLakh(Math.abs(change)).replace('₹ ', '₹')}</span>;
};

function Comparison({ revision }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Current and revised figures for revision {revision.revisionNo}</caption>
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-3 py-2">Department</th>
            <th scope="col" className="px-3 py-2 text-right">Before</th>
            <th scope="col" className="px-3 py-2 text-right">Revised</th>
            <th scope="col" className="px-3 py-2">Targets changed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {revision.proposed.map((proposed) => {
            const before = revision.before.find((item) => String(item.departmentId) === String(proposed.departmentId)) || { activities: [], totalLakh: 0 };
            const beforeByCode = new Map(before.activities.map((a) => [a.activityCode, a]));
            const proposedCodes = new Set(proposed.activities.map((a) => a.activityCode));
            const changes = [
              ...proposed.activities.filter((a) => {
                const old = beforeByCode.get(a.activityCode);
                return !old || old.physicalTarget !== a.physicalTarget || old.financialTargetLakh !== a.financialTargetLakh;
              }).map((a) => {
                const old = beforeByCode.get(a.activityCode);
                return old
                  ? `${a.activityName}: ${old.physicalTarget} → ${a.physicalTarget} ${a.unit || ''}, ${formatLakh(old.financialTargetLakh)} → ${formatLakh(a.financialTargetLakh)}`
                  : `${a.activityName}: added (${a.physicalTarget} ${a.unit || ''}, ${formatLakh(a.financialTargetLakh)})`;
              }),
              ...before.activities.filter((a) => !proposedCodes.has(a.activityCode)).map((a) => `${a.activityName}: removed`),
            ];
            return (
              <tr key={String(proposed.departmentId)} className="align-top">
                <th scope="row" className="px-3 py-2 text-left font-medium text-slate-900">{proposed.departmentName}</th>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{formatLakh(before.totalLakh)}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{formatLakh(proposed.totalLakh)}{delta(before.totalLakh, proposed.totalLakh)}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {changes.length ? <ul className="space-y-0.5">{changes.map((line) => <li key={line}>{line}</li>)}</ul> : <span className="text-slate-400">Shares only</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
            <th scope="row" className="px-3 py-2 text-left">Project total</th>
            <td className="px-3 py-2 text-right tabular-nums">{formatLakh(revision.beforeTotalLakh)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatLakh(revision.proposedTotalLakh)}{delta(revision.beforeTotalLakh, revision.proposedTotalLakh)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Revised estimates of a project: what was proposed, by whom, and the review actions for Checker / Approver. */
export function RevisionsPanel({ project, user, onChanged }) {
  const revisions = useMasterList(() => fetchRevisions(project._id), `revisions:${project._id}:${project.updatedAt || ''}`);
  const [dialog, setDialog] = useState(null); // { action, revision }
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  const config = dialog ? DIALOGS[dialog.action] : null;
  const noteError = config?.required && !note.trim() ? 'A reason is required to reject the revision.' : '';
  const open = (action, revision) => { setDialog({ action, revision }); setNote(''); setTouched(false); setError(''); };

  const confirm = async () => {
    if (busyRef.current) return;
    setTouched(true);
    if (noteError) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await reviewRevision(dialog.revision.id, dialog.action, note.replace(/\s+/g, ' ').trim());
      setDialog(null);
      revisions.reload();
      await onChanged?.();
    } catch (err) {
      setError(err?.message || 'This action could not be completed. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!(project.departmentAllocations || []).length) return null;

  return (
    <Panel title="Revised Estimates" description="Changes to shares and targets after sanction. Each goes through Checker and Approver before it applies.">
      {revisions.loading && <div className="space-y-2" role="status" aria-label="Loading revisions"><Skeleton className="h-16" /></div>}
      {!revisions.loading && revisions.error && <Notice tone="error" action={<RetryButton onClick={revisions.reload} />}>{revisions.error}</Notice>}
      {!revisions.loading && !revisions.error && revisions.items.length === 0 && <EmptyNote>This project has not been revised.</EmptyNote>}
      {!revisions.loading && !revisions.error && revisions.items.length > 0 && (
        <ul className="space-y-5">
          {revisions.items.map((revision) => {
            const status = STATUS[revision.status] || STATUS.PENDING_CHECKER;
            const canVerify = revision.status === 'PENDING_CHECKER' && user?.workflowRole === 'CHECKER';
            const canApprove = revision.status === 'PENDING_APPROVER' && user?.workflowRole === 'APPROVER';
            return (
              <li key={revision.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      Revision {revision.revisionNo}
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Proposed by {revision.maker?.name || '—'} on {formatMoment(revision.createdAt, true)}</p>
                    <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Reason:</span> {revision.reason}</p>
                  </div>
                  <p className="flex items-center gap-2 text-sm font-semibold tabular-nums text-slate-900">
                    {formatLakh(revision.beforeTotalLakh)} <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" /> {formatLakh(revision.proposedTotalLakh)}
                  </p>
                </div>

                <div className="mt-3"><Comparison revision={revision} /></div>

                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
                  {revision.checker && <div><dt className="inline font-medium">Checker:</dt> <dd className="inline">{revision.checker.name}, {formatMoment(revision.checkerAt)}{revision.checkerNote ? ` — “${revision.checkerNote}”` : ''}</dd></div>}
                  {revision.approver && <div><dt className="inline font-medium">Approver:</dt> <dd className="inline">{revision.approver.name}, {formatMoment(revision.approverAt)}{revision.approverNote ? ` — “${revision.approverNote}”` : ''}</dd></div>}
                  {revision.rejectedBy && <div className="sm:col-span-2 text-red-700"><dt className="inline font-medium">Rejected by {revision.rejectedBy.name}:</dt> <dd className="inline">{revision.rejectionReason}</dd></div>}
                </dl>

                {(canVerify || canApprove) && (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                    <ActionButton variant="secondary" size="sm" icon={XCircle} onClick={() => open('reject', revision)} className="!border-red-300 !text-red-700 hover:!bg-red-50">Reject</ActionButton>
                    {canVerify && <ActionButton size="sm" icon={CheckCircle2} onClick={() => open('verify', revision)}>Verify</ActionButton>}
                    {canApprove && <ActionButton variant="success" size="sm" icon={CheckCircle2} onClick={() => open('approve', revision)}>Approve &amp; Apply</ActionButton>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(dialog)}
        onClose={() => { if (!busy) setDialog(null); }}
        title={config?.title || ''}
        description={config?.text}
        size="md"
        dismissible={!busy}
        footer={config && (
          <>
            <ActionButton variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={config.variant} className={dialog.action === 'reject' ? '!bg-red-700 hover:!bg-red-800' : ''} loading={busy} onClick={confirm}>{busy ? 'Saving…' : config.confirm}</ActionButton>
          </>
        )}
      >
        {config && (
          <div className="space-y-4">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">Revision {dialog.revision.revisionNo}</span>
              <span className="block text-slate-600">{formatLakh(dialog.revision.beforeTotalLakh)} → {formatLakh(dialog.revision.proposedTotalLakh)}</span>
            </p>
            <div>
              <label htmlFor="revision-review-note" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                {config.label}{config.required ? <span className="text-red-600" aria-hidden="true">*</span> : <span className="text-xs font-normal text-slate-400">(optional)</span>}
              </label>
              <textarea id="revision-review-note" rows={3} maxLength={1000} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} onBlur={() => setTouched(true)}
                aria-invalid={Boolean(touched && noteError) || undefined} className={`${inputClass(Boolean(touched && noteError))} resize-none`} />
              <FieldError message={touched ? noteError : ''} />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </Panel>
  );
}
