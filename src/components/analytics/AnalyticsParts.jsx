"use client";
import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatIndian } from '@/lib/numeric';
import { MONEY_UNITS, formatFigure, formatMoney, getMoneyUnit, inUnit, unitCaption, useMoneyUnit } from '@/lib/moneyUnit';
import { ExportButton, downloadCsv } from '@/components/projects/detail/shared';
import { CARD_COLORS, colorFor } from '@/lib/cardColors';

export { CARD_COLORS, colorFor };

// Categorical colours, validated together for colour-blind separation on a light
// surface. Fixed meaning everywhere on the page: budget (sanctioned), spent, balance.
export const COLORS = { budget: '#2a78d6', spent: '#1baf7a', balance: '#eb6834' };

const AXIS = { fontSize: 11, fill: '#475569', fontWeight: 600 };
/** Axis label of an amount held in lakh, in the unit chosen for reports. */
export const compactLakh = (value) => {
  const unit = getMoneyUnit();
  const n = inUnit(value, unit);
  if (unit === 'RUPEES') return `₹${formatIndian(n, { maxDecimals: 0 })}`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })}${MONEY_UNITS[unit].short}`;
};

export function Panel({ title, description, aside, children, padded = true, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 h-5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-b from-blue-600 to-emerald-500" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-navy">{title}</h2>
            {description && <p className="mt-0.5 text-xs font-medium text-slate-500">{description}</p>}
          </div>
        </div>
        {aside}
      </header>
      <div className={padded ? 'px-5 py-4' : ''}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, sub, tone = 'default', icon: Icon, meter, color }) {
  const c = CARD_COLORS[color || (tone === 'success' ? 'green' : tone === 'warning' ? 'orange' : tone === 'danger' ? 'rose' : colorFor(label))];
  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md ${c.card}`}>
      <dt className="flex items-center gap-2.5">
        {Icon && <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white shadow ${c.disc}`} aria-hidden="true"><Icon className="h-[18px] w-[18px]" /></span>}
        <span className={`text-[15px] font-extrabold leading-tight ${c.label}`}>{label}</span>
      </dt>
      <dd className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-xs font-medium text-slate-600" title={typeof sub === 'string' ? sub : undefined}>{sub}</dd>}
      {typeof meter === 'number' && (
        <dd className="mt-2">
          <div role="img" aria-label={`${label}: ${meter}%`} className="h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <div className={`h-full rounded-full transition-[width] duration-500 ${tone === 'danger' ? 'bg-red-600' : c.bar}`} style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
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
      <p className="font-bold text-slate-900">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-0.5 flex items-center gap-2 text-slate-700">
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span>{item.name}:</span>
          <span className="font-bold tabular-nums text-slate-900">{formatMoney(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

const legendText = (value) => <span style={{ color: '#334155' }}>{value}</span>;
const LEGEND = { verticalAlign: 'top', align: 'right', iconType: 'circle', iconSize: 8, wrapperStyle: { fontSize: 12, paddingBottom: 8 }, formatter: legendText };

/** Expenditure reported, month by month or as a running total. One axis: ₹ lakh. */
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
        <Bar dataKey="spentLakh" name="Spent" fill={COLORS.spent} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Sanctioned, spent and balance side by side for each district / department. One axis: ₹ lakh. */
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
          <Bar dataKey="spentLakh" name="Spent" fill={COLORS.spent} radius={[0, 4, 4, 0]} maxBarSize={12} isAnimationActive={false} />
          <Bar dataKey="balanceLakh" name="Balance" fill={COLORS.balance} radius={[0, 4, 4, 0]} maxBarSize={12} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Percentage cell: a round gauge coloured by how far along it is. */
export function CellMeter({ percent }) {
  return <span className="flex items-center justify-end"><PercentRing percent={percent} /></span>;
}

/** Round gauge for a percentage: red below 25, amber below 50, yellow below 75, green from 75. */
export function PercentRing({ percent, size = 34 }) {
  const value = Math.max(0, Number(percent) || 0);
  const shown = Math.min(100, value);
  const color = value >= 75 ? '#16a34a' : value >= 50 ? '#eab308' : value >= 25 ? '#f59e0b' : '#dc2626';
  const r = (size - 6) / 2;
  const length = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${value}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="#fff" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * length} ${length}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="absolute text-[9px] font-extrabold tabular-nums text-slate-800">{Math.round(value)}%</span>
    </span>
  );
}

/** Header band, header text and cell tint of each column colour (report design). */
const BANDS = {
  blue: { head: 'bg-[#4472c4] text-white', sub: 'bg-[#dbe5f6] text-[#1f3864]', cell: 'bg-[#f1f5fc]' },
  green: { head: 'bg-[#2e8b57] text-white', sub: 'bg-[#d5ecdd] text-[#14532d]', cell: 'bg-[#f0f9f3]' },
  orange: { head: 'bg-[#e67e22] text-white', sub: 'bg-[#fde3cc] text-[#7c2d12]', cell: 'bg-[#fff6ee]' },
  violet: { head: 'bg-[#7c3aed] text-white', sub: 'bg-[#e9ddfd] text-[#4c1d95]', cell: 'bg-[#f7f3fe]' },
  teal: { head: 'bg-[#0f8f8c] text-white', sub: 'bg-[#cdeeed] text-[#134e4a]', cell: 'bg-[#effaf9]' },
  slate: { head: 'bg-[#334155] text-white', sub: 'bg-[#e2e8f0] text-[#0f172a]', cell: '' },
};

const cellText = (column, row, unit) => {
  if (column.render && !column.money) return column.render(row);
  const value = row[column.key];
  if (column.money) return formatFigure(value, unit);
  if (column.percent) return <PercentRing percent={value} />;
  return value;
};

/**
 * Report table in SARRA's report design: coloured column groups, the name column
 * in green, money in the unit chosen for reports, percentages as round gauges,
 * and totals at the top and bottom. Sortable, with CSV export.
 *
 * `columns`: { key, label, align?, render?, csv?, sortable?, money?, percent?, sum?, group?, tone? }
 *   money    the value is in lakh; shown in the chosen unit (Rupees / Thousand / Lakh / Crore)
 *   percent  shown as a round gauge
 *   sum      added up in the total rows (a `total(rows)` function can compute it instead)
 *   group    columns with the same group share a coloured band above them; `tone` colours it
 * `onRowClick` makes rows actionable (keyboard accessible).
 */
export function DataTable({
  columns, rows = [], defaultSort, rowKey, onRowClick, rowLabel, csvName, caption,
  emptyText = 'Nothing to show for these filters.', minWidth = 900, pageSize = 15, totals,
}) {
  const unit = useMoneyUnit();
  const [sort, setSort] = useState(defaultSort || { key: columns[0].key, direction: 'asc' });
  const [showAll, setShowAll] = useState(false);
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
  const labelOf = (column) => (column.money && !column.group ? `${column.label} (${unitCaption(unit)})` : column.label);
  const exportCsv = () => downloadCsv(csvName, columns.map(labelOf), sorted.map((row) => columns.map((c) => (c.money ? Number(inUnit(row[c.key], unit).toFixed(MONEY_UNITS[unit].decimals)) : c.csv ? c.csv(row) : row[c.key]))));

  // Column groups (coloured bands above the column headers).
  const grouped = columns.some((c) => c.group);
  const bands = [];
  columns.forEach((column) => {
    const label = column.group || '';
    const last = bands[bands.length - 1];
    if (last && last.label === label && label) last.span += 1;
    else bands.push({ label, span: 1, tone: column.tone || (label ? 'blue' : 'slate'), money: column.money });
  });
  const anyMoneyInGroup = (band) => columns.some((c) => c.group === band.label && c.money);

  const showTotals = totals ?? columns.some((c) => c.sum || c.total);
  const totalOf = (column) => {
    if (column.total) return column.total(rows);
    if (!column.sum) return '';
    const sum = rows.reduce((s, row) => s + (Number(row[column.key]) || 0), 0);
    return column.money ? formatFigure(sum, unit) : formatIndian(sum, { maxDecimals: 2 });
  };
  const visible = showAll || sorted.length <= pageSize ? sorted : sorted.slice(0, pageSize);

  if (!rows.length) return <div className="p-5"><EmptyState>{emptyText}</EmptyState></div>;

  const totalRow = (label, cls) => (
    <tr className={`font-extrabold ${cls}`}>
      {columns.map((column, index) => (index === 0
        ? <th key={column.key} scope="row" className="border border-slate-200 px-3 py-2.5 pl-4 text-left text-[13px] text-slate-900">{label}</th>
        : <td key={column.key} className={`border border-slate-200 px-3 py-2.5 text-[13px] text-slate-900 ${column.align === 'right' || column.money || column.sum ? 'text-right tabular-nums' : ''}`}>{column.percent && column.total ? <PercentRing percent={column.total(rows)} /> : totalOf(column)}</td>))}
    </tr>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-2">
        <span className="text-xs font-semibold text-slate-600">{rows.length} record{rows.length === 1 ? '' : 's'}{columns.some((c) => c.money) ? ` · amounts ${unitCaption(unit)}` : ''}</span>
        <div className="flex items-center gap-3">
          {sorted.length > pageSize && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showAll ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <input type="checkbox" className="peer sr-only" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                <span className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${showAll ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </span>
              Show all ({sorted.length})
            </label>
          )}
          {csvName && <ExportButton onClick={exportCsv} />}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            {grouped && (
              <tr>
                {bands.map((band, index) => (
                  <th key={`${band.label}-${index}`} scope="colgroup" colSpan={band.span} className={`border border-white/40 px-3 py-2 text-center text-[13px] font-extrabold ${BANDS[band.tone]?.head || BANDS.blue.head}`}>
                    {band.label}{band.label && anyMoneyInGroup(band) ? ` (${unitCaption(unit)})` : ''}
                  </th>
                ))}
              </tr>
            )}
            <tr>
              {columns.map((column, index) => {
                const active = sort.key === column.key;
                const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                const band = BANDS[column.tone || (column.group ? 'blue' : 'slate')];
                const cls = grouped ? band.sub : index === 0 ? 'bg-[#2e8b57] text-white' : (column.tone ? BANDS[column.tone].head : 'bg-[#1f4e79] text-white');
                return (
                  <th key={column.key} scope="col" aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={`border border-slate-200 px-3 py-2.5 text-xs font-bold ${cls} ${column.align === 'right' || column.money ? 'text-right' : 'text-left'} ${index === 0 ? 'pl-4' : ''}`}>
                    {column.sortable === false ? labelOf(column) : (
                      <button type="button" onClick={() => toggle(column.key)} className="inline-flex items-center gap-1 rounded transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                        {grouped ? column.label : labelOf(column)}<Icon className="h-3 w-3 opacity-80" aria-hidden="true" />
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {showTotals && totalRow('Selected Record Total', 'bg-slate-100')}
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onRowClick(row); } } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                className={`group transition-colors ${onRowClick ? 'cursor-pointer focus:outline-none' : ''}`}
              >
                {columns.map((column, index) => {
                  const content = cellText(column, row, unit);
                  const align = column.align === 'right' || column.money ? 'text-right tabular-nums' : column.percent ? 'text-center' : 'text-left';
                  if (index === 0) {
                    return <th key={column.key} scope="row" className="border border-slate-200 bg-[#2e8b57] px-3 py-2.5 pl-4 text-left text-[13px] font-bold uppercase tracking-wide text-white group-hover:bg-[#25744a] group-focus-visible:bg-[#25744a] [&_*]:!text-emerald-50">{content}</th>;
                  }
                  const tint = column.tone ? BANDS[column.tone].cell : column.group ? BANDS.blue.cell : '';
                  return <td key={column.key} className={`border border-slate-200 px-3 py-2.5 font-semibold text-slate-800 group-hover:brightness-95 ${tint} ${align}`}>{content}</td>;
                })}
              </tr>
            ))}
            {showTotals && totalRow('Overall Total', 'bg-[#dbe5f6]')}
          </tbody>
        </table>
      </div>
    </div>
  );
}
