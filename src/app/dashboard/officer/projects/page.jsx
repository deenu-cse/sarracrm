"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardPlus, Clock, FolderOpen } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { piaAccept } from '@/lib/projectWorkflowApi';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { MPR_ENTRY_ROUTE } from '@/components/projects/detail/PiaActions';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function ProjectCard({ project, onAccept, accepting }) {
  const departments = project.myDepartments || [];
  const location = [project.location?.village, project.location?.block, project.location?.district || project.district].filter(Boolean).join(', ');
  return (
    <li className={`rounded-xl border bg-white p-5 shadow-sm transition-[border-color,box-shadow] duration-150 hover:shadow-md ${project.needsMyAcceptance ? 'border-amber-300' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-slate-500">{project.projectId || project.sanctionId}</p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-900">{project.projectTitle}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{location}{project.head?.code ? ` · Head ${project.head.code} ${project.head.name}` : ''}</p>
        </div>
        {project.needsMyAcceptance
          ? <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> Awaiting your acceptance</span>
          : <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Accepted</span>}
      </div>

      {departments.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
          {departments.map((department) => (
            <li key={department.departmentId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
              <span className="font-medium text-slate-900">{department.name}</span>
              <span className="text-xs text-slate-600">
                <span className="tabular-nums">{formatLakh(department.totalLakh)}</span>
                {' · '}{department.acceptedAt ? `Accepted ${formatDate(department.acceptedAt)}` : `Assigned ${formatDate(department.assignedAt)}`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-600">Sanctioned budget <span className="font-semibold tabular-nums">{formatLakh(project.totalSanctionedBudgetLakh)}</span></p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Link href={`/dashboard/officer/projects/${project._id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50">
          View Details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {project.needsMyAcceptance && (
          <ActionButton variant="success" size="sm" icon={CheckCircle2} loading={accepting} onClick={() => onAccept(project)} className="!py-2">
            {accepting ? 'Accepting…' : 'Accept Project'}
          </ActionButton>
        )}
        {project.canReport && (
          <Link href={`${MPR_ENTRY_ROUTE}?projectId=${project._id}`} className="inline-flex items-center gap-2 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2">
            <ClipboardPlus className="h-4 w-4" aria-hidden="true" /> File Monthly Progress
          </Link>
        )}
      </div>
    </li>
  );
}

/** PIA officer: projects where a department is assigned to me. */
export default function OfficerProjectsPage() {
  const { projects, loading, error, refetch } = useProjects('PIA_OFFICER');
  const [accepting, setAccepting] = useState(null);
  const [actionError, setActionError] = useState('');
  const busyRef = useRef(false);

  const accept = async (project) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setAccepting(project._id);
    setActionError('');
    try {
      await piaAccept(project._id);
      await refetch();
    } catch (err) {
      setActionError(err?.message || 'The project could not be accepted. Please try again.');
    } finally {
      busyRef.current = false;
      setAccepting(null);
    }
  };

  // Older single-PIA projects carry no per-department flags.
  const normalized = projects.map((project) => ({
    ...project,
    needsMyAcceptance: project.needsMyAcceptance ?? project.status === 'FORWARDED_TO_PIA',
    canReport: project.canReport ?? false,
  }));
  const pending = normalized.filter((project) => project.needsMyAcceptance);
  const accepted = normalized.filter((project) => !project.needsMyAcceptance);
  const firstLoad = loading && projects.length === 0;

  return (
    <div className="mx-auto max-w-5xl p-4 pb-16 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><FolderOpen className="h-5 w-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Projects</h1>
          <p className="text-sm text-slate-500">Projects where the district has assigned a department to you.</p>
        </div>
      </div>

      {actionError && <div className="mb-4"><Notice tone="error">{actionError}</Notice></div>}

      {firstLoad && <div className="space-y-3" role="status" aria-label="Loading projects">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-40" />)}</div>}
      {!loading && error && <Notice tone="error" title="Unable to load your projects." action={<RetryButton onClick={refetch} />}>Please try again.</Notice>}

      {!loading && !error && projects.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No project is assigned to you yet. Projects appear here when the District Director assigns your department to you.
        </p>
      )}

      {!firstLoad && !error && pending.length > 0 && (
        <section className="mb-8" aria-labelledby="pending-heading">
          <h2 id="pending-heading" className="mb-3 text-sm font-semibold text-slate-800">Awaiting your acceptance ({pending.length})</h2>
          <ul className="space-y-3">{pending.map((project) => <ProjectCard key={project._id} project={project} onAccept={accept} accepting={accepting === project._id} />)}</ul>
        </section>
      )}

      {!firstLoad && !error && accepted.length > 0 && (
        <section aria-labelledby="accepted-heading">
          <h2 id="accepted-heading" className="mb-3 text-sm font-semibold text-slate-800">Accepted projects ({accepted.length})</h2>
          <ul className="space-y-3">{accepted.map((project) => <ProjectCard key={project._id} project={project} onAccept={accept} accepting={false} />)}</ul>
        </section>
      )}
    </div>
  );
}
