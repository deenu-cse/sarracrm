"use client";
import React from 'react';
import { sumMoney } from '@/lib/numeric';
import { formatFigure, unitCaption, useMoneyUnit } from '@/lib/moneyUnit';
import { PercentRing } from '@/components/analytics/AnalyticsParts';
import { displayName, groupLines, qty } from './shared';

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
    { group: 'Financial target and progress', key: 'openingSarraLakh', label: 'SARRA exp. up to last FY' },
    { group: 'Financial target and progress', key: 'rate', label: 'Rate' },
    { group: 'Financial target and progress', key: 'deptShareLakh', label: 'Target: dept. share' },
    { group: 'Financial target and progress', key: 'sarraShareLakh', label: 'Target: SARRA share' },
    { group: 'Financial target and progress', key: 'expenditurePreviousLakh', label: 'Exp. previous months' },
    { group: 'Financial target and progress', key: 'expenditureCurrentLakh', label: 'Exp. this month', strong: true },
    { group: 'Financial target and progress', key: 'expenditureFyLakh', label: 'Exp. up to this month' },
    { group: 'Financial target and progress', key: 'expenditureTotalLakh', label: 'Total SARRA exp.' },
    { group: 'Financial target and progress', key: 'balanceLakh', label: 'Balance' },
    { group: 'Financial target and progress', key: 'utilisationPercent', label: 'Utilised', pct: true },
  ],
  UNIT: [
    { group: 'Physical progress', key: 'physicalTarget', label: 'Target', q: true },
    { group: 'Physical progress', key: 'physicalPrevious', label: 'Previous months', q: true },
    { group: 'Physical progress', key: 'physicalCurrent', label: 'This month', q: true, strong: true },
    { group: 'Physical progress', key: 'physicalFy', label: 'Cumulative', q: true },
    { group: 'Expenditure', key: 'sarraShareLakh', label: 'Approved budget' },
    { group: 'Expenditure', key: 'expenditurePreviousLakh', label: 'Previous months' },
    { group: 'Expenditure', key: 'expenditureCurrentLakh', label: 'This month', strong: true },
    { group: 'Expenditure', key: 'expenditureFyLakh', label: 'Cumulative' },
    { group: 'Expenditure', key: 'balanceLakh', label: 'Balance' },
    { group: 'Expenditure', key: 'utilisationPercent', label: 'Utilised', pct: true },
    { group: 'Since start', key: 'expenditureTotalLakh', label: 'Total incl. earlier years' },
  ],
};
COLUMN_SETS.STATEMENT = COLUMN_SETS.PIA;

const physicalKeys = new Set(PHYSICAL);

/** Colours of the column groups (report design): physical teal, money blue, since-start orange. */
const BAND = {
  'Physical target and progress': { head: 'bg-[#0f8f8c]', sub: 'bg-[#cdeeed] text-[#134e4a]', cell: 'bg-[#effaf9]' },
  'Physical progress': { head: 'bg-[#0f8f8c]', sub: 'bg-[#cdeeed] text-[#134e4a]', cell: 'bg-[#effaf9]' },
  'Financial target and progress': { head: 'bg-[#4472c4]', sub: 'bg-[#dbe5f6] text-[#1f3864]', cell: 'bg-[#f1f5fc]' },
  Expenditure: { head: 'bg-[#4472c4]', sub: 'bg-[#dbe5f6] text-[#1f3864]', cell: 'bg-[#f1f5fc]' },
  'Since start': { head: 'bg-[#e67e22]', sub: 'bg-[#fde3cc] text-[#7c2d12]', cell: 'bg-[#fff6ee]' },
};
const moneyGroup = (label) => label === 'Financial target and progress' || label === 'Expenditure' || label === 'Since start';

function Cell({ row, column, unit }) {
  const value = row[column.key];
  if (physicalKeys.has(column.key) && !row.hasPhysical) return <span className="text-slate-300">—</span>;
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>;
  if (column.pct) return <PercentRing percent={value} />;
  if (column.q) return qty(value);
  const text = column.key === 'rate' ? qty(value) : formatFigure(value, unit);
  if (column.key === 'balanceLakh' && value < 0) return <span className="font-bold text-red-700">{text}</span>;
  return text;
}

export function Head56Table({ rows, total, variant = 'UNIT', caption = 'Prarup-2 figures' }) {
  const unit = useMoneyUnit();
  const columns = COLUMN_SETS[variant === 'PIA' || variant === 'STATEMENT' ? variant : 'UNIT'];
  const groups = columns.reduce((list, column) => {
    const last = list[list.length - 1];
    if (last && last.label === column.group) last.span += 1;
    else list.push({ label: column.group, span: 1 });
    return list;
  }, []);
  const renderRow = (row, key, kind) => (
    <tr key={key} className={kind === 'total' ? 'font-extrabold text-slate-900' : row.heading ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}>
      <th scope="row" className={`sticky left-0 z-[1] whitespace-nowrap border border-slate-200 px-3 py-2 text-left font-mono text-xs font-bold ${kind === 'total' ? 'bg-[#1f4e79] text-white' : row.heading ? 'bg-[#25744a] text-white' : 'bg-[#2e8b57] text-white'}`}>{row.code}</th>
      <td className={`min-w-[16rem] border border-slate-200 px-3 py-2 text-left ${kind === 'total' ? 'bg-[#dbe5f6]' : row.heading ? 'bg-amber-100/80' : 'bg-white'} ${row.depth ? 'pl-7' : ''}`}>
        <span className="block">{kind === 'top' ? 'Selected Record Total' : displayName(row)}</span>
        {row.hasPhysical && row.unit && !row.heading && <span className="text-[11px] font-medium text-slate-500">Unit: {row.unit}</span>}
        {row.remarks && <span className="block text-[11px] font-medium italic text-slate-500">Remarks: {row.remarks}</span>}
      </td>
      {columns.map((column) => (
        <td key={column.key} className={`whitespace-nowrap border border-slate-200 px-3 py-2 text-right tabular-nums ${kind === 'total' || kind === 'top' ? 'bg-[#dbe5f6]' : row.heading ? 'bg-amber-50' : BAND[column.group]?.cell || ''} ${column.strong ? 'font-extrabold text-navy' : ''} ${column.pct ? 'text-center' : ''}`}><Cell row={row} column={column} unit={unit} /></td>
      ))}
    </tr>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-xs font-extrabold text-white">
            <th scope="col" rowSpan={2} className="sticky left-0 z-[1] border border-white/40 bg-[#2e8b57] px-3 py-2 text-left">Code</th>
            <th scope="col" rowSpan={2} className="border border-white/40 bg-[#2e8b57] px-3 py-2 text-left">Activity / sub-activity</th>
            {groups.map((group) => <th key={group.label} scope="colgroup" colSpan={group.span} className={`border border-white/40 px-3 py-2 text-center ${BAND[group.label]?.head || 'bg-[#1f4e79]'}`}>{group.label}{moneyGroup(group.label) ? ` (${unitCaption(unit)})` : ''}</th>)}
          </tr>
          <tr className="text-[11px] font-bold">
            {columns.map((column) => <th key={column.key} scope="col" className={`border border-slate-200 px-3 py-2 text-right align-bottom ${BAND[column.group]?.sub || 'bg-slate-100 text-slate-700'}`}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {total && rows.length > 3 && renderRow(total, 'top', 'top')}
          {rows.map((row, index) => renderRow(row, `${row.code}-${index}`))}
          {total && renderRow(total, 'total', 'total')}
        </tbody>
      </table>
    </div>
  );
}
