"use client";
import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatLakh } from '@/lib/numeric';
import { ExportButton, downloadCsv } from '@/components/projects/detail/shared';

// Categorical colours, validated together for colour-blind separation on a light
// surface. Fixed meaning everywhere on the page: budget, released, spent.
export const COLORS = { budget: '#2a78d6', released: '#eb6834', spent: '#1baf7a' };

const AXIS = { fontSize: 11, fill: '#64748b' };
export const compactLakh = (value) => {
  const n = Number(value) || 0;
  if (n >= 100) return `₹${(n / 100).toLocaleString('en-IN', { maximumFractionDigits: 1 })}Cr`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
};

export function Panel({ title, description, aside, children, padded = true, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {aside}
      </header>
      <div className={padded ? 'px-5 py-4' : ''}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, sub, tone = 'default', icon: Icon, meter }) {
  const tones = { default: 'text-slate-900', success: 'text-emerald-700', warning: 'text-amber-700', danger: 'text-red-700' };
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}{label}
      </dt>
      <dd className={`mt-1 text-xl font-bold tabular-nums ${tones[tone]}`}>{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-xs text-slate-500" title={typeof sub === 'string' ? sub : undefined}>{sub}</dd>}
      {typeof meter === 'number' && (
        <dd className="mt-2">
          <div role="img" aria-label={`${label}: ${meter}%`} className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-[width] duration-500 ${tone === 'danger' ? 'bg-red-600' : tone === 'success' ? 'bg-emerald-600' : 'bg-navy'}`} style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
          </div>
        </dd>
      )}
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">{children}</p>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-0.5 flex items-center gap-2 text-slate-700">
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span>{item.name}:</span>
          <span className="font-semibold tabular-nums text-slate-900">{formatLakh(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

const legendText = (value) => <span style={{ color: '#334155' }}>{value}</span>;
const LEGEND = { verticalAlign: 'top', align: 'right', iconType: 'circle', iconSize: 8, wrapperStyle: { fontSize: 12, paddingBottom: 8 }, formatter: legendText };

/** Funds released and expenditure reported, month by month or as running totals. One axis: ₹ lakh. */
export function TrendChart({ data, cumulative }) {
  if (cumulative) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} interval="preserveStartEnd" />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compactLakh} width={68} />
          <Tooltip content={<ChartTooltip />} />
          <Legend {...LEGEND} />
          <Line dataKey="cumulativeReleasedLakh" name="Released (running total)" stroke={COLORS.released} strokeWidth={2} dot={{ r: 3, fill: COLORS.released, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
          <Line dataKey="cumulativeSpentLakh" name="Spent (running total)" stroke={COLORS.spent} strokeWidth={2} dot={{ r: 3, fill: COLORS.spent, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barGap={2} barCategoryGap="24%">
        <CartesianGrid stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} interval="preserveStartEnd" />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compactLakh} width={68} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
        <Legend {...LEGEND} />
        <Bar dataKey="releasedLakh" name="Released" fill={COLORS.released} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        <Bar dataKey="spentLakh" name="Spent" fill={COLORS.spent} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Budget, released and spent side by side for each district / department. One axis: ₹ lakh. */
export function ComparisonChart({ rows }) {
  const data = rows.slice(0, 13);
  return (
    <div style={{ height: Math.max(220, data.length * 54 + 60) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 8 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tickFormatter={compactLakh} />
          <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: '#334155' }} tickLine={false} axisLine={false} width={150} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
          <Legend {...LEGEND} />
          <Bar dataKey="budgetLakh" name="Sanctioned budget" fill={COLORS.budget} radius={[0, 4, 4, 0]} maxBarSize={12} isAnimationActive={false} />
          <Bar dataKey="releasedLakh" name="Released" fill={COLORS.released} radius={[0, 4, 4, 0]} maxBarSize={12} isAnimationActive={false} />
          <Bar dataKey="spentLakh" name="Spent" fill={COLORS.spent} radius={[0, 4, 4, 0]} maxBarSize={12} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Inline meter for a percentage cell. */
export function CellMeter({ percent, tone = 'navy' }) {
  const colors = { navy: 'bg-navy', emerald: 'bg-emerald-600', red: 'bg-red-600', amber: 'bg-amber-500' };
  return (
    <span className="flex items-center justify-end gap-2">
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden="true">
        <span className={`block h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </span>
      <span className="w-12 text-right tabular-nums">{percent}%</span>
    </span>
  );
}

/**
 * Sortable table with CSV export. `columns`: { key, label, align?, render?, csv?, sortable? }.
 * `onRowClick` makes rows actionable (keyboard accessible).
 */
export function DataTable({ columns, rows = [], defaultSort, rowKey, onRowClick, rowLabel, csvName, caption, emptyText = 'Nothing to show for these filters.', minWidth = 900 }) {
  const [sort, setSort] = useState(defaultSort || { key: columns[0].key, direction: 'asc' });
  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const x = a[sort.key]; const y = b[sort.key];
      const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'en', { sensitivity: 'base' });
      return sort.direction === 'asc' ? order : -order;
    });
    return list;
  }, [rows, sort]);

  const toggle = (key) => setSort((current) => (current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'desc' }));
  const exportCsv = () => downloadCsv(csvName, columns.map((c) => c.label), sorted.map((row) => columns.map((c) => (c.csv ? c.csv(row) : row[c.key]))));

  if (!rows.length) return <div className="p-5"><EmptyState>{emptyText}</EmptyState></div>;

  return (
    <div>
      {csvName && <div className="flex justify-end border-b border-slate-100 px-5 py-2"><ExportButton onClick={exportCsv} /></div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((column) => {
                const active = sort.key === column.key;
                const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th key={column.key} scope="col" aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={`px-3 py-2.5 first:pl-5 last:pr-5 ${column.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {column.sortable === false ? column.label : (
                      <button type="button" onClick={() => toggle(column.key)} className={`inline-flex items-center gap-1 rounded uppercase tracking-wider transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${active ? 'text-slate-800' : ''}`}>
                        {column.label}<Icon className="h-3 w-3" aria-hidden="true" />
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onRowClick(row); } } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-navy/[0.04] focus:outline-none focus-visible:bg-navy/[0.06]' : 'hover:bg-slate-50/60'}`}
              >
                {columns.map((column, index) => {
                  const content = column.render ? column.render(row) : row[column.key];
                  const cls = `px-3 py-2.5 first:pl-5 last:pr-5 ${column.align === 'right' ? 'text-right tabular-nums' : 'text-left'}`;
                  return index === 0
                    ? <th key={column.key} scope="row" className={`${cls} font-medium text-slate-900`}>{content}</th>
                    : <td key={column.key} className={`${cls} text-slate-700`}>{content}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
