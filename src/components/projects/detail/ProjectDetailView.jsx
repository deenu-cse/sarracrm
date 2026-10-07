"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, CalendarDays, ChevronLeft, ClipboardList, IndianRupee, Lock, Printer, RefreshCw, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectDetail } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/Badge';
import { fetchBudgetState } from '@/lib/budgetApi';
import { formatLakh } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { AllocatedTick } from '@/components/projects/budget/BudgetStatus';
import { LifecycleTrack } from './LifecycleTrack';
import { OverviewTab } from './OverviewTab';
import { BudgetTab } from './BudgetTab';
import { ActivityTab } from './ActivityTab';
import { ReportsTab } from './ReportsTab';
import { WorkflowTab } from './WorkflowTab';
import { OutcomesTab } from './OutcomesTab';
import { ClosureTab } from './ClosureTab';
import { useT } from '@/contexts/LanguageContext';
import { CopyButton, StatTile } from './shared';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'budget', label: 'Budget & Releases' },
  { id: 'activities', label: 'Activity Plan' },
  { id: 'reports', label: 'Progress Reports' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'closure', label: 'Completion & Closure' },
  { id: 'workflow', label: 'Workflow & Documents' },
];

const tabFromHash = () => {
  if (typeof window === 'undefined') return 'overview';
  const id = window.location.hash.replace('#', '');
  return TABS.some((tab) => tab.id === id) ? id : 'overview';
};

function IdChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white py-0.5 pl-2 pr-1 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-bold text-slate-800">{value}</span>
      <CopyButton text={value} label={`Copy ${label}`} />
    </span>
  );
}

/**
 * Project detail, shared by the State, District and PIA screens. The page
 * decides what the signed-in role can do through three render props:
 *
 *   renderActions({ project, budget, user, refresh })  header actions + their dialogs
 *   renderBudgetAction({ project, budget, user })      button in the Budget tab
 *   mprHref(mpr)                                       where a progress report opens for this role
 */
export function ProjectDetailView({ projectId, backHref, backLabel = 'Back to projects', renderActions, renderBudgetAction, mprHref, reportsAction }) {
  const { user } = useAuth();
  const t = useT();
  const { project, loading, error, refetch } = useProjectDetail(projectId);

  const [tab, setTab] = useState('overview');
  const [budgetBox, setBudgetBox] = useState({ budget: null, loading: false, error: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const tabRefs = useRef({});

  const hasDepartments = (project?.departmentAllocations || []).length > 0;

  // Budget position always comes from the backend, which recalculates it from the stored installments.
  const loadBudget = useCallback(() => {
    setBudgetBox((current) => ({ ...current, loading: true, error: '' }));
    return fetchBudgetState(projectId)
      .then((budget) => setBudgetBox({ budget, loading: false, error: '' }))
      .catch((err) => setBudgetBox({ budget: null, loading: false, error: err?.message || 'Unable to load the budget position.' }));
  }, [projectId]);

  useEffect(() => { if (hasDepartments) loadBudget(); }, [hasDepartments, loadBudget]);

  useEffect(() => {
    setTab(tabFromHash());
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openTab = useCallback((next) => {
    setTab(next);
    // Keep the tab in the URL so a refresh or a shared link opens the same view.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${next}`);
  }, []);

  const onTabKeyDown = (event, index) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : delta ? (index + delta + TABS.length) % TABS.length : null;
    if (target === null) return;
    event.preventDefault();
    openTab(TABS[target].id);
    tabRefs.current[TABS[target].id]?.focus();
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), hasDepartments ? loadBudget() : null]);
      setRefreshKey((key) => key + 1);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, loadBudget, hasDepartments]);

  if (loading && !project) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6" role="status" aria-label="Loading project">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-20" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl p-6 pt-10">
        <Notice tone="error" title="Unable to load this project." action={<RetryButton onClick={refetch} />}>
          It may not be assigned to you, it may have been removed, or the connection failed. Please try again.
        </Notice>
        <Link href={backHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}
        </Link>
      </div>
    );
  }

  const { budget } = budgetBox;
  const departments = project.departmentAllocations || [];
  const activityCount = (project.sanctionedTargets || []).length;
  const fully = budget?.totals.status === 'FULLY_ALLOCATED';
  const context = { project, budget, user, refresh: refreshAll };

  return (
    <div className="mx-auto max-w-7xl p-4 pb-16 sm:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4 xl:flex-nowrap">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={backHref}
            aria-label={backLabel}
            className="mt-0.5 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 print:hidden"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{project.projectTitle || 'Untitled project'}</h1>
              <Badge status={project.status} size="md" />
              {project.closure?.status === 'CLOSED'
                ? <span className="inline-flex items-center gap-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"><Lock className="h-3 w-3" aria-hidden="true" /> {t('Closed')}</span>
                : project.isActive && <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Active</span>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {project.projectId && <IdChip label="Project ID" value={project.projectId} />}
              {project.sanctionId
                ? <IdChip label="Sanction ID" value={project.sanctionId} />
                : <span className="rounded-md border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500">Sanction ID issued on approval</span>}
              {project.head?.code && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                  <span className="text-slate-500">Head</span>
                  <span className="font-mono font-bold text-slate-800">{project.head.code}</span>
                  <span className="font-medium text-slate-700">{project.head.name}</span>
                </span>
              )}
              <span className="text-xs text-slate-500">FY {project.financialYear}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            aria-label="Refresh project"
            title="Refresh"
            className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 transition-[background-color,border-color] duration-150 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print this page"
            title="Print"
            className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 transition-[background-color,border-color] duration-150 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
          </button>
          {renderActions?.(context)}
        </div>
      </header>

      {project.status === 'REJECTED' && (
        <div className="mb-5">
          <Notice tone="error" title="This project was rejected">{project.rejectionReason || 'No reason was recorded.'}</Notice>
        </div>
      )}
      {project.closure?.status === 'CLOSED' && (
        <div className="mb-5">
          <Notice
            tone="info"
            title={t('This project is closed')}
            action={<button type="button" onClick={() => openTab('closure')} className="flex-shrink-0 rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">View closure</button>}
          >
            No budget release, monthly report or revision is possible. Outcomes can still be measured.
          </Notice>
        </div>
      )}
      {project.unreviewedMprCount > 0 && (
        <div className="mb-5">
          <Notice
            tone="info"
            action={<button type="button" onClick={() => openTab('reports')} className="flex-shrink-0 rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">View reports</button>}
          >
            {project.unreviewedMprCount} monthly progress report{project.unreviewedMprCount === 1 ? ' is' : 's are'} waiting for district review on this project.
          </Notice>
        </div>
      )}

      <LifecycleTrack project={project} />

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile icon={IndianRupee} label={t('Total Budget')} value={formatLakh(project.totalSanctionedBudgetLakh)} sub={`SARRA ${formatLakh(project.sarraShareLakh)} · Dept. ${formatLakh(project.deptShareLakh)}`} />
        <StatTile
          icon={Wallet}
          label={t('Budget Released')}
          value={budget ? formatLakh(budget.totals.releasedLakh) : budgetBox.loading ? '…' : '—'}
          sub={budget ? `${budget.totals.percentAllocated}% · ${formatLakh(budget.totals.remainingLakh)} remaining` : hasDepartments ? '' : 'Not tracked for this project'}
          tone={fully ? 'success' : 'default'}
        />
        <StatTile icon={Building2} label={t('PIA Departments')} value={String(departments.length || (project.department ? 1 : 0))} sub={departments.length ? departments.map((d) => d.departmentName).join(', ') : project.department || ''} />
        <StatTile icon={ClipboardList} label={t('Activities Planned')} value={String(activityCount)} sub={project.head?.code ? `Head ${project.head.code}` : ''} />
        <StatTile icon={CalendarDays} label={t('District')} value={project.location?.district || project.district || '—'} sub={[project.location?.block, project.location?.village].filter(Boolean).join(' › ')} />
      </dl>

      <div className="mt-6 border-b border-slate-200 print:hidden">
        <div role="tablist" aria-label="Project sections" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((item, index) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                ref={(node) => { tabRefs.current[item.id] = node; }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={active}
                aria-controls={`panel-${item.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => openTab(item.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40
                  ${active ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}
              >
                {t(item.label)}
                {item.id === 'closure' && project.closure?.status === 'CLOSED' && <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />}
                {item.id === 'budget' && fully && <AllocatedTick className="h-3.5 w-3.5" />}
                {item.id === 'activities' && activityCount > 0 && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600">{activityCount}</span>}
                {item.id === 'reports' && project.unreviewedMprCount > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-800">{project.unreviewedMprCount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="wz-fade-in mt-5 focus:outline-none">
        {tab === 'overview' && <OverviewTab project={project} budget={budget} budgetError={budgetBox.error} onOpenTab={openTab} />}
        {tab === 'budget' && (
          <BudgetTab
            project={project}
            budget={budget}
            loading={budgetBox.loading && !budget}
            error={budgetBox.error}
            onRetry={loadBudget}
            actions={renderBudgetAction?.(context) || null}
            canReverse={user?.role === 'SUPER_ADMIN' && user?.workflowRole === 'MAKER' && project.closure?.status !== 'CLOSED'}
            onChanged={refreshAll}
          />
        )}
        {tab === 'activities' && <ActivityTab project={project} />}
        {tab === 'reports' && <ReportsTab key={refreshKey} project={project} mprHref={mprHref} action={reportsAction?.(context) || null} />}
        {tab === 'outcomes' && <OutcomesTab project={project} />}
        {tab === 'closure' && <ClosureTab project={project} onChanged={refreshAll} />}
        {tab === 'workflow' && <WorkflowTab project={project} budget={budget} user={user} canSeeRevisions={user?.role !== 'PIA_OFFICER'} onChanged={refreshAll} />}
      </div>
    </div>
  );
}
