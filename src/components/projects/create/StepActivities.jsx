"use client";
import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { NumericInput } from '@/components/ui/NumericInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { createDepartment, fetchDepartments, fetchHeadActivities } from '@/lib/projectApi';
import { formatIndian, formatLakh, lakhToRupees, sumMoney } from '@/lib/numeric';
import { AddMasterDialog } from './AddMasterDialog';
import { ActionButton, Field, FieldError, Notice, RetryButton, Skeleton, StepCard, useMasterList } from './parts';
import { MAX_PIA, MONEY_DECIMALS, departmentTotal, validateDepartmentActivities } from './wizardState';

function Stat({ label, value, sub, emphasis = false }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-0.5 truncate tabular-nums ${emphasis ? 'text-base font-bold text-slate-900' : 'text-sm font-semibold text-slate-800'}`}>{value}</dd>
      {sub && <dd className="truncate text-xs tabular-nums text-slate-400">{sub}</dd>}
    </div>
  );
}

/** "+ Add Department" while entering activities: department + its shares, existing entries untouched. */
function AddDepartmentDialog({ open, onClose, usedIds, onAdd }) {
  const departments = useMasterList(fetchDepartments, open ? 'departments' : null);
  const [department, setDepartment] = useState(null);
  const [deptShare, setDeptShare] = useState('');
  const [sarraShare, setSarraShare] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [addConfig, setAddConfig] = useState(null);

  const reset = () => { setDepartment(null); setDeptShare(''); setSarraShare(''); setAttempted(false); };
  const close = () => { reset(); onClose(); };

  const total = sumMoney([deptShare, sarraShare], MONEY_DECIMALS);
  const departmentError = !department ? 'Please select a department.' : '';
  const shareError = total <= 0 ? 'Enter a Department share or a SARRA share.' : '';

  const submit = (event) => {
    event.preventDefault();
    setAttempted(true);
    if (departmentError || shareError) return;
    onAdd({ department: { id: department.id, name: department.name }, deptShare, sarraShare });
    close();
  };

  return (
    <>
      <Dialog open={open && !addConfig} onClose={close} title="Add Department" description="Adds one more PIA to this project. Entries for the other departments are kept." size="md" allowOverflow>
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field id="extra-department" label="Department" required error={attempted ? departmentError : ''}>
            <SearchableSelect
              id="extra-department"
              noun="department"
              value={department}
              options={departments.items}
              onChange={setDepartment}
              placeholder="Select department"
              searchPlaceholder="Search department…"
              loading={departments.loading}
              error={departments.error}
              onRetry={departments.reload}
              invalid={Boolean(attempted && departmentError)}
              isOptionDisabled={(option) => usedIds.has(option.id)}
              optionDisabledLabel="Already in project"
              onCreate={(name) => setAddConfig({
                noun: 'Department', initialName: name, existing: departments.items, create: (value) => createDepartment(value),
              })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="extra-dept-share" label="Department Share">
              <NumericInput id="extra-dept-share" value={deptShare} onChange={setDeptShare} maxDecimals={MONEY_DECIMALS} formatOnBlur prefix="₹" suffix="Lakh" placeholder="0.00" invalid={Boolean(attempted && shareError)} />
            </Field>
            <Field id="extra-sarra-share" label="SARRA Share">
              <NumericInput id="extra-sarra-share" value={sarraShare} onChange={setSarraShare} maxDecimals={MONEY_DECIMALS} formatOnBlur prefix="₹" suffix="Lakh" placeholder="0.00" invalid={Boolean(attempted && shareError)} />
            </Field>
          </div>
          <FieldError message={attempted ? shareError : ''} />
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="font-medium text-slate-600">Total</span>
            <span className="font-bold tabular-nums text-slate-900">{formatLakh(total)}</span>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <ActionButton variant="secondary" onClick={close}>Cancel</ActionButton>
            <ActionButton type="submit" icon={Plus}>Add Department</ActionButton>
          </div>
        </form>
      </Dialog>
      <AddMasterDialog
        config={addConfig}
        onClose={() => setAddConfig(null)}
        onCreated={(record) => {
          departments.reload();
          if (!usedIds.has(record.id)) setDepartment({ id: record.id, name: record.name });
        }}
      />
    </>
  );
}

/** Step 5 — Activity targets, one department at a time, for the selected Head. */
export function StepActivities({ state, dispatch, onBack, onComplete }) {
  const activities = useMasterList(() => fetchHeadActivities(state.head.id), state.head ? state.head.id : null);
  const [direction, setDirection] = useState('forward');
  const [attempted, setAttempted] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const topRef = useRef(null);

  const count = state.departments.length;
  const active = Math.min(state.activeDepartment, count - 1);
  const row = state.departments[active];
  const checks = state.departments.map(validateDepartmentActivities);
  const check = checks[active];
  const completed = checks.filter((item) => !item.error).length;
  const isLast = active === count - 1;
  const nextName = !isLast ? (state.departments[active + 1].department?.name || `Department ${active + 2}`) : '';
  const prevName = active > 0 ? (state.departments[active - 1].department?.name || `Department ${active}`) : '';
  const departmentName = row.department?.name || `Department ${active + 1}`;
  const showError = attempted[row.key] || (check.error && check.entered > 0);

  const goTo = (index) => {
    if (index === active) return;
    setDirection(index > active ? 'forward' : 'back');
    dispatch({ type: 'SET_ACTIVE_DEPARTMENT', index });
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const next = () => {
    if (check.error) { setAttempted((current) => ({ ...current, [row.key]: true })); return; }
    if (!isLast) { goTo(active + 1); return; }
    // Leaving the last department: every department must be complete.
    const firstInvalid = checks.findIndex((item) => item.error);
    if (firstInvalid >= 0) {
      setAttempted((current) => ({ ...current, [state.departments[firstInvalid].key]: true }));
      goTo(firstInvalid);
      return;
    }
    onComplete();
  };

  const setActivity = (code, field, value) => dispatch({ type: 'SET_ACTIVITY', index: active, code, field, value });
  const usedIds = new Set(state.departments.filter((item) => item.department).map((item) => item.department.id));
  const over = check.remaining < 0;

  return (
    <StepCard
      step={5}
      title="Department-wise Activities"
      description="Enter the physical and financial targets for each department. Activities and units come from the selected Head."
      aside={state.mode === 'revise' ? (
        <span className="text-xs text-slate-400">Departments cannot be added by a revision</span>
      ) : count < MAX_PIA ? (
        <ActionButton variant="secondary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add Department</ActionButton>
      ) : (
        <span className="text-xs text-slate-400">Maximum of {MAX_PIA} departments reached</span>
      )}
    >
      <div ref={topRef} className="scroll-mt-28">
        {/* Progress */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            Department {active + 1} of {count}
          </p>
          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Departments completed"
              aria-valuemin={0}
              aria-valuemax={count}
              aria-valuenow={completed}
              className="h-2 w-40 overflow-hidden rounded-full bg-slate-100"
            >
              <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${(completed / count) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-600">{completed} / {count} Departments Completed</span>
          </div>
        </div>

        {/* Department navigation */}
        <div role="tablist" aria-label="Departments" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {state.departments.map((item, index) => {
            const done = !checks[index].error;
            const current = index === active;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`dept-tab-${index}`}
                aria-selected={current}
                aria-controls="dept-panel"
                onClick={() => goTo(index)}
                className={`inline-flex flex-shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
                  ${current ? 'border-navy bg-navy text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-emerald-600 text-white' : current ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : index + 1}
                </span>
                <span className="max-w-[12rem] truncate">{item.department?.name || `Department ${index + 1}`}</span>
                <span className="sr-only">{done ? '(completed)' : '(not completed)'}</span>
              </button>
            );
          })}
        </div>

        {/* Active department */}
        <div
          key={row.key}
          id="dept-panel"
          role="tabpanel"
          aria-labelledby={`dept-tab-${active}`}
          className={`mt-5 ${direction === 'forward' ? 'wz-slide-from-right' : 'wz-slide-from-left'}`}
        >
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">{departmentName}</h3>
              <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs">
                <span className="text-slate-500">Head</span>
                <span className="font-mono font-bold text-slate-800">{state.head?.code}</span>
                <span className="font-semibold text-slate-800">{state.head?.name}</span>
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Department Share" value={formatLakh(row.deptShare)} />
              <Stat label="SARRA Share" value={formatLakh(row.sarraShare)} />
              <Stat label="Total Allocation" value={formatLakh(departmentTotal(row))} sub={lakhToRupees(departmentTotal(row))} emphasis />
              <Stat label="Activities Entered" value={`${check.entered} of ${activities.items.length || '—'}`} />
            </dl>
          </div>

          {activities.loading && (
            <div className="mt-4 space-y-2" role="status" aria-label="Loading activities">
              {Array.from({ length: 7 }, (_, n) => <Skeleton key={n} className="h-11" />)}
            </div>
          )}

          {!activities.loading && activities.error && (
            <div className="mt-4"><Notice tone="error" action={<RetryButton onClick={activities.reload} />}>{activities.error}</Notice></div>
          )}

          {!activities.loading && !activities.error && activities.items.length === 0 && (
            <div className="mt-4"><Notice tone="warning">No activities are configured for Head {state.head?.code}. Please contact the system administrator.</Notice></div>
          )}

          {!activities.loading && !activities.error && activities.items.length > 0 && (
            <>
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[720px] text-sm">
                  <caption className="sr-only">Activity targets for {departmentName}</caption>
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th scope="col" className="w-12 px-4 py-3">#</th>
                      <th scope="col" className="px-4 py-3">Name of Activity</th>
                      <th scope="col" className="w-24 px-4 py-3">Unit</th>
                      <th scope="col" className="w-40 px-4 py-3 text-right">Physical Target</th>
                      <th scope="col" className="w-48 px-4 py-3 text-right">Financial Target (₹ Lakh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activities.items.map((activity, index) => {
                      const entry = row.activities[activity.code] || { physical: '', financial: '' };
                      const filled = Number(entry.physical) > 0 || Number(entry.financial) > 0;
                      return (
                        <tr key={activity.code} className={`transition-colors duration-150 ${filled ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}`}>
                          <td className="px-4 py-2.5 tabular-nums text-slate-400">{index + 1}</td>
                          <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-800">
                            {activity.name}
                            <span className="ml-2 font-mono text-[11px] font-normal text-slate-400">{activity.code}</span>
                          </th>
                          <td className="px-4 py-2.5 text-slate-600">{activity.unit || '—'}</td>
                          <td className="px-4 py-1.5">
                            {activity.hasPhysical ? (
                              <NumericInput
                                aria-label={`${activity.name}: physical target in ${activity.unit || 'units'}`}
                                value={entry.physical}
                                onChange={(value) => setActivity(activity.code, 'physical', value)}
                                allowDecimal={activity.allowsDecimal}
                                maxDecimals={activity.allowsDecimal ? 3 : 0}
                                formatOnBlur
                                minDecimalsOnBlur={0}
                              />
                            ) : (
                              <p className="px-3 text-right text-xs text-slate-400" title="This activity has a financial target only">Not applicable</p>
                            )}
                          </td>
                          <td className="px-4 py-1.5">
                            <NumericInput
                              aria-label={`${activity.name}: financial target in lakh rupees`}
                              value={entry.financial}
                              onChange={(value) => setActivity(activity.code, 'financial', value)}
                              maxDecimals={MONEY_DECIMALS}
                              formatOnBlur
                              prefix="₹"
                              placeholder="0.00"
                              invalid={over && Number(entry.financial) > 0}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <dl className={`mt-4 grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-3 ${over ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-white'}`} aria-live="polite">
                <Stat label="Department Total (allocated)" value={formatLakh(check.allocated)} />
                <Stat label="Activity Financial Total" value={formatLakh(check.planned)} />
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-slate-500">{over ? 'Over allocation by' : 'Remaining to assign'}</dt>
                  <dd className={`mt-0.5 text-sm font-bold tabular-nums ${over ? 'text-red-700' : check.remaining === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {over ? '▲ ' : ''}₹ {formatIndian(Math.abs(check.remaining), { minDecimals: 2 })} Lakh
                  </dd>
                </div>
              </dl>

              <div className="mt-3 space-y-2">
                {showError && check.error && <Notice tone="error" title={check.error}>{over ? `Reduce the financial targets or increase ${departmentName}'s allocation in the Head & Allocation step.` : null}</Notice>}
                {!check.error && check.warning && <Notice tone="warning">{check.warning} You can still continue.</Notice>}
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <ActionButton variant="secondary" icon={ArrowLeft} onClick={() => (active > 0 ? goTo(active - 1) : onBack())}>
            {active > 0 ? `Previous: ${prevName}` : 'Back'}
          </ActionButton>
          <ActionButton
            size="lg"
            iconRight={ArrowRight}
            onClick={next}
            disabled={activities.loading || Boolean(activities.error) || activities.items.length === 0}
            disabledReason="Activities must load before you can continue"
          >
            {isLast ? 'Continue to Review' : `Next: ${nextName}`}
          </ActionButton>
        </div>
      </div>

      <AddDepartmentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        usedIds={usedIds}
        onAdd={(payload) => {
          dispatch({ type: 'ADD_DEPARTMENT', ...payload });
          setDirection('forward');
          dispatch({ type: 'SET_ACTIVE_DEPARTMENT', index: count });
        }}
      />
    </StepCard>
  );
}
