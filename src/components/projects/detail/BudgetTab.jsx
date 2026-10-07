"use client";
import React, { useMemo, useRef, useState } from 'react';
import { FileText, Undo2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { reverseInstallment } from '@/lib/budgetApi';
import { ActionButton, FieldError, inputClass } from '@/components/projects/create/parts';
import { formatLakh, lakhToRupees } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { AllocatedTick, ProgressBar, ordinal } from '@/components/projects/budget/BudgetStatus';
import { EmptyNote, ExportButton, Panel, StatTile, downloadCsv, formatDay, formatMoment } from './shared';

/** Budget released so far: totals, department × installment matrix, and the release ledger. */
export function BudgetTab({ project, budget, loading, error, onRetry, actions, canReverse = false, onChanged }) {
  const [reversing, setReversing] = useState(null); // ledger row
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reverseError, setReverseError] = useState('');
  const busyRef = useRef(false);
  const reasonError = reason.replace(/\s+/g, ' ').trim().length < 10 ? 'Give the reason for reversing this release (at least 10 characters).' : '';

  const confirmReverse = async () => {
    if (busyRef.current) return;
    setTouched(true);
    if (reasonError) return;
    busyRef.current = true;
    setBusy(true);
    setReverseError('');
    try {
      await reverseInstallment(project._id, { departmentId: reversing.departmentId, installmentNumber: reversing.installmentNumber, reason: reason.replace(/\s+/g, ' ').trim() });
      setReversing(null);
      await onChanged?.();
    } catch (err) {
      setReverseError(err?.message || 'Unable to reverse the release. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const ledger = useMemo(() => {
    if (!budget) return [];
    return budget.departments
      .flatMap((department) => department.installments.map((installment) => ({
        ...installment,
        department: department.name,
        departmentId: department.departmentId,
        // Only the latest installment of a department can be reversed.
        reversible: installment.installmentNumber === department.reversibleInstallment,
      })))
      .sort((a, b) => (
        String(b.allocationDate).localeCompare(String(a.allocationDate))
        || String(b.releasedAt).localeCompare(String(a.releasedAt))
        || a.department.localeCompare(b.department)
      ));
  }, [budget]);

  if (loading) {
    return <div className="space-y-4" role="status" aria-label="Loading budget"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  }
  if (error) return <Notice tone="error" title="Unable to load the budget position." action={<RetryButton onClick={onRetry} />}>{error}</Notice>;
  if (!budget || budget.departments.length === 0) {
    return <EmptyNote>Budget release is tracked for projects created with department-wise budget. This project has none.</EmptyNote>;
  }

  const { totals, rules } = budget;
  const full = totals.status === 'FULLY_ALLOCATED';
  const numbers = Array.from({ length: rules.maxInstallments }, (_, index) => index + 1);
  const code = project.projectId || project.sanctionId || 'project';

  const exportLedger = () => downloadCsv(
    `${code}_budget_releases.csv`,
    ['Allocation Date', 'Department', 'Installment', 'Amount (Rs. Lakh)', '% of Department Budget', 'Released By', 'Entered On', 'Document'],
    [...ledger].reverse().map((row) => [
      formatDay(row.allocationDate), row.department, ordinal(row.installmentNumber), row.amountLakh, row.percentage,
      row.releasedBy || '', formatMoment(row.releasedAt, true), row.document?.url || '',
    ]),
  );

  return (
    <div className="space-y-5">
      {!budget.eligible && !full && <Notice tone="warning" title="Budget cannot be allocated yet">{budget.ineligibleReason}</Notice>}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total Project Budget" value={formatLakh(totals.totalBudgetLakh)} sub={lakhToRupees(totals.totalBudgetLakh)} />
        <StatTile label="Total Released" value={formatLakh(totals.releasedLakh)} sub={`${totals.percentAllocated}% of budget`} tone="success" />
        <StatTile label="Remaining" value={formatLakh(totals.remainingLakh)} sub={full ? 'Nothing left to release' : lakhToRupees(totals.remainingLakh)} tone={full ? 'success' : 'warning'} />
        <StatTile label="Installments Released" value={String(ledger.length)} sub={`Across ${budget.departments.filter((d) => d.installments.length).length} of ${budget.departments.length} departments`} />
      </dl>

      <Panel
        title="Department-wise Release"
        description={`Up to ${rules.maxInstallments} installments per department.`}
        aside={(
          <div className="flex flex-wrap items-center gap-2">
            {full && <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><AllocatedTick className="h-3.5 w-3.5" /> Budget Fully Allocated</span>}
            {actions}
          </div>
        )}
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-5 py-2.5">Department</th>
                <th scope="col" className="px-3 py-2.5 text-right">Budget</th>
                {numbers.map((number) => <th key={number} scope="col" className="px-3 py-2.5 text-right">{ordinal(number)}</th>)}
                <th scope="col" className="px-3 py-2.5 text-right">Total Released</th>
                <th scope="col" className="px-3 py-2.5 text-right">Remaining</th>
                <th scope="col" className="w-44 px-5 py-2.5">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budget.departments.map((department) => {
                const byNumber = new Map(department.installments.map((item) => [item.installmentNumber, item]));
                const complete = department.status === 'FULLY_ALLOCATED';
                return (
                  <tr key={department.departmentId} className={complete ? 'bg-emerald-50/30' : ''}>
                    <th scope="row" className="px-5 py-3 text-left font-medium text-slate-900">
                      <span className="inline-flex items-center gap-1.5">{department.name}{complete && <AllocatedTick className="h-3.5 w-3.5" />}</span>
                      <span className="block text-xs font-normal text-slate-400">SARRA share {formatLakh(department.sarraShareLakh)}</span>
                    </th>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">{formatLakh(department.budgetLakh)}</td>
                    {numbers.map((number) => {
                      const item = byNumber.get(number);
                      return (
                        <td key={number} className="px-3 py-3 text-right tabular-nums">
                          {item ? (
                            <>
                              <span className="font-medium text-slate-800">{formatLakh(item.amountLakh)}</span>
                              <span className="block text-xs text-slate-400">{item.percentage}% · {formatDay(item.allocationDate)}</span>
                            </>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-3 text-right font-semibold tabular-nums ${complete ? 'text-emerald-700' : 'text-slate-900'}`}>{formatLakh(department.releasedLakh)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatLakh(department.remainingLakh)}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold tabular-nums text-slate-700">{department.percentAllocated}%</span>
                      <div className="mt-1"><ProgressBar percent={department.percentAllocated} complete={complete} label={`${department.name}: budget released`} /></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                <th scope="row" className="px-5 py-3 text-left">Project Total</th>
                <td className="px-3 py-3 text-right tabular-nums">{formatLakh(totals.totalBudgetLakh)}</td>
                {numbers.map((number) => {
                  const sum = budget.departments.reduce((total, department) => total + Math.round((department.installments.find((item) => item.installmentNumber === number)?.amountLakh || 0) * 100000), 0) / 100000;
                  return <td key={number} className="px-3 py-3 text-right tabular-nums">{sum > 0 ? formatLakh(sum) : <span className="font-normal text-slate-300">—</span>}</td>;
                })}
                <td className="px-3 py-3 text-right tabular-nums">{formatLakh(totals.releasedLakh)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatLakh(totals.remainingLakh)}</td>
                <td className="px-5 py-3 text-xs tabular-nums">{totals.percentAllocated}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <Panel
        title="Release Ledger"
        description="Every installment released, newest first."
        aside={<ExportButton onClick={exportLedger} disabled={!ledger.length} />}
        padded={false}
      >
        {ledger.length === 0 ? (
          <div className="p-5"><EmptyNote>No budget has been released for this project yet.</EmptyNote></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">Allocation Date</th>
                  <th scope="col" className="px-3 py-2.5">Department</th>
                  <th scope="col" className="px-3 py-2.5">Installment</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                  <th scope="col" className="px-3 py-2.5 text-right">% of Budget</th>
                  <th scope="col" className="px-3 py-2.5">Released By</th>
                  <th scope="col" className="px-3 py-2.5">Document</th>
                  {canReverse && <th scope="col" className="px-5 py-2.5"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((row) => (
                  <tr key={`${row.department}-${row.installmentNumber}`} className="transition-colors hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-2.5 text-slate-700">{formatDay(row.allocationDate)}</td>
                    <th scope="row" className="px-3 py-2.5 text-left font-medium text-slate-900">{row.department}</th>
                    <td className="px-3 py-2.5"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{ordinal(row.installmentNumber)}</span></td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">{formatLakh(row.amountLakh)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{row.percentage}%</td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {row.releasedBy || '—'}
                      {row.releasedAt && <span className="block text-xs text-slate-400">{formatMoment(row.releasedAt, true)}</span>}
                    </td>
                    <td className="px-5 py-2.5">
                      {row.document ? (
                        <a href={row.document.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[13rem] items-center gap-1.5 text-xs font-medium text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{row.document.name || 'PDF document'}</span>
                        </a>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    {canReverse && (
                      <td className="px-5 py-2.5 text-right">
                        {row.reversible && (
                          <button
                            type="button"
                            onClick={() => { setReversing(row); setReason(''); setTouched(false); setReverseError(''); }}
                            aria-label={`Reverse ${row.department} ${ordinal(row.installmentNumber)} installment`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                          >
                            <Undo2 className="h-3 w-3" aria-hidden="true" /> Reverse
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {(budget.reversals || []).length > 0 && (
        <Panel title="Reversed Releases" description="Releases that were taken back. They are not counted in any total above." padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">Department</th>
                  <th scope="col" className="px-3 py-2.5">Installment</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                  <th scope="col" className="px-3 py-2.5">Reason</th>
                  <th scope="col" className="px-5 py-2.5">Reversed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budget.reversals.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-slate-900">{row.department}<span className="block text-xs font-normal text-slate-400">Dated {formatDay(row.allocationDate)}</span></th>
                    <td className="px-3 py-2.5 text-slate-700">{ordinal(row.installmentNumber)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 line-through">{formatLakh(row.amountLakh)}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.reason}</td>
                    <td className="px-5 py-2.5 text-slate-700">{row.reversedBy || '—'}<span className="block text-xs text-slate-400">{formatMoment(row.reversedAt, true)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Dialog
        open={Boolean(reversing)}
        onClose={() => { if (!busy) setReversing(null); }}
        title="Reverse this release?"
        description="Use this only when a release was entered wrongly. The amount is removed from the released total and the installment can be entered again. The reversal is kept on record."
        size="md"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setReversing(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton className="!bg-red-700 hover:!bg-red-800" loading={busy} onClick={confirmReverse}>{busy ? 'Reversing…' : 'Reverse Release'}</ActionButton>
          </>
        )}
      >
        {reversing && (
          <div className="space-y-4">
            <dl className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <dt className="text-xs text-slate-500">Release</dt>
              <dd className="font-semibold text-slate-900">{reversing.department} — {ordinal(reversing.installmentNumber)} installment</dd>
              <dd className="tabular-nums text-slate-700">{formatLakh(reversing.amountLakh)} · dated {formatDay(reversing.allocationDate)}</dd>
            </dl>
            <div>
              <label htmlFor="reverse-reason" className="mb-1.5 block text-sm font-medium text-slate-700">Reason <span className="text-red-600" aria-hidden="true">*</span></label>
              <textarea id="reverse-reason" rows={3} maxLength={1000} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} onBlur={() => setTouched(true)}
                aria-invalid={Boolean(touched && reasonError) || undefined} className={`${inputClass(Boolean(touched && reasonError))} resize-none`} />
              <FieldError message={touched ? reasonError : ''} />
            </div>
            {reverseError && <Notice tone="error">{reverseError}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
