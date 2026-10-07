"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Eye, IndianRupee, Lock } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { commitAllocation, fetchBudgetState, fetchEligibleProjects, previewAllocation } from '@/lib/budgetApi';
import { formatLakh, lakhToRupees } from '@/lib/numeric';
import { ActionButton, Field, Notice, RetryButton, Skeleton, SuccessTick, inputClass } from '@/components/projects/create/parts';
import { AllocationPreview } from './AllocationPreview';
import { AllocatedTick, InlineCheck, ProgressBar } from './BudgetStatus';
import { DepartmentAllocationCard } from './DepartmentAllocationCard';
import { buildPayload, emptyEntry, evaluateForm, isoDay, newRequestKey, todayIso } from './allocationForm';

const PROJECTS_ROUTE = '/dashboard/admin/projects';
const STALE_CODES = ['STALE_STATE', 'PROJECT_FULLY_ALLOCATED', 'DEPARTMENT_FULLY_ALLOCATED', 'INSTALLMENT_LIMIT_REACHED'];

function Card({ title, description, aside, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ReadOnlyField({ label, value, wide = false, mono = false }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-4' : ''}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 flex min-h-[2.5rem] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  );
}

function SummaryFigure({ label, value, sub, tone = 'default' }) {
  const tones = { default: 'text-slate-900', success: 'text-emerald-700', accent: 'text-navy' };
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${tones[tone]}`}>{value}</dd>
      {sub && <dd className="text-xs tabular-nums text-slate-400">{sub}</dd>}
    </div>
  );
}

const projectOption = (project) => ({
  id: project.id,
  name: `${project.projectId ? `${project.projectId} — ` : ''}${project.projectName}`,
  hint: `${project.district} · Remaining ${formatLakh(project.remainingBudget)} of ${formatLakh(project.totalBudget)}`,
});

/**
 * Budget allocation against an existing project.
 *
 * `lockedProjectId` — the project was chosen on the projects list and cannot
 * be changed here. Without it the user picks from the eligible projects.
 *
 * Budget figures always come from the backend (loaded on open, after every
 * save, and again whenever the backend says the position has moved); nothing
 * financial is kept in browser storage.
 */
export function BudgetAllocationWorkspace({ lockedProjectId, canAllocate }) {
  const [projectId, setProjectId] = useState(lockedProjectId || null);
  const [selectedOption, setSelectedOption] = useState(null);

  const [eligible, setEligible] = useState({ items: [], loading: !lockedProjectId, error: '' });
  const [stateBox, setStateBox] = useState({ state: null, loading: Boolean(lockedProjectId), error: '' });

  const [allocationDate, setAllocationDate] = useState(todayIso());
  const [entries, setEntries] = useState({});
  const [requestKey, setRequestKey] = useState(newRequestKey);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  const [validating, setValidating] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [plan, setPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [staleState, setStaleState] = useState(false);
  const [result, setResult] = useState(null);
  const submittingRef = useRef(false);
  const topRef = useRef(null);

  const { state } = stateBox;

  // ── Loading ────────────────────────────────────────────────────────────────
  const loadEligible = useCallback(() => {
    setEligible((current) => ({ ...current, loading: true, error: '' }));
    fetchEligibleProjects()
      .then((items) => setEligible({ items, loading: false, error: '' }))
      .catch((err) => setEligible({ items: [], loading: false, error: err?.message || 'Unable to load projects. Please try again.' }));
  }, []);

  useEffect(() => { if (!lockedProjectId) loadEligible(); }, [lockedProjectId, loadEligible]);

  const resetForm = useCallback(() => {
    setEntries({});
    setAllocationDate(todayIso());
    setRequestKey(newRequestKey());
    setShowErrors(false);
    setPlan(null);
    setPreviewError('');
    setSubmitError('');
    setStaleState(false);
  }, []);

  const loadState = useCallback((id) => {
    if (!id) { setStateBox({ state: null, loading: false, error: '' }); return; }
    setStateBox({ state: null, loading: true, error: '' });
    fetchBudgetState(id)
      .then((loaded) => setStateBox({ state: loaded, loading: false, error: '' }))
      .catch((err) => setStateBox({ state: null, loading: false, error: err?.message || 'Unable to load project. Please try again.' }));
  }, []);

  useEffect(() => { resetForm(); setResult(null); loadState(projectId); }, [projectId, loadState, resetForm]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const entryFor = useCallback((departmentId) => entries[departmentId] || emptyEntry(), [entries]);
  const allEntries = useMemo(() => {
    if (!state) return {};
    return Object.fromEntries(state.departments.map((department) => [department.departmentId, entryFor(department.departmentId)]));
  }, [state, entryFor]);
  const form = useMemo(() => (state ? evaluateForm(state, allEntries, allocationDate) : null), [state, allEntries, allocationDate]);

  // After a save the screen shows the new position read-only until the user starts the next release.
  const editable = Boolean(state?.eligible && canAllocate && !result);
  const hasInput = Object.values(entries).some((entry) => entry.amount || entry.document);

  useEffect(() => {
    if (!hasInput || result) return undefined;
    const onBeforeUnload = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasInput, result]);

  const updateEntry = (departmentId, patch) => {
    setEntries((current) => ({ ...current, [departmentId]: { ...(current[departmentId] || emptyEntry()), ...patch } }));
    setPreviewError('');
  };

  const documentUseCount = (documentId) => Object.values(entries).filter((entry) => entry.document?.documentId === documentId).length;

  const applyDocumentToAll = (sourceId) => {
    const document = entries[sourceId]?.document;
    if (!document) return;
    setEntries((current) => {
      const next = { ...current };
      state.departments.forEach((department, index) => {
        const id = department.departmentId;
        if (id !== sourceId && form.evaluations[index].active && !next[id]?.document) next[id] = { ...(next[id] || emptyEntry()), document };
      });
      return next;
    });
  };

  // ── Preview / Proceed ──────────────────────────────────────────────────────
  const disabledReason = !form ? '' : uploadsInProgress > 0 ? 'Wait for the PDF upload to finish.' : '';

  const openPreview = async () => {
    setShowErrors(true);
    setPreviewError('');
    if (form.blockReason) { setPreviewError(form.blockReason); return; }
    setValidating(true);
    try {
      // The backend validates the request and returns the figures it will save.
      setPlan(await previewAllocation(projectId, buildPayload(state, allEntries, allocationDate, requestKey)));
      setSubmitError('');
      setStaleState(false);
    } catch (err) {
      setPreviewError(err?.message || 'Unable to validate the allocation. Please try again.');
      if (STALE_CODES.includes(err?.code)) setStaleState(true);
    } finally {
      setValidating(false);
    }
  };

  const proceed = async () => {
    if (submittingRef.current) return; // double click
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      // Same key on every retry of this form: the backend saves it at most once.
      const saved = await commitAllocation(projectId, buildPayload(state, allEntries, allocationDate, requestKey));
      setPlan(null);
      setResult(saved);
      setStateBox({ state: saved.state, loading: false, error: '' });
      setEntries({});
      setRequestKey(newRequestKey());
      setShowErrors(false);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setSubmitError(err?.message || 'Unable to save the allocation. Please try again.');
      if (STALE_CODES.includes(err?.code)) setStaleState(true);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const reloadLatest = () => { resetForm(); loadState(projectId); if (!lockedProjectId) loadEligible(); };

  const changeProject = (option) => {
    setSelectedOption(option);
    setProjectId(option ? option.id : null);
  };

  const allocateNext = () => { setResult(null); resetForm(); if (!lockedProjectId) loadEligible(); };

  // ── Render ─────────────────────────────────────────────────────────────────
  const fully = state?.totals.status === 'FULLY_ALLOCATED';
  const minDate = state && form
    ? state.departments.reduce((latest, department, index) => {
      const day = isoDay(department.lastAllocationDate);
      return form.evaluations[index].active && day > latest ? day : latest;
    }, '2000-01-01')
    : '2000-01-01';

  return (
    <div ref={topRef} className="mx-auto max-w-6xl scroll-mt-28 p-4 pb-16 sm:p-6">
      {/* Page header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={PROJECTS_ROUTE}
            aria-label="Back to projects"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true">
            <IndianRupee className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Budget Allocation</h1>
            <p className="text-sm text-slate-500">Release project budget to departments in installments. All amounts are in ₹ Lakh.</p>
          </div>
        </div>
        {state && (
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold
              ${fully ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'}`}
          >
            {fully ? <><AllocatedTick className="h-3.5 w-3.5" /> Budget Fully Allocated</> : `${state.totals.percentAllocated}% of project budget allocated`}
          </span>
        )}
      </div>

      <div className="space-y-5">
        {!canAllocate && (
          <Notice tone="info" title="View only">Only a State Maker can allocate budget. You can review the current position.</Notice>
        )}

        {/* Success */}
        {result && state && (
          <section className="wz-fade-in rounded-xl border border-emerald-200 bg-emerald-50/60 px-6 py-6" role="status">
            <div className="flex flex-wrap items-center gap-5">
              <SuccessTick size={56} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {result.alreadyProcessed ? 'This allocation was already saved' : 'Budget Allocated Successfully'}
                </h2>
                <p className="mt-0.5 text-sm text-slate-700">
                  {formatLakh(result.batch.totalAmountLakh)} released to {result.batch.entryCount} department{result.batch.entryCount === 1 ? '' : 's'} for {state.project.code || state.project.projectName}.
                  {' '}Project position: {formatLakh(state.totals.releasedLakh)} / {formatLakh(state.totals.totalBudgetLakh)}.
                </p>
                {fully && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                    <AllocatedTick className="h-4 w-4" /> Budget Fully Allocated — no further allocation is possible for this project.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {state.eligible && canAllocate && <ActionButton variant="secondary" onClick={allocateNext}>Allocate Another Installment</ActionButton>}
                <Link
                  href={PROJECTS_ROUTE}
                  className="inline-flex items-center justify-center rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2"
                >
                  Back to Projects
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Project */}
        <Card
          title="Project Information"
          description={lockedProjectId ? 'Selected from the projects list. Project details cannot be changed here.' : 'Choose a project whose budget is not yet fully allocated.'}
          aside={lockedProjectId && <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"><Lock className="h-3 w-3" aria-hidden="true" /> Project locked</span>}
        >
          {!lockedProjectId && (
            <div className="mb-5 max-w-2xl">
              <Field id="budget-project" label="Select Project" required error={!eligible.loading ? eligible.error : ''}>
                <SearchableSelect
                  id="budget-project"
                  noun="project"
                  value={selectedOption}
                  options={eligible.items.map(projectOption)}
                  onChange={changeProject}
                  placeholder={eligible.loading ? 'Loading projects…' : 'Select project'}
                  searchPlaceholder="Search by Project ID, name or district…"
                  loading={eligible.loading}
                  error={eligible.error}
                  onRetry={loadEligible}
                  disabled={submitting || validating}
                />
              </Field>
              {!eligible.loading && !eligible.error && eligible.items.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">No approved project is waiting for budget allocation.</p>
              )}
            </div>
          )}

          {stateBox.loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading project">
              <Skeleton className="h-16 sm:col-span-2 lg:col-span-4" />
              {[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-16" />)}
            </div>
          )}

          {!stateBox.loading && stateBox.error && (
            <Notice tone="error" title="Unable to load project." action={<RetryButton onClick={() => loadState(projectId)} />}>{stateBox.error}</Notice>
          )}

          {!stateBox.loading && !stateBox.error && !state && !lockedProjectId && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
              Select a project to see its departments and budget position.
            </p>
          )}

          {state && (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ReadOnlyField wide label="Project Name / Unique ID" value={`${state.project.projectName}${state.project.code ? ` — ${state.project.code}` : ''}`} />
              <ReadOnlyField label="District" value={state.project.district} />
              <ReadOnlyField label="Block" value={state.project.block} />
              <ReadOnlyField label="Gram Panchayat" value={state.project.gramPanchayat} />
              <ReadOnlyField label="Village" value={state.project.village} />
            </dl>
          )}
        </Card>

        {state && (
          <>
            {!state.eligible && !result && (
              <Notice tone={fully ? 'success' : 'warning'} title={fully ? 'Budget Fully Allocated' : 'Budget cannot be allocated yet'}>
                {state.ineligibleReason}
              </Notice>
            )}

            {/* Department budget (read-only, from the project) */}
            <Card title="Department Budget" description="From the approved project. These figures cannot be changed during budget allocation.">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th scope="col" className="px-4 py-3">Department</th>
                      <th scope="col" className="px-4 py-3 text-right">Department Share</th>
                      <th scope="col" className="px-4 py-3 text-right">SARRA Share</th>
                      <th scope="col" className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.departments.map((department) => (
                      <tr key={department.departmentId}>
                        <th scope="row" className="px-4 py-3 text-left font-medium text-slate-900">{department.name}</th>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatLakh(department.deptShareLakh)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatLakh(department.sarraShareLakh)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatLakh(department.totalLakh)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                      <th scope="row" className="px-4 py-3 text-left">Total Project Budget</th>
                      <td className="px-4 py-3 text-right tabular-nums">{formatLakh(state.departments.reduce((s, d) => s + d.deptShareLakh, 0))}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatLakh(state.departments.reduce((s, d) => s + d.sarraShareLakh, 0))}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatLakh(state.totals.totalBudgetLakh)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {/* Installments */}
            <Card
              title="Installment Allocation"
              description={`Each department's budget can be released in up to ${state.rules.maxInstallments} installments. Leave a department blank to skip it in this release.`}
            >
              {editable && (
                <div className="mb-5 max-w-xs">
                  <Field id="allocation-date" label="Budget Allocation Date" required error={showErrors || allocationDate ? form.dateError : ''}>
                    <input
                      id="allocation-date"
                      type="date"
                      value={allocationDate}
                      min={minDate}
                      max={todayIso()}
                      onChange={(event) => { setAllocationDate(event.target.value); setPreviewError(''); }}
                      aria-required="true"
                      aria-invalid={Boolean(form.dateError && (showErrors || allocationDate)) || undefined}
                      aria-describedby={form.dateError ? 'allocation-date-error' : undefined}
                      className={inputClass(Boolean(form.dateError && (showErrors || allocationDate)))}
                    />
                  </Field>
                </div>
              )}

              <div className="space-y-4">
                {state.departments.map((department, index) => {
                  const entry = entryFor(department.departmentId);
                  const othersNeedDocument = state.departments.some((other, otherIndex) => (
                    other.departmentId !== department.departmentId && form.evaluations[otherIndex].active && !entryFor(other.departmentId).document
                  ));
                  return (
                    <DepartmentAllocationCard
                      key={department.departmentId}
                      department={department}
                      entry={entry}
                      evaluation={form.evaluations[index]}
                      rules={state.rules}
                      projectId={projectId}
                      readOnly={!editable}
                      showErrors={showErrors}
                      onChange={(patch) => updateEntry(department.departmentId, patch)}
                      onBusyChange={(busy) => setUploadsInProgress((count) => Math.max(0, count + (busy ? 1 : -1)))}
                      canShareDocument={othersNeedDocument}
                      documentShared={entry.document ? documentUseCount(entry.document.documentId) > 1 : false}
                      onApplyDocumentToAll={() => applyDocumentToAll(department.departmentId)}
                    />
                  );
                })}
              </div>
            </Card>

            {/* Summary */}
            <Card title="Summary" description="Totals are calculated automatically and confirmed by the server before saving.">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
                <SummaryFigure label="Total Project Budget" value={formatLakh(state.totals.totalBudgetLakh)} sub={lakhToRupees(state.totals.totalBudgetLakh)} />
                <SummaryFigure label="Total Released" value={formatLakh(form.totals.releasedAfterLakh)} sub={form.totals.thisReleaseLakh > 0 ? `Includes ${formatLakh(form.totals.thisReleaseLakh)} in this release` : 'Released so far'} tone={form.totals.remainingAfterLakh === 0 ? 'success' : 'default'} />
                <SummaryFigure label="This Release" value={formatLakh(form.totals.thisReleaseLakh)} sub={`${form.activeCount} department${form.activeCount === 1 ? '' : 's'}`} tone="accent" />
                <SummaryFigure label="Remaining Project Budget" value={formatLakh(form.totals.remainingAfterLakh)} tone={form.totals.remainingAfterLakh === 0 ? 'success' : 'default'} />
              </dl>
              <div className="mt-4">
                <ProgressBar percent={state.totals.percentAllocated} pendingPercent={form.totals.pendingPercent} complete={fully} label="Project budget allocated" />
              </div>

              <h3 className="mt-6 text-sm font-semibold text-slate-800">Department-wise completion</h3>
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {state.departments.map((department, index) => {
                  const evaluation = form.evaluations[index];
                  const complete = evaluation.remainingAfterLakh === 0 && department.budgetLakh > 0;
                  return (
                    <li key={department.departmentId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="font-medium text-slate-800">{department.name}</span>
                      <span className={`flex items-center gap-2 tabular-nums ${complete ? 'font-semibold text-emerald-700' : 'text-slate-700'}`}>
                        {formatLakh(evaluation.releasedAfterLakh)} / {formatLakh(department.budgetLakh)}
                        {complete && <InlineCheck />}
                        {evaluation.thisReleaseLakh > 0 && <span className="rounded bg-navy/10 px-1.5 py-0.5 text-[11px] font-semibold text-navy">+{formatLakh(evaluation.thisReleaseLakh)} now</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Actions */}
            {editable && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={PROJECTS_ROUTE}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2"
                >
                  Cancel
                </Link>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  {previewError && (
                    <p role="alert" className="wz-fade-in max-w-xl text-right text-sm font-medium text-red-700">
                      {previewError}
                      {staleState && (
                        <button type="button" onClick={reloadLatest} className="ml-2 font-semibold text-navy underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">Reload latest position</button>
                      )}
                    </p>
                  )}
                  <ActionButton
                    size="lg"
                    icon={Eye}
                    loading={validating}
                    disabled={Boolean(disabledReason)}
                    disabledReason={disabledReason}
                    onClick={openPreview}
                  >
                    {validating ? 'Validating…' : uploadsInProgress > 0 ? 'Uploading PDF…' : 'Preview'}
                  </ActionButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {state && (
        <AllocationPreview
          open={Boolean(plan)}
          plan={plan}
          state={state}
          submitting={submitting}
          error={submitError}
          staleState={staleState}
          onBack={() => { setPlan(null); setSubmitError(''); }}
          onProceed={proceed}
          onReload={reloadLatest}
        />
      )}
    </div>
  );
}
