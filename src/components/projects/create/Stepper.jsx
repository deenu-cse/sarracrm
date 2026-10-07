"use client";
import React from 'react';
import { Check } from 'lucide-react';
import { STEPS } from './wizardState';

/**
 * Progress indicator: 01 Location → … → 06 Review.
 * Each step states its status in text as well as colour (Completed / Current /
 * Needs attention / Upcoming). Steps already reached can be reopened.
 */
export function Stepper({ current, furthest, validity, canOpen, onSelect }) {
  return (
    <nav aria-label="Project creation progress" className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
      <ol className="flex items-start overflow-x-auto pb-1">
        {STEPS.map((step, index) => {
          const isCurrent = index === current;
          const reached = index <= furthest;
          const valid = index < validity.length ? validity[index] : false;
          const completed = !isCurrent && reached && valid && index < current;
          const visitedValid = !isCurrent && reached && valid;
          const needsAttention = !isCurrent && reached && !valid && index < STEPS.length - 1;
          const openable = !isCurrent && reached && canOpen(index);
          const status = isCurrent ? 'Current step' : needsAttention ? 'Needs attention' : visitedValid ? 'Completed' : 'Upcoming';

          return (
            <li key={step.key} className="flex min-w-[7.5rem] flex-1 items-start last:flex-none sm:min-w-0">
              <button
                type="button"
                disabled={!openable}
                onClick={() => onSelect(index)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${index + 1} of ${STEPS.length}: ${step.label}. ${status}.`}
                className={`group flex flex-col items-start gap-2 rounded-lg p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${openable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums transition-colors duration-200
                    ${isCurrent ? 'border-navy bg-navy text-white shadow-sm'
                      : needsAttention ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : visitedValid ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-white text-slate-400'}
                    ${openable ? 'group-hover:shadow-md' : ''}`}
                >
                  {visitedValid ? <Check className="h-4 w-4" aria-hidden="true" /> : String(index + 1).padStart(2, '0')}
                </span>
                <span className="pr-3">
                  <span className={`block whitespace-nowrap text-sm font-semibold ${isCurrent ? 'text-navy' : reached ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  <span className={`block text-[11px] font-medium ${isCurrent ? 'text-navy/80' : needsAttention ? 'text-amber-700' : visitedValid ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {isCurrent ? 'In progress' : needsAttention ? 'Needs attention' : visitedValid ? 'Completed' : 'Upcoming'}
                  </span>
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <span aria-hidden="true" className="mt-5 h-0.5 min-w-[1.5rem] flex-1 rounded-full bg-slate-200">
                  <span className={`block h-full rounded-full bg-emerald-600 transition-[width] duration-300 ${completed || (visitedValid && index < furthest) ? 'w-full' : 'w-0'}`} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
