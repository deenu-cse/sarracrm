"use client";
import React from 'react';
import { fetchHeadActivities } from '@/lib/projectApi';
import { formatIndian, formatLakh, lakhToRupees, toNumber } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton, useMasterList } from './parts';
import { activityFinancialTotal, countEnteredActivities, departmentTotal, projectTotals } from './wizardState';

const formatDate = (iso) => {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

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
 * Read-only review of everything entered in the wizard.
 * `detailed` adds the activity-by-activity tables (used by Preview).
 */
export function ProjectSummary({ state, detailed = false }) {
  const totals = projectTotals(state);
  const activities = useMasterList(
    () => fetchHeadActivities(state.head.id),
    detailed && state.head ? state.head.id : null,
  );
  const { location, details } = state;

  return (
    <div className="space-y-4">
      <Section title="Project Information">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Item label="Project ID" value={state.projectId?.projectId || 'Not generated yet'} mono={Boolean(state.projectId)} />
          <div className="col-span-2 md:col-span-3"><Item label="Project Name" value={details.projectName.replace(/\s+/g, ' ').trim()} /></div>
          <Item label="District" value={location.district?.name} />
          <Item label="Block" value={location.block?.name} />
          <Item label="Gram Panchayat" value={location.gramPanchayat?.name} />
          <Item label="Village" value={location.village?.name} />
          <Item label="DLEC Approval Date" value={formatDate(details.dlec)} />
          <Item label="SLEC Approval Date" value={formatDate(details.slec)} />
          <Item label="HPC Approval Date" value={formatDate(details.hpc)} />
        </dl>
      </Section>

      <Section title="PIA & Head">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Item label="Number of PIA" value={String(state.piaCount || 0)} />
          <Item label="Selected Head" value={state.head ? `${state.head.code} — ${state.head.name}` : ''} />
          <Item label="Activities Planned" value={String(totals.activityCount)} />
          <Item label="Activity Financial Total" value={formatLakh(totals.activityFinancial)} />
        </dl>
      </Section>

      <Section title="Financial Information">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="pb-2 pr-4">Department</th>
                <th scope="col" className="pb-2 pr-4 text-right">Department Share</th>
                <th scope="col" className="pb-2 pr-4 text-right">SARRA Share</th>
                <th scope="col" className="pb-2 pr-4 text-right">Total</th>
                <th scope="col" className="pb-2 pr-4 text-right">Activities</th>
                <th scope="col" className="pb-2 text-right">Activity Financial Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 border-t border-slate-200">
              {state.departments.map((row, index) => (
                <tr key={row.key}>
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-slate-900">{row.department?.name || `Department ${index + 1}`}</th>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{formatLakh(row.deptShare)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{formatLakh(row.sarraShare)}</td>
                  <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-slate-900">{formatLakh(departmentTotal(row))}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">{countEnteredActivities(row)}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-700">{formatLakh(activityFinancialTotal(row))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
                <th scope="row" className="py-2.5 pr-4 text-left">Total Allocation</th>
                <td className="py-2.5 pr-4 text-right tabular-nums">{formatLakh(totals.deptShare)}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{formatLakh(totals.sarraShare)}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {formatLakh(totals.total)}
                  <span className="block text-xs font-normal text-slate-400">{lakhToRupees(totals.total)}</span>
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{totals.activityCount}</td>
                <td className="py-2.5 text-right tabular-nums">{formatLakh(totals.activityFinancial)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {detailed && (
        <Section title="Activity Summary">
          {activities.loading && <div className="space-y-2" role="status" aria-label="Loading activities">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-9" />)}</div>}
          {!activities.loading && activities.error && <Notice tone="error" action={<RetryButton onClick={activities.reload} />}>{activities.error}</Notice>}
          {!activities.loading && !activities.error && (
            <div className="space-y-6">
              {state.departments.map((row, index) => {
                const rows = activities.items.filter((activity) => {
                  const entry = row.activities[activity.code];
                  return entry && (toNumber(entry.physical) > 0 || toNumber(entry.financial) > 0);
                });
                return (
                  <div key={row.key}>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{row.department?.name || `Department ${index + 1}`}</h4>
                      <p className="text-xs text-slate-500">Allocation {formatLakh(departmentTotal(row))}</p>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th scope="col" className="px-3 py-2">Activity</th>
                            <th scope="col" className="w-24 px-3 py-2">Unit</th>
                            <th scope="col" className="w-36 px-3 py-2 text-right">Physical Target</th>
                            <th scope="col" className="w-44 px-3 py-2 text-right">Financial Target</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rows.map((activity) => {
                            const entry = row.activities[activity.code];
                            return (
                              <tr key={activity.code}>
                                <th scope="row" className="px-3 py-2 text-left font-medium text-slate-800">{activity.name}</th>
                                <td className="px-3 py-2 text-slate-600">{activity.unit || '—'}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-700">{activity.hasPhysical ? formatIndian(entry.physical, { maxDecimals: 3 }) : '—'}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatLakh(entry.financial)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                            <th scope="row" colSpan={3} className="px-3 py-2 text-left">Activity Financial Total</th>
                            <td className="px-3 py-2 text-right tabular-nums">{formatLakh(activityFinancialTotal(row))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
