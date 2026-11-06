"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, RotateCcw, Save, Send, ShieldCheck, Undo2 } from 'lucide-react';
import { approveH56Allocation, discardH56Allocation, fetchH56Allocation, returnH56Allocation, saveH56Allocation, submitH56Allocation, verifyH56Allocation } from '@/lib/head56Api';
import { NumericInput } from '@/components/ui/NumericInput';
import { Dialog } from '@/components/ui/Dialog';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { sumMoney } from '@/lib/numeric';
import { AllocationPill, LevelPill, amount, groupLines, lakh, moment, qty, useH56Base } from './shared';

const KEYS = ['physicalTarget', 'targetSize', 'rate', 'deptShareLakh', 'sarraShareLakh', 'openingPhysical', 'openingSarraLakh'];

const DIALOGS = {
  submit: { title: 'Submit the allocation to the HQ Checker?', confirm: 'Submit', label: 'Reason for the revision', min: 0, variant: 'primary' },
  verify: { title: 'Verify this allocation?', description: 'It goes to the HQ Approver for approval and publication.', confirm: 'Verify & Send to HQ Approver', label: 'Remarks (optional)', min: 0, variant: 'success' },
  approve: { title: 'Approve and publish this allocation?', description: 'Monthly reports of the unit are checked against the published figures from now on.', confirm: 'Approve & Publish', label: 'Remarks (optional)', min: 0, variant: 'success' },
  return: { title: 'Return the allocation to the HQ Maker?', description: 'The HQ Maker is told your remarks, corrects it and submits it again.', confirm: 'Return to HQ Maker', label: 'Remarks for the HQ Maker', min: 5, variant: 'primary' },
  discard: { title: 'Discard?', confirm: 'Discard', label: null, min: 0, variant: 'primary' },
};

/**
 * One unit's Head 56 allocation for a year. HQ Maker enters (and revises) it,
 * HQ Checker verifies, HQ Approver approves and publishes. Everyone else reads it.
 * A PIA allocation carries the full Prarup-2 target block; HQ and District
 * allocations an approved budget and, where a line has one, a physical target.
 */
export function Head56AllocationEditor({ id }) {
  const base = useH56Base();
  const router = useRouter();
  const [box, setBox] = useState({ data: null, loading: true, error: '' });
  const [values, setValues] = useState({});
  const [reason, setReason] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const load = useCallback(() => {
    setBox((current) => ({ ...current, loading: true, error: '' }));
    return fetchH56Allocation(id).then((data) => {
      setBox({ data, loading: false, error: '' });
      setValues(Object.fromEntries(data.rows.map((row) => [row.code, { ...Object.fromEntries(KEYS.map((key) => [key, row[key] ? String(row[key]) : ''])), note: row.note || '' }])));
      setReason(data.reason || '');
      setDirty(false);
    }).catch((err) => setBox({ data: null, loading: false, error: err?.message || 'Unable to load the allocation.' }));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const data = box.data;
  const p = data?.permissions || {};
  const editable = Boolean(p.canEdit || p.canRevise);
  const pia = data?.level === 'PIA';
  const revision = (data?.version || 0) > 0;

  const totals = useMemo(() => ({
    budget: sumMoney(Object.values(values).map((v) => v.sarraShareLakh)),
    dept: sumMoney(Object.values(values).map((v) => v.deptShareLakh)),
    opening: sumMoney(Object.values(values).map((v) => v.openingSarraLakh)),
  }), [values]);

  const set = (code, key, value) => { setValues((current) => ({ ...current, [code]: { ...current[code], [key]: value } })); setDirty(true); setDone(''); };
  const lines = () => data.rows.map((row) => ({ code: row.code, ...Object.fromEntries(KEYS.map((key) => [key, values[row.code]?.[key] || 0])), note: values[row.code]?.note || '' }));

  const save = async () => {
    setBusy('save');
    setError('');
    try {
      await saveH56Allocation(id, { lines: lines(), reason });
      await load();
      setDone(revision && data.status === 'PUBLISHED' ? 'Revision started. The published figures stay in force until it is approved.' : 'Allocation saved.');
    } catch (err) { setError(err?.message || 'The allocation could not be saved.'); } finally { setBusy(''); }
  };

  const config = dialog ? { ...DIALOGS[dialog], min: dialog === 'submit' && revision ? 10 : DIALOGS[dialog].min, label: dialog === 'submit' ? (revision ? 'Reason for the budget revision' : null) : DIALOGS[dialog].label } : null;
  const text = note.replace(/\s+/g, ' ').trim();
  const noteError = config?.min && text.length < config.min ? `Write at least ${config.min} characters.` : '';
  const open = (name) => { setDialog(name); setNote(name === 'submit' ? reason : ''); setTouched(false); setError(''); };

  const confirm = async () => {
    setTouched(true);
    if (noteError) return;
    setBusy(dialog);
    setError('');
    try {
      if (dialog === 'submit') {
        if (dirty) await saveH56Allocation(id, { lines: lines(), reason: text });
        await submitH56Allocation(id, text);
      }
      if (dialog === 'verify') await verifyH56Allocation(id, text);
      if (dialog === 'approve') await approveH56Allocation(id, text);
      if (dialog === 'return') await returnH56Allocation(id, text);
      if (dialog === 'discard') {
        const result = await discardH56Allocation(id);
        if (result?.deleted) { router.replace(`${base}?tab=allocation`); return; }
      }
      setDone({ submit: 'Sent to the HQ Checker.', verify: 'Verified and sent to the HQ Approver.', approve: 'Approved and published.', return: 'Returned to the HQ Maker.', discard: 'Revision cancelled. The published figures remain.' }[dialog]);
      setDialog(null);
      await load();
    } catch (err) {
      setError(err?.message || 'This action could not be completed.');
    } finally {
      setBusy('');
    }
  };

  if (box.loading && !data) return <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6" role="status" aria-label="Loading"><Skeleton className="h-12 w-80" /><Skeleton className="h-96" /></div>;
  if (box.error || !data) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Notice tone="error" title="Unable to load the allocation." action={<RetryButton onClick={load} />}>{box.error}</Notice>
        <Link href={`${base}?tab=allocation`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to allocations</Link>
      </div>
    );
  }

  const field = (row, key, { decimals = 5, whole = false } = {}) => (
    editable
      ? <NumericInput value={values[row.code]?.[key] || ''} onChange={(value) => set(row.code, key, value)} allowDecimal={!whole} maxDecimals={decimals} disabled={!row.available && !row.published} aria-label={`${row.code} ${key}`} />
      : <span className="tabular-nums">{key.endsWith('Lakh') || key === 'rate' ? amount(row[key]) : qty(row[key])}</span>
  );
  const physicalField = (row, key) => (row.hasPhysical ? field(row, key, { decimals: 3, whole: key === 'physicalTarget' && !row.allowsDecimal }) : <span className="text-slate-300">—</span>);
  const columns = pia
    ? [['Progress to last FY', (row) => physicalField(row, 'openingPhysical')], ['Target: unit (No./Ha)', (row) => physicalField(row, 'physicalTarget')], ['Target: size (cu.m)', (row) => physicalField(row, 'targetSize')], ['Rate', (row) => field(row, 'rate')], ['Dept. share', (row) => field(row, 'deptShareLakh')], ['SARRA share', (row) => field(row, 'sarraShareLakh')], ['SARRA exp. to last FY', (row) => field(row, 'openingSarraLakh')]]
    : [['Physical target', (row) => physicalField(row, 'physicalTarget')], ['Approved budget', (row) => field(row, 'sarraShareLakh')], ['Progress to last FY', (row) => physicalField(row, 'openingPhysical')], ['Expenditure to last FY', (row) => field(row, 'openingSarraLakh')]];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href={`${base}?tab=allocation`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Head 56 allocations</Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Head 56 allocation · FY {data.financialYear}</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{data.unitName}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm"><LevelPill level={data.level} label={data.levelLabel} /><AllocationPill status={data.status} label={data.statusLabel} />{data.version > 0 && <span className="text-xs text-slate-500">Published version {data.version}{data.publishedAt ? ` · ${moment(data.publishedAt)}` : ''}</span>}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"><dt className="text-xs text-slate-500">{pia ? 'SARRA share' : 'Approved budget'}</dt><dd className="text-base font-bold tabular-nums">{lakh(totals.budget)}</dd></div>
          {pia && <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"><dt className="text-xs text-slate-500">Dept. share</dt><dd className="text-base font-bold tabular-nums">{lakh(totals.dept)}</dd></div>}
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"><dt className="text-xs text-slate-500">Reported this FY</dt><dd className="text-base font-bold tabular-nums">{lakh(data.totals.reportedLakh)}</dd></div>
        </dl>
      </header>

      {data.revisionPending && <Notice tone="warning" title="Budget revision in progress">Version {data.version} ({lakh(data.totals.publishedBudgetLakh)}) stays in force until the HQ Approver publishes the revision.</Notice>}
      {data.returnReason && <Notice tone="warning" title="Returned to the HQ Maker">{data.returnReason}</Notice>}
      {p.blockedReason && <Notice tone="info">{p.blockedReason}</Notice>}
      {p.canRevise && <Notice tone="info">This allocation is published. Changing a figure and saving starts a budget revision, which goes through the HQ Checker and HQ Approver again. A budget or target can never go below what the unit has already reported.</Notice>}
      {done && <Notice tone="success">{done}</Notice>}
      {error && !dialog && <Notice tone="error">{error}</Notice>}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <th scope="col" className="px-3 py-2.5 text-left">Line</th>
                {columns.map(([label]) => <th key={label} scope="col" className="px-3 py-2.5 text-right">{label}</th>)}
                <th scope="col" className="px-3 py-2.5 text-right">Reported this FY</th>
                {revision && <th scope="col" className="px-3 py-2.5 text-right">Published v{data.version}</th>}
                <th scope="col" className="px-3 py-2.5 text-left">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupLines(data.rows, data.parents).map((group) => (
                <React.Fragment key={group.key || group.lines[0].code}>
                  {group.heading && <tr className="bg-amber-50/70"><th scope="rowgroup" colSpan={columns.length + (revision ? 4 : 3)} className="px-3 py-2 text-left text-xs font-semibold text-slate-800">{group.heading.code} — {group.heading.name}{group.heading.nameHindi ? ` · ${group.heading.nameHindi}` : ''}</th></tr>}
                  {group.lines.map((row) => (
                    <tr key={row.code} className={!row.available ? 'bg-slate-50 text-slate-500' : ''}>
                      <th scope="row" className={`min-w-[16rem] px-3 py-2 text-left font-normal ${group.heading ? 'pl-6' : ''}`}>
                        <span className="font-mono text-xs text-slate-500">{row.code}</span>
                        <span className="block font-medium text-slate-900">{row.name}</span>
                        {row.hasPhysical && <span className="text-[11px] text-slate-500">Unit: {row.unit}</span>}
                        {!row.available && <span className="block text-[11px] text-amber-700">Line retired from the master; kept because it holds figures.</span>}
                      </th>
                      {columns.map(([label, render]) => <td key={label} className="w-32 px-2 py-2 text-right">{render(row)}</td>)}
                      <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-600">{row.reportedLakh ? lakh(row.reportedLakh) : '—'}{row.hasPhysical && row.reportedPhysical ? <span className="block">{qty(row.reportedPhysical)} {row.unit}</span> : null}</td>
                      {revision && <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-500">{row.published ? lakh(row.published.sarraShareLakh) : '—'}</td>}
                      <td className="min-w-[10rem] px-2 py-2">{editable ? <input value={values[row.code]?.note || ''} onChange={(event) => set(row.code, 'note', event.target.value)} maxLength={300} aria-label={`${row.code} note`} className={`${inputClass(false)} py-1.5 text-xs`} /> : <span className="text-xs text-slate-600">{row.note}</span>}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 font-bold text-slate-900">
                <th scope="row" className="px-3 py-2.5 text-left">Total</th>
                {columns.map(([label]) => (
                  <td key={label} className="px-3 py-2.5 text-right tabular-nums">{label === 'SARRA share' || label === 'Approved budget' ? amount(totals.budget) : label === 'Dept. share' ? amount(totals.dept) : label.includes('xp. to last FY') || label === 'Expenditure to last FY' ? amount(totals.opening) : ''}</td>
                ))}
                <td className="px-3 py-2.5 text-right tabular-nums">{amount(data.totals.reportedLakh)}</td>
                {revision && <td className="px-3 py-2.5 text-right tabular-nums">{amount(data.totals.publishedBudgetLakh)}</td>}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {(editable || p.canSubmit || p.canVerify || p.canApprove || p.canReturn || p.canDiscard) && (
        <section className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm" aria-label="Actions">
          {editable && <ActionButton variant="secondary" icon={Save} loading={busy === 'save'} disabled={!dirty || Boolean(busy)} onClick={save}>{p.canRevise ? 'Save as Revision' : 'Save'}</ActionButton>}
          {p.canSubmit && <ActionButton icon={Send} disabled={Boolean(busy)} onClick={() => open('submit')}>Submit to HQ Checker</ActionButton>}
          {p.canDiscard && <ActionButton variant="ghost" icon={Undo2} disabled={Boolean(busy)} onClick={() => open('discard')}>{revision ? 'Cancel Revision' : 'Discard Draft'}</ActionButton>}
          {p.canVerify && <ActionButton variant="success" icon={ShieldCheck} onClick={() => open('verify')}>Verify</ActionButton>}
          {p.canApprove && <ActionButton variant="success" icon={CheckCircle2} onClick={() => open('approve')}>Approve &amp; Publish</ActionButton>}
          {p.canReturn && <ActionButton variant="secondary" icon={RotateCcw} onClick={() => open('return')}>Return to HQ Maker</ActionButton>}
          {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">History</h2>
        <ol className="mt-3 space-y-3">
          {data.history.map((entry, index) => (
            <li key={index} className="border-l-2 border-slate-200 pl-3">
              <p className="text-xs font-semibold text-slate-900">{entry.action.replace(/_/g, ' ')}</p>
              <p className="text-xs text-slate-600">{entry.by || '—'} · {entry.role}{entry.designation && entry.designation !== entry.role ? ` (${entry.designation})` : ''} · {moment(entry.at)}</p>
              {entry.note && <p className="mt-0.5 text-xs text-slate-500">{entry.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <Dialog
        open={Boolean(dialog)}
        onClose={() => !busy && setDialog(null)}
        dismissible={!busy}
        title={dialog === 'discard' ? (revision ? 'Cancel the revision?' : 'Discard this draft allocation?') : config?.title}
        description={dialog === 'discard' ? (revision ? `The published version ${data.version} stays in force.` : 'The draft is deleted.') : dialog === 'submit' ? (revision ? 'The revision goes to the HQ Checker; the published figures stay in force meanwhile.' : 'The allocation goes to the HQ Checker for verification.') : config?.description}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setDialog(null)} disabled={Boolean(busy)}>Cancel</ActionButton>
            <ActionButton variant={config?.variant} loading={Boolean(busy)} onClick={confirm}>{dialog === 'discard' ? (revision ? 'Cancel Revision' : 'Discard') : config?.confirm}</ActionButton>
          </>
        )}
      >
        {dialog && (
          <div className="space-y-3">
            {config?.label && (
              <div>
                <label htmlFor="alloc-note" className="mb-1.5 block text-sm font-medium text-slate-700">{config.label}{config.min ? <span className="text-red-600"> *</span> : null}</label>
                <textarea id="alloc-note" rows={3} maxLength={1000} value={note} disabled={Boolean(busy)} onChange={(event) => setNote(event.target.value)} className={`${inputClass(Boolean(touched && noteError))} resize-none`} />
                {touched && <FieldError id="alloc-note-error" message={noteError} />}
              </div>
            )}
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
