"use client";
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, UserCheck, Users } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { SANCTION_STATUS, ENTRY_MODE_LABELS } from '@/constants/status';
import { workflowRoleOf } from '@/constants/roles';
import { get } from '@/lib/api';
import { assignPiaOfficers, districtAccept, fetchPiaCandidates, transferPia } from '@/lib/projectWorkflowApi';
import axiosInstance from '@/lib/axiosInstance';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { DoneTick } from '@/components/ui/Progress';

/** District Maker receives and accepts a project forwarded by SARRA HQ. */
function AcceptDialog({ open, project, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  useEffect(() => { if (open) setError(''); }, [open]);

  const confirm = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await districtAccept(project._id);
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
      description={`Confirms that the ${project.district} District SARRA Centre takes up the project. Next you assign the PIA and the MPR reporting responsibility of each department.`}
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
          <dd className="font-mono text-xs text-slate-500">{project.projectId} · {project.sanctionId}</dd>
        </dl>
        <p className="text-sm text-slate-600">Sanctioned amount: <strong className="tabular-nums">{formatLakh(project.totalSanctionedBudgetLakh)}</strong> across {(project.departmentAllocations || []).length || 1} department{(project.departmentAllocations || []).length === 1 ? '' : 's'}.</p>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}

/** An accepted department: shows its PIA Maker and lets the District Maker hand the charge to a successor. */
function TransferRow({ department, project, onTransferred }) {
  const [open, setOpen] = useState(false);
  const [successor, setSuccessor] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const others = department.officers.filter((officer) => officer.id !== department.assigned?.id);

  const confirm = async () => {
    if (busy) return;
    if (!successor) { setError('Select the PIA Maker taking over.'); return; }
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
          <DoneTick className="h-4 w-4" /> {department.assigned?.name}
          <span className="text-xs font-normal text-emerald-800">· PIA Maker, accepted</span>
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
            <p className="text-xs text-amber-900">No other active PIA Maker of {department.name} in {project.district}. Add one under Users.</p>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-600" htmlFor={`transfer-to-${department.departmentId}`}>PIA Maker taking over</label>
              <select id={`transfer-to-${department.departmentId}`} value={successor} disabled={busy} onChange={(event) => setSuccessor(event.target.value)} className={inputClass(false)}>
                <option value="">Select PIA Maker</option>
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

const initialChoice = (department) => ({
  reportingMode: department.reportingMode || 'PIA',
  piaUserId: department.assigned?.id || (department.officers.length === 1 ? department.officers[0].id : ''),
  districtStaffUserId: department.districtStaff?.id || '',
});

/**
 * For each department: the PIA Maker who implements it, and the MPR reporting
 * responsibility — PIA entry (PIA Maker → PIA Checker → PIA Approver) or
 * District entry by District Technical Staff (PIA approval chain bypassed).
 */
function AssignDialog({ open, project, onClose, onDone }) {
  const [box, setBox] = useState({ departments: [], districtStaff: [], loading: true, error: '' });
  const [choice, setChoice] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  const load = () => {
    setBox({ departments: [], districtStaff: [], loading: true, error: '' });
    fetchPiaCandidates(project._id)
      .then(({ departments, districtStaff }) => {
        setBox({ departments, districtStaff, loading: false, error: '' });
        setChoice(Object.fromEntries(departments.map((d) => [d.departmentId, initialChoice(d)])));
      })
      .catch((err) => setBox({ departments: [], districtStaff: [], loading: false, error: err?.message || 'Unable to load the officers. Please try again.' }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) { setError(''); load(); } }, [open]);

  const setFor = (departmentId, key, value) => setChoice((current) => ({ ...current, [departmentId]: { ...current[departmentId], [key]: value } }));

  // Only departments whose choice differs from what is saved are sent.
  const changes = box.departments.map((d) => {
    const next = choice[d.departmentId];
    if (!next) return null;
    const saved = initialChoice({ ...d, officers: [] });
    const piaChanged = !d.accepted && next.piaUserId && next.piaUserId !== (d.assigned?.id || '');
    const modeChanged = next.reportingMode !== saved.reportingMode;
    const staffChanged = (next.districtStaffUserId || '') !== (d.districtStaff?.id || '');
    if (!piaChanged && !modeChanged && !staffChanged) return null;
    return {
      departmentId: d.departmentId,
      reportingMode: next.reportingMode,
      ...(piaChanged ? { piaUserId: next.piaUserId } : {}),
      districtStaffUserId: next.districtStaffUserId || (next.reportingMode === 'PIA' ? '' : undefined),
    };
  }).filter(Boolean);

  const missing = box.departments.find((d) => {
    const next = choice[d.departmentId];
    if (!next) return false;
    if (next.reportingMode === 'PIA' && !next.piaUserId && !d.assigned) return true;
    return next.reportingMode === 'DISTRICT' && !next.districtStaffUserId;
  });

  const confirm = async () => {
    if (busyRef.current || !changes.length) return;
    if (missing) { setError(`${missing.name}: ${choice[missing.departmentId].reportingMode === 'DISTRICT' ? 'select the District Technical Staff who will report its progress.' : 'select the PIA Maker who will report its progress.'}`); return; }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await assignPiaOfficers(project._id, changes);
      onClose();
      await onDone();
    } catch (err) {
      setError(err?.message || 'The assignment could not be saved. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Assign PIA and Reporting Responsibility"
      description="Each department gets its PIA Maker and a reporting responsibility. Only one report can exist for a project, department and month, whichever option is used."
      size="xl"
      dismissible={!busy}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton icon={UserCheck} loading={busy} disabled={!changes.length} disabledReason="Change the assignment of at least one department" onClick={confirm}>
            {busy ? 'Saving…' : `Save ${changes.length || ''} Assignment${changes.length === 1 ? '' : 's'}`.replace('  ', ' ')}
          </ActionButton>
        </>
      )}
    >
      {box.loading && <div className="space-y-3" role="status" aria-label="Loading officers">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-24" />)}</div>}
      {!box.loading && box.error && <Notice tone="error" action={<RetryButton onClick={load} />}>{box.error}</Notice>}
      {!box.loading && !box.error && (
        <div className="space-y-4">
          <ul className="space-y-3">
            {box.departments.map((department) => {
              const next = choice[department.departmentId] || initialChoice(department);
              const district = next.reportingMode === 'DISTRICT';
              return (
                <li key={department.departmentId} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{department.name}</p>
                    <div role="radiogroup" aria-label={`${department.name}: MPR reporting responsibility`} className="flex gap-1.5">
                      {['PIA', 'DISTRICT'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          role="radio"
                          aria-checked={next.reportingMode === mode}
                          disabled={busy || (department.reportingLocked && department.reportingMode !== mode)}
                          title={department.reportingLocked ? department.reportingLockedReason : undefined}
                          onClick={() => setFor(department.departmentId, 'reportingMode', mode)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50
                            ${next.reportingMode === mode ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                          {ENTRY_MODE_LABELS[mode]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {department.reportingLocked && <p className="mt-1 text-xs text-amber-800">Reporting responsibility locked: {department.reportingLockedReason}</p>}

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`pia-${department.departmentId}`} className="mb-1 block text-xs font-medium text-slate-600">
                        PIA Maker {district ? <span className="font-normal text-slate-400">(optional in district entry)</span> : <span className="text-red-600" aria-hidden="true">*</span>}
                      </label>
                      {department.accepted ? (
                        <TransferRow department={department} project={project} onTransferred={async () => { load(); await onDone(); }} />
                      ) : department.officers.length === 0 ? (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">No active PIA Maker of {department.name} in {project.district}. Add one under Users{district ? '' : ', or choose District entry'}.</p>
                      ) : (
                        <select id={`pia-${department.departmentId}`} value={next.piaUserId} disabled={busy} onChange={(event) => setFor(department.departmentId, 'piaUserId', event.target.value)} className={`${inputClass(false)} ${next.piaUserId ? '' : 'text-slate-400'}`}>
                          <option value="">Select PIA Maker</option>
                          {department.officers.map((officer) => (
                            <option key={officer.id} value={officer.id} className="text-slate-900">{officer.name}{officer.designation ? ` — ${officer.designation}` : ''} ({officer.email})</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label htmlFor={`staff-${department.departmentId}`} className="mb-1 block text-xs font-medium text-slate-600">
                        District Technical Staff {district ? <span className="text-red-600" aria-hidden="true">*</span> : <span className="font-normal text-slate-400">(optional, verifies field photographs)</span>}
                      </label>
                      <select id={`staff-${department.departmentId}`} value={next.districtStaffUserId} disabled={busy || (department.reportingLocked && district)} onChange={(event) => setFor(department.departmentId, 'districtStaffUserId', event.target.value)} className={`${inputClass(false)} ${next.districtStaffUserId ? '' : 'text-slate-400'}`}>
                        <option value="">{district ? 'Select District Maker' : 'None'}</option>
                        {box.districtStaff.map((member) => <option key={member.id} value={member.id} className="text-slate-900">{member.name}{member.designation ? ` — ${member.designation}` : ''}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {district
                      ? 'District Technical Staff prepares the MPR → District Checker → District Approver → HQ. The PIA approval chain is bypassed; the district is accountable for the report.'
                      : 'PIA Maker prepares the MPR → PIA Checker → PIA Approver → District Maker → District Checker → District Approver → HQ.'}
                  </p>
                </li>
              );
            })}
          </ul>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      )}
    </Dialog>
  );
}

/** Older projects without departments keep a single PIA Maker. */
function LegacyAssignDialog({ open, project, onClose, onDone }) {
  const [officers, setOfficers] = useState(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected(''); setError(''); setOfficers(null);
    get(`/admin/users?role=PIA_OFFICER&workflowRole=MAKER&limit=200`).then((res) => {
      setOfficers(Array.isArray(res?.data) ? res.data : []);
    }).catch(() => setOfficers([]));
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
      title="Assign to PIA Maker"
      size="md"
      dismissible={!busy}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton loading={busy} disabled={!selected} disabledReason="Select a PIA Maker" onClick={confirm}>Assign to PIA</ActionButton>
        </>
      )}
    >
      {officers === null ? <Skeleton className="h-11" /> : (
        <>
          <label htmlFor="legacy-pia" className="mb-1.5 block text-sm font-medium text-slate-700">PIA Maker</label>
          <select id="legacy-pia" value={selected} onChange={(event) => setSelected(event.target.value)} className={inputClass(false)}>
            <option value="">Select PIA Maker</option>
            {officers.map((officer) => <option key={officer._id} value={officer._id}>{officer.name} ({officer.department || 'No department'})</option>)}
          </select>
          {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
        </>
      )}
    </Dialog>
  );
}

/** What the signed-in district user can do with the project right now. Accepting and assigning is the District Maker's. */
export function DistrictActions({ project, user, onDone }) {
  const [open, setOpen] = useState(null);
  const { status } = project;
  const maker = workflowRoleOf(user) === 'MAKER';
  const departments = project.departmentAllocations || [];
  const departmentWise = departments.length > 0;
  const unassigned = departments.filter((d) => !d.piaUserId && !d.districtStaffUserId);
  const awaitingAcceptance = departments.filter((d) => d.reportingMode !== 'DISTRICT' && d.piaUserId && !d.piaAcceptedAt);

  const canAccept = maker && status === SANCTION_STATUS.FORWARDED_TO_DISTRICT;
  const canAssign = maker && (departmentWise
    ? [SANCTION_STATUS.DISTRICT_ACCEPTED, SANCTION_STATUS.FORWARDED_TO_PIA, SANCTION_STATUS.PIA_ACCEPTED].includes(status) && project.closure?.status !== 'CLOSED'
    : status === SANCTION_STATUS.DISTRICT_ACCEPTED);

  let waiting = '';
  if (status === SANCTION_STATUS.FORWARDED_TO_DISTRICT && !maker) waiting = 'Waiting for the District Maker to accept this project.';
  else if (status === SANCTION_STATUS.DISTRICT_ACCEPTED && !maker) waiting = 'Accepted. Waiting for the District Maker to assign the PIA and reporting responsibility.';
  else if (status === SANCTION_STATUS.FORWARDED_TO_PIA && unassigned.length === 0) {
    waiting = departmentWise
      ? `Waiting for ${awaitingAcceptance.length} PIA Maker${awaitingAcceptance.length === 1 ? '' : 's'} to accept.`
      : 'Assigned to a PIA Maker. Waiting for acceptance.';
  } else if (status === SANCTION_STATUS.PIA_ACCEPTED) {
    waiting = 'Active. Every department is ready for monthly progress reporting.';
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canAccept && <ActionButton variant="success" icon={CheckCircle2} onClick={() => setOpen('accept')}>Accept Project</ActionButton>}
      {canAssign && (
        <ActionButton variant={unassigned.length > 0 || !departmentWise ? 'primary' : 'secondary'} icon={Users} onClick={() => setOpen('assign')}>
          {departmentWise && unassigned.length === 0 ? 'Change Assignment / Transfer Charge' : 'Assign PIA & Reporting'}
        </ActionButton>
      )}
      {waiting && (
        <p className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" /> {waiting}
        </p>
      )}

      <AcceptDialog open={open === 'accept'} project={project} onClose={() => setOpen(null)} onDone={onDone} />
      {departmentWise
        ? <AssignDialog open={open === 'assign'} project={project} onClose={() => setOpen(null)} onDone={onDone} />
        : <LegacyAssignDialog open={open === 'assign'} project={project} onClose={() => setOpen(null)} onDone={onDone} />}
    </div>
  );
}
