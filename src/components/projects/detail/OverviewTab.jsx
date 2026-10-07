"use client";
import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { WorkflowTimeline } from '@/components/ui/WorkflowTimeline';
import { formatLakh } from '@/lib/numeric';
import { Notice } from '@/components/projects/create/parts';
import { AllocatedTick, ProgressBar } from '@/components/projects/budget/BudgetStatus';
import { DataItem, EmptyNote, Panel, formatDay, formatMoment } from './shared';

function TabLink({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
    >
      {children} <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}

/** At-a-glance view: who, where, how much, and what happened last. */
export function OverviewTab({ project, budget, budgetError, onOpenTab }) {
  const { location, approvalDates, head } = project;
  const departments = project.departmentAllocations || [];
  const history = project.workflowHistory || [];
  const recent = history.slice(-3).reverse();
  const trail = [location?.district || project.district, location?.block, location?.gramPanchayat, location?.village].filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Panel title="Project Information">
          {trail.length > 1 && (
            <p className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
              {trail.map((name, index) => (
                <React.Fragment key={`${name}-${index}`}>
                  {index > 0 && <span className="text-slate-300" aria-hidden="true">›</span>}
                  <span className={index === trail.length - 1 ? 'font-semibold text-slate-900' : ''}>{name}</span>
                </React.Fragment>
              ))}
            </p>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
            <DataItem label="District" value={location?.district || project.district} />
            <DataItem label="Block" value={location?.block} />
            <DataItem label="Gram Panchayat" value={location?.gramPanchayat} />
            <DataItem label="Village" value={location?.village} />
            <DataItem label="Head" value={head?.code ? `${head.code} — ${head.name}` : ''} className="col-span-2" />
            <DataItem label="Project Type" value={project.projectType || project.dprType} />
            <DataItem label="Financial Year" value={project.financialYear} />
            <DataItem label="DLEC Approval" value={formatDay(approvalDates?.dlec)} />
            <DataItem label="SLEC Approval" value={formatDay(approvalDates?.slec)} />
            <DataItem label="HPC Approval" value={formatDay(approvalDates?.hpc)} />
            <DataItem label="Number of PIA" value={project.numberOfPIA ? String(project.numberOfPIA) : ''} />
            <DataItem label="Created By" value={project.makerUserId?.name} />
            <DataItem label="Created On" value={formatMoment(project.makerAt || project.createdAt, true)} />
            {project.makerNote && <DataItem label="Maker Note" value={project.makerNote} className="col-span-2" />}
          </dl>
        </Panel>

        <Panel
          title="Departments"
          description={departments.length ? `${departments.length} PIA department${departments.length === 1 ? '' : 's'} with their budget and release position` : undefined}
          aside={departments.length > 0 && <TabLink onClick={() => onOpenTab('budget')}>Budget &amp; releases</TabLink>}
          padded={false}
        >
          {departments.length === 0 ? (
            <div className="p-5"><EmptyNote>This project has no department-wise budget{project.department ? ` (department: ${project.department})` : ''}.</EmptyNote></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-5 py-2.5">Department</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Dept. Share</th>
                    <th scope="col" className="px-3 py-2.5 text-right">SARRA Share</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Total</th>
                    <th scope="col" className="px-3 py-2.5">PIA Officer</th>
                    <th scope="col" className="w-44 px-5 py-2.5">Released</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((department) => {
                    const position = budget?.departments.find((item) => item.departmentId === String(department.departmentId));
                    const full = position?.status === 'FULLY_ALLOCATED';
                    return (
                      <tr key={department.departmentId}>
                        <th scope="row" className="px-5 py-3 text-left font-medium text-slate-900">
                          {department.departmentName}
                          <span className="block text-xs font-normal text-slate-400">{(department.activities || []).length} activities</span>
                        </th>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatLakh(department.deptShareLakh)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatLakh(department.sarraShareLakh)}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">{formatLakh(department.totalLakh)}</td>
                        <td className="px-3 py-3">
                          {department.piaUserId ? (
                            <>
                              <span className="block font-medium text-slate-800">{department.piaUserId.name || 'Assigned'}</span>
                              <span className={`text-xs ${department.piaAcceptedAt ? 'text-emerald-700' : 'text-amber-700'}`}>{department.piaAcceptedAt ? 'Accepted' : 'Awaiting acceptance'}</span>
                            </>
                          ) : <span className="text-xs text-slate-400">Not assigned</span>}
                        </td>
                        <td className="px-5 py-3">
                          {position ? (
                            <>
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className={`font-semibold tabular-nums ${full ? 'text-emerald-700' : 'text-slate-700'}`}>{position.percentAllocated}%</span>
                                {full ? <AllocatedTick className="h-3.5 w-3.5" /> : <span className="text-slate-400">{position.installments.length} of {budget.rules.maxInstallments} inst.</span>}
                              </div>
                              <div className="mt-1"><ProgressBar percent={position.percentAllocated} complete={full} label={`${department.departmentName}: budget released`} /></div>
                            </>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Budget Position" aside={budget && <TabLink onClick={() => onOpenTab('budget')}>Details</TabLink>}>
          {budgetError && <Notice tone="error">{budgetError}</Notice>}
          {!budgetError && !budget && <EmptyNote>Budget release is tracked for projects with department-wise budget.</EmptyNote>}
          {budget && (
            <>
              <p className="text-2xl font-bold tabular-nums text-slate-900">{budget.totals.percentAllocated}%</p>
              <p className="text-xs text-slate-500">of the project budget released</p>
              <div className="mt-3"><ProgressBar percent={budget.totals.percentAllocated} complete={budget.totals.status === 'FULLY_ALLOCATED'} label="Project budget released" /></div>
              <dl className="mt-4 space-y-2 text-sm">
                {[
                  ['Total budget', formatLakh(budget.totals.totalBudgetLakh), 'text-slate-900'],
                  ['Released', formatLakh(budget.totals.releasedLakh), 'text-emerald-700'],
                  ['Remaining', formatLakh(budget.totals.remainingLakh), budget.totals.remainingLakh > 0 ? 'text-amber-700' : 'text-emerald-700'],
                ].map(([label, value, tone]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className={`font-semibold tabular-nums ${tone}`}>{value}</dd>
                  </div>
                ))}
              </dl>
              {budget.totals.status === 'FULLY_ALLOCATED' && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><AllocatedTick className="h-3.5 w-3.5" /> Budget Fully Allocated</p>
              )}
              {!budget.eligible && budget.ineligibleCode !== 'FULLY_ALLOCATED' && (
                <p className="mt-3 text-xs text-slate-500">{budget.ineligibleReason}</p>
              )}
            </>
          )}
        </Panel>

        <Panel title="Recent Activity" aside={history.length > 0 && <TabLink onClick={() => onOpenTab('workflow')}>Full history</TabLink>}>
          <WorkflowTimeline history={recent} />
        </Panel>
      </div>
    </div>
  );
}
