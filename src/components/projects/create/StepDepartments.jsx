"use client";
import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { createDepartment, fetchDepartments } from '@/lib/projectApi';
import { AddMasterDialog } from './AddMasterDialog';
import { ActionButton, Field, Notice, RetryButton, StepCard, inputClass, useMasterList } from './parts';
import { PIA_OPTIONS, countEnteredActivities, departmentTotal } from './wizardState';

const rowHasData = (row) => Boolean(row.department) || departmentTotal(row) > 0 || countEnteredActivities(row) > 0;

/** Step 3 — Number of PIA and one department per PIA. */
export function StepDepartments({ state, dispatch, errors, showErrors }) {
  const departments = useMasterList(fetchDepartments, 'departments');
  const [addConfig, setAddConfig] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);

  const selectedElsewhere = (index) => new Set(
    state.departments.filter((row, i) => i !== index && row.department).map((row) => row.department.id),
  );

  const changeCount = (count) => {
    // Reducing the count removes the last departments: confirm if that loses data.
    const removed = count ? state.departments.slice(count) : state.departments;
    if (removed.some(rowHasData)) setPendingCount(count);
    else dispatch({ type: 'SET_PIA_COUNT', count });
  };

  const removedNames = pendingCount === null ? [] : state.departments
    .slice(pendingCount || 0)
    .map((row, i) => row.department?.name || `Department ${(pendingCount || 0) + i + 1}`);

  const openAdd = (index, initialName) => setAddConfig({
    noun: 'Department',
    index,
    initialName,
    existing: departments.items,
    create: (name) => createDepartment(name),
  });

  return (
    <StepCard
      step={3}
      title="PIA Departments"
      description="Choose how many Project Implementing Agencies (PIA) take part, then select one department for each."
    >
      <div className="max-w-xs">
        <Field id="pia-count" label="Number of PIA" required error={showErrors ? errors.piaCount : ''}>
          <select
            id="pia-count"
            value={state.piaCount || ''}
            onChange={(event) => changeCount(event.target.value ? Number(event.target.value) : null)}
            aria-required="true"
            aria-invalid={Boolean(showErrors && errors.piaCount) || undefined}
            className={`${inputClass(Boolean(showErrors && errors.piaCount))} ${state.piaCount ? '' : 'text-slate-400'}`}
          >
            <option value="">Select number of PIA</option>
            {PIA_OPTIONS.map((count) => <option key={count} value={count} className="text-slate-900">{count}</option>)}
          </select>
        </Field>
      </div>

      {departments.error && !departments.loading && (
        <div className="mt-5">
          <Notice tone="error" action={<RetryButton onClick={departments.reload} />}>{departments.error}</Notice>
        </div>
      )}

      {state.piaCount ? (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Departments</h3>
            <p className="text-xs text-slate-500">
              {state.departments.filter((row) => row.department).length} of {state.piaCount} selected · each department can be used once
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            {state.departments.map((row, index) => {
              const id = `department-${index}`;
              const error = (showErrors || row.department) ? errors.rows?.[index] : '';
              const taken = selectedElsewhere(index);
              return (
                <div key={row.key} className="wz-fade-in">
                  <Field id={id} label={`Department ${index + 1}`} required error={error}>
                    <SearchableSelect
                      id={id}
                      noun="department"
                      value={row.department}
                      options={departments.items}
                      onChange={(value) => dispatch({ type: 'SET_DEPARTMENT', index, value: value ? { id: value.id, name: value.name } : null })}
                      placeholder="Select department"
                      searchPlaceholder="Search department…"
                      loading={departments.loading}
                      error={departments.error}
                      onRetry={departments.reload}
                      invalid={Boolean(error)}
                      isOptionDisabled={(option) => taken.has(option.id)}
                      onCreate={(name) => openAdd(index, name)}
                      aria-describedby={error ? `${id}-error` : undefined}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
          Select the number of PIA to choose departments.
        </p>
      )}

      <AddMasterDialog
        config={addConfig}
        onClose={() => setAddConfig(null)}
        onCreated={(record) => {
          departments.reload();
          // If it turned out to exist and is already used in another row, leave this row empty.
          if (!selectedElsewhere(addConfig.index).has(record.id)) {
            dispatch({ type: 'SET_DEPARTMENT', index: addConfig.index, value: { id: record.id, name: record.name } });
          }
        }}
      />

      <Dialog
        open={pendingCount !== null}
        onClose={() => setPendingCount(null)}
        title="Reduce the number of PIA?"
        size="sm"
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setPendingCount(null)}>Keep {state.departments.length} PIA</ActionButton>
            <ActionButton onClick={() => { dispatch({ type: 'SET_PIA_COUNT', count: pendingCount }); setPendingCount(null); }}>
              Remove and continue
            </ActionButton>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          This removes the following department{removedNames.length === 1 ? '' : 's'} together with any shares and activity targets already entered:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-medium text-slate-800">
          {removedNames.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}
        </ul>
      </Dialog>
    </StepCard>
  );
}
