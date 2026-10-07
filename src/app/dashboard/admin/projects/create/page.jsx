"use client";
import React, { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProjectForEdit } from '@/lib/projectApi';
import { ArrowLeft, ArrowRight, ChevronLeft, CircleCheck, CircleAlert, FolderPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog } from '@/components/ui/Dialog';
import { Stepper } from '@/components/projects/create/Stepper';
import { StepLocation } from '@/components/projects/create/StepLocation';
import { StepDetails } from '@/components/projects/create/StepDetails';
import { StepDepartments } from '@/components/projects/create/StepDepartments';
import { StepAllocation } from '@/components/projects/create/StepAllocation';
import { StepActivities } from '@/components/projects/create/StepActivities';
import { StepReview } from '@/components/projects/create/StepReview';
import { SuccessScreen } from '@/components/projects/create/SuccessScreen';
import { ActionButton, Notice, Skeleton } from '@/components/projects/create/parts';
import {
  FIRST_REVISION_STEP, STEPS, canOpenStep, clearDraft, createInitialState, hasEnteredData, loadDraft, saveDraft, stateFromProject, stepValidity,
  validateAllocation, validateDepartments, validateDetails, validateLocation, wizardReducer,
} from '@/components/projects/create/wizardState';

const PROJECTS_ROUTE = '/dashboard/admin/projects';
const STEP_VALIDATORS = [validateLocation, validateDetails, validateDepartments, validateAllocation];

const formatSavedAt = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const MODE_TITLES = { create: 'Create Project', resubmit: 'Correct & Resubmit Project', revise: 'Revise Project' };

/**
 * The project wizard. Three modes share the same steps and validation:
 *   create    a new project
 *   resubmit  correct a rejected project and send it back to the Checker
 *   revise    propose revised shares / targets for a sanctioned project
 */
function ProjectWizard({ mode, sourceId }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?._id || user?.id || null;

  const [state, dispatch] = useReducer(wizardReducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [restoredAt, setRestoredAt] = useState('');
  const [attemptedStep, setAttemptedStep] = useState(-1);
  const [direction, setDirection] = useState('forward');
  const [shakeNext, setShakeNext] = useState(false);
  const [createdProject, setCreatedProject] = useState(null);
  const [pendingHref, setPendingHref] = useState(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const editing = mode !== 'create';
  const backRoute = editing && sourceId ? `${PROJECTS_ROUTE}/${sourceId}` : PROJECTS_ROUTE;
  const stepRegionRef = useRef(null);
  const leavingRef = useRef(false);

  const validity = useMemo(() => stepValidity(state), [state]);
  const dirty = hydrated && !createdProject && hasEnteredData(state);

  // ── Draft: restore once the user is known, then keep it saved ──────────────
  useEffect(() => {
    if (authLoading || hydrated) return;
    if (editing) {
      // Existing project: always loaded fresh from the server, never from a browser draft.
      let current = true;
      fetchProjectForEdit(sourceId)
        .then((project) => {
          if (!current) return;
          const expected = mode === 'resubmit' ? project.status === 'REJECTED' : !['REJECTED', 'PENDING_CHECKER', 'PENDING_APPROVER', 'DRAFT'].includes(project.status);
          if (!expected) {
            setLoadError(mode === 'resubmit' ? 'Only a rejected project can be corrected and resubmitted.' : 'Only a sanctioned project can be revised.');
          } else if (!(project.departmentAllocations || []).length) {
            setLoadError('This older project has no department-wise budget and cannot be edited here.');
          } else {
            dispatch({ type: 'RESTORE', state: stateFromProject(project, mode) });
          }
          setHydrated(true);
        })
        .catch((err) => { if (current) { setLoadError(err?.message || 'Unable to load the project. Please try again.'); setHydrated(true); } });
      return () => { current = false; };
    }
    const draft = userId ? loadDraft(userId) : null;
    if (draft && hasEnteredData({ ...createInitialState(), ...draft })) {
      const restored = { ...createInitialState(), ...draft };
      // Never reopen on a step whose earlier steps are no longer valid.
      const firstInvalid = stepValidity(restored).findIndex((valid) => !valid);
      const maxStep = firstInvalid === -1 ? STEPS.length - 1 : firstInvalid;
      restored.step = Math.min(restored.step || 0, maxStep);
      restored.furthestStep = Math.max(restored.step, Math.min(restored.furthestStep || 0, STEPS.length - 1));
      dispatch({ type: 'RESTORE', state: restored });
      setRestoredAt(formatSavedAt(draft.savedAt));
    }
    setHydrated(true);
    return undefined;
  }, [authLoading, hydrated, userId, editing, mode, sourceId]);

  useEffect(() => {
    if (editing || !hydrated || !userId || createdProject) return undefined;
    if (!hasEnteredData(state)) return undefined;
    const timer = setTimeout(() => saveDraft(userId, state), 400);
    return () => clearTimeout(timer);
  }, [state, hydrated, userId, createdProject, editing]);

  // ── Guard against losing entered data ──────────────────────────────────────
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => { event.preventDefault(); event.returnValue = ''; };
    // In-app links (navbar, breadcrumb, back arrow) are intercepted before the router sees them.
    const onClickCapture = (event) => {
      if (leavingRef.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClickCapture, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, [dirty]);

  const leave = () => {
    leavingRef.current = true;
    const href = pendingHref;
    setPendingHref(null);
    router.push(href || backRoute);
  };

  // ── Step navigation ────────────────────────────────────────────────────────
  const goToStep = useCallback((target) => {
    setDirection(target > state.step ? 'forward' : 'back');
    setAttemptedStep(-1);
    dispatch({ type: 'GO_TO_STEP', step: target });
    requestAnimationFrame(() => {
      stepRegionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      stepRegionRef.current?.focus({ preventScroll: true });
    });
  }, [state.step]);

  const stepErrors = state.step < STEP_VALIDATORS.length ? STEP_VALIDATORS[state.step](state) : {};
  const showErrors = attemptedStep === state.step;

  const handleNext = () => {
    if (Object.keys(stepErrors).length > 0) {
      setAttemptedStep(state.step);
      setShakeNext(true);
      setTimeout(() => setShakeNext(false), 400);
      // Move focus to the first field that needs attention.
      requestAnimationFrame(() => {
        const invalid = stepRegionRef.current?.querySelector('[aria-invalid="true"]');
        if (invalid instanceof HTMLElement) invalid.focus();
      });
      return;
    }
    goToStep(state.step + 1);
  };

  const startFresh = () => {
    clearDraft(userId);
    dispatch({ type: 'RESET' });
    setRestoredAt('');
    setAttemptedStep(-1);
    setCreatedProject(null);
    setDiscardOpen(false);
    leavingRef.current = false;
  };

  const handleCreated = (project) => {
    if (!editing) clearDraft(userId);
    setCreatedProject(project);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (authLoading || !hydrated) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 p-6" role="status" aria-label="Loading project creation">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (user?.workflowRole !== 'MAKER') {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Notice tone="warning" title="You cannot create projects">
          Only a State Maker can create a project. Your account does not have the Maker role.
        </Notice>
        <Link href={PROJECTS_ROUTE} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to projects
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Notice tone="error" title="This project cannot be opened here">{loadError}</Notice>
        <Link href={backRoute} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to project
        </Link>
      </div>
    );
  }

  if (createdProject) {
    return (
      <div className="p-6 pt-12">
        <SuccessScreen project={createdProject} mode={mode} source={state.source} onCreateAnother={startFresh} />
      </div>
    );
  }

  const invalidReached = validity.filter((valid, index) => !valid && index <= state.furthestStep && index !== state.step).length;
  const allValid = validity.every(Boolean);
  const activeDepartment = state.departments[Math.min(state.activeDepartment, state.departments.length - 1)];
  const nextLabel = state.step < STEPS.length - 1 ? STEPS[state.step + 1].label : '';

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16 sm:p-6">
      {/* Page header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={backRoute}
            aria-label={editing ? 'Back to project' : 'Back to projects'}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true">
            <FolderPlus className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{MODE_TITLES[mode]}</h1>
            <p className="text-sm text-slate-500">
              Step {state.step + 1} of {STEPS.length} · {STEPS[state.step].label}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {state.head && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
              <span className="text-slate-500">Head</span>
              <span className="font-mono font-bold text-slate-800">{state.head.code}</span>
            </span>
          )}
          {state.step === 4 && activeDepartment?.department && (
            <span className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
              <span className="text-slate-500">Department</span>
              <span className="truncate font-semibold text-slate-800">{activeDepartment.department.name}</span>
            </span>
          )}
          {state.projectId && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
              <span className="text-emerald-700">Project ID</span>
              <span className="font-mono font-bold text-emerald-900">{state.projectId.projectId}</span>
            </span>
          )}
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-semibold
              ${allValid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : invalidReached ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {allValid ? <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
            {allValid
              ? (state.projectId ? 'Ready to create' : 'All steps complete — generate Project ID')
              : invalidReached
                ? `${invalidReached} step${invalidReached === 1 ? '' : 's'} need attention`
                : `${validity.filter(Boolean).length} of ${validity.length} steps complete`}
          </span>
        </div>
      </div>

      {restoredAt && (
        <div className="mb-4">
          <Notice
            tone="info"
            action={(
              <button
                type="button"
                onClick={() => setDiscardOpen(true)}
                className="flex-shrink-0 rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
              >
                Start fresh
              </button>
            )}
          >
            Your unfinished project from {restoredAt} has been restored. It is saved on this device as you type.
          </Notice>
        </div>
      )}

      <Stepper
        current={state.step}
        furthest={state.furthestStep}
        validity={validity}
        canOpen={(index) => canOpenStep(state, index)}
        onSelect={goToStep}
      />

      <div ref={stepRegionRef} tabIndex={-1} className="mt-5 scroll-mt-28 focus:outline-none">
        <div key={state.step} className={direction === 'forward' ? 'wz-slide-from-right' : 'wz-slide-from-left'}>
          {state.step === 0 && <StepLocation state={state} dispatch={dispatch} errors={stepErrors} showErrors={showErrors} />}
          {state.step === 1 && <StepDetails state={state} dispatch={dispatch} errors={stepErrors} showErrors={showErrors} />}
          {state.step === 2 && <StepDepartments state={state} dispatch={dispatch} errors={stepErrors} showErrors={showErrors} />}
          {state.step === 3 && <StepAllocation state={state} dispatch={dispatch} errors={stepErrors} showErrors={showErrors} />}
          {state.step === 4 && <StepActivities state={state} dispatch={dispatch} onBack={() => goToStep(3)} onComplete={() => goToStep(5)} />}
          {state.step === 5 && <StepReview state={state} dispatch={dispatch} onBack={() => goToStep(4)} onCreated={handleCreated} />}
        </div>
      </div>

      {/* Navigation for the form steps (Activities and Review bring their own) */}
      {state.step <= 3 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {state.step > (mode === 'revise' ? FIRST_REVISION_STEP : 0) ? (
            <ActionButton variant="secondary" icon={ArrowLeft} onClick={() => goToStep(state.step - 1)}>Back</ActionButton>
          ) : (
            <Link
              href={backRoute}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2"
            >
              Cancel
            </Link>
          )}
          <div className="flex items-center gap-4">
            {showErrors && Object.keys(stepErrors).length > 0 && (
              <p role="alert" className="wz-fade-in text-sm font-medium text-red-700">Please fix the highlighted fields to continue.</p>
            )}
            <ActionButton size="lg" iconRight={ArrowRight} onClick={handleNext} className={shakeNext ? 'wz-shake' : ''}>
              Next: {nextLabel}
            </ActionButton>
          </div>
        </div>
      )}

      {/* Leave confirmation */}
      <Dialog
        open={Boolean(pendingHref)}
        onClose={() => setPendingHref(null)}
        title="Leave project creation?"
        size="sm"
        footer={(
          <>
            <ActionButton variant="secondary" onClick={leave}>Leave</ActionButton>
            <ActionButton onClick={() => setPendingHref(null)}>Stay</ActionButton>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          You have unsaved project information. Are you sure you want to leave?
        </p>
        <p className="mt-2 text-xs text-slate-500">
          The project has not been created yet. A draft is kept on this device so you can continue later.
        </p>
      </Dialog>

      {/* Discard restored draft */}
      <Dialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Start a new project?"
        size="sm"
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setDiscardOpen(false)}>Keep draft</ActionButton>
            <ActionButton onClick={startFresh}>Discard and start fresh</ActionButton>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          Everything entered in the restored draft will be cleared.
          {state.projectId ? ` Project ID ${state.projectId.projectId} will be left unused.` : ''}
        </p>
      </Dialog>
    </div>
  );
}

function ProjectWizardRoute() {
  const params = useSearchParams();
  const resubmitId = params.get('resubmit');
  const reviseId = params.get('revise');
  const mode = resubmitId ? 'resubmit' : reviseId ? 'revise' : 'create';
  const sourceId = resubmitId || reviseId || null;
  // A different project or mode starts a fresh wizard.
  return <ProjectWizard key={`${mode}:${sourceId || ''}`} mode={mode} sourceId={sourceId} />;
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl space-y-5 p-6" role="status" aria-label="Loading"><Skeleton className="h-12 w-72" /><Skeleton className="h-24" /><Skeleton className="h-80" /></div>}>
      <ProjectWizardRoute />
    </Suspense>
  );
}
