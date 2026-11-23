"use client";
import React from 'react';
import Link from 'next/link';
import { CircleCheckBig, CircleX, Hourglass, Layers } from 'lucide-react';
import { CARD_COLORS } from '@/lib/cardColors';

/** Project Status groups (HQ): every project is pending, approved or rejected. */
export const PROJECT_GROUPS = [
  { key: '', label: 'Total Projects', sub: 'All projects in the State', icon: Layers, color: 'blue' },
  { key: 'PENDING', label: 'Pending Projects', sub: 'With the HQ Checker or Approver', icon: Hourglass, color: 'amber' },
  { key: 'APPROVED', label: 'Approved Projects', sub: 'Sanctioned, at any later step', icon: CircleCheckBig, color: 'green' },
  { key: 'REJECTED', label: 'Rejected Projects', sub: 'Returned to the HQ Maker', icon: CircleX, color: 'rose' },
];

/** Project stages in each group (closed projects count as approved). */
export const GROUP_STAGES = {
  PENDING: ['PENDING_CHECKER', 'PENDING_APPROVER'],
  APPROVED: ['SANCTIONED', 'FORWARDED_TO_DISTRICT', 'DISTRICT_ACCEPTED', 'DISTRICT_PENDING_CHECKER', 'DISTRICT_PENDING_APPROVER', 'FORWARDED_TO_PIA', 'PIA_ACCEPTED', 'CLOSED'],
  REJECTED: ['REJECTED'],
};

/** Group counts from the per-stage counts of the project list. */
export const groupCounts = (byStage = {}, total = 0) => {
  const sum = (stages) => stages.reduce((n, stage) => n + (byStage[stage] || 0), 0);
  return { '': total, PENDING: sum(GROUP_STAGES.PENDING), APPROVED: sum(GROUP_STAGES.APPROVED), REJECTED: sum(GROUP_STAGES.REJECTED) };
};

/**
 * Total / Pending / Approved / Rejected projects, each in its own colour.
 * With `onSelect` the boxes filter the list (the selected one is outlined); with `hrefFor` they are links.
 */
export function ProjectOverview({ counts, selected, onSelect, hrefFor }) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {PROJECT_GROUPS.map(({ key, label, sub, icon: Icon, color }) => {
        const c = CARD_COLORS[color];
        const value = counts?.[key];
        const isSelected = onSelect && selected === key;
        const cls = `block h-full w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 ${c.card} ${isSelected ? 'ring-2 ring-offset-2 ring-navy' : ''}`;
        const body = (
          <>
            <span className="flex items-center gap-3">
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white shadow ${c.disc}`} aria-hidden="true"><Icon className="h-5 w-5" /></span>
              <span className={`text-base font-extrabold leading-tight ${c.label}`}>{label}</span>
            </span>
            <span className="mt-3 block text-4xl font-black tabular-nums text-slate-900">{value ?? '—'}</span>
            <span className="mt-1 block text-xs font-semibold text-slate-600">{sub}</span>
          </>
        );
        return (
          <li key={key || 'total'}>
            {onSelect
              ? <button type="button" aria-pressed={isSelected} onClick={() => onSelect(key)} className={cls}>{body}</button>
              : <Link href={hrefFor(key)} className={cls}>{body}</Link>}
          </li>
        );
      })}
    </ul>
  );
}
