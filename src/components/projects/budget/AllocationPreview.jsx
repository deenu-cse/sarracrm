"use client";
import React from 'react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, Notice } from '@/components/projects/create/parts';
import { AllocatedTick, ordinal } from './BudgetStatus';
import { formatDay } from './allocationForm';

function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <h3 className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Item({ label, value, mono = false }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

/**
 * Read-only preview of an allocation. The figures are the ones the backend
 * calculated when it validated the request (`plan`), not the form's own sums.
 */
export function AllocationPreview({ open, plan, state, submitting, error, staleState, onBack, onProceed, onReload }) {
  if (!plan) return null;
  const { project } = state;
  const planned = new Map(plan.entries.map((entry) => [entry.departmentId, entry]));
  const installmentNumbers = Array.from({ length: state.rules.maxInstallments }, (_, index) => index + 1);

  return (
    <Dialog
      open={open}
      onClose={onBack}
      title="Preview Budget Allocation"
      description="Read-only. Nothing is saved until you choose Proceed."
      size="xl"
      dismissible={!submitting}
      footer={(
        <>
          {staleState ? (
            <ActionButton onClick={onReload}>Reload latest position</ActionButton>
          ) : (
            <>
              <ActionButton variant="secondary" icon={ArrowLeft} onClick={onBack} disabled={submitting}>Back to Edit</ActionButton>
              <ActionButton variant="success" iconRight={ArrowRight} loading={submitting} onClick={onProceed}>
                {submitting ? 'Submitting…' : 'Proceed'}
              </ActionButton>
            </>
          )}
        </>
      )}
    >
      <div className="space-y-4">
        {error && <Notice tone="error" title="The allocation was not saved">{error}</Notice>}

        <Section title="Project">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-5">
            <div className="col-span-2 md:col-span-5">
              <Item label="Project Name / Unique ID" value={`${project.projectName}${project.code ? ` — ${project.code}` : ''}`} />
            </div>
            <Item label="District" value={project.district} />
            <Item label="Block" value={project.block} />
            <Item label="Gram Panchayat" value={project.gramPanchayat} />
            <Item label="Village" value={project.village} />
            <Item label="Allocation Date" value={formatDay(plan.allocationDate)} />
          </dl>
        </Section>

        <Section title="Departments">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="pb-2 pr-4">Department</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Department Share</th>
                  <th scope="col" className="pb-2 pr-4 text-right">SARRA Share</th>
                  <th scope="col" className="pb-2 text-right">Total Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-200">
                {state.departments.map((department) => (
                  <tr key={department.departmentId}>
                    <th scope="row" className="py-2 pr-4 text-left font-medium text-slate-900">{department.name}</th>
                    <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{formatLakh(department.deptShareLakh)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-slate-700">{formatLakh(department.sarraShareLakh)}</td>
                    <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{formatLakh(department.totalLakh)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Allocation">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="pb-2 pr-4">Department</th>
                  <th scope="col" className="pb-2 pr-4">Installment</th>
                  {installmentNumbers.map((number) => <th key={number} scope="col" className="pb-2 pr-4 text-right">{ordinal(number)}</th>)}
                  <th scope="col" className="pb-2 pr-4 text-right">Total Release</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Remaining</th>
                  <th scope="col" className="pb-2">PDF Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-200">
                {state.departments.map((department) => {
                  const entry = planned.get(department.departmentId);
                  const byNumber = new Map(department.installments.map((item) => [item.installmentNumber, item.amountLakh]));
                  const releasedLakh = entry ? entry.newReleasedLakh : department.releasedLakh;
                  const remainingLakh = entry ? entry.remainingAfterLakh : department.remainingLakh;
                  const complete = entry ? entry.fullyAllocatedAfter : department.status === 'FULLY_ALLOCATED';
                  return (
                    <tr key={department.departmentId} className={entry ? 'bg-navy/[0.03]' : ''}>
                      <th scope="row" className="py-2.5 pr-4 text-left font-medium text-slate-900">
                        <span className="inline-flex items-center gap-1.5">{department.name}{complete && <AllocatedTick className="h-3.5 w-3.5" />}</span>
                      </th>
                      <td className="py-2.5 pr-4 text-slate-700">
                        {entry ? <span className="font-semibold text-navy">{ordinal(entry.installmentNumber)} · {entry.percentage}%</span> : <span className="text-slate-400">No release</span>}
                      </td>
                      {installmentNumbers.map((number) => {
                        const isThis = entry?.installmentNumber === number;
                        const amount = isThis ? entry.amountLakh : byNumber.get(number);
                        return (
                          <td key={number} className={`py-2.5 pr-4 text-right tabular-nums ${isThis ? 'font-bold text-navy' : 'text-slate-700'}`}>
                            {amount !== undefined ? formatLakh(amount) : <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                      <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-slate-900">{formatLakh(releasedLakh)}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{formatLakh(remainingLakh)}</td>
                      <td className="py-2.5">
                        {entry?.document ? (
                          <a href={entry.document.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[14rem] items-center gap-1.5 text-xs font-medium text-navy hover:underline">
                            <FileText className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">{entry.document.name}</span>
                          </a>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Highlighted figures are released by this allocation. Other installments were released earlier.</p>
        </Section>

        <Section title="Summary">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
            <Item label="Total Project Budget" value={formatLakh(plan.totals.totalBudgetLakh)} />
            <Item label="This Release" value={formatLakh(plan.totals.thisReleaseLakh)} />
            <Item label="Total Released (after)" value={formatLakh(plan.totals.releasedAfterLakh)} />
            <Item label="Remaining (after)" value={formatLakh(plan.totals.remainingAfterLakh)} />
          </dl>
          {plan.totals.statusAfter === 'FULLY_ALLOCATED' && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
              <AllocatedTick className="h-4 w-4" /> This allocation completes the project budget.
            </p>
          )}
        </Section>
      </div>
    </Dialog>
  );
}
