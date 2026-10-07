"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronLeft, ClipboardList, Eye, Lock } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  fetchMprContext, fetchMprCorrectionForm, fetchMprForm, fetchMprWorkload,
  previewMpr, previewMprCorrection, resubmitMpr, submitMpr,
} from '@/lib/mprApi';
import { ActionButton, Field, Notice, RetryButton, Skeleton, SuccessTick, inputClass } from '@/components/projects/create/parts';
import { MprActivityEntry } from './MprActivityEntry';
import { MprReportDocument, MprSummaryPanel } from './MprReportDocument';
import { buildEntries, emptyEntry, evaluateActivity, summarize } from './mprForm';
import { EvidencePicker } from './MprEvidence';
import { addMprEvidence } from '@/lib/lifecycleApi';
import { useT } from '@/contexts/LanguageContext';

const MPRS_ROUTE = '/dashboard/officer/mprs';
const reportHref = (id) => `${MPRS_ROUTE}/report/${id}`;

function Card({ step, title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          {step && <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white" aria-hidden="true">{step}</span>}
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function ReadOnly({ label, value, wide = false }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-4' : ''}>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{label} <Lock className="h-3 w-3 text-slate-300" aria-label="Read only" /></dt>
      <dd className="mt-1 flex min-h-[2.5rem] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">{value || '—'}</dd>
    </div>
  );
}

const projectOption = (project) => ({
  id: project.id,
  name: `${project.code ? `${project.code} — ` : ''}${project.projectName}`,
  hint: `${[project.village, project.block, project.district].filter(Boolean).join(', ')} · ${project.departments.filter((d) => d.accepted).map((d) => d.name).join(', ')}`,
});

const NO_ACTIVITIES = [];

/**
 * Monthly Progress Report entry for a PIA officer.
 *
 * Select Project → (project information loads) → Financial Year → Month →
 * Department → Head → activities → Preview → Submit.
 *
 * With `?mprId=` it opens a report returned by the district for correction:
 * the selection is fixed and the previous figures are pre-filled.
 */
export function MprEntryWorkspace({ initialQuery = {} }) {
  // Selection the page was opened with (deep link or refresh).
  const initial = useRef({ projectId: '', departmentId: '', fy: '', month: '', mprId: '', ...initialQuery }).current;
  const correctionId = initial.mprId;

  const [workload, setWorkload] = useState({ items: [], loading: !correctionId, error: '' });
  const [projectId, setProjectId] = useState(initial.projectId);
  const [contextBox, setContextBox] = useState({ context: null, loading: false, error: '' });
  const [departmentId, setDepartmentId] = useState(initial.departmentId);
  const [financialYear, setFinancialYear] = useState(initial.fy);
  const [month, setMonth] = useState(initial.month);
  const [formBox, setFormBox] = useState({ form: null, loading: Boolean(correctionId), error: '' });

  const [entries, setEntries] = useState({});
  const [remarks, setRemarks] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [validating, setValidating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saved, setSaved] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const t = useT();
  const submittingRef = useRef(false);
  const topRef = useRef(null);

  const { context } = contextBox;
  const { form } = formBox;

  // ── Loading ────────────────────────────────────────────────────────────────
  const loadWorkload = useCallback(() => {
    setWorkload((current) => ({ ...current, loading: true, error: '' }));
    fetchMprWorkload()
      .then((items) => setWorkload({ items, loading: false, error: '' }))
      .catch((err) => setWorkload({ items: [], loading: false, error: err?.message || 'Unable to load your projects. Please try again.' }));
  }, []);
  useEffect(() => { if (!correctionId) loadWorkload(); }, [correctionId, loadWorkload]);

  const loadContext = useCallback(() => {
    if (correctionId) return;
    if (!projectId) { setContextBox({ context: null, loading: false, error: '' }); return; }
    setContextBox({ context: null, loading: true, error: '' });
    fetchMprContext(projectId, departmentId)
      .then((loaded) => {
        setContextBox({ context: loaded, loading: false, error: '' });
        // One assigned department: selected automatically.
        if (loaded.selectedDepartmentId && loaded.selectedDepartmentId !== departmentId) setDepartmentId(loaded.selectedDepartmentId);
      })
      .catch((err) => setContextBox({ context: null, loading: false, error: err?.message || 'Unable to load project information. Please try again.' }));
  }, [correctionId, projectId, departmentId]);
  useEffect(() => { loadContext(); }, [loadContext]);

  const periodReady = Boolean(projectId && departmentId && financialYear && month);
  const selectedYear = context?.financialYears.find((year) => year.value === financialYear) || null;
  const selectedMonth = selectedYear?.months.find((item) => item.value === month) || null;

  const applyForm = (loaded) => {
    setFormBox({ form: loaded, loading: false, error: '' });
    if (loaded.entries) {
      setEntries(Object.fromEntries(loaded.entries.map((entry) => [entry.activityCode, {
        physical: entry.physicalCurrent ? String(entry.physicalCurrent) : '',
        financial: entry.financialCurrentLakh ? String(entry.financialCurrentLakh) : '',
      }])));
      setRemarks(loaded.remarks || '');
    }
  };

  const loadForm = useCallback(() => {
    if (correctionId) {
      setFormBox({ form: null, loading: true, error: '' });
      fetchMprCorrectionForm(correctionId).then(applyForm)
        .catch((err) => setFormBox({ form: null, loading: false, error: err?.message || 'Unable to load the report for correction. Please try again.' }));
      return;
    }
    if (!periodReady) { setFormBox({ form: null, loading: false, error: '' }); return; }
    setFormBox({ form: null, loading: true, error: '' });
    fetchMprForm({ projectId, departmentId, financialYear, reportingMonth: month })
      .then(applyForm)
      .catch((err) => setFormBox({ form: null, loading: false, error: err?.message || "Unable to load previous month's MPR. Please try again." }));
  }, [correctionId, periodReady, projectId, departmentId, financialYear, month]);
  useEffect(() => { setEntries({}); setRemarks(''); setShowErrors(false); setActionError(''); loadForm(); }, [loadForm]);

  // Keep the selection in the URL, so a refresh reopens the same form from backend data.
  useEffect(() => {
    if (correctionId || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (departmentId) params.set('departmentId', departmentId);
    if (financialYear) params.set('fy', financialYear);
    if (month) params.set('month', month);
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState(null, '', next);
  }, [correctionId, projectId, departmentId, financialYear, month]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activities = form?.activities || NO_ACTIVITIES;
  const evaluations = useMemo(() => activities.map((activity) => evaluateActivity(activity, entries[activity.activityCode] || emptyEntry())), [activities, entries]);
  const totals = useMemo(() => summarize(activities, evaluations), [activities, evaluations]);
  const hasInput = Object.values(entries).some((entry) => entry.physical || entry.financial) || Boolean(remarks.trim());
  const blocked = Boolean(form?.blocker);

  useEffect(() => {
    if (!hasInput || saved) return undefined;
    const onBeforeUnload = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasInput, saved]);

  const setEntry = (code, field, value) => {
    setEntries((current) => ({ ...current, [code]: { ...(current[code] || emptyEntry()), [field]: value } }));
    setActionError('');
  };

  const payload = () => ({
    projectId: form.project.id,
    departmentId: form.department.departmentId,
    financialYear: form.financialYear,
    reportingMonth: form.reportingMonth,
    entries: buildEntries(activities, entries),
    remarks: remarks.trim(),
  });

  // ── Preview / submit ───────────────────────────────────────────────────────
  const openPreview = async () => {
    setShowErrors(true);
    setActionError('');
    if (totals.errors > 0) {
      setActionError(`${totals.errors} activit${totals.errors === 1 ? 'y exceeds its' : 'ies exceed their'} target. Fix the highlighted figures to continue.`);
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setValidating(true);
    try {
      // The backend validates and returns the exact figures it will save.
      const result = correctionId ? await previewMprCorrection(correctionId, payload()) : await previewMpr(payload());
      setSubmitError('');
      setPreview(result);
    } catch (err) {
      setActionError(err?.message || 'Unable to validate the report. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const submit = async () => {
    if (submittingRef.current) return; // double click
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = correctionId ? await resubmitMpr(correctionId, payload()) : await submitMpr(payload());
      // The report is saved. Evidence is optional, so a failed upload is reported but never undoes the report.
      let evidenceNote = '';
      if (evidence.length) {
        try {
          await addMprEvidence(result.id, evidence);
        } catch (uploadError) {
          evidenceNote = `${uploadError?.message || 'The files could not be uploaded.'} The report itself is saved; add the files from the report page.`;
        }
      }
      setPreview(null);
      setEvidence([]);
      setSaved({ ...result, period: form.period, department: form.department.name, evidenceCount: evidenceNote ? 0 : evidence.length, evidenceNote });
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setSubmitError(err?.message || 'Unable to submit the report. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const changeProject = (option) => {
    setProjectId(option ? option.id : '');
    setDepartmentId(''); setFinancialYear(''); setMonth('');
  };

  const fileAnother = () => {
    setSaved(null); setMonth(''); setEntries({}); setRemarks(''); setEvidence([]); setShowErrors(false);
    loadContext();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const selectedProjectOption = (() => {
    const item = workload.items.find((project) => project.id === projectId);
    return item ? projectOption(item) : null;
  })();
  const info = form?.project || context?.project || null;
  const head = form?.head || context?.head || null;
  const departments = context?.departments.filter((department) => department.accepted) || [];
  const departmentName = form?.department.name || departments.find((d) => d.departmentId === departmentId)?.name || '';

  return (
    <div ref={topRef} className="mx-auto max-w-7xl scroll-mt-28 p-4 pb-16 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href={MPRS_ROUTE} aria-label="Back to my MPRs" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><ClipboardList className="h-5 w-5" /></span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">{t(correctionId ? 'Correct Monthly Progress Report' : 'Monthly Progress Report')}</h1>
          <p className="text-sm text-slate-500">
            {head ? <>Form <strong className="font-semibold text-slate-700">{head.formType}</strong> · Head {head.code} — {head.name}</> : t('Report physical and financial progress for your department. Amounts are in ₹ Lakh.')}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {saved && (
          <section className="wz-fade-in rounded-xl border border-emerald-200 bg-emerald-50/60 px-6 py-6" role="status">
            <div className="flex flex-wrap items-center gap-5">
              <SuccessTick size={56} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900">{t(correctionId ? 'Report Resubmitted' : 'MPR Submitted Successfully')}</h2>
                <p className="mt-0.5 text-sm text-slate-700">
                  <span className="font-mono font-semibold">{saved.mprNo}</span> — {saved.department}, {saved.period}. {t('It has been sent to the district for review.')}
                  {saved.evidenceCount > 0 && ` ${saved.evidenceCount} evidence file${saved.evidenceCount === 1 ? '' : 's'} attached.`}
                </p>
                {saved.evidenceNote && <p role="alert" className="mt-1 text-sm font-medium text-amber-800">{saved.evidenceNote}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {!correctionId && <ActionButton variant="secondary" onClick={fileAnother}>{t('File Another Month')}</ActionButton>}
                <Link href={reportHref(saved.id)} className="inline-flex items-center justify-center rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
                  {t('View Report')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {!saved && (
          <>
            {correctionId && form?.returnReason && (
              <Notice tone="warning" title={`Returned by the district for correction${form.mprNo ? ` — ${form.mprNo}` : ''}`}>{form.returnReason}</Notice>
            )}

            {/* 1. Project */}
            <Card step="1" title={t('Project')} description={t(correctionId ? 'The project and period of a returned report cannot be changed.' : 'Only projects assigned to you are listed. Project details are filled automatically.')}>
              {!correctionId && (
                <div className="mb-5 max-w-2xl">
                  <Field id="mpr-project" label={t('Project Name / Unique ID')} required error={!workload.loading ? workload.error : ''}>
                    <SearchableSelect
                      id="mpr-project"
                      noun="project"
                      value={selectedProjectOption}
                      options={workload.items.map(projectOption)}
                      onChange={changeProject}
                      placeholder={t(workload.loading ? 'Loading projects…' : 'Search project…')}
                      searchPlaceholder={t('Search by Project ID, name or village…')}
                      loading={workload.loading}
                      error={workload.error}
                      onRetry={loadWorkload}
                      disabled={submitting || validating}
                    />
                  </Field>
                  {!workload.loading && !workload.error && workload.items.length === 0 && (
                    <p className="mt-2 text-sm text-slate-500">
                      No project is ready for reporting. Accept an assigned project under <Link href="/dashboard/officer/projects" className="font-semibold text-navy hover:underline">My Projects</Link> first.
                    </p>
                  )}
                </div>
              )}

              {(contextBox.loading || (correctionId && formBox.loading)) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading project information">
                  <Skeleton className="h-16 sm:col-span-2 lg:col-span-4" />
                  {[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-16" />)}
                </div>
              )}
              {!contextBox.loading && contextBox.error && <Notice tone="error" title="Unable to load project information." action={<RetryButton onClick={loadContext} />}>{contextBox.error}</Notice>}
              {info && (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ReadOnly wide label={t('Project Name / Unique ID')} value={`${info.projectName}${info.code ? ` — ${info.code}` : ''}`} />
                  <ReadOnly label={t('District')} value={info.district} />
                  <ReadOnly label={t('Block')} value={info.block} />
                  <ReadOnly label={t('Gram Panchayat')} value={info.gramPanchayat} />
                  <ReadOnly label={t('Village')} value={info.village} />
                </dl>
              )}
              {!info && !contextBox.loading && !contextBox.error && !correctionId && (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">{t('Select a project to begin.')}</p>
              )}
            </Card>

            {/* 2. Period, department, head */}
            {(context || (correctionId && form)) && (
              <Card step="2" title={t('Reporting Period')} description={t('Choose the financial year and the month you are reporting.')}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                  {correctionId ? (
                    <>
                      <ReadOnly label={t('Financial Year')} value={form.financialYear} />
                      <ReadOnly label={t('Progress Entry Month')} value={form.period} />
                    </>
                  ) : (
                    <>
                      <Field id="mpr-fy" label={t('Financial Year')} required>
                        <select
                          id="mpr-fy"
                          value={financialYear}
                          onChange={(event) => { setFinancialYear(event.target.value); setMonth(''); }}
                          className={`${inputClass(false)} ${financialYear ? '' : 'text-slate-400'}`}
                        >
                          <option value="">{t('Select financial year')}</option>
                          {context.financialYears.map((year) => <option key={year.value} value={year.value} className="text-slate-900">{year.label}</option>)}
                        </select>
                      </Field>
                      <Field id="mpr-month" label={t('Progress Entry Month')} required hint={!financialYear ? t('Select the financial year first') : undefined}>
                        <select
                          id="mpr-month"
                          value={month}
                          disabled={!selectedYear}
                          onChange={(event) => setMonth(event.target.value)}
                          className={`${inputClass(false)} ${month ? '' : 'text-slate-400'} disabled:cursor-not-allowed disabled:bg-slate-50`}
                        >
                          <option value="">{t('Select month')}</option>
                          {(selectedYear?.months || []).map((item) => (
                            <option key={item.value} value={item.value} disabled={!item.selectable} className="text-slate-900 disabled:text-slate-400">
                              {item.label}{item.reason ? ` — ${item.reason}` : ''}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}

                  {correctionId || departments.length <= 1 ? (
                    <ReadOnly label={t('Department')} value={departmentName} />
                  ) : (
                    <Field id="mpr-department" label={t('Department')} required>
                      <select id="mpr-department" value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setMonth(''); }} className={`${inputClass(false)} ${departmentId ? '' : 'text-slate-400'}`}>
                        <option value="">{t('Select department')}</option>
                        {departments.map((department) => <option key={department.departmentId} value={department.departmentId} className="text-slate-900">{department.name}</option>)}
                      </select>
                    </Field>
                  )}
                  <ReadOnly label={t('Head')} value={head ? `${head.code} — ${head.name}` : ''} />
                </div>
                {selectedMonth?.mprId && (
                  <p className="mt-3 text-sm text-slate-600">
                    A report already exists for {selectedMonth.label}. <Link href={reportHref(selectedMonth.mprId)} className="font-semibold text-navy hover:underline">Open it</Link>
                  </p>
                )}
              </Card>
            )}

            {/* 3. Activities */}
            {(periodReady || correctionId) && (
              <Card
                step="3"
                title={`${t('Activity Progress')}${form ? ` — ${form.period}` : ''}`}
                description={form && !blocked ? (form.previousReport
                  ? `Previous progress is the cumulative total of ${form.reportsBefore} earlier report${form.reportsBefore === 1 ? '' : 's'} (latest: ${form.previousReport.period}).`
                  : t('This is the first report for this department, so previous progress is zero.')) : undefined}
              >
                {formBox.loading && (
                  <div className="space-y-2" role="status" aria-label="Loading activities and previous MPR">
                    <p className="text-sm text-slate-500">Loading activities and previous month&apos;s progress…</p>
                    {Array.from({ length: 5 }, (_, n) => <Skeleton key={n} className="h-14" />)}
                  </div>
                )}
                {!formBox.loading && formBox.error && <Notice tone="error" title="Unable to load the form." action={<RetryButton onClick={loadForm} />}>{formBox.error}</Notice>}
                {form && blocked && (
                  <Notice
                    tone="warning"
                    title={t('This month cannot be reported')}
                    action={form.blocker.mprId ? <Link href={reportHref(form.blocker.mprId)} className="flex-shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100">{t('Open report')}</Link> : null}
                  >
                    {form.blocker.message}
                  </Notice>
                )}
                {form && !blocked && (
                  <>
                    <MprActivityEntry activities={activities} entries={entries} evaluations={evaluations} onChange={setEntry} monthLabel={form.period} />

                    <div className="mt-5">
                      <label htmlFor="mpr-remarks" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">{t('Remarks')} <span className="text-xs font-normal text-slate-400">{t('(optional)')}</span></label>
                      <textarea id="mpr-remarks" rows={2} maxLength={1000} value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder={t("Anything the district should know about this month's progress")} className={`${inputClass(false)} resize-none`} />
                    </div>

                    {!correctionId && (
                      <div className="mt-5">
                        <p className="mb-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">{t('Evidence')} <span className="text-xs font-normal text-slate-400">{t('(optional)')}</span></p>
                        <p className="mb-2 text-xs text-slate-500">{t('Site photographs or measurement sheets for this month. A report can be submitted without any.')}</p>
                        <EvidencePicker items={evidence} onChange={setEvidence} disabled={submitting || validating} />
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}

            {/* Summary + actions */}
            {form && !blocked && (
              <>
                <Card title={t('Summary')} description={t('Calculated from the figures above and confirmed by the server before saving.')}>
                  <MprSummaryPanel totals={totals} />
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={MPRS_ROUTE} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2">Cancel</Link>
                  <div className="flex flex-wrap items-center justify-end gap-4">
                    {actionError && <p role="alert" className="wz-fade-in max-w-xl text-right text-sm font-medium text-red-700">{actionError}</p>}
                    {!actionError && totals.entered === 0 && <p className="text-xs text-slate-500">No progress entered: this will be filed as a nil report for {form.period}.</p>}
                    <ActionButton size="lg" icon={Eye} loading={validating} onClick={openPreview} className={showErrors && totals.errors > 0 ? 'wz-shake' : ''}>
                      {t(validating ? 'Validating…' : 'Preview')}
                    </ActionButton>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Dialog
        open={Boolean(preview)}
        onClose={() => { if (!submitting) setPreview(null); }}
        title={t('Preview Monthly Progress Report')}
        description={t('Read-only. Nothing is saved until you choose Proceed.')}
        size="xl"
        dismissible={!submitting}
        footer={(
          <>
            <ActionButton variant="secondary" icon={ArrowLeft} onClick={() => setPreview(null)} disabled={submitting}>{t('Back to Edit')}</ActionButton>
            <ActionButton variant="success" iconRight={ArrowRight} loading={submitting} onClick={submit}>{submitting ? (evidence.length ? 'Submitting and uploading…' : t('Submitting MPR…')) : t('Proceed')}</ActionButton>
          </>
        )}
      >
        {preview && (
          <div className="space-y-4">
            {submitError && <Notice tone="error" title="The report was not saved">{submitError}</Notice>}
            <MprReportDocument report={preview} />
            {evidence.length > 0 && <p className="text-sm text-slate-600">{evidence.length} evidence file{evidence.length === 1 ? '' : 's'} will be attached: {evidence.map((item) => item.file.name).join(', ')}.</p>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
