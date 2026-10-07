"use client";
import React, { useState } from 'react';
import { Field, FieldError, StepCard, inputClass } from './parts';
import { todayIso } from './wizardState';

const DATE_FIELDS = [
  { field: 'dlec', label: 'DLEC Approval Date', hint: 'District Level Executive Committee' },
  { field: 'slec', label: 'SLEC Approval Date', hint: 'State Level Executive Committee' },
  { field: 'hpc', label: 'HPC Approval Date', hint: 'High Powered Committee' },
];

/** Step 2 — Project name and committee approval dates. */
export function StepDetails({ state, dispatch, errors, showErrors }) {
  const { details } = state;
  const [touched, setTouched] = useState({});
  const today = todayIso();

  const set = (field, value) => dispatch({ type: 'SET_DETAIL', field, value });
  const touch = (field) => setTouched((current) => ({ ...current, [field]: true }));
  const errorFor = (field) => ((showErrors || touched[field]) ? errors[field] : '');

  // A committee cannot approve before the one below it: DLEC ≤ SLEC ≤ HPC.
  const minFor = { dlec: '2000-01-01', slec: details.dlec || '2000-01-01', hpc: details.slec || details.dlec || '2000-01-01' };
  const anyDateTouched = touched.dlec || touched.slec || touched.hpc;

  return (
    <StepCard
      step={2}
      title="Project Details"
      description={`${state.location.village?.name || ''}, ${state.location.gramPanchayat?.name || ''}, ${state.location.block?.name || ''}, ${state.location.district?.name || ''}`.replace(/^[, ]+|[, ]+$/g, '').replace(/(, )+/g, ', ')}
    >
      <div className="space-y-6">
        <Field id="project-name" label="Project Name" required error={errorFor('projectName')}>
          <input
            id="project-name"
            type="text"
            value={details.projectName}
            maxLength={200}
            autoComplete="off"
            onChange={(event) => set('projectName', event.target.value)}
            onBlur={() => touch('projectName')}
            placeholder="e.g. Springshed Development in Chakrata — Batch 1"
            aria-required="true"
            aria-invalid={Boolean(errorFor('projectName')) || undefined}
            aria-describedby={errorFor('projectName') ? 'project-name-error' : undefined}
            className={inputClass(Boolean(errorFor('projectName')))}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">Approval Dates</legend>
          <p className="mt-0.5 text-xs text-slate-500">
            Enter the dates that apply — at least one is required. Dates must follow the order DLEC → SLEC → HPC and cannot be in the future.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-3">
            {DATE_FIELDS.map(({ field, label, hint }) => {
              const id = `date-${field}`;
              const error = errorFor(field);
              return (
                <Field key={field} id={id} label={label} error={error} hint={hint}>
                  <input
                    id={id}
                    type="date"
                    value={details[field]}
                    min={minFor[field]}
                    max={today}
                    onChange={(event) => set(field, event.target.value)}
                    onBlur={() => touch(field)}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={error ? `${id}-error` : `${id}-hint`}
                    className={`${inputClass(Boolean(error))} ${details[field] ? '' : 'text-slate-400'}`}
                  />
                </Field>
              );
            })}
          </div>
          <FieldError id="dates-error" message={(showErrors || anyDateTouched) ? errors.dates : ''} />
        </fieldset>
      </div>
    </StepCard>
  );
}
