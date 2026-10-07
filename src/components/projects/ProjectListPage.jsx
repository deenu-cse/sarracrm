"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, FolderKanban, IndianRupee, Lock, Plus, Search, UserCog, X } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { fetchDistricts, fetchHeads } from '@/lib/projectApi';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { formatLakh } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { BUDGET_ALLOCATION_ROUTE, ProgressBar } from '@/components/projects/budget/BudgetStatus';
import { PiaHandoverDialog } from '@/components/projects/detail/PiaHandoverDialog';

const STAGES = {
  state: [['PENDING_CHECKER', 'With Checker'], ['PENDING_APPROVER', 'With Approver'], ['SANCTIONED', 'Sanctioned'], ['FORWARDED_TO_DISTRICT', 'Sent to district'], ['DISTRICT_ACCEPTED', 'District accepted'],
    ['FORWARDED_TO_PIA', 'Assigned to PIA'], ['PIA_ACCEPTED', 'In progress'], ['CLOSED', 'Closed'], ['REJECTED', 'Rejected']],
  district: [['FORWARDED_TO_DISTRICT', 'To accept'], ['DISTRICT_ACCEPTED', 'To assign'], ['FORWARDED_TO_PIA', 'Assigned to PIA'], ['PIA_ACCEPTED', 'In progress'], ['CLOSED', 'Closed']],
};
const LIMIT = 15;
const shortLakh = (value) => formatLakh(value || 0).replace(' Lakh', ' L');
const date = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-[border-color,box-shadow] hover:border-slate-400 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20';
const primaryLink = 'inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2';
const secondaryLink = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2';

/**
 * Project list for the State (`scope="state"`) and for a District Director
 * (`scope="district"`). Search, stage and other filters are applied by the
 * server; the counts on the stage buttons respect every filter except stage.
 */
export function ProjectListPage({ scope }) {
  const { user } = useAuth();
  const router = useRouter();
  const isState = scope === 'state';
  const base = isState ? '/dashboard/admin/projects' : '/dashboard/dd/projects';
  const isMaker = isState && user?.workflowRole === 'MAKER';

  const [filters, setFilters] = useState({ status: '', district: '', headCode: '', search: '' });
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [box, setBox] = useState({ rows: [], total: 0, pages: 1, summary: null, loading: true, error: '' });
  const [handover, setHandover] = useState(false);
  const requestRef = useRef(0);
  const districts = useMasterList(fetchDistricts, isState ? 'districts' : null);
  const heads = useMasterList(fetchHeads, 'heads');

  useEffect(() => {
    const timer = setTimeout(() => { setFilters((current) => (current.search === searchText.trim() ? current : { ...current, search: searchText.trim() })); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const load = useCallback(() => {
    const requestId = ++requestRef.current;
    setBox((current) => ({ ...current, loading: true, error: '' }));
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    Object.entries(filters).forEach(([key, value]) => { if (value && (isState || key !== 'district')) params.set(key, value); });
    return axiosInstance.get(`${isState ? '/sanctions' : '/sanctions/district'}?${params}`)
      .then(({ data: body }) => {
        if (requestRef.current !== requestId) return;
        const payload = body?.data || {};
        setBox({ rows: Array.isArray(payload.data) ? payload.data : [], total: payload.pagination?.total || 0, pages: payload.pagination?.pages || 1, summary: payload.summary || null, loading: false, error: '' });
      })
      .catch(() => { if (requestRef.current === requestId) setBox((current) => ({ ...current, loading: false, error: 'Unable to load projects. Please try again.' })); });
  }, [filters, page, isState]);
  useEffect(() => { load(); }, [load]);

  const set = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const active = Object.values(filters).some(Boolean);
  const clear = () => { setFilters({ status: '', district: '', headCode: '', search: '' }); setSearchText(''); setPage(1); };
  const counts = box.summary?.byStage || {};
  const toAccept = !isState ? (counts.FORWARDED_TO_DISTRICT || 0) : 0;
  const firstLoad = box.loading && box.rows.length === 0 && !box.summary;

  return (
    <div className="mx-auto max-w-7xl p-4 pb-16 sm:p-6">
      {!isState && <PiaHandoverDialog open={handover} onClose={() => setHandover(false)} onDone={load} />}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><FolderKanban className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isState ? 'Projects' : 'District Projects'}</h1>
            <p className="text-sm text-slate-500">{isState ? 'Every project in the State, from creation to closure.' : `Projects forwarded to ${user?.district || 'your district'}.`}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isMaker && <Link href={BUDGET_ALLOCATION_ROUTE} className={secondaryLink}><IndianRupee className="h-4 w-4" aria-hidden="true" /> Release Budget</Link>}
          {isMaker && <Link href="/dashboard/admin/projects/create" className={primaryLink}><Plus className="h-4 w-4" aria-hidden="true" /> New Project</Link>}
          {!isState && <button type="button" onClick={() => setHandover(true)} className={secondaryLink}><UserCog className="h-4 w-4" aria-hidden="true" /> Hand Over PIA Charge</button>}
        </div>
      </div>

      {toAccept > 0 && filters.status !== 'FORWARDED_TO_DISTRICT' && (
        <div className="mb-4">
          <Notice tone="warning" title={`${toAccept} project${toAccept === 1 ? ' is' : 's are'} waiting for your acceptance`}
            action={<button type="button" onClick={() => set('status', 'FORWARDED_TO_DISTRICT')} className="flex-shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">Show</button>}>
            Open a project to accept it and assign a PIA officer to each department.
          </Notice>
        </div>
      )}

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Filters">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Stage">
          {[['', 'All'], ...STAGES[scope]].map(([value, label]) => {
            const n = value ? (counts[value] || 0) : (box.summary?.total ?? null);
            const selected = filters.status === value;
            return (
              <button key={value || 'all'} type="button" role="tab" aria-selected={selected} onClick={() => set('status', value)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${selected ? 'border-navy bg-navy text-white' : n === 0 ? 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                {label}{n !== null && <span className={`tabular-nums ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{n}</span>}
              </button>
            );
          })}
        </div>
        <div className={`mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 ${isState ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]' : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]'}`}>
          <div className="relative">
            <label htmlFor="project-search" className="sr-only">Search projects</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="project-search" type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by Project ID, Sanction ID, name, block or village" className={`${input} pl-9`} />
          </div>
          {isState && (
            <div><label htmlFor="project-district" className="sr-only">District</label>
              <select id="project-district" value={filters.district} onChange={(event) => set('district', event.target.value)} className={input}>
                <option value="">All districts</option>{districts.items.map((district) => <option key={district.id} value={district.name}>{district.name}</option>)}
              </select></div>
          )}
          <div><label htmlFor="project-head" className="sr-only">Head</label>
            <select id="project-head" value={filters.headCode} onChange={(event) => set('headCode', event.target.value)} className={input}>
              <option value="">All heads</option>{heads.items.map((head) => <option key={head.code} value={head.code}>{head.code} {head.name}</option>)}
            </select></div>
          <button type="button" onClick={clear} disabled={!active && !searchText} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50">
            <X className="h-4 w-4" aria-hidden="true" /> Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {firstLoad && <div className="space-y-2 p-5" role="status" aria-label="Loading projects">{[0, 1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-14" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" action={<RetryButton onClick={load} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && box.rows.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-semibold text-slate-800">{active ? 'No project matches these filters.' : isState ? 'No project has been created yet.' : 'No project has been forwarded to your district yet.'}</p>
            {active
              ? <button type="button" onClick={clear} className="mt-2 text-sm font-semibold text-navy hover:underline">Clear filters</button>
              : isMaker && <Link href="/dashboard/admin/projects/create" className={`${primaryLink} mt-4`}><Plus className="h-4 w-4" aria-hidden="true" /> New Project</Link>}
          </div>
        )}

        {box.rows.length > 0 && (
          <div className={`overflow-x-auto transition-opacity ${box.loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[980px] text-sm">
              <caption className="sr-only">Projects</caption>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">Project</th>
                  {isState && <th scope="col" className="px-3 py-2.5">District</th>}
                  <th scope="col" className="px-3 py-2.5">Stage</th>
                  <th scope="col" className="px-3 py-2.5">Departments</th>
                  <th scope="col" className="w-56 px-3 py-2.5">Budget released</th>
                  {!isState && <th scope="col" className="px-3 py-2.5">Reports</th>}
                  <th scope="col" className="px-5 py-2.5">{isState ? 'Created' : 'Received'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {box.rows.map((project) => {
                  const closed = project.closure?.status === 'CLOSED';
                  const departments = project.departments || [];
                  const accepted = departments.filter((d) => d.accepted).length;
                  const budget = project.budget || {};
                  const tracked = budget.ineligibleCode !== 'NO_DEPARTMENTS';
                  const full = budget.allocationStatus === 'FULLY_ALLOCATED';
                  const href = `${base}/${project._id}`;
                  return (
                    <tr key={project._id} onClick={() => router.push(href)} className="cursor-pointer align-top transition-colors hover:bg-slate-50/70">
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <Link href={href} onClick={(event) => event.stopPropagation()} className="block max-w-sm truncate font-semibold text-slate-900 hover:text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">{project.projectTitle || 'Untitled project'}</Link>
                        <span className="block truncate font-mono text-xs text-slate-500">{project.projectId || project.sanctionId || project.dprApplicationNo || '—'}{project.head?.code ? ` · ${project.head.code}` : ''}</span>
                        {(project.location?.village || project.location?.block) && <span className="block truncate text-xs text-slate-400">{[project.location?.village, project.location?.block].filter(Boolean).join(', ')}</span>}
                      </th>
                      {isState && <td className="px-3 py-3 text-slate-700">{project.district}</td>}
                      <td className="px-3 py-3">
                        {closed ? <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"><Lock className="h-3 w-3" aria-hidden="true" /> Closed</span> : <Badge status={project.status} />}
                        {project.status === 'REJECTED' && project.rejectionReason && <span className="mt-1 block max-w-[14rem] truncate text-xs text-red-700" title={project.rejectionReason}>{project.rejectionReason}</span>}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {departments.length === 0 ? <span className="text-slate-400">{project.department || '—'}</span> : (
                          <>
                            <span className="block max-w-[14rem] truncate" title={departments.map((d) => d.name).join(', ')}>{departments.map((d) => d.name).join(', ')}</span>
                            {['FORWARDED_TO_PIA', 'PIA_ACCEPTED', 'DISTRICT_ACCEPTED'].includes(project.status) && <span className={`block text-xs tabular-nums ${accepted === departments.length ? 'text-emerald-700' : 'text-amber-700'}`}>{accepted} of {departments.length} accepted by PIA</span>}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {!tracked ? <span className="tabular-nums text-slate-700">{shortLakh(project.totalSanctionedBudgetLakh)}</span> : (
                          <>
                            <span className="text-xs font-semibold tabular-nums text-slate-700">{shortLakh(budget.totalAllocatedLakh)} <span className="font-normal text-slate-500">of {shortLakh(budget.totalBudgetLakh)}</span></span>
                            <div className="mt-1.5"><ProgressBar percent={budget.percentAllocated} complete={full} label={`Budget released for ${project.projectTitle || 'project'}`} /></div>
                            {isMaker && budget.eligible && (
                              <Link href={`${BUDGET_ALLOCATION_ROUTE}?projectId=${project._id}`} onClick={(event) => event.stopPropagation()} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                                <IndianRupee className="h-3 w-3" aria-hidden="true" /> Release budget
                              </Link>
                            )}
                          </>
                        )}
                      </td>
                      {!isState && (
                        <td className="px-3 py-3">
                          {project.unreviewedMprCount > 0
                            ? <span className="inline-block rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">{project.unreviewedMprCount} to review</span>
                            : <span className="text-xs text-slate-400">None waiting</span>}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                        {date(isState ? project.createdAt : (project.forwardedToDistrictAt || project.createdAt))}
                        {isState && project.maker?.name && <span className="block text-slate-400">by {project.maker.name}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {box.total > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
            <p className="tabular-nums">{(page - 1) * LIMIT + 1} to {Math.min(page * LIMIT, box.total)} of {box.total}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || box.loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous</button>
              <span className="tabular-nums">Page {page} of {box.pages}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(box.pages, value + 1))} disabled={page >= box.pages || box.loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50">Next <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
