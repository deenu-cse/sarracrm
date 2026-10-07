"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardPlus } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { SANCTION_STATUS } from '@/constants/status';
import { piaAccept } from '@/lib/projectWorkflowApi';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, Notice } from '@/components/projects/create/parts';

export const MPR_ENTRY_ROUTE = '/dashboard/officer/forms/new';

const idOf = (value) => String(value?._id || value || '');

/** The signed-in officer's own departments on a project, and what they still have to do. */
export function myAssignment(project, user) {
  const userId = String(user?._id || user?.id || '');
  const departments = (project.departmentAllocations || []).filter((d) => d.piaUserId && idOf(d.piaUserId) === userId);
  const legacy = (project.departmentAllocations || []).length === 0;
  const legacyMine = legacy && idOf(project.forwardedToPIA) === userId;
  return {
    departments,
    legacy,
    needsAcceptance: legacy ? legacyMine && project.status === SANCTION_STATUS.FORWARDED_TO_PIA : departments.some((d) => !d.piaAcceptedAt),
    canReport: !legacy && departments.some((d) => d.piaAcceptedAt),
  };
}

/** PIA officer: accept the assigned department(s), then file monthly progress. */
export function PiaActions({ project, user, onDone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const mine = myAssignment(project, user);
  const pending = mine.departments.filter((d) => !d.piaAcceptedAt);

  const confirm = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await piaAccept(project._id);
      setOpen(false);
      await onDone();
    } catch (err) {
      setError(err?.message || 'The project could not be accepted. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mine.needsAcceptance && (
        <ActionButton variant="success" icon={CheckCircle2} onClick={() => { setError(''); setOpen(true); }}>Accept Project</ActionButton>
      )}
      {mine.canReport && (
        <Link
          href={`${MPR_ENTRY_ROUTE}?projectId=${project._id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2"
        >
          <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> File Monthly Progress
        </Link>
      )}

      <Dialog
        open={open}
        onClose={() => { if (!busy) setOpen(false); }}
        title="Accept this project?"
        description="After accepting you can report monthly progress for your department."
        size="md"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant="success" loading={busy} onClick={confirm}>{busy ? 'Accepting…' : 'Accept Project'}</ActionButton>
          </>
        )}
      >
        <div className="space-y-4">
          <dl className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <dt className="text-xs text-slate-500">Project</dt>
            <dd className="font-semibold text-slate-900">{project.projectTitle}</dd>
            <dd className="font-mono text-xs text-slate-500">{project.projectId || project.sanctionId}</dd>
          </dl>
          {pending.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned to you</p>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
                {pending.map((department) => (
                  <li key={idOf(department.departmentId)} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span className="font-medium text-slate-900">{department.departmentName}</span>
                    <span className="tabular-nums text-slate-600">{formatLakh(department.totalLakh)} · {(department.activities || []).length} activities</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Dialog>
    </div>
  );
}
