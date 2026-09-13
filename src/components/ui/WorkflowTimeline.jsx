"use client";
import React from 'react';
import { CheckCircle, XCircle, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

const ACTION_CONFIG = {
  CREATED: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'Project Created' },
  CHECKER_VERIFIED: { icon: CheckCircle, color: 'bg-teal-100 text-teal-700', label: 'Checker Verified' },
  APPROVED: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Approved & Sanctioned' },
  REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
  FORWARDED_TO_DISTRICT: { icon: ArrowRight, color: 'bg-cyan-100 text-cyan-700', label: 'Forwarded to District' },
  DISTRICT_ACCEPTED: { icon: UserCheck, color: 'bg-teal-100 text-teal-700', label: 'Accepted by District' },
  FORWARDED_TO_PIA: { icon: ArrowRight, color: 'bg-indigo-100 text-indigo-700', label: 'Assigned to PIA' },
  PIA_ACCEPTED: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'PIA Accepted — Active' },
  RETURNED: { icon: XCircle, color: 'bg-yellow-100 text-yellow-700', label: 'Returned for Correction' },
  SUBMITTED: { icon: ArrowRight, color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
  DISTRICT_APPROVED: { icon: CheckCircle, color: 'bg-teal-100 text-teal-700', label: 'District Approved' },
  STATE_VERIFIED: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'State Verified' },
};

export function WorkflowTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400 text-sm">No workflow history available.</div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />

      <ol className="space-y-4">
        {history.map((step, i) => {
          const cfg = ACTION_CONFIG[step.action] || {
            icon: Clock,
            color: 'bg-slate-100 text-slate-500',
            label: step.action,
          };
          const Icon = cfg.icon;

          return (
            <li key={i} className="relative flex gap-4 items-start pl-3">
              {/* Icon dot */}
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                    {step.performedBy && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        by {step.performedBy?.name || 'System'}
                      </p>
                    )}
                    {step.note && (
                      <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 rounded px-2 py-1 border border-slate-100">
                        "{step.note}"
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                    {formatDate(step.performedAt)}
                  </time>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
