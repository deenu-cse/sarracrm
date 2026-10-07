"use client";
import React, { useEffect, useState } from 'react';
import { Activity, ArrowRight, CalendarClock, CheckCircle2, FolderKanban, Search } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { FullPageSpinner } from '@/components/ui/Spinner';

const statusClass = (status) => {
  if (!status) return 'bg-slate-100 text-slate-600';
  if (['APPROVED', 'PIA_ACCEPTED', 'DISTRICT_APPROVED', 'STATE_VERIFIED'].includes(status)) return 'bg-emerald-50 text-emerald-700';
  if (['REJECTED', 'RETURNED_TO_PIA'].includes(status)) return 'bg-rose-50 text-rose-700';
  if (status.includes('PENDING') || status === 'SUBMITTED') return 'bg-amber-50 text-amber-700';
  return 'bg-blue-50 text-blue-700';
};

function TimelineEvent({ event }) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-4 border-slate-50 bg-navy text-white">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{event.eventName || event.action}</p>
            <p className="mt-1 text-sm text-slate-600">{event.description}</p>
          </div>
          <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusClass(event.status || event.newStatus)}`}>
            {(event.status || event.newStatus || 'Activity').replace(/_/g, ' ')}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{event.performedBy || 'System'}</span>
          <span>{event.performedByRole || 'System'}</span>
          <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{formatDate(event.timestamp, 'dd MMM yyyy, hh:mm a')}</span>
          {event.previousStatus && event.newStatus && <span>{event.previousStatus} <ArrowRight className="mx-1 inline h-3 w-3" /> {event.newStatus}</span>}
        </div>
      </div>
    </div>
  );
}

export default function BusinessAuditView() {
  const [data, setData] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (selectedId = projectId, searchTerm = search) => {
    setLoading(true);
    const query = new URLSearchParams();
    if (selectedId) query.set('projectId', selectedId);
    if (searchTerm.trim()) query.set('search', searchTerm.trim());
    const response = await apiCall(`/admin/business-audit?${query.toString()}`);
    if (response?.success) {
      setData(response.data);
      if (!selectedId && response.data?.selected?.project?.id) setProjectId(response.data.selected.project.id);
    }
    setLoading(false);
  };

  useEffect(() => { load('', ''); }, []);

  if (loading && !data) return <FullPageSpinner />;

  const selected = data?.selected;
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] p-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3"><div className="rounded-xl bg-navy p-2.5 text-white"><Activity className="h-6 w-6" /></div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Business activity</p></div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Project Audit Timeline</h1>
          <p className="mt-1 text-sm text-slate-500">Follow project decisions, ownership and MPR activity in one place.</p>
        </div>
        <div className="flex w-full gap-2 lg:w-auto">
          <div className="relative flex-1 lg:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load('', search)} placeholder="Search project or district" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-navy" /></div>
          <button type="button" onClick={() => load('', search)} className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light">Search</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2"><FolderKanban className="h-4 w-4 text-navy" /><h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Projects</h2></div>
          <div className="space-y-2">
            {(data?.projects || []).map((project) => <button type="button" key={project.id} onClick={() => { setProjectId(project.id); load(project.id, search); }} className={`w-full rounded-xl border p-3 text-left transition ${String(project.id) === String(projectId) ? 'border-navy bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}><p className="truncate text-sm font-bold text-slate-900">{project.label}</p><p className="mt-1 text-xs text-slate-500">{project.referenceNo} · {project.district || 'District pending'}</p><span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(project.status)}`}>{(project.status || 'Unknown').replace(/_/g, ' ')}</span></button>)}
            {!data?.projects?.length && <p className="py-6 text-center text-sm text-slate-500">No projects found.</p>}
          </div>
        </aside>

        <section>
          {selected ? <><div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{selected.project.referenceNo}</p><h2 className="mt-1 text-2xl font-black text-slate-900">{selected.project.projectTitle}</h2><p className="mt-2 text-sm text-slate-500">{selected.project.district} · {selected.project.department || 'Department pending'} · Maker: {selected.project.maker?.name || 'Not assigned'}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase ${statusClass(selected.project.status)}`}>{(selected.project.status || 'Unknown').replace(/_/g, ' ')}</span></div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="mb-5 text-sm font-black uppercase tracking-widest text-slate-700">Workflow timeline</h2>{selected.timeline?.length ? selected.timeline.map((event) => <TimelineEvent key={event.id} event={event} />) : <p className="py-10 text-center text-sm text-slate-500">No business activity recorded for this project yet.</p>}</div></> : <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><FolderKanban className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">Select a project to view its timeline</p></div>}
          {recentActivity.length > 0 && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-700">Recent workflow activity</h2><div className="grid gap-3 md:grid-cols-2">{recentActivity.slice(0, 8).map((event) => <a href={event.href} key={event.id} className="rounded-xl border border-slate-100 p-3 hover:border-navy"><p className="text-sm font-bold text-slate-800">{event.eventName}</p><p className="mt-1 text-xs text-slate-500">{event.referenceNo} · {event.performedBy} · {formatDate(event.timestamp, 'dd MMM yyyy, hh:mm a')}</p></a>)}</div></div>}
        </section>
      </div>
    </div>
  );
}
