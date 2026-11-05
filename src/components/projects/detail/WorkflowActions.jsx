"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, FileText, PencilLine, Send, Undo2, Upload, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { SANCTION_STATUS } from '@/constants/status';
import { approveProject, checkerVerify, forwardToDistrict, rejectProject } from '@/lib/projectWorkflowApi';
import { ActionButton, FieldError, Notice, inputClass } from '@/components/projects/create/parts';

const MAX_ORDER_BYTES = 10 * 1024 * 1024;

export function OrderFile({ id, label, file, onChange, disabled }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  const pick = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    if (!/\.pdf$/i.test(chosen.name) || (chosen.type && chosen.type !== 'application/pdf')) { setError('Only PDF files can be attached.'); return; }
    if (chosen.size > MAX_ORDER_BYTES) { setError('The PDF is too large. Maximum size is 10 MB.'); return; }
    setError('');
    onChange(chosen);
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label} <span className="text-xs font-normal text-slate-400">(optional)</span></p>
      <input ref={inputRef} id={id} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={pick} disabled={disabled} tabIndex={-1} aria-label={label} />
      {file ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <FileText className="h-4 w-4 flex-shrink-0 text-emerald-700" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} disabled={disabled} aria-label={`Remove ${file.name}`} className="rounded p-1 text-slate-500 transition-colors hover:bg-white hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-[background-color,border-color] duration-150 hover:border-navy hover:bg-navy/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
        >
          <Upload className="h-4 w-4" aria-hidden="true" /> Attach PDF
        </button>
      )}
      <FieldError message={error} />
    </div>
  );
}

const DIALOGS = {
  verify: { title: 'Verify this project?', description: 'Confirms the DPR, project details, physical and financial targets are correct and sends it to the HQ Approver.', confirm: 'Verify & Send to Approver', busy: 'Verifying…', variant: 'primary', noteLabel: 'Verification note', noteRequired: false },
  approve: { title: 'Approve & sanction this project?', description: 'Issues the Sanction ID and the Sanction Order. The HQ Maker then forwards the project to the district.', confirm: 'Approve & Sanction', busy: 'Approving…', variant: 'success', noteLabel: 'Approval note', noteRequired: false },
  reject: { title: 'Return this project to the HQ Maker?', description: 'The Maker is notified with your objection, corrects the project and resubmits it under the same Project ID.', confirm: 'Return to Maker', busy: 'Returning…', variant: 'danger', noteLabel: 'Objection (what is incorrect or incomplete)', noteRequired: true },
  forward: { title: 'Forward to district?', description: null, confirm: 'Forward to District', busy: 'Forwarding…', variant: 'primary', noteLabel: null, noteRequired: false },
};

/**
 * What the signed-in HQ user can do with the project right now (Maker,
 * Checker or Approver), plus the confirmation dialogs. When nobody on this
 * screen can act, it says who the project is waiting for.
 */
export function WorkflowActions({ project, user, onDone }) {
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [files, setFiles] = useState({ secretariatApprovalOrder: null, stateSanctionOrder: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  const role = user?.workflowRole;
  const { status } = project;
  const config = open ? DIALOGS[open] : null;
  const noteError = config?.noteRequired && note.replace(/\s+/g, ' ').trim().length < 5 ? 'Write the objection for the Maker (at least 5 characters).' : '';

  const show = (name) => { setOpen(name); setNote(''); setNoteTouched(false); setFiles({ secretariatApprovalOrder: null, stateSanctionOrder: null }); setError(''); };
  const close = () => { if (!busyRef.current) setOpen(null); };

  const confirm = async () => {
    if (busyRef.current) return; // double click
    setNoteTouched(true);
    if (noteError) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const text = note.replace(/\s+/g, ' ').trim();
      if (open === 'verify') await checkerVerify(project._id, text);
      else if (open === 'approve') await approveProject(project._id, { note: text, ...files });
      else if (open === 'reject') await rejectProject(project._id, text);
      else if (open === 'forward') await forwardToDistrict(project._id);
      setOpen(null);
      await onDone();
    } catch (err) {
      setError(err?.message || 'This action could not be completed. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const canReview = (status === SANCTION_STATUS.PENDING_CHECKER && role === 'CHECKER')
    || (status === SANCTION_STATUS.PENDING_APPROVER && role === 'APPROVER');
  const canForward = status === SANCTION_STATUS.SANCTIONED && role === 'MAKER';
  const departmentWise = (project.departmentAllocations || []).length > 0;
  const closed = project.closure?.status === 'CLOSED';
  const canResubmit = status === SANCTION_STATUS.REJECTED && role === 'MAKER' && departmentWise;
  const canRevise = role === 'MAKER' && departmentWise && !closed
    && [SANCTION_STATUS.SANCTIONED, SANCTION_STATUS.FORWARDED_TO_DISTRICT, SANCTION_STATUS.DISTRICT_ACCEPTED, SANCTION_STATUS.FORWARDED_TO_PIA, SANCTION_STATUS.PIA_ACCEPTED].includes(status);
  const secondaryLink = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-[background-color,border-color,transform] duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2';

  // Who the project is waiting for, when this user cannot move it forward.
  let waiting = '';
  if (status === SANCTION_STATUS.PENDING_CHECKER && role !== 'CHECKER') waiting = 'Waiting for the HQ Checker to verify this project.';
  else if (status === SANCTION_STATUS.PENDING_APPROVER && role !== 'APPROVER') waiting = 'Waiting for the HQ Approver to sanction this project.';
  else if (status === SANCTION_STATUS.SANCTIONED && role !== 'MAKER') waiting = 'Sanctioned. Waiting for the HQ Maker to forward it to the district.';
  else if (status === SANCTION_STATUS.REJECTED && role !== 'MAKER') waiting = 'Returned to the HQ Maker for correction.';
  else if (status === SANCTION_STATUS.FORWARDED_TO_DISTRICT) waiting = `Waiting for the ${project.district} District Maker to accept the project.`;
  else if (status === SANCTION_STATUS.DISTRICT_ACCEPTED) waiting = 'Accepted by the district. Waiting for the District Maker to assign the PIA and reporting responsibility.';
  else if (status === SANCTION_STATUS.FORWARDED_TO_PIA) waiting = 'Assigned to the PIA. Waiting for the PIA Maker to accept.';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === SANCTION_STATUS.PENDING_CHECKER && role === 'CHECKER' && (
        <ActionButton icon={CheckCircle2} onClick={() => show('verify')}>Verify</ActionButton>
      )}
      {status === SANCTION_STATUS.PENDING_APPROVER && role === 'APPROVER' && (
        <ActionButton variant="success" icon={CheckCircle2} onClick={() => show('approve')}>Approve &amp; Sanction</ActionButton>
      )}
      {canReview && (
        <ActionButton variant="secondary" icon={Undo2} onClick={() => show('reject')} className="!border-red-300 !text-red-700 hover:!bg-red-50">Return to Maker</ActionButton>
      )}
      {canResubmit && (
        <Link href={`/dashboard/admin/projects/create?resubmit=${project._id}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
          <PencilLine className="h-4 w-4" aria-hidden="true" /> Correct &amp; Resubmit
        </Link>
      )}
      {canRevise && (
        <Link href={`/dashboard/admin/projects/create?revise=${project._id}`} className={secondaryLink}>
          <PencilLine className="h-4 w-4" aria-hidden="true" /> Revise Targets
        </Link>
      )}
      {canForward && <ActionButton icon={Send} onClick={() => show('forward')}>Forward to District</ActionButton>}
      {waiting && !canReview && !canForward && (
        <p className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" /> {waiting}
        </p>
      )}

      <Dialog
        open={Boolean(open)}
        onClose={close}
        title={config?.title || ''}
        description={config?.description || undefined}
        size="md"
        dismissible={!busy}
        footer={config && (
          <>
            <ActionButton variant="secondary" onClick={close} disabled={busy}>Cancel</ActionButton>
            <ActionButton
              variant={config.variant === 'danger' ? 'primary' : config.variant}
              className={config.variant === 'danger' ? '!bg-red-700 hover:!bg-red-800' : ''}
              loading={busy}
              onClick={confirm}
            >
              {busy ? config.busy : config.confirm}
            </ActionButton>
          </>
        )}
      >
        {config && (
          <div className="space-y-4">
            <dl className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <dt className="text-xs text-slate-500">Project</dt>
              <dd className="font-semibold text-slate-900">{project.projectTitle}</dd>
              <dd className="font-mono text-xs text-slate-500">{project.projectId || project.sanctionId}</dd>
            </dl>

            {open === 'forward' && (
              <p className="text-sm text-slate-600">
                The sanctioned project will be sent to the <strong>{project.district}</strong> District SARRA Centre. Its District Maker accepts it and assigns the PIA and the MPR reporting responsibility. This cannot be undone here.
              </p>
            )}

            {config.noteLabel && (
              <div>
                <label htmlFor="workflow-note" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  {config.noteLabel}
                  {config.noteRequired ? <span className="text-red-600" aria-hidden="true">*</span> : <span className="text-xs font-normal text-slate-400">(optional)</span>}
                </label>
                <textarea
                  id="workflow-note"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  disabled={busy}
                  onChange={(event) => setNote(event.target.value)}
                  onBlur={() => setNoteTouched(true)}
                  aria-required={config.noteRequired || undefined}
                  aria-invalid={Boolean(noteTouched && noteError) || undefined}
                  aria-describedby={noteTouched && noteError ? 'workflow-note-error' : undefined}
                  className={`${inputClass(Boolean(noteTouched && noteError))} resize-none`}
                />
                <FieldError id="workflow-note-error" message={noteTouched ? noteError : ''} />
              </div>
            )}

            {open === 'approve' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <OrderFile id="order-secretariat" label="Secretariat Approval Order" file={files.secretariatApprovalOrder} disabled={busy} onChange={(file) => setFiles((current) => ({ ...current, secretariatApprovalOrder: file }))} />
                <OrderFile id="order-sanction" label="Sanction Order" file={files.stateSanctionOrder} disabled={busy} onChange={(file) => setFiles((current) => ({ ...current, stateSanctionOrder: file }))} />
              </div>
            )}

            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
