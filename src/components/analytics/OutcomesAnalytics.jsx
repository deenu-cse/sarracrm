"use client";
import React from 'react';
import { fetchOutcomeSummary } from '@/lib/lifecycleApi';
import { formatIndian } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { TrendBadge } from '@/components/projects/detail/OutcomesTab';
import { DataTable, EmptyState, Kpi, Panel } from './AnalyticsParts';

const number = (value) => formatIndian(value, { maxDecimals: 3 });
const date = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Share of measured projects that improved / did not change / declined, as one bar with a legend. */
function ResultBar({ indicator }) {
  const parts = [
    { key: 'improved', label: 'Improved', value: indicator.improved, color: '#1baf7a' },
    { key: 'unchanged', label: 'No change', value: indicator.unchanged, color: '#94a3b8' },
    { key: 'declined', label: 'Declined', value: indicator.declined, color: '#d64545' },
  ];
  if (!indicator.measured) return <span className="text-xs text-slate-400">Not measured yet</span>;
  return (
    <div>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={parts.map((part) => `${part.label} ${part.value}`).join(', ')}>
        {parts.filter((part) => part.value > 0).map((part) => <span key={part.key} style={{ width: `${(part.value / indicator.measured) * 100}%`, backgroundColor: part.color }} />)}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-600">
        {parts.map((part) => <span key={part.key} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: part.color }} aria-hidden="true" />{part.label} {part.value}</span>)}
      </p>
    </div>
  );
}

/** State-wide outcome tracking: what changed on the ground, by indicator and by district. */
export function OutcomesAnalytics({ district, headCode, projectHref }) {
  const box = useMasterList(async () => [await fetchOutcomeSummary({ district, headCode })], `outcome-summary:${district}:${headCode}`);
  const data = box.items[0];

  if (!data && !box.error) return <div className="space-y-3" role="status" aria-label="Loading outcomes"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  if (box.error || !data) return <Notice tone="error" title="Unable to load outcomes." action={<RetryButton onClick={box.reload} />}>{box.error}</Notice>;

  const { totals } = data;
  const applicable = data.indicators.filter((indicator) => indicator.applicableProjects > 0);
  const measuredRows = applicable.flatMap((indicator) => indicator.projects.map((project) => ({ ...project, indicator: indicator.name, unit: indicator.unit, key: `${indicator.code}:${project.id}` })));

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Sanctioned projects" value={String(totals.projects)} sub={district ? district : 'Whole State'} />
        <Kpi label="Baseline recorded" value={String(totals.projectsWithBaseline)} sub={totals.projects ? `${Math.round((totals.projectsWithBaseline / totals.projects) * 100)}% of projects` : ''} tone={totals.projects > 0 && totals.projectsWithBaseline === totals.projects ? 'success' : 'default'} />
        <Kpi label="Measured after baseline" value={String(totals.projectsMeasured)} sub={`${totals.readings} reading${totals.readings === 1 ? '' : 's'} in all`} />
        <Kpi label="No baseline yet" value={String(totals.projectsWithoutBaseline)} sub="Outcome cannot be judged without one" tone={totals.projectsWithoutBaseline > 0 ? 'warning' : 'default'} />
      </dl>

      <Panel title="Indicators" description="For each indicator: how many projects have a baseline, how many were measured again, and what the result was. Head and district filters apply; period filters do not." padded={false}>
        {applicable.length === 0 ? <div className="p-5"><EmptyState>No indicator applies to the projects for these filters.</EmptyState></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <caption className="sr-only">Outcome indicators</caption>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">Indicator</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Projects</th>
                  <th scope="col" className="px-3 py-2.5 text-right">With baseline</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Measured</th>
                  <th scope="col" className="w-64 px-3 py-2.5">Result</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Average change</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Baseline to latest (sum)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicable.map((indicator) => (
                  <tr key={indicator.code} className="align-top">
                    <th scope="row" className="px-5 py-3 text-left font-medium text-slate-900">
                      {indicator.name}
                      <span className="block text-xs font-normal text-slate-500">{indicator.unit} · {indicator.direction === 'DECREASE' ? 'lower is better' : 'higher is better'}</span>
                    </th>
                    <td className="px-3 py-3 text-right tabular-nums">{indicator.applicableProjects}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{indicator.withBaseline}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{indicator.measured}</td>
                    <td className="px-3 py-3"><ResultBar indicator={indicator} /></td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">{indicator.averageChangePercent === null ? '—' : `${indicator.averageChangePercent > 0 ? '+' : ''}${number(indicator.averageChangePercent)}%`}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{indicator.measured ? `${number(indicator.baselineTotal)} to ${number(indicator.latestTotal)} ${indicator.unit}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Measured Projects" description="Every project and indicator that has a baseline and at least one later reading." padded={false}>
        <DataTable
          rows={measuredRows}
          caption="Outcome of each measured project"
          csvName="outcomes.csv"
          rowKey={(row) => row.key}
          defaultSort={{ key: 'changePercent', direction: 'desc' }}
          emptyText="No project has been measured after its baseline yet."
          minWidth={980}
          columns={[
            { key: 'code', label: 'Project', render: (r) => (projectHref ? <a href={projectHref(r.id)} className="font-mono text-xs font-semibold text-navy hover:underline">{r.code}</a> : <span className="font-mono text-xs">{r.code}</span>) },
            { key: 'name', label: 'Name', render: (r) => <span className="block max-w-[16rem] truncate">{r.name}</span> },
            { key: 'district', label: 'District' },
            { key: 'indicator', label: 'Indicator', render: (r) => `${r.indicator} (${r.unit})`, csv: (r) => `${r.indicator} (${r.unit})` },
            { key: 'baseline', label: 'Baseline', align: 'right', render: (r) => number(r.baseline) },
            { key: 'latest', label: 'Latest', align: 'right', render: (r) => number(r.latest) },
            { key: 'latestOn', label: 'Measured on', render: (r) => date(r.latestOn), csv: (r) => String(r.latestOn).slice(0, 10) },
            { key: 'changePercent', label: 'Change', align: 'right', render: (r) => <TrendBadge comparison={r} />, csv: (r) => (r.changePercent === null ? '' : r.changePercent) },
          ]}
        />
      </Panel>

      <Panel title="District-wise Coverage" description="How far outcome tracking has reached in each district." padded={false}>
        <DataTable
          rows={data.districts}
          caption="Outcome tracking by district"
          csvName="outcomes_by_district.csv"
          rowKey={(row) => row.district}
          defaultSort={{ key: 'projects', direction: 'desc' }}
          emptyText="No districts for these filters."
          minWidth={760}
          columns={[
            { key: 'district', label: 'District' },
            { key: 'projects', label: 'Projects', align: 'right' },
            { key: 'projectsWithBaseline', label: 'With baseline', align: 'right' },
            { key: 'projectsMeasured', label: 'Measured', align: 'right' },
            { key: 'readings', label: 'Readings', align: 'right' },
            { key: 'improved', label: 'Indicators improved', align: 'right' },
            { key: 'declined', label: 'Indicators declined', align: 'right' },
          ]}
        />
      </Panel>
    </>
  );
}
