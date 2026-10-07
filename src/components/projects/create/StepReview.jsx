"use client";
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, Eye, Hash } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { createProject, createRevision, generateProjectId, resubmitProject } from '@/lib/projectApi';
import { formatLakh } from '@/lib/numeric';
import { ProjectSummary } from './ProjectSummary';
import { ActionButton, FieldError, Notice, StepCard, SuccessTick, inputClass } from './parts';
import { buildProjectPayload, buildRevisionPayload, projectTotals } from './wizardState';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context): fall back to a selection copy.
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ }
      document.body.removeChild(area);
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy Project ID"
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-[background-color,color,transform] duration-150 hover:bg-slate-50 hover:text-slate-800 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </button>
      <span role="status" className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2">
        {copied && <span className="wz-fade-in block whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-lg">Copied!</span>}
      </span>
    </span>
  );
}

export function ProjectIdBadge({ projectId, justGenerated = false, note = 'Successfully Generated' }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SuccessTick size={justGenerated ? 52 : 44} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project ID</p>
        <div className="mt-0.5 flex items-center gap-3">
          <p className="font-mono text-2xl font-bold tracking-wide text-slate-900">{projectId}</p>
          <CopyButton text={projectId} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" aria-hidden="true" /> {note}
        </p>
      </div>
    </div>
  );
}

// What the final step does in each mode of the wizard.
const MODES = {
  create: {
    description: 'Check the summary, generate the Project ID, then preview and create the project.',
    confirmTitle: 'Create this project?',
    confirmText: 'Are you sure you want to create this project? It will be sent to the Checker for verification.',
    confirmButton: 'Create Project', busy: 'Creating Project…', failed: 'The project was not created',
  },
  resubmit: {
    description: 'Check the corrected details, then send the project back to the Checker. The Project ID stays the same.',
    confirmTitle: 'Resubmit this project?',
    confirmText: 'The corrected project will be sent to the Checker for verification again.',
    confirmButton: 'Resubmit Project', busy: 'Resubmitting…', failed: 'The project was not resubmitted',
  },
  revise: {
    description: 'Check the revised figures and give the reason. The project changes only after the Checker and Approver approve the revision.',
    confirmTitle: 'Send this revision for review?',
    confirmText: 'The revised estimate goes to the Checker and then the Approver. Until it is approved the project keeps its current figures.',
    confirmButton: 'Send Revision', busy: 'Sending…', failed: 'The revision was not sent',
  },
};

/** Step 6 — Summary → (Generate Project ID) → Preview / Proceed → confirm → save. */
export function StepReview({ state, dispatch, onBack, onCreated }) {
  const mode = state.mode || 'create';
  const copy = MODES[mode];
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [justGenerated, setJustGenerated] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  // Refs guard against double clicks landing before React re-renders the disabled state.
  const generatingRef = useRef(false);
  const creatingRef = useRef(false);

  const totals = projectTotals(state);
  const { location } = state;
  const locationText = [location.village, location.gramPanchayat, location.block, location.district].map((item) => item?.name).filter(Boolean).join(', ');
  const reason = (state.revisionReason || '').replace(/\s+/g, ' ').trim();
  const reasonError = mode === 'revise' && reason.length < 10 ? 'Give the reason for the revision (at least 10 characters).' : '';
  const ready = mode === 'create' ? Boolean(state.projectId) : true;

  const generate = async () => {
    if (generatingRef.current || state.projectId) return;
    generatingRef.current = true;
    setGenerating(true);
    setGenerateError('');
    try {
      // The backend owns the ID. The same draft always receives the same ID.
      const result = await generateProjectId(state.draftKey, location.district.id);
      dispatch({ type: 'SET_PROJECT_ID', value: { projectId: result.projectId, generatedAt: result.generatedAt } });
      setJustGenerated(true);
    } catch (err) {
      setGenerateError(err?.message || 'Unable to generate the Project ID. Please try again.');
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  };

  const openConfirm = () => {
    setReasonTouched(true);
    if (reasonError) { document.getElementById('revision-reason')?.focus(); return; }
    setCreateError('');
    setPreviewOpen(false);
    setConfirmOpen(true);
  };

  const save = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    setCreateError('');
    try {
      let result;
      if (mode === 'resubmit') result = await resubmitProject(state.source.id, buildProjectPayload(state));
      else if (mode === 'revise') result = await createRevision(state.source.id, buildRevisionPayload(state));
      else result = await createProject(buildProjectPayload(state));
      onCreated(result);
    } catch (err) {
      setCreateError(err?.message || `${copy.failed}. Please try again.`);
      creatingRef.current = false;
      setCreating(false);
    }
  };

  return (
    <StepCard step={6} title={mode === 'revise' ? 'Review & Send Revision' : mode === 'resubmit' ? 'Review & Resubmit' : 'Review & Create'} description={copy.description}>
      <ProjectSummary state={state} />

      {mode === 'revise' && (
        <div className="mt-6">
          <label htmlFor="revision-reason" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            Reason for revision <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <textarea
            id="revision-reason"
            rows={3}
            maxLength={1000}
            value={state.revisionReason || ''}
            onChange={(event) => dispatch({ type: 'SET_REVISION_REASON', value: event.target.value })}
            onBlur={() => setReasonTouched(true)}
            placeholder="For example: rates revised as per Schedule of Rates 2026; additional trenches approved by DLEC on 12 Aug 2026"
            aria-required="true"
            aria-invalid={Boolean(reasonTouched && reasonError) || undefined}
            aria-describedby={reasonTouched && reasonError ? 'revision-reason-error' : undefined}
            className={`${inputClass(Boolean(reasonTouched && reasonError))} resize-none`}
          />
          <FieldError id="revision-reason-error" message={reasonTouched ? reasonError : ''} />
        </div>
      )}

      <div className={`mt-6 rounded-xl border p-5 transition-colors duration-300 ${ready ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/70'}`}>
        {ready ? (
          <div className="flex flex-wrap items-center justify-between gap-5" role="status">
            {state.projectId
              ? <ProjectIdBadge projectId={state.projectId.projectId} justGenerated={justGenerated} note={mode === 'create' ? 'Successfully Generated' : 'Project ID is kept'} />
              : <p className="text-sm font-semibold text-slate-900">{state.source?.code || state.details.projectName}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <ActionButton variant="secondary" size="lg" icon={Eye} onClick={() => setPreviewOpen(true)}>Preview</ActionButton>
              <ActionButton size="lg" iconRight={ArrowRight} onClick={openConfirm}>{mode === 'create' ? 'Proceed' : copy.confirmButton}</ActionButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Generate Project ID</p>
              <p className="mt-0.5 text-sm text-slate-500">
                A permanent, unique ID is issued for {location.district?.name} district. After it is generated the district cannot be changed.
              </p>
            </div>
            <ActionButton size="lg" icon={Hash} loading={generating} onClick={generate}>
              {generating ? 'Generating…' : 'Generate Project ID'}
            </ActionButton>
          </div>
        )}
        {generateError && <div className="mt-4"><Notice tone="error">{generateError}</Notice></div>}
      </div>

      {!ready && <p className="mt-3 text-xs text-slate-500">Preview and Proceed become available once the Project ID is generated.</p>}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <ActionButton variant="secondary" icon={ArrowLeft} onClick={onBack}>Back to Activities</ActionButton>
      </div>

      {/* Preview — read only, saves nothing */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={mode === 'revise' ? 'Revised Estimate Preview' : 'Project Preview'}
        description="Read-only review. Nothing is saved until you confirm."
        size="xl"
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setPreviewOpen(false)}>Close Preview</ActionButton>
            <ActionButton iconRight={ArrowRight} onClick={openConfirm}>{mode === 'create' ? 'Proceed' : copy.confirmButton}</ActionButton>
          </>
        )}
      >
        <ProjectSummary state={state} detailed />
      </Dialog>

      {/* Final confirmation */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={copy.confirmTitle}
        description={copy.confirmText}
        size="md"
        dismissible={!creating}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setConfirmOpen(false)} disabled={creating}>Cancel</ActionButton>
            <ActionButton variant="success" loading={creating} onClick={save}>{creating ? copy.busy : copy.confirmButton}</ActionButton>
          </>
        )}
      >
        <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          {[
            ['Project ID', <span key="id" className="font-mono">{state.projectId?.projectId || state.source?.code}</span>],
            ['Project Name', state.details.projectName.replace(/\s+/g, ' ').trim()],
            ['Location', locationText],
            ['PIA Count', String(state.piaCount || 0)],
            ['Department Count', String(state.departments.length)],
            [mode === 'revise' ? 'Revised Financial Allocation' : 'Total Financial Allocation', formatLakh(totals.total)],
            ...(mode === 'revise' ? [['Current Allocation', formatLakh(state.source?.totalLakh)], ['Reason', reason]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-6 px-4 py-2.5">
              <dt className="flex-shrink-0 text-slate-500">{label}</dt>
              <dd className="min-w-0 break-words text-right font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        {createError && <div className="mt-4"><Notice tone="error" title={copy.failed}>{createError}</Notice></div>}
      </Dialog>
    </StepCard>
  );
}
