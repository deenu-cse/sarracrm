"use client";
import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { formatIndian, formatLakh } from '@/lib/numeric';

/** Shared pieces of the Budget Head 56 screens. */

export const FY_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
export const LEVEL_LABELS = { HQ: 'SARRA HQ', DISTRICT: 'District SARRA Centre', PIA: 'PIA' };
export const LEVEL_TONE = { HQ: 'bg-indigo-50 text-indigo-800 border-indigo-200', DISTRICT: 'bg-cyan-50 text-cyan-800 border-cyan-200', PIA: 'bg-amber-50 text-amber-800 border-amber-200' };
export const ALLOCATION_TONE = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDING_CHECKER: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING_APPROVER: 'bg-amber-100 text-amber-800 border-amber-200',
  RETURNED: 'bg-red-50 text-red-700 border-red-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const BASES = {
  [USER_ROLES.SUPER_ADMIN]: '/dashboard/admin/head56',
  [USER_ROLES.DD_LEVEL]: '/dashboard/dd/head56',
  [USER_ROLES.PIA_OFFICER]: '/dashboard/officer/head56',
  [USER_ROLES.MND_OFFICER]: '/dashboard/mnd/head56',
  [USER_ROLES.MND_SUPER_ADMIN]: '/dashboard/mnd-admin/head56',
};

/** Where the Head 56 pages of the signed-in role live. */
export const useH56Base = () => {
  const { user } = useAuth();
  return BASES[user?.role] || '/dashboard/admin/head56';
};

export const fyLabel = (start) => `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
export const currentFyStart = (date = new Date()) => (date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1);
export const currentFy = () => fyLabel(currentFyStart());
/** Previous, current and next financial year. */
export const fyOptions = () => [currentFyStart() + 1, currentFyStart(), currentFyStart() - 1].map(fyLabel);
/** Months of a year that have started. */
export const startedMonths = (financialYear) => {
  const start = Number(String(financialYear).slice(0, 4));
  const now = new Date();
  return FY_MONTHS.filter((_, index) => {
    const year = start + (index >= 9 ? 1 : 0);
    const month = (index + 3) % 12;
    return year * 12 + month <= now.getFullYear() * 12 + now.getMonth();
  });
};

export const lakh = (value) => formatLakh(value || 0);
export const amount = (value) => formatIndian(value || 0, { minDecimals: 2 });
export const qty = (value) => formatIndian(value || 0, { maxDecimals: 3 });
export const pct = (value) => `${(Number(value) || 0).toFixed(2)}%`;
export const moment = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export function LevelPill({ level, label }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${LEVEL_TONE[level] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{label || LEVEL_LABELS[level] || level}</span>;
}

export function AllocationPill({ status, label }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ALLOCATION_TONE[status] || ALLOCATION_TONE.DRAFT}`}>{label || status}</span>;
}

/** Tab strip; `tabs` = [{ id, label, count? }]. */
export function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${active ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab.label}
            {tab.count > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">{tab.count > 99 ? '99+' : tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const selectClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20';

/** Labelled select used in filter bars. */
export function FilterSelect({ id, label, value, onChange, options, allLabel }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {allLabel !== undefined && <option value="">{allLabel}</option>}
        {options.map((option) => (typeof option === 'string'
          ? <option key={option} value={option}>{option}</option>
          : <option key={option.value} value={option.value}>{option.label}</option>))}
      </select>
    </label>
  );
}

/** PDF and Excel buttons; `onDownload(format)` returns a promise. */
export function DownloadButtons({ onDownload, compact = false }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const run = async (format) => {
    setBusy(format);
    setError('');
    try { await onDownload(format); } catch (err) { setError(err?.message || 'The file could not be prepared.'); } finally { setBusy(''); }
  };
  const button = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={button} onClick={() => run('excel')} disabled={Boolean(busy)}>
        {busy === 'excel' ? <Download className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />}
        {compact ? 'Excel' : 'Excel (Prarup-2)'}
      </button>
      <button type="button" className={button} onClick={() => run('pdf')} disabled={Boolean(busy)}>
        {busy === 'pdf' ? <Download className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" /> : <FileText className="h-3.5 w-3.5 text-red-700" aria-hidden="true" />}
        PDF
      </button>
      {error && <span role="alert" className="text-xs font-medium text-red-700">{error}</span>}
    </div>
  );
}

/** Lines grouped under their sub-head headings: [{ heading, lines }] in format order. */
export const groupLines = (lines, parents = []) => {
  const parentOf = new Map(parents.map((parent) => [parent.code, parent]));
  const groups = [];
  for (const line of lines) {
    const key = line.parentCode || null;
    let group = groups.find((g) => g.key === key && key !== null);
    if (!group) {
      group = { key, heading: key ? (parentOf.get(key) || { code: key, name: key }) : null, lines: [] };
      groups.push(group);
    }
    group.lines.push(line);
  }
  return groups;
};

export const displayName = (line) => (line.nameHindi && line.nameHindi !== line.name ? `${line.name} · ${line.nameHindi}` : line.name);
