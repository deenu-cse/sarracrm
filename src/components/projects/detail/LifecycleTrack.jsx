"use client";
import React from 'react';
import { Check, X } from 'lucide-react';
import { SANCTION_STATUS } from '@/constants/status';
import { formatMoment } from './shared';

const STAGES = [
  { key: 'created', label: 'Created', date: (p) => p.makerAt || p.createdAt },
  { key: 'checked', label: 'Checker Verified', date: (p) => p.checkerAt },
  { key: 'sanctioned', label: 'Sanctioned', date: (p) => p.approverAt },
  { key: 'toDistrict', label: 'Sent to District', date: (p) => p.forwardedToDistrictAt },
  { key: 'districtAccepted', label: 'District Accepted', date: (p) => p.districtAcceptedAt },
  { key: 'toPia', label: 'Assigned to PIA', date: (p) => p.piaForwardedAt },
  { key: 'active', label: 'Active', date: (p) => p.piaAcceptedAt },
];

// How many stages are complete for each status.
const COMPLETED = {
  [SANCTION_STATUS.DRAFT]: 0,
  [SANCTION_STATUS.PENDING_CHECKER]: 1,
  [SANCTION_STATUS.PENDING_APPROVER]: 2,
  [SANCTION_STATUS.SANCTIONED]: 3,
  [SANCTION_STATUS.FORWARDED_TO_DISTRICT]: 4,
  [SANCTION_STATUS.DISTRICT_ACCEPTED]: 5,
  [SANCTION_STATUS.FORWARDED_TO_PIA]: 6,
  [SANCTION_STATUS.PIA_ACCEPTED]: 7,
};

/**
 * Where the project is in its life: Created → Checker → Sanctioned → District → PIA → Active.
 * State is given in text as well as colour.
 */
export function LifecycleTrack({ project }) {
  const rejected = project.status === SANCTION_STATUS.REJECTED;
  // A rejected project stopped after whichever review stages it had passed.
  const completed = rejected ? (project.checkerAt ? 2 : 1) : (COMPLETED[project.status] ?? 0);

  return (
    <nav aria-label="Project lifecycle" className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
      <ol className="flex items-start overflow-x-auto pb-1">
        {STAGES.map((stage, index) => {
          const done = index < completed;
          const current = index === completed;
          const failed = rejected && current;
          const state = failed ? 'Rejected' : done ? 'Completed' : current ? 'Pending' : 'Upcoming';
          const date = done ? stage.date(project) : failed ? project.rejectedAt : null;

          return (
            <li key={stage.key} className="flex min-w-[7.75rem] flex-1 items-start last:flex-none sm:min-w-0" aria-current={current && !failed ? 'step' : undefined}>
              <div className="flex flex-col items-start gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold tabular-nums transition-colors duration-200
                    ${failed ? 'border-red-600 bg-red-600 text-white'
                      : done ? 'border-emerald-600 bg-emerald-600 text-white'
                      : current ? 'border-navy bg-white text-navy ring-4 ring-navy/10'
                      : 'border-slate-200 bg-white text-slate-400'}`}
                >
                  {failed ? <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : index + 1}
                </span>
                <span className="pr-3">
                  <span className={`block whitespace-nowrap text-xs font-semibold ${failed ? 'text-red-700' : done || current ? 'text-slate-900' : 'text-slate-400'}`}>
                    {failed ? 'Rejected' : stage.label}
                  </span>
                  <span className={`block whitespace-nowrap text-[11px] ${failed ? 'text-red-600' : done ? 'text-emerald-700' : current ? 'text-navy' : 'text-slate-400'}`}>
                    {date ? formatMoment(date) : state}
                  </span>
                  <span className="sr-only">{state}</span>
                </span>
              </div>
              {index < STAGES.length - 1 && (
                <span aria-hidden="true" className="mt-3.5 h-0.5 min-w-[1.25rem] flex-1 rounded-full bg-slate-200">
                  <span className={`block h-full rounded-full bg-emerald-600 transition-[width] duration-500 ${index < completed - 1 || (done && !rejected && index < completed) ? 'w-full' : 'w-0'}`} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
