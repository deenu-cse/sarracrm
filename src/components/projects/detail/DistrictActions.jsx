"use client";
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, UserCheck, Users } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { SANCTION_STATUS } from '@/constants/status';
import { get } from '@/lib/api';
import { assignPiaOfficers, districtAccept, fetchPiaCandidates, transferPia } from '@/lib/projectWorkflowApi';
import axiosInstance from '@/lib/axiosInstance';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { AllocatedTick } from '@/components/projects/budget/BudgetStatus';
import { OrderFile } from './WorkflowActions';

/** Accept a project forwarded by the State. Budget is released by the State, so no amount is entered here. */
function AcceptDialog({ open, project, budget, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  useEffect(() => { if (open) { setFile(null); setError(''); } }, [open]);

  const confirm = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await districtAccept(project._id, file);
      onClose();
      await onDone();
    } catch (err) {
      setError(err?.message || 'The project could not be accepted. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Accept this project?"
      description={`Confirms that ${project.district} district takes up the project. Next you assign a PIA officer to each department.`}
      size="md"
      dismissible={!busy}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
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

        {budget ? (
          <div className="rounded-lg border border-slate-200 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Budget released by the State</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
              {formatLakh(budget.totals.releasedLakh)} <span className="text-sm font-medium text-slate-500">of {formatLakh(budget.totals.totalBudgetLakh)}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              The State releases this project&apos;s budget to each department in installments. You do not enter an amount here; the released position is shown under Budget &amp; Releases.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Sanctioned budget: <strong>{formatLakh(project.totalSanctionedBudgetLakh)}</strong>.</p>
        )}

        <OrderFile id="order-fund-allocation" label="Fund Allocation Order" file={file} disabled={busy} onChange={setFile} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}

/** An accepted department: shows its officer and lets the district hand the charge to a successor. */
function TransferRow({ department, project, onTransferred }) {
  const [open, setOpen] = useState(false);
  const [successor, setSuccessor] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const others = department.officers.filter((officer) => officer.id !== department.assigned?.id);

  const confirm = async () => {
    if (busy) return;
    if (!successor) { setError('Select the officer taking over.'); return; }
    if (reason.replace(/\s+/g, ' ').trim().length < 5) { setError('Give the reason (for example: officer transferred, retired, on long leave).'); return; }
    setBusy(true);
    setError('');
    try {
      await transferPia(project._id, { departmentId: department.departmentId, piaUserId: successor, reason: reason.replace(/\s+/g, ' ').trim() });
      setOpen(false);
      await onTransferred();
    } catch (err) {
      setError(err?.message || 'The department could not be handed over. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm">
        <p className="flex items-center gap-2 font-medium text-slate-900">
          <AllocatedTick className="h-4 w-4" /> {department.assigned?.name}
          <span className="text-xs font-normal text-emerald-800">· accepted</span>
        </p>
        {!open && (
          <button type="button" onClick={() => { setOpen(true); setError(''); }} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
            Transfer charge
          </button>
        )}
      </div>
      {open && (
        <div className="wz-fade-in mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
          {others.length === 0 ? (
            <p className="text-xs text-amber-900">No other active PIA officer of {department.name} in {project.district}. Ask the State administrator to add one.</p>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-600" htmlFor={`transfer-to-${department.departmentId}`}>Officer taking over</label>
              <select id={`transfer-to-${department.departmentId}`} value={successor} disabled={busy} onChange={(event) => setSuccessor(event.target.value)} className={inputClass(false)}>
                <option value="">Select PIA officer</option>
                {others.map((officer) => <option key={officer.id} value={officer.id}>{officer.name} ({officer.email})</option>)}
              </select>
              <label className="block text-xs font-medium text-slate-600" htmlFor={`transfer-reason-${department.departmentId}`}>Reason</label>
              <input id={`transfer-reason-${department.departmentId}`} type="text" maxLength={500} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Transferred vide order dated 01 Oct 2026" className={inputClass(false)} />
            </>
          )}
          {error && <p role="alert" className="text-xs font-medium text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <ActionButton variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</ActionButton>
            {others.length > 0 && <ActionButton size="sm" loading={busy} onClick={confirm}>{busy ? 'Transferring…' : 'Transfer'}</ActionButton>}
          </div>
        </div>
      )}
    </div>
  );
}

/** One PIA officer per department; only officers of that department in this district are offered. */
function AssignDialog({ open, project, onClose, onDone }) {
  const [box, setBox] = useState({ departments: [], loading: true, error: '' });
  const [choice, setChoice] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  const load = () => {
    setBox({ departments: [], loading: true, error: '' });
    fetchPiaCandidates(project._id)
      .then((departments) => {
        setBox({ departments, loading: false, error: '' });
        // Start from the current assignment; a department with a single eligible officer is pre-selected.
        setChoice(Object.fromEntries(departments.map((d) => [d.departmentId, d.assigned?.id || (d.officers.length === 1 ? d.officers[0].id : '')])));
      })
      .catch((err) => setBox({ departments: [], loading: false, error: err?.message || 'Unable to load PIA officers. Please try again.' }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) { setError(''); load(); } }, [open]);

  const changes = box.departments
    .filter((d) => !d.accepted && choice[d.departmentId] && choice[d.departmentId] !== (d.assigned?.id || ''))
    .map((d) => ({ departmentId: d.departmentId, piaUserId: choice[d.departmentId] }));
  const unstaffed = box.departments.filter((d) => !d.accepted && d.officers.length === 0);

  const confirm = async () => {
    if (busyRef.current || !changes.length) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await assignPiaOfficers(project._id, changes);
      onClose();
      await onDone();
    } catch (err) {
      setError(err?.message || 'The officers could not be assigned. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Assign PIA Officers"
      description="Each department is assigned its own PIA officer. Only that officer can accept the department and report its monthly progress."
      size="lg"
      dismissible={!busy}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton
            icon={UserCheck}
            loading={busy}
            disabled={!changes.length}
            disabledReason="Select a PIA officer for a department that is not yet accepted"
            onClick={confirm}
          >
            {busy ? 'Assigning…' : `Assign ${changes.length || ''} Officer${changes.length === 1 ? '' : 's'}`.replace('  ', ' ')}
          </ActionButton>
        </>
      )}
    >
      {box.loading && <div className="space-y-3" role="status" aria-label="Loading PIA officers">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-16" />)}</div>}
      {!box.loading && box.error && <Notice tone="error" action={<RetryButton onClick={load} />}>{box.error}</Notice>}
      {!box.loading && !box.error && (
        <div className="space-y-4">
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {box.departments.map((department) => {
              const id = `pia-${department.departmentId}`;
              return (
                <li key={department.departmentId} className="grid grid-cols-1 items-center gap-2 px-4 py-3 sm:grid-cols-5 sm:gap-4">
                  <label htmlFor={id} className="text-sm font-semibold text-slate-900 sm:col-span-2">
                    {department.name}
                    <span className="block text-xs font-normal text-slate-500">
                      {department.officers.length} eligible officer{department.officers.length === 1 ? '' : 's'} in {project.district}
                    </span>
                  </label>
                  <div className="sm:col-span-3">
                    {department.accepted ? (
                      <TransferRow department={department} project={project} onTransferred={async () => { load(); await onDone(); }} />
                    ) : department.officers.length === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        No active PIA officer of {department.name} in {project.district}. Ask the State administrator to add one; this department can be assigned later.
                      </p>
                    ) : (
                      <select
                        id={id}
                        value={choice[department.departmentId] || ''}
                        disabled={busy}
                        onChange={(event) => setChoice((current) => ({ ...current, [department.departmentId]: event.target.value }))}
                        className={`${inputClass(false)} ${choice[department.departmentId] ? '' : 'text-slate-400'}`}
                      >
                        <option value="">Select PIA officer</option>
                        {department.officers.map((officer) => (
                          <option key={officer.id} value={officer.id} className="text-slate-900">
                            {officer.name}{officer.designation ? ` — ${officer.designation}` : ''} ({officer.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {unstaffed.length > 0 && changes.length > 0 && (
            <p className="text-xs text-slate-500">Departments without an officer stay unassigned for now. You can assign them later from this page.</p>
          )}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      )}
    </Dialog>
  );
}

/** Older projects without departments keep a single PIA officer. */
function LegacyAssignDialog({ open, project, onClose, onDone }) {
  const [officers, setOfficers] = useState(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected(''); setError(''); setOfficers(null);
    get(`/admin/users?role=PIA_OFFICER&district=${encodeURIComponent(project.district)}&limit=200`).then((res) => {
      setOfficers(Array.isArray(res?.data) ? res.data : []);
    });
  }, [open, project.district]);

  const confirm = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      await axiosInstance.patch(`/sanctions/${project._id}/forward-pia`, { piaUserId: selected });
      onClose();
      await onDone();
    } catch (err) {
      setError(err?.response?.data?.message || 'The officer could not be assigned. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Assign to PIA Officer"
      size="md"
      dismissible={!busy}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton loading={busy} disabled={!selected} disabledReason="Select a PIA officer" onClick={confirm}>Assign to PIA</ActionButton>
        </>
      )}
    >
      {officers === null ? <Skeleton className="h-11" /> : (
        <>
          <label htmlFor="legacy-pia" className="mb-1.5 block text-sm font-medium text-slate-700">PIA Officer</label>
          <select id="legacy-pia" value={selected} onChange={(event) => setSelected(event.target.value)} className={inputClass(false)}>
            <option value="">Select PIA officer</option>
            {officers.map((officer) => <option key={officer._id} value={officer._id}>{officer.name} ({officer.department || 'No department'})</option>)}
          </select>
          {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
        </>
      )}
    </Dialog>
  );
}

/** What the District Director can do with the project right now. */
export function DistrictActions({ project, budget, onDone }) {
  const [open, setOpen] = useState(null);
  const { status } = project;
  const departments = project.departmentAllocations || [];
  const departmentWise = departments.length > 0;
  const unassigned = departments.filter((d) => !d.piaUserId);
  const awaitingAcceptance = departments.filter((d) => d.piaUserId && !d.piaAcceptedAt);

  const canAccept = status === SANCTION_STATUS.FORWARDED_TO_DISTRICT;
  const canAssign = departmentWise
    ? [SANCTION_STATUS.DISTRICT_ACCEPTED, SANCTION_STATUS.FORWARDED_TO_PIA, SANCTION_STATUS.PIA_ACCEPTED].includes(status) && project.closure?.status !== 'CLOSED'
    : status === SANCTION_STATUS.DISTRICT_ACCEPTED;

  let waiting = '';
  if (status === SANCTION_STATUS.FORWARDED_TO_PIA && unassigned.length === 0) {
    waiting = departmentWise
      ? `Waiting for ${awaitingAcceptance.length} PIA officer${awaitingAcceptance.length === 1 ? '' : 's'} to accept.`
      : 'Assigned to a PIA officer. Waiting for acceptance.';
  } else if (status === SANCTION_STATUS.PIA_ACCEPTED) {
    waiting = 'All PIA officers have accepted. Monthly progress is being reported.';
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canAccept && <ActionButton variant="success" icon={CheckCircle2} onClick={() => setOpen('accept')}>Accept Project</ActionButton>}
      {canAssign && (
        <ActionButton variant={unassigned.length > 0 || !departmentWise ? 'primary' : 'secondary'} icon={Users} onClick={() => setOpen('assign')}>
          {departmentWise && unassigned.length === 0 ? (awaitingAcceptance.length === 0 ? 'Transfer PIA Charge' : 'Change PIA Officers') : 'Assign PIA Officers'}
        </ActionButton>
      )}
      {waiting && (
        <p className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" /> {waiting}
        </p>
      )}

      <AcceptDialog open={open === 'accept'} project={project} budget={budget} onClose={() => setOpen(null)} onDone={onDone} />
      {departmentWise
        ? <AssignDialog open={open === 'assign'} project={project} onClose={() => setOpen(null)} onDone={onDone} />
        : <LegacyAssignDialog open={open === 'assign'} project={project} onClose={() => setOpen(null)} onDone={onDone} />}
    </div>
  );
}
