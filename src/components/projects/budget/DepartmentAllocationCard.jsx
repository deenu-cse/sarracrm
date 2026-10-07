"use client";
import React from 'react';
import { FileText, Lock } from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';
import { formatLakh } from '@/lib/numeric';
import { FieldError } from '@/components/projects/create/parts';
import { AllocatedTick, ProgressBar, ordinal } from './BudgetStatus';
import { PdfUpload } from './PdfUpload';
import { amountFromPercent, formatDay, percentFromAmount } from './allocationForm';

function Figure({ label, value, tone = 'default' }) {
  const tones = { default: 'text-slate-900', success: 'text-emerald-700', warning: 'text-amber-700', danger: 'text-red-700' };
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${tones[tone]}`}>{value}</dd>
    </div>
  );
}

/**
 * One department in the allocation screen: what has been released so far,
 * installment by installment, and the input for the next installment.
 */
export function DepartmentAllocationCard({
  department, entry, evaluation, rules, projectId, readOnly, showErrors,
  onChange, onBusyChange, onApplyDocumentToAll, canShareDocument, documentShared,
}) {
  const { departmentId, name } = department;
  const full = department.status === 'FULLY_ALLOCATED';
  const editable = department.canAllocate && !readOnly;
  const next = department.nextInstallmentNumber;
  const lockedAmount = editable && evaluation.isFinal && rules.finalInstallmentMustComplete;
  const amountError = evaluation.amountError;
  const documentError = showErrors ? evaluation.documentError : '';
  const slots = Array.from({ length: rules.maxInstallments }, (_, index) => index + 1);
  const byNumber = new Map(department.installments.map((item) => [item.installmentNumber, item]));

  const setPercent = (percent) => onChange({ percent, amount: amountFromPercent(percent, department.budgetLakh) });
  const setAmount = (amount) => onChange({ amount, percent: percentFromAmount(amount, department.budgetLakh) });
  const releaseRemaining = () => setAmount(String(department.remainingLakh));
  const clear = () => onChange({ amount: '', percent: '' });

  return (
    <article
      aria-labelledby={`dept-${departmentId}-name`}
      className={`rounded-xl border bg-white transition-colors duration-300 ${full ? 'border-emerald-200' : 'border-slate-200'}`}
    >
      {/* Header: position so far */}
      <header className={`rounded-t-xl border-b px-5 py-4 ${full ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/60'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id={`dept-${departmentId}-name`} className="text-base font-semibold text-slate-900">{name}</h3>
          {full ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">
              <AllocatedTick className="h-4 w-4" /> Fully Allocated
            </span>
          ) : (
            <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${department.releasedLakh > 0 ? 'border-sky-200 bg-white text-sky-800' : 'border-slate-200 bg-white text-slate-600'}`}>
              {department.releasedLakh > 0 ? `${department.percentAllocated}% Allocated` : 'Not Allocated'}
            </span>
          )}
        </div>
        <div className="mt-3">
          <ProgressBar
            percent={department.percentAllocated}
            pendingPercent={evaluation.pendingPercent}
            complete={full}
            label={`${name}: budget allocated`}
          />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Figure label="Total Budget" value={formatLakh(department.budgetLakh)} />
          <Figure label="SARRA Share" value={formatLakh(department.sarraShareLakh)} />
          <Figure label="Released" value={`${formatLakh(department.releasedLakh)}`} tone={full ? 'success' : 'default'} />
          <Figure label="Remaining" value={formatLakh(department.remainingLakh)} tone={full ? 'success' : 'warning'} />
        </dl>
      </header>

      <div className="px-5 py-4">
        {/* Installment track */}
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={`${name}: installments`}>
          {slots.map((number) => {
            const released = byNumber.get(number);
            const isNext = editable && number === next;
            const pending = isNext && evaluation.active && !amountError;
            return (
              <li
                key={number}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors duration-200
                  ${released ? 'border-emerald-200 bg-emerald-50/50' : pending ? 'border-navy bg-navy/[0.04]' : isNext ? 'border-dashed border-slate-300 bg-white' : 'border-slate-100 bg-slate-50/60'}`}
              >
                <p className={`font-semibold ${released ? 'text-emerald-800' : isNext ? 'text-navy' : 'text-slate-400'}`}>
                  {ordinal(number)} Installment
                </p>
                {released ? (
                  <>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{formatLakh(released.amountLakh)}</p>
                    <p className="text-slate-500">{released.percentage}% · {formatDay(released.allocationDate)}</p>
                    {released.document && (
                      <a href={released.document.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 font-medium text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                        <FileText className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{released.document.name || 'PDF document'}</span>
                      </a>
                    )}
                  </>
                ) : pending ? (
                  <>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{formatLakh(evaluation.thisReleaseLakh)}</p>
                    <p className="text-navy">This release</p>
                  </>
                ) : (
                  <p className="mt-0.5 text-slate-400">{isNext ? 'Next to release' : full ? 'Not needed' : '—'}</p>
                )}
              </li>
            );
          })}
        </ol>

        {/* Entry for the next installment */}
        {editable && (
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                Installment: <span className="text-navy">{ordinal(next)}</span>
                {evaluation.isFinal && <span className="ml-2 text-xs font-medium text-amber-700">Last installment allowed</span>}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={releaseRemaining}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-[background-color,transform] duration-150 hover:bg-slate-50 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                >
                  Release remaining {formatLakh(department.remainingLakh)}
                </button>
                {(entry.amount || entry.percent) && (
                  <button
                    type="button"
                    onClick={clear}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <label htmlFor={`pct-${departmentId}`} className="mb-1.5 block text-xs font-medium text-slate-600">Budget Allotment %</label>
                <NumericInput
                  id={`pct-${departmentId}`}
                  value={entry.percent}
                  onChange={setPercent}
                  maxDecimals={2}
                  suffix="%"
                  placeholder="0"
                  invalid={Boolean(amountError)}
                  readOnly={lockedAmount}
                  aria-describedby={amountError ? `amount-${departmentId}-error` : undefined}
                />
              </div>
              <div className="md:col-span-4">
                <label htmlFor={`amount-${departmentId}`} className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  {ordinal(next)} Installment Amount
                  {lockedAmount && <Lock className="h-3 w-3 text-slate-400" aria-hidden="true" />}
                </label>
                <NumericInput
                  id={`amount-${departmentId}`}
                  value={entry.amount}
                  onChange={setAmount}
                  maxDecimals={5}
                  formatOnBlur
                  prefix="₹"
                  suffix="Lakh"
                  placeholder="0.00"
                  invalid={Boolean(amountError)}
                  readOnly={lockedAmount}
                  aria-describedby={amountError ? `amount-${departmentId}-error` : undefined}
                />
              </div>
              <div className="md:col-span-5">
                <p className="mb-1.5 text-xs font-medium text-slate-600">
                  PDF Upload {rules.documentRequired && evaluation.active && <span className="text-red-600" aria-hidden="true">*</span>}
                </p>
                <PdfUpload
                  id={`pdf-${departmentId}`}
                  label={`${name}: PDF document for the ${ordinal(next)} installment`}
                  projectId={projectId}
                  value={entry.document}
                  onChange={(document) => onChange({ document })}
                  onBusyChange={onBusyChange}
                  maxBytes={rules.maxDocumentBytes}
                  invalid={Boolean(documentError)}
                  shared={documentShared}
                />
                <FieldError id={`pdf-${departmentId}-required`} message={documentError} />
                {entry.document && canShareDocument && (
                  <button
                    type="button"
                    onClick={onApplyDocumentToAll}
                    className="mt-1.5 text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                  >
                    Use this PDF for the other departments in this release
                  </button>
                )}
              </div>
            </div>

            <FieldError id={`amount-${departmentId}-error`} message={amountError} />
            {lockedAmount && !amountError && (
              <p className="mt-2 text-xs text-slate-500">
                The {ordinal(next)} installment is the last one allowed, so it releases the full remaining budget. Use “Release remaining” to include it.
              </p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-3 sm:grid-cols-3" aria-live="polite">
              <Figure label="This Release" value={formatLakh(evaluation.thisReleaseLakh)} />
              <Figure
                label="Total Release Budget"
                value={`${formatLakh(evaluation.releasedAfterLakh)} / ${formatLakh(department.budgetLakh)}`}
                tone={evaluation.completesDepartment ? 'success' : 'default'}
              />
              <Figure
                label="Remaining After This Release"
                value={formatLakh(evaluation.remainingAfterLakh)}
                tone={amountError ? 'danger' : evaluation.completesDepartment ? 'success' : 'default'}
              />
            </dl>
            {evaluation.completesDepartment && (
              <p className="wz-fade-in mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <AllocatedTick className="h-3.5 w-3.5" /> This release completes {name}&apos;s budget.
              </p>
            )}
          </div>
        )}

        {!department.canAllocate && (
          <p className={`mt-4 flex items-center gap-2 text-sm font-medium ${full ? 'text-emerald-700' : 'text-slate-500'}`}>
            {full ? <AllocatedTick className="h-4 w-4" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
            {full
              ? `${formatLakh(department.releasedLakh)} / ${formatLakh(department.budgetLakh)} Allocated — no further installment can be added.`
              : department.blockedReason}
          </p>
        )}
      </div>
    </article>
  );
}
