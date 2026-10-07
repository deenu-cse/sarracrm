"use client";
import React from 'react';
import { formatLakh } from '@/lib/numeric';
import { FORM_TYPE_TITLES, formatQuantity } from './mprForm';

const money = (value) => formatLakh(value).replace(' Lakh', '').replace('₹ ', '');

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-slate-900">{value || '—'}</dd>
    </div>
  );
}

export function MprSummaryPanel({ totals }) {
  if (!totals) return null;
  const tiles = [
    ['Activities Completed', `${totals.activitiesCompleted} of ${totals.activities}`],
    ['Activities In Progress', String(totals.activitiesInProgress)],
    ['Overall Physical Achievement', `${totals.physicalPercent}%`],
    ['Total Financial Target', formatLakh(totals.financialTargetLakh)],
    ['Previous Financial Progress', formatLakh(totals.financialPreviousLakh)],
    ['This Month', formatLakh(totals.financialCurrentLakh)],
    ['Cumulative Financial Progress', `${formatLakh(totals.financialTotalLakh)} (${totals.financialPercent}%)`],
    ['Remaining Financial Target', formatLakh(totals.financialRemainingLakh)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-live="polite">
      {tiles.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <dt className="text-xs font-medium text-slate-500">{label}</dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Read-only MPR in the layout of the official statement: project block, then
 * one table with Physical and Financial progress side by side. Used for the
 * preview before submission and for viewing a filed report.
 *
 * `report` is what the backend returned (targets, previous, current, totals).
 */
export function MprReportDocument({ report }) {
  const { project, department, head, activities, totals } = report;
  const departmentName = department?.name || report.departmentName;
  const footer = activities.reduce((sum, a) => ({
    target: sum.target + Math.round(a.financialTargetLakh * 100000),
    previous: sum.previous + Math.round(a.financialPreviousLakh * 100000),
    current: sum.current + Math.round(a.financialCurrentLakh * 100000),
    total: sum.total + Math.round(a.financialTotalLakh * 100000),
  }), { target: 0, previous: 0, current: 0, total: 0 });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-300 bg-white">
        <div className="border-b border-slate-300 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Spring and River Rejuvenation Authority (SARRA)</p>
          <h3 className="mt-0.5 text-base font-bold text-slate-900">{FORM_TYPE_TITLES[report.formType] || 'Monthly Progress Report'}</h3>
          <p className="text-xs text-slate-600">Form {report.formType}{report.mprNo ? ` · ${report.mprNo}` : ''}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 md:grid-cols-4">
          <div className="col-span-2 md:col-span-4"><Info label="Project Name / Unique ID" value={`${project.projectName}${project.code ? ` — ${project.code}` : ''}`} /></div>
          <Info label="District" value={project.district} />
          <Info label="Block" value={project.block} />
          <Info label="Gram Panchayat" value={project.gramPanchayat} />
          <Info label="Village" value={project.village} />
          <Info label="Financial Year" value={report.financialYear} />
          <Info label="Progress Entry Month" value={report.period || report.reportingMonth} />
          <Info label="Department" value={departmentName} />
          <Info label="Head" value={head ? `${head.code} — ${head.name}` : ''} />
        </dl>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <caption className="sr-only">Physical and financial progress by activity</caption>
          <thead className="bg-slate-100 text-xs font-semibold text-slate-700">
            <tr>
              <th scope="col" rowSpan={2} className="border border-slate-300 px-2 py-2 text-left">S.No.</th>
              <th scope="col" rowSpan={2} className="border border-slate-300 px-2 py-2 text-left">Name of Activity</th>
              <th scope="col" rowSpan={2} className="border border-slate-300 px-2 py-2 text-left">Unit</th>
              <th scope="colgroup" colSpan={4} className="border border-slate-300 px-2 py-1.5 text-center">Physical Progress</th>
              <th scope="colgroup" colSpan={4} className="border border-slate-300 px-2 py-1.5 text-center">Financial Progress (₹ Lakh)</th>
            </tr>
            <tr>
              {[0, 1].map((group) => (
                <React.Fragment key={group}>
                  <th scope="col" className="border border-slate-300 px-2 py-1.5 text-right">Total Target</th>
                  <th scope="col" className="border border-slate-300 px-2 py-1.5 text-right">Progress upto Previous Month</th>
                  <th scope="col" className="border border-slate-300 px-2 py-1.5 text-right">Progress During Month</th>
                  <th scope="col" className="border border-slate-300 px-2 py-1.5 text-right">Total</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={activity.activityCode}>
                <td className="border border-slate-300 px-2 py-1.5 tabular-nums text-slate-600">{index + 1}</td>
                <th scope="row" className="border border-slate-300 px-2 py-1.5 text-left font-medium text-slate-900">{activity.activityName}</th>
                <td className="border border-slate-300 px-2 py-1.5 text-slate-700">{activity.unit || '—'}</td>
                {activity.hasPhysical ? (
                  <>
                    <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">{formatQuantity(activity.physicalTarget)}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">{formatQuantity(activity.physicalPrevious)}</td>
                    <td className="border border-slate-300 bg-navy/[0.04] px-2 py-1.5 text-right font-semibold tabular-nums text-navy">{formatQuantity(activity.physicalCurrent)}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold tabular-nums">{formatQuantity(activity.physicalTotal)}</td>
                  </>
                ) : (
                  <td colSpan={4} className="border border-slate-300 px-2 py-1.5 text-center text-slate-400">—</td>
                )}
                <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">{money(activity.financialTargetLakh)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right tabular-nums">{money(activity.financialPreviousLakh)}</td>
                <td className="border border-slate-300 bg-navy/[0.04] px-2 py-1.5 text-right font-semibold tabular-nums text-navy">{money(activity.financialCurrentLakh)}</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold tabular-nums">{money(activity.financialTotalLakh)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold text-slate-900">
            <tr>
              <th scope="row" colSpan={7} className="border border-slate-300 px-2 py-2 text-left">Total</th>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">{money(footer.target / 100000)}</td>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">{money(footer.previous / 100000)}</td>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums text-navy">{money(footer.current / 100000)}</td>
              <td className="border border-slate-300 px-2 py-2 text-right tabular-nums">{money(footer.total / 100000)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <MprSummaryPanel totals={totals} />

      {report.remarks && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Remarks</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{report.remarks}</p>
        </div>
      )}
    </div>
  );
}
