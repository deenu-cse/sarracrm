"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { fetchProjectMprs } from '@/lib/mprApi';
import { formatLakh } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { ProgressBar } from '@/components/projects/budget/BudgetStatus';
import { EmptyNote, Panel, formatMoment } from './shared';

/** Monthly progress reports filed against the project (a PIA officer sees their own departments only). */
export function ReportsTab({ project, mprHref, action }) {
  const hasDepartments = (project.departmentAllocations || []).length > 0;
  const reports = useMasterList(() => fetchProjectMprs(project._id), hasDepartments ? project._id : null);

  if (!hasDepartments) return <EmptyNote>Monthly progress is reported department-wise. This project has no departments.</EmptyNote>;
  if (reports.loading) return <div className="space-y-2" role="status" aria-label="Loading progress reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>;
  if (reports.error) return <Notice tone="error" title="Unable to load progress reports." action={<RetryButton onClick={reports.reload} />}>{reports.error}</Notice>;

  return (
    <Panel
      title="Monthly Progress Reports"
      description={`${reports.items.length} report${reports.items.length === 1 ? '' : 's'} filed, newest month first.`}
      aside={action}
      padded={false}
    >
      {reports.items.length === 0 ? (
        <div className="p-5"><EmptyNote>No monthly progress report has been filed for this project yet.</EmptyNote></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-5 py-2.5">Month</th>
                <th scope="col" className="px-3 py-2.5">Department</th>
                <th scope="col" className="px-3 py-2.5">Report No.</th>
                <th scope="col" className="px-3 py-2.5 text-right">Spent This Month</th>
                <th scope="col" className="w-44 px-3 py-2.5">Financial Progress</th>
                <th scope="col" className="px-3 py-2.5">Status</th>
                <th scope="col" className="px-3 py-2.5">Submitted</th>
                <th scope="col" className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.items.map((report) => (
                <tr key={report.id} className="transition-colors hover:bg-slate-50/60">
                  <th scope="row" className="whitespace-nowrap px-5 py-3 text-left font-semibold text-slate-900">{report.period}</th>
                  <td className="px-3 py-3 text-slate-700">{report.departmentName}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-600">{report.mprNo}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-800">{formatLakh(report.totals?.financialCurrentLakh)}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-semibold tabular-nums text-slate-700">{report.totals?.financialPercent ?? 0}%</span>
                    <div className="mt-1"><ProgressBar percent={report.totals?.financialPercent} complete={report.totals?.financialPercent >= 100} label={`${report.departmentName} ${report.period}: financial progress`} /></div>
                  </td>
                  <td className="px-3 py-3"><Badge status={report.status} /></td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {report.submittedBy?.name || '—'}
                    <span className="block text-slate-400">{formatMoment(report.submittedAt)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {mprHref && (
                      <Link href={mprHref(report)} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                        Open <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
