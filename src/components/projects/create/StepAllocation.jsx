"use client";
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { NumericInput } from '@/components/ui/NumericInput';
import { fetchHeads } from '@/lib/projectApi';
import { formatLakh, lakhToRupees } from '@/lib/numeric';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, StepCard, useMasterList } from './parts';
import { MONEY_DECIMALS, countEnteredActivities, departmentTotal, projectTotals } from './wizardState';

/** Step 4 — Fund split per department, then the Head that drives the activity list. */
export function StepAllocation({ state, dispatch, errors, showErrors }) {
  const heads = useMasterList(fetchHeads, 'heads');
  const [touched, setTouched] = useState({});
  const [pendingHead, setPendingHead] = useState(null);
  const totals = projectTotals(state);

  const setShare = (index, field, value) => dispatch({ type: 'SET_SHARE', index, field, value });
  const hasActivityData = state.departments.some((row) => countEnteredActivities(row) > 0);

  // A revision keeps the Head: activities and reported progress belong to it.
  const headLocked = state.mode === 'revise';

  const chooseHead = (head) => {
    if (headLocked || state.head?.id === head.id) return;
    const value = { id: head.id, code: head.code, name: head.name };
    if (state.head && hasActivityData) setPendingHead(value);
    else dispatch({ type: 'SET_HEAD', value });
  };

  const onHeadKeyDown = (event, index) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = heads.items[(index + delta + heads.items.length) % heads.items.length];
    chooseHead(next);
    document.getElementById(`head-${next.id}`)?.focus();
  };

  return (
    <StepCard
      step={4}
      title="Head & Allocation"
      description="Enter each department's share and the SARRA share. Totals are calculated automatically. All amounts are in ₹ Lakh."
    >
      <h3 className="text-sm font-semibold text-slate-800">Department Allocation</h3>
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="w-12 px-4 py-3">#</th>
              <th scope="col" className="px-4 py-3">Department</th>
              <th scope="col" className="w-44 px-4 py-3 text-right">Department Share</th>
              <th scope="col" className="w-44 px-4 py-3 text-right">SARRA Share</th>
              <th scope="col" className="w-48 px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.departments.map((row, index) => {
              const total = departmentTotal(row);
              const error = (showErrors || touched[index]) ? errors.rows?.[index] : '';
              const name = row.department?.name || `Department ${index + 1}`;
              return (
                <tr key={row.key} className="align-top">
                  <td className="px-4 py-3.5 tabular-nums text-slate-400">{index + 1}</td>
                  <th scope="row" className="px-4 py-3.5 text-left font-medium text-slate-900">
                    {name}
                    <FieldError id={`alloc-${index}-error`} message={error} />
                  </th>
                  <td className="px-4 py-2.5">
                    <NumericInput
                      id={`alloc-${index}-dept`}
                      aria-label={`${name}: Department share in lakh rupees`}
                      value={row.deptShare}
                      onChange={(value) => setShare(index, 'deptShare', value)}
                      onBlur={() => setTouched((current) => ({ ...current, [index]: true }))}
                      maxDecimals={MONEY_DECIMALS}
                      formatOnBlur
                      prefix="₹"
                      suffix="Lakh"
                      placeholder="0.00"
                      invalid={Boolean(error)}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <NumericInput
                      id={`alloc-${index}-sarra`}
                      aria-label={`${name}: SARRA share in lakh rupees`}
                      value={row.sarraShare}
                      onChange={(value) => setShare(index, 'sarraShare', value)}
                      onBlur={() => setTouched((current) => ({ ...current, [index]: true }))}
                      maxDecimals={MONEY_DECIMALS}
                      formatOnBlur
                      prefix="₹"
                      suffix="Lakh"
                      placeholder="0.00"
                      invalid={Boolean(error)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right" aria-live="polite">
                    <output htmlFor={`alloc-${index}-dept alloc-${index}-sarra`} className="block font-semibold tabular-nums text-slate-900">
                      {formatLakh(total)}
                    </output>
                    <span className="block text-xs tabular-nums text-slate-400">{total > 0 ? lakhToRupees(total) : 'Calculated automatically'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
              <td className="px-4 py-3" />
              <th scope="row" className="px-4 py-3 text-left">Project Total</th>
              <td className="px-4 py-3 text-right tabular-nums">{formatLakh(totals.deptShare)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatLakh(totals.sarraShare)}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatLakh(totals.total)}
                <span className="block text-xs font-normal text-slate-400">{lakhToRupees(totals.total)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 id="head-group-label" className="text-sm font-semibold text-slate-800">
          Select Head <span className="text-red-600" aria-hidden="true">*</span>
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {headLocked
            ? 'The Head cannot be changed by a revision.'
            : 'One Head applies to every department in this project and decides which activities can be planned.'}
        </p>

        {heads.loading && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" role="status" aria-label="Loading Heads">
            {[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-[76px]" />)}
          </div>
        )}

        {!heads.loading && heads.error && (
          <div className="mt-4"><Notice tone="error" action={<RetryButton onClick={heads.reload} />}>{heads.error}</Notice></div>
        )}

        {!heads.loading && !heads.error && heads.items.length === 0 && (
          <div className="mt-4"><Notice tone="warning">No Heads are configured yet. Please contact the system administrator.</Notice></div>
        )}

        {!heads.loading && !heads.error && heads.items.length > 0 && (
          <div role="radiogroup" aria-labelledby="head-group-label" aria-required="true" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {heads.items.map((head, index) => {
              const selected = state.head?.id === head.id;
              const tabbable = selected || (!state.head && index === 0);
              return (
                <button
                  key={head.id}
                  id={`head-${head.id}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={headLocked && !selected ? true : undefined}
                  disabled={headLocked && !selected}
                  tabIndex={tabbable ? 0 : -1}
                  onClick={() => chooseHead(head)}
                  onKeyDown={(event) => onHeadKeyDown(event, index)}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-[border-color,box-shadow,background-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 active:scale-[0.99]
                    ${selected ? 'border-navy bg-navy/[0.04] shadow-sm ring-1 ring-navy' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}
                    ${headLocked && !selected ? 'cursor-not-allowed opacity-50 hover:border-slate-200 hover:shadow-none' : ''}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white'}`} aria-hidden="true">
                    {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-700">{head.code}</span>
                      <span className="text-sm font-semibold text-slate-900">{head.name}</span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {head.description ? `${head.description} · ` : ''}{head.activityCount} activities
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <FieldError id="head-error" message={showErrors ? errors.head : ''} />
      </div>

      <Dialog
        open={Boolean(pendingHead)}
        onClose={() => setPendingHead(null)}
        title="Change the Head?"
        size="sm"
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setPendingHead(null)}>Keep {state.head?.code}</ActionButton>
            <ActionButton onClick={() => { dispatch({ type: 'SET_HEAD', value: pendingHead }); setPendingHead(null); }}>
              Change Head
            </ActionButton>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          Each Head has its own activities. Changing from <strong>{state.head?.code} {state.head?.name}</strong> to{' '}
          <strong>{pendingHead?.code} {pendingHead?.name}</strong> clears the activity targets already entered for every department. Shares are kept.
        </p>
      </Dialog>
    </StepCard>
  );
}
