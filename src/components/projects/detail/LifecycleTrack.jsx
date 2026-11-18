"use client";
import React from 'react';
import { Check, X } from 'lucide-react';
import { SANCTION_STATUS } from '@/constants/status';
import { formatMoment } from './shared';

const STAGES = [
  { key: 'created', label: 'HQ Maker: DPR entry', date: (p) => p.makerAt || p.createdAt },
  { key: 'checked', label: 'HQ Checker: verified', date: (p) => p.checkerAt },
  { key: 'sanctioned', label: 'HQ Approver: sanctioned', date: (p) => p.approverAt },
  { key: 'toDistrict', label: 'Forwarded to District', date: (p) => p.forwardedToDistrictAt },
  { key: 'districtAccepted', label: 'District Maker: accepted & PIA selected', date: (p) => p.districtAcceptedAt },
  { key: 'districtChecked', label: 'District Checker: verified', date: (p) => p.districtCheckedAt },
  { key: 'toPia', label: 'District Approver: PIA assigned', date: (p) => p.districtApprovedAt || p.piaForwardedAt },
  { key: 'active', label: 'Active: implementation', date: (p) => p.piaAcceptedAt },
];

// How many stages are complete for each status.
const COMPLETED = {
  [SANCTION_STATUS.DRAFT]: 0,
  [SANCTION_STATUS.PENDING_CHECKER]: 1,
  [SANCTION_STATUS.PENDING_APPROVER]: 2,
  [SANCTION_STATUS.SANCTIONED]: 3,
  [SANCTION_STATUS.FORWARDED_TO_DISTRICT]: 4,
  [SANCTION_STATUS.DISTRICT_ACCEPTED]: 4,
  [SANCTION_STATUS.DISTRICT_PENDING_CHECKER]: 5,
  [SANCTION_STATUS.DISTRICT_PENDING_APPROVER]: 6,
  [SANCTION_STATUS.FORWARDED_TO_PIA]: 7,
  [SANCTION_STATUS.PIA_ACCEPTED]: 8,
};

/**
 * Where the project is in its life: HQ Maker → HQ Checker → HQ Approver →
 * District → PIA → Active. State is given in text as well as colour.
 */
export function LifecycleTrack({ project }) {
  // Stored as REJECTED: returned to the HQ Maker with an objection.
  const rejected = project.status === SANCTION_STATUS.REJECTED;
  // A returned project stopped after whichever review stages it had passed.
  const completed = rejected ? (project.checkerAt ? 2 : 1) : (COMPLETED[project.status] ?? 0);

  return (
    <nav aria-label="Project lifecycle" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
      <ol className="grid min-w-[880px] gap-2" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` }}>
        {STAGES.map((stage, index) => {
          const done = index < completed;
          const current = index === completed;
          const failed = rejected && current;
          const state = failed ? 'Returned to Maker' : done ? 'Completed' : current ? 'Pending' : 'Upcoming';
          const date = done ? stage.date(project) : failed ? project.rejectedAt : null;

          return (
            <li key={stage.key} className="min-w-0" aria-current={current && !failed ? 'step' : undefined}>
              <div className="flex items-center">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold tabular-nums transition-colors duration-200
                    ${failed ? 'border-red-600 bg-red-600 text-white'
                      : done ? 'border-emerald-600 bg-emerald-600 text-white'
                      : current ? 'border-amber-500 bg-amber-50 text-amber-700 ring-4 ring-amber-200/60'
                      : 'border-slate-200 bg-white text-slate-400'}`}
                >
                  {failed ? <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : index + 1}
                </span>
                {index < STAGES.length - 1 && (
                  <span aria-hidden="true" className="mx-1.5 h-1 flex-1 rounded-full bg-slate-200">
                    <span className={`block h-full rounded-full bg-emerald-500 transition-[width] duration-500 ${done && !failed ? 'w-full' : 'w-0'}`} />
                  </span>
                )}
              </div>
              <span className={`mt-2 block pr-2 text-[12px] font-bold leading-tight ${failed ? 'text-red-700' : done ? 'text-slate-900' : current ? 'text-amber-800' : 'text-slate-400'}`}>
                {failed ? 'Returned to Maker' : stage.label}
              </span>
              <span className={`mt-0.5 block text-[11px] font-semibold ${failed ? 'text-red-600' : done ? 'text-emerald-700' : current ? 'text-amber-700' : 'text-slate-400'}`}>
                {date ? formatMoment(date) : state}
              </span>
              <span className="sr-only">{state}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
