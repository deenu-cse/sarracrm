"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatLakh } from '@/lib/numeric';
import { ProgressBar } from '@/components/projects/budget/BudgetStatus';
import { useT } from '@/contexts/LanguageContext';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Row of status filter buttons shared by the report lists. */
export function StatusFilter({ filters, value, onChange }) {
  const t = useT();
  return (
    <div role="tablist" aria-label="Filter reports by status" className="flex gap-1.5 overflow-x-auto">
      {filters.map((filter) => (
        <button
          key={filter.value || 'all'}
          type="button"
          role="tab"
          aria-selected={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
            ${value === filter.value ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
        >
          {t(filter.label)}
        </button>
      ))}
    </div>
  );
}

/** Table of project Monthly Progress Reports (used on the PIA and district list screens). */
export function MprList({ reports, hrefFor, showSubmitter = false, actionLabel = 'Open' }) {
  const t = useT();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-5 py-2.5">{t('Report')}</th>
            <th scope="col" className="px-3 py-2.5">{t('Project')}</th>
            <th scope="col" className="px-3 py-2.5">{t('Department')}</th>
            <th scope="col" className="px-3 py-2.5 text-right">{t('Spent This Month')}</th>
            <th scope="col" className="w-40 px-3 py-2.5">{t('Financial Progress')}</th>
            <th scope="col" className="px-3 py-2.5">{t('Status')}</th>
            <th scope="col" className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {reports.map((report) => (
            <tr key={report.id} className="transition-colors hover:bg-slate-50/60">
              <th scope="row" className="px-5 py-3 text-left">
                <span className="block font-semibold text-slate-900">{report.period}</span>
                <span className="block font-mono text-xs font-normal text-slate-500">{report.mprNo} · Form {report.formType}</span>
              </th>
              <td className="px-3 py-3">
                <span className="block max-w-[16rem] truncate font-medium text-slate-800">{report.project.projectName}</span>
                <span className="block font-mono text-xs text-slate-500">{report.project.code}</span>
              </td>
              <td className="px-3 py-3 text-slate-700">
                {report.departmentName}
                {showSubmitter && <span className="block text-xs text-slate-400">{report.submittedBy?.name || '—'} · {formatDate(report.submittedAt)}</span>}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-slate-800">{formatLakh(report.totals?.financialCurrentLakh)}</td>
              <td className="px-3 py-3">
                <span className="text-xs font-semibold tabular-nums text-slate-700">{report.totals?.financialPercent ?? 0}%</span>
                <div className="mt-1"><ProgressBar percent={report.totals?.financialPercent} complete={report.totals?.financialPercent >= 100} label={`${report.departmentName} ${report.period}: financial progress`} /></div>
              </td>
              <td className="px-3 py-3"><Badge status={report.status} /></td>
              <td className="px-5 py-3 text-right">
                <Link href={hrefFor(report)} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                  {t(typeof actionLabel === 'function' ? actionLabel(report) : actionLabel)} {report.evidenceCount > 0 && <span className="sr-only">({report.evidenceCount} evidence files)</span>}<ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
