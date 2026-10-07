"use client";
import React from 'react';
import { 
  DPR_STATUS, STATUS_LABELS, 
  SANCTION_STATUS, SANCTION_STATUS_LABELS, 
  MPR_STATUS, MPR_STATUS_LABELS 
} from '@/constants/status';
import { useT } from '@/contexts/LanguageContext';

const ALL_STATUS_LABELS = {
  ...STATUS_LABELS,
  ...SANCTION_STATUS_LABELS,
  ...MPR_STATUS_LABELS,
};

const STATUS_STYLES = {
  // DPR
  [DPR_STATUS.APPROVED]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [DPR_STATUS.REJECTED]: 'bg-red-100 text-red-800 border border-red-200',
  [DPR_STATUS.SUBMITTED]: 'bg-blue-100 text-blue-800 border border-blue-200',
  [DPR_STATUS.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  [DPR_STATUS.DRAFT]: 'bg-slate-100 text-slate-600 border border-slate-200',
  [DPR_STATUS.RESUBMITTED]: 'bg-purple-100 text-purple-800 border border-purple-200',

  // Sanction / Project
  [SANCTION_STATUS.DRAFT]: 'bg-slate-100 text-slate-600 border border-slate-200',
  [SANCTION_STATUS.PENDING_CHECKER]: 'bg-amber-100 text-amber-800 border border-amber-200',
  [SANCTION_STATUS.PENDING_APPROVER]: 'bg-orange-100 text-orange-800 border border-orange-200',
  [SANCTION_STATUS.SANCTIONED]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [SANCTION_STATUS.FORWARDED_TO_DISTRICT]: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  [SANCTION_STATUS.DISTRICT_ACCEPTED]: 'bg-teal-100 text-teal-800 border border-teal-200',
  [SANCTION_STATUS.FORWARDED_TO_PIA]: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  [SANCTION_STATUS.PIA_ACCEPTED]: 'bg-green-100 text-green-900 border border-green-300 font-semibold',
  [SANCTION_STATUS.REJECTED]: 'bg-red-100 text-red-800 border border-red-200',

  // MPR
  [MPR_STATUS.DRAFT]: 'bg-slate-100 text-slate-600 border border-slate-200',
  [MPR_STATUS.SUBMITTED]: 'bg-blue-100 text-blue-800 border border-blue-200',
  [MPR_STATUS.DISTRICT_APPROVED]: 'bg-teal-100 text-teal-800 border border-teal-200',
  [MPR_STATUS.STATE_VERIFIED]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [MPR_STATUS.RETURNED_TO_PIA]: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  [MPR_STATUS.REJECTED]: 'bg-red-100 text-red-800 border border-red-200',
};

export function Badge({ status, className = '', size = 'sm' }) {
  const t = useT();
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 border border-slate-200';
  const label = ALL_STATUS_LABELS[status] || status || '—';
  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${style} ${className}`}>
      {t(label)}
    </span>
  );
}
