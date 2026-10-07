"use client";
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, UserCog } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { fetchPiaWorkload, handoverPiaCharge } from '@/lib/projectWorkflowApi';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';

/**
 * Handing over charge: when a PIA officer is transferred, retires or goes on
 * long leave, the District Director moves every department that officer holds
 * in the district to a successor of the same department, in one step.
 */
export function PiaHandoverDialog({ open, onClose, onDone }) {
  const [box, setBox] = useState({ officers: [], loading: true, error: '' });
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [reason, setReason] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const busyRef = useRef(false);

  const load = () => {
    setBox({ officers: [], loading: true, error: '' });
    fetchPiaWorkload()
      .then((officers) => setBox({ officers, loading: false, error: '' }))
      .catch((err) => setBox({ officers: [], loading: false, error: err?.message || 'Unable to load PIA officers. Please try again.' }));
  };
  useEffect(() => {
    if (!open) return;
    setFromId(''); setToId(''); setReason(''); setAttempted(false); setError(''); setResult(null);
    load();
  }, [open]);

  const holders = box.officers.filter((officer) => officer.holdings.length > 0);
  const from = holders.find((officer) => officer.id === fromId) || null;
  const reasonError = reason.replace(/\s+/g, ' ').trim().length < 5 ? 'Give the reason (for example: officer transferred, retired, on long leave).' : '';
  const fromError = !from ? 'Select the officer handing over.' : '';
  const toError = !toId ? 'Select the officer taking over.' : '';

  const confirm = async () => {
    if (busyRef.current) return;
    setAttempted(true);
    if (fromError || toError || reasonError) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      setResult(await handoverPiaCharge({ fromUserId: fromId, toUserId: toId, reason: reason.replace(/\s+/g, ' ').trim() }));
      await onDone?.();
    } catch (err) {
      setError(err?.message || 'The charge could not be handed over. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Hand Over PIA Charge"
      description="Moves every department an officer holds in your district to a successor of the same department. The successor continues the same monthly reports."
      size="lg"
      dismissible={!busy}
      footer={result ? <ActionButton onClick={onClose}>Done</ActionButton> : (
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton icon={UserCog} loading={busy} onClick={confirm}>{busy ? 'Handing over…' : 'Hand Over Charge'}</ActionButton>
        </>
      )}
    >
      {result && (
        <Notice tone="success" title="Charge handed over">
          {result.departments} department{result.departments === 1 ? '' : 's'} on {result.projects} project{result.projects === 1 ? '' : 's'} moved from {result.from} to {result.to}. {result.to} has been notified.
        </Notice>
      )}
      {!result && box.loading && <div className="space-y-3" role="status" aria-label="Loading PIA officers"><Skeleton className="h-11" /><Skeleton className="h-11" /></div>}
      {!result && !box.loading && box.error && <Notice tone="error" action={<RetryButton onClick={load} />}>{box.error}</Notice>}
      {!result && !box.loading && !box.error && holders.length === 0 && <Notice tone="info">No PIA officer in your district holds a department yet.</Notice>}
      {!result && !box.loading && !box.error && holders.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <label htmlFor="handover-from" className="mb-1.5 block text-sm font-medium text-slate-700">Officer handing over <span className="text-red-600" aria-hidden="true">*</span></label>
              <select id="handover-from" value={fromId} disabled={busy} onChange={(event) => { setFromId(event.target.value); setToId(''); }} className={inputClass(Boolean(attempted && fromError))}>
                <option value="">Select officer</option>
                {holders.map((officer) => <option key={officer.id} value={officer.id}>{officer.name} — {officer.department} ({officer.holdings.length}){officer.active ? '' : ' · inactive'}</option>)}
              </select>
              <FieldError message={attempted ? fromError : ''} />
            </div>
            <ArrowRight className="mt-9 hidden h-5 w-5 text-slate-400 sm:block" aria-hidden="true" />
            <div>
              <label htmlFor="handover-to" className="mb-1.5 block text-sm font-medium text-slate-700">Officer taking over <span className="text-red-600" aria-hidden="true">*</span></label>
              <select id="handover-to" value={toId} disabled={busy || !from} onChange={(event) => setToId(event.target.value)} className={`${inputClass(Boolean(attempted && toError))} disabled:cursor-not-allowed disabled:bg-slate-50`}>
                <option value="">{from ? 'Select successor' : 'Select the first officer'}</option>
                {(from?.successors || []).map((officer) => <option key={officer.id} value={officer.id}>{officer.name} ({officer.email})</option>)}
              </select>
              <FieldError message={attempted ? toError : ''} />
              {from && from.successors.length === 0 && <p className="mt-1.5 text-xs text-amber-800">No other active {from.department} officer in the district. Ask the State administrator to add one.</p>}
            </div>
          </div>

          {from && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Departments that will move ({from.holdings.length})</p>
              <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 text-sm">
                {from.holdings.map((holding) => (
                  <li key={`${holding.projectId}-${holding.department}`} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate"><span className="font-mono text-xs text-slate-500">{holding.projectCode}</span> {holding.projectName}</span>
                    <span className="flex-shrink-0 text-xs text-slate-600">{holding.department}{holding.accepted ? '' : ' · not yet accepted'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="handover-reason" className="mb-1.5 block text-sm font-medium text-slate-700">Reason <span className="text-red-600" aria-hidden="true">*</span></label>
            <input id="handover-reason" type="text" maxLength={500} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Transferred to Haridwar vide order dated 01 Oct 2026" className={inputClass(Boolean(attempted && reasonError))} />
            <FieldError message={attempted ? reasonError : ''} />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      )}
    </Dialog>
  );
}
