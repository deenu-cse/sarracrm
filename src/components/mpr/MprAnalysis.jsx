"use client";
import React from 'react';
import Link from 'next/link';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatLakh } from '@/lib/numeric';
import { formatQuantity } from './mprForm';

// Two series, validated together for colour-blind separation on a light surface.
const SPEND_COLOR = '#2a6fb0';
const CUMULATIVE_COLOR = '#d35400';

const lakh = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}L`;

function Panel({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-0.5 flex items-center gap-2 text-slate-700">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
          {item.name}: <span className="font-semibold tabular-nums text-slate-900">{formatLakh(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Segmented bar: progress before this month, this month, and what is left. */
function SplitBar({ previous, current, target, label }) {
  const before = target > 0 ? Math.min(100, (previous / target) * 100) : 0;
  const now = target > 0 ? Math.min(100 - before, (current / target) * 100) : 0;
  return (
    <div role="img" aria-label={label} className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
      {before > 0 && <div className="h-full rounded-l-full bg-slate-400" style={{ width: `${before}%` }} />}
      {now > 0 && <div className="h-full bg-navy" style={{ width: `${now}%` }} />}
    </div>
  );
}

/**
 * Analysis of one report in context: funds released against expenditure, the
 * department's month-by-month trend, and activity-wise progress with this
 * month's contribution picked out.
 */
export function MprAnalysis({ report, reportHref }) {
  const { funds, series, activities, totals } = report;
  const chartData = series.map((item) => ({ ...item, label: item.period.replace(/ (\d{2})(\d{2})$/, " '$2") }));
  const overspent = funds.spentBeyondReleaseLakh > 0;
  const releasedShare = funds.departmentBudgetLakh > 0 ? Math.min(100, (funds.releasedLakh / funds.departmentBudgetLakh) * 100) : 0;
  const spentShare = funds.departmentBudgetLakh > 0 ? Math.min(100, (funds.spentLakh / funds.departmentBudgetLakh) * 100) : 0;

  return (
    <div className="space-y-5">
      <Panel title="Funds Released vs Expenditure" description={`${report.departmentName}: what the State has released in installments against what has been reported as spent.`}>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Department Budget', formatLakh(funds.departmentBudgetLakh), ''],
            ['Released by State', formatLakh(funds.releasedLakh), `${funds.installments} installment${funds.installments === 1 ? '' : 's'}`],
            ['Spent to Date', formatLakh(funds.spentLakh), funds.releasedLakh > 0 ? `${funds.utilisationPercent}% of released funds` : 'No funds released yet'],
            [overspent ? 'Spent Beyond Release' : 'Unspent Balance', formatLakh(overspent ? funds.spentBeyondReleaseLakh : funds.unspentLakh), overspent ? 'More than released so far' : 'Released but not yet spent'],
          ].map(([label, value, sub]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs font-medium text-slate-500">{label}</dt>
              <dd className={`mt-0.5 text-base font-bold tabular-nums ${label === 'Spent Beyond Release' ? 'text-red-700' : 'text-slate-900'}`}>{value}</dd>
              {sub && <dd className="text-xs text-slate-500">{sub}</dd>}
            </div>
          ))}
        </dl>
        <div className="mt-4 space-y-2">
          {[['Released', releasedShare, 'bg-emerald-600'], ['Spent', spentShare, overspent ? 'bg-red-600' : 'bg-navy']].map(([label, share, color]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 flex-shrink-0 text-xs font-medium text-slate-600">{label}</span>
              <div role="img" aria-label={`${label}: ${share.toFixed(1)}% of department budget`} className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${share}%` }} />
              </div>
              <span className="w-14 flex-shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">{share.toFixed(1)}%</span>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Share of the department budget of {formatLakh(funds.departmentBudgetLakh)}.</p>
        </div>
        {overspent && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800" role="alert">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Reported expenditure is {formatLakh(funds.spentBeyondReleaseLakh)} more than the State has released to this department so far.
          </p>
        )}
      </Panel>

      <Panel title="Monthly Trend" description="Expenditure reported each month and the running total, in ₹ Lakh, against the financial target.">
        {series.length < 2 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
            The trend appears once this department has filed more than one month.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="30%">
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={lakh} width={64} />
                <Tooltip content={<TrendTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} formatter={(value) => <span style={{ color: '#334155' }}>{value}</span>} />
                {totals.financialTargetLakh > 0 && (
                  <ReferenceLine y={totals.financialTargetLakh} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `Target ${lakh(totals.financialTargetLakh)}`, position: 'insideTopLeft', fontSize: 11, fill: '#64748b' }} />
                )}
                <Bar dataKey="spentLakh" name="Spent in month" fill={SPEND_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Line dataKey="cumulativeLakh" name="Cumulative" type="monotone" stroke={CUMULATIVE_COLOR} strokeWidth={2} dot={{ r: 4, fill: CUMULATIVE_COLOR, stroke: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Reports filed by {report.departmentName}, month by month</caption>
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-3 py-2">Month</th>
                <th scope="col" className="px-3 py-2 text-right">Spent in Month</th>
                <th scope="col" className="px-3 py-2 text-right">Cumulative</th>
                <th scope="col" className="px-3 py-2 text-right">Financial</th>
                <th scope="col" className="px-3 py-2 text-right">Physical</th>
                <th scope="col" className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {series.map((item) => (
                <tr key={item.id} className={item.current ? 'bg-navy/[0.04]' : ''}>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-slate-900">
                    {item.current || !reportHref
                      ? <>{item.period}{item.current && <span className="ml-2 rounded bg-navy px-1.5 py-0.5 text-[10px] font-semibold text-white">This report</span>}</>
                      : <Link href={reportHref(item.id)} className="text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">{item.period}</Link>}
                  </th>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatLakh(item.spentLakh)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{formatLakh(item.cumulativeLakh)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">{item.financialPercent}%</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">{item.physicalPercent}%</td>
                  <td className="px-3 py-2"><Badge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Activity-wise Progress" description="Grey is progress up to the previous month; dark blue is what this month added.">
        <ul className="divide-y divide-slate-100">
          {activities.map((activity) => {
            const physicalPercent = activity.physicalTarget > 0 ? Math.floor((activity.physicalTotal / activity.physicalTarget) * 1000) / 10 : 0;
            const financialPercent = activity.financialTargetLakh > 0 ? Math.floor((activity.financialTotalLakh / activity.financialTargetLakh) * 1000) / 10 : 0;
            return (
              <li key={activity.activityCode} className="grid grid-cols-1 gap-x-6 gap-y-2 py-3 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <p className="text-sm font-medium text-slate-900">{activity.activityName}</p>
                  <p className="text-xs text-slate-500">Unit: {activity.unit || '—'}</p>
                </div>
                <div className="md:col-span-4">
                  {activity.hasPhysical ? (
                    <>
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-slate-500">Physical</span>
                        <span className="tabular-nums text-slate-700">
                          <span className="font-semibold text-slate-900">{formatQuantity(activity.physicalTotal)}</span> / {formatQuantity(activity.physicalTarget)}
                          {activity.physicalCurrent > 0 && <span className="ml-1 text-navy">(+{formatQuantity(activity.physicalCurrent)})</span>}
                          <span className="ml-2 font-semibold">{physicalPercent}%</span>
                        </span>
                      </div>
                      <SplitBar previous={activity.physicalPrevious} current={activity.physicalCurrent} target={activity.physicalTarget} label={`${activity.activityName}: physical progress ${physicalPercent}%`} />
                    </>
                  ) : <p className="text-xs text-slate-400">No physical target</p>}
                </div>
                <div className="md:col-span-4">
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-slate-500">Financial</span>
                    <span className="tabular-nums text-slate-700">
                      <span className="font-semibold text-slate-900">{lakh(activity.financialTotalLakh)}</span> / {lakh(activity.financialTargetLakh)}
                      {activity.financialCurrentLakh > 0 && <span className="ml-1 text-navy">(+{lakh(activity.financialCurrentLakh)})</span>}
                      <span className="ml-2 font-semibold">{financialPercent}%</span>
                    </span>
                  </div>
                  <SplitBar previous={activity.financialPreviousLakh} current={activity.financialCurrentLakh} target={activity.financialTargetLakh} label={`${activity.activityName}: financial progress ${financialPercent}%`} />
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
