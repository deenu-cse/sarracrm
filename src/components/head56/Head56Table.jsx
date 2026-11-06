"use client";
import React from 'react';
import { sumMoney } from '@/lib/numeric';
import { amount, displayName, groupLines, pct, qty } from './shared';

/**
 * Prarup-2 table (read-only). `variant`:
 *   PIA        the full format: unit, size, rate, departmental and SARRA share
 *   DISTRICT / HQ   approved budget and, where a line has one, its physical target
 *   STATEMENT  consolidated figures of several units (the full format without rate)
 */

const PHYSICAL = ['openingPhysical', 'physicalTarget', 'targetSize', 'physicalPrevious', 'physicalCurrent', 'physicalFy', 'physicalTotal'];
const MONEY = ['openingSarraLakh', 'deptShareLakh', 'sarraShareLakh', 'expenditurePreviousLakh', 'expenditureCurrentLakh', 'expenditureFyLakh', 'expenditureTotalLakh', 'balanceLakh'];

const sumOf = (rows, extra) => {
  const out = { ...extra, hasPhysical: rows.some((r) => r.hasPhysical) };
  PHYSICAL.forEach((key) => { out[key] = rows.reduce((s, r) => s + (Number(r[key]) || 0), 0); });
  MONEY.forEach((key) => { out[key] = sumMoney(rows.map((r) => r[key])); });
  out.utilisationPercent = out.sarraShareLakh > 0 ? Math.floor((out.expenditureFyLakh / out.sarraShareLakh) * 10000) / 100 : 0;
  out.physicalPercent = out.physicalTarget > 0 ? Math.floor((out.physicalFy / out.physicalTarget) * 10000) / 100 : null;
  return out;
};

/** Report lines with a summed heading row above each sub-head's items, and the total. */
export const rowsWithHeadings = (lines, parents) => {
  const rows = [];
  for (const group of groupLines(lines, parents)) {
    if (group.heading) {
      rows.push(sumOf(group.lines, { code: group.heading.code, name: group.heading.name, nameHindi: group.heading.nameHindi, heading: true, depth: 0 }));
      group.lines.forEach((line) => rows.push({ ...line, depth: 1 }));
    } else {
      group.lines.forEach((line) => rows.push({ ...line, depth: 0 }));
    }
  }
  return { rows, total: { ...sumOf(lines, { code: '56', name: 'Total — 56 Non-Salary Grant', heading: true }), hasPhysical: true } };
};

const COLUMN_SETS = {
  PIA: [
    { group: 'Physical target and progress', key: 'openingPhysical', label: 'Up to last FY', q: true },
    { group: 'Physical target and progress', key: 'physicalTarget', label: 'Target: unit (No./Ha)', q: true },
    { group: 'Physical target and progress', key: 'targetSize', label: 'Target: size (cu.m)', q: true },
    { group: 'Physical target and progress', key: 'physicalPrevious', label: 'Previous months', q: true },
    { group: 'Physical target and progress', key: 'physicalCurrent', label: 'This month', q: true, strong: true },
    { group: 'Physical target and progress', key: 'physicalFy', label: 'Up to this month', q: true },
    { group: 'Physical target and progress', key: 'physicalTotal', label: 'Total progress', q: true },
    { group: 'Financial target and progress (₹ lakh)', key: 'openingSarraLakh', label: 'SARRA exp. up to last FY' },
    { group: 'Financial target and progress (₹ lakh)', key: 'rate', label: 'Rate' },
    { group: 'Financial target and progress (₹ lakh)', key: 'deptShareLakh', label: 'Target: dept. share' },
    { group: 'Financial target and progress (₹ lakh)', key: 'sarraShareLakh', label: 'Target: SARRA share' },
    { group: 'Financial target and progress (₹ lakh)', key: 'expenditurePreviousLakh', label: 'Exp. previous months' },
    { group: 'Financial target and progress (₹ lakh)', key: 'expenditureCurrentLakh', label: 'Exp. this month', strong: true },
    { group: 'Financial target and progress (₹ lakh)', key: 'expenditureFyLakh', label: 'Exp. up to this month' },
    { group: 'Financial target and progress (₹ lakh)', key: 'expenditureTotalLakh', label: 'Total SARRA exp.' },
    { group: 'Financial target and progress (₹ lakh)', key: 'balanceLakh', label: 'Balance' },
    { group: 'Financial target and progress (₹ lakh)', key: 'utilisationPercent', label: 'Utilised', pct: true },
  ],
  UNIT: [
    { group: 'Physical progress', key: 'physicalTarget', label: 'Target', q: true },
    { group: 'Physical progress', key: 'physicalPrevious', label: 'Previous months', q: true },
    { group: 'Physical progress', key: 'physicalCurrent', label: 'This month', q: true, strong: true },
    { group: 'Physical progress', key: 'physicalFy', label: 'Cumulative', q: true },
    { group: 'Expenditure (₹ lakh)', key: 'sarraShareLakh', label: 'Approved budget' },
    { group: 'Expenditure (₹ lakh)', key: 'expenditurePreviousLakh', label: 'Previous months' },
    { group: 'Expenditure (₹ lakh)', key: 'expenditureCurrentLakh', label: 'This month', strong: true },
    { group: 'Expenditure (₹ lakh)', key: 'expenditureFyLakh', label: 'Cumulative' },
    { group: 'Expenditure (₹ lakh)', key: 'balanceLakh', label: 'Balance' },
    { group: 'Expenditure (₹ lakh)', key: 'utilisationPercent', label: 'Utilised', pct: true },
    { group: 'Since start', key: 'expenditureTotalLakh', label: 'Total incl. earlier years' },
  ],
};
COLUMN_SETS.STATEMENT = COLUMN_SETS.PIA;

const physicalKeys = new Set(PHYSICAL);

function Cell({ row, column }) {
  const value = row[column.key];
  if (physicalKeys.has(column.key) && !row.hasPhysical) return <span className="text-slate-300">—</span>;
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>;
  if (column.pct) {
    const tone = value > 100 ? 'text-red-700' : value >= 90 ? 'text-amber-700' : '';
    return <span className={tone}>{pct(value)}</span>;
  }
  if (column.key === 'balanceLakh' && value < 0) return <span className="font-semibold text-red-700">{amount(value)}</span>;
  return column.q ? qty(value) : amount(value);
}

export function Head56Table({ rows, total, variant = 'UNIT', caption = 'Prarup-2 figures' }) {
  const columns = COLUMN_SETS[variant === 'PIA' || variant === 'STATEMENT' ? variant : 'UNIT'];
  const groups = columns.reduce((list, column) => {
    const last = list[list.length - 1];
    if (last && last.label === column.group) last.span += 1;
    else list.push({ label: column.group, span: 1 });
    return list;
  }, []);
  const renderRow = (row, key, kind) => (
    <tr key={key} className={kind === 'total' ? 'bg-blue-50 font-bold text-slate-900' : row.heading ? 'bg-amber-50/70 font-semibold text-slate-900' : 'hover:bg-slate-50/60'}>
      <th scope="row" className={`sticky left-0 z-[1] whitespace-nowrap border-r border-slate-200 px-3 py-2 text-left font-mono text-xs ${kind === 'total' ? 'bg-blue-50' : row.heading ? 'bg-amber-50' : 'bg-white'}`}>{row.code}</th>
      <td className={`min-w-[16rem] border-r border-slate-200 px-3 py-2 text-left ${row.depth ? 'pl-7' : ''}`}>
        <span className="block">{displayName(row)}</span>
        {row.hasPhysical && row.unit && !row.heading && <span className="text-[11px] font-normal text-slate-500">Unit: {row.unit}</span>}
        {row.remarks && <span className="block text-[11px] font-normal italic text-slate-500">Remarks: {row.remarks}</span>}
      </td>
      {columns.map((column) => (
        <td key={column.key} className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${column.strong ? 'bg-navy/[0.03] font-semibold' : ''}`}><Cell row={row} column={column} /></td>
      ))}
    </tr>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <th scope="col" rowSpan={2} className="sticky left-0 z-[1] border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left">Code</th>
            <th scope="col" rowSpan={2} className="border-b border-r border-slate-200 px-3 py-2 text-left">Activity / sub-activity</th>
            {groups.map((group) => <th key={group.label} scope="colgroup" colSpan={group.span} className="border-b border-r border-slate-200 px-3 py-2 text-center last:border-r-0">{group.label}</th>)}
          </tr>
          <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600">
            {columns.map((column) => <th key={column.key} scope="col" className={`border-b border-slate-200 px-3 py-2 text-right align-bottom ${column.strong ? 'text-navy' : ''}`}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => renderRow(row, `${row.code}-${index}`))}
          {total && renderRow(total, 'total', 'total')}
        </tbody>
      </table>
    </div>
  );
}
