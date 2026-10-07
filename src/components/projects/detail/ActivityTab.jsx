"use client";
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatIndian, formatLakh } from '@/lib/numeric';
import { EmptyNote, ExportButton, Panel, downloadCsv } from './shared';

const ALL = 'ALL';
const toUnits = (lakh) => Math.round((Number(lakh) || 0) * 100000);

/** Planned activity targets: consolidated for the project, or for one department. */
export function ActivityTab({ project }) {
  const departments = project.departmentAllocations || [];
  const [view, setView] = useState(ALL);
  const [query, setQuery] = useState('');

  const consolidated = useMemo(() => (project.sanctionedTargets || []).map((target) => ({
    code: target.activityId,
    name: target.activityLabel || target.activityId,
    unit: target.unit,
    physical: target.physicalTarget,
    financial: target.financialAmountLakh,
    departments: departments.filter((d) => (d.activities || []).some((a) => a.activityCode === target.activityId)).length,
  })), [project.sanctionedTargets, departments]);

  const selected = departments.find((department) => String(department.departmentId) === view);
  const rows = selected
    ? (selected.activities || []).map((a) => ({ code: a.activityCode, name: a.activityName, unit: a.unit, physical: a.physicalTarget, financial: a.financialTargetLakh }))
    : consolidated;

  const needle = query.replace(/\s+/g, ' ').trim().toLowerCase();
  const visible = needle ? rows.filter((row) => `${row.name} ${row.code}`.toLowerCase().includes(needle)) : rows;
  const totalUnits = rows.reduce((sum, row) => sum + toUnits(row.financial), 0);
  const visibleUnits = visible.reduce((sum, row) => sum + toUnits(row.financial), 0);
  const allocatedLakh = selected ? selected.totalLakh : project.totalSanctionedBudgetLakh;
  const code = project.projectId || project.sanctionId || 'project';

  if (!rows.length && !departments.length) {
    return <EmptyNote>No activity targets were recorded for this project.</EmptyNote>;
  }

  const exportPlan = () => {
    const lines = departments.length
      ? departments.flatMap((department) => (department.activities || []).map((a) => [department.departmentName, a.activityCode, a.activityName, a.unit, a.physicalTarget, a.financialTargetLakh]))
      : consolidated.map((row) => [project.department || '', row.code, row.name, row.unit, row.physical, row.financial]);
    downloadCsv(`${code}_activity_plan.csv`, ['Department', 'Activity Code', 'Activity', 'Unit', 'Physical Target', 'Financial Target (Rs. Lakh)'], lines);
  };

  return (
    <Panel
      title="Activity Plan"
      description={project.head?.code ? `Head ${project.head.code} — ${project.head.name}` : 'Sanctioned activity targets'}
      aside={<ExportButton onClick={exportPlan} />}
      padded={false}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        {departments.length > 0 ? (
          <div role="tablist" aria-label="Activity plan view" className="flex gap-1.5 overflow-x-auto">
            {[{ id: ALL, label: 'All departments' }, ...departments.map((d) => ({ id: String(d.departmentId), label: d.departmentName }))].map((option) => {
              const active = view === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(option.id)}
                  className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
                    ${active ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : <span />}
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Search activities</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activities…"
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">{selected ? `Activity targets for ${selected.departmentName}` : 'Activity targets for all departments'}</caption>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="w-12 px-5 py-2.5">#</th>
              <th scope="col" className="px-3 py-2.5">Activity</th>
              <th scope="col" className="w-24 px-3 py-2.5">Unit</th>
              <th scope="col" className="w-36 px-3 py-2.5 text-right">Physical Target</th>
              <th scope="col" className="w-44 px-3 py-2.5 text-right">Financial Target</th>
              <th scope="col" className="w-28 px-5 py-2.5 text-right">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row, index) => (
              <tr key={row.code || row.name} className="transition-colors hover:bg-slate-50/60">
                <td className="px-5 py-2.5 tabular-nums text-slate-400">{index + 1}</td>
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-slate-800">
                  {row.name}
                  {row.code && <span className="ml-2 font-mono text-[11px] font-normal text-slate-400">{row.code}</span>}
                  {!selected && row.departments > 1 && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{row.departments} departments</span>}
                </th>
                <td className="px-3 py-2.5 text-slate-600">{row.unit || '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{row.physical > 0 ? formatIndian(row.physical, { maxDecimals: 3 }) : <span className="text-slate-300">—</span>}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">{formatLakh(row.financial)}</td>
                <td className="px-5 py-2.5 text-right tabular-nums text-slate-500">{totalUnits > 0 ? `${((toUnits(row.financial) / totalUnits) * 100).toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No activity matches “{query.trim()}”.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
              <th scope="row" colSpan={4} className="px-5 py-3 text-left">
                {needle ? `Matching activities (${visible.length} of ${rows.length})` : `Activity Financial Total (${rows.length} activities)`}
              </th>
              <td className="px-3 py-3 text-right tabular-nums">{formatLakh(visibleUnits / 100000)}</td>
              <td className="px-5 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
      {allocatedLakh > 0 && (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          {selected ? `${selected.departmentName} allocation` : 'Project budget'}: <span className="font-semibold tabular-nums text-slate-700">{formatLakh(allocatedLakh)}</span>
          {' · '}planned in activities: <span className="font-semibold tabular-nums text-slate-700">{formatLakh(totalUnits / 100000)}</span>
          {toUnits(allocatedLakh) > totalUnits && <> · not assigned to an activity: <span className="font-semibold tabular-nums text-amber-700">{formatLakh((toUnits(allocatedLakh) - totalUnits) / 100000)}</span></>}
        </p>
      )}
    </Panel>
  );
}
