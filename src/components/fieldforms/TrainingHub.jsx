"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, GraduationCap, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CARD_COLORS, colorFor } from '@/lib/cardColors';
import { USER_ROLES } from '@/constants/roles';
import { DISTRICTS } from '@/constants/districts';
import { Pagination } from '@/components/ui/Pagination';
import { ActionButton, Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { FilterSelect } from '@/components/head56/shared';
import { downloadTrainingExcel, fetchTrainings } from '@/lib/formsApi';
import { PageHeader, card, day, linkButton, num, useRoleBase } from './shared';

export const TRAINING_LEVELS = { GRAM_PANCHAYAT: 'Gram Panchayat', BLOCK: 'Block', DISTRICT: 'District' };
const ORGANISERS = [{ value: 'HQ', label: 'SARRA HQ' }, { value: 'DISTRICT', label: 'District SARRA Centres' }, { value: 'PIA', label: 'PIAs' }];

function Breakdown({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.participants));
  return (
    <section className={`${card} p-4`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {rows.length ? (
        <ul className="mt-2 space-y-2">
          {rows.map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex justify-between gap-2"><span className="truncate font-medium text-slate-800">{r.label}</span><span className="tabular-nums text-slate-600">{num(r.programmes)} prog. · {num(r.participants)}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-navy" style={{ width: `${(r.participants / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-slate-500">—</p>}
    </section>
  );
}

/** Training and capacity development programmes held by SARRA HQ, districts and PIAs. */
export function TrainingHub() {
  const base = useRoleBase();
  const { user } = useAuth();
  const stateWide = [USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(user?.role);
  const [filters, setFilters] = useState({ level: '', organiser: '', district: '', from: '', to: '', search: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });
  const [exp, setExp] = useState({ busy: false, error: '' });

  useEffect(() => {
    const timer = setTimeout(() => { setFilters((f) => (f.search === search ? f : { ...f, search })); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let live = true;
    setBox((b) => ({ ...b, loading: true, error: '' }));
    fetchTrainings({ ...filters, page, limit: 20 })
      .then((data) => live && setBox((b) => ({ ...b, data, loading: false })))
      .catch((err) => live && setBox((b) => ({ ...b, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [filters, page, box.attempt]);

  const set = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const exportExcel = async () => {
    setExp({ busy: true, error: '' });
    try { await downloadTrainingExcel(filters); setExp({ busy: false, error: '' }); } catch (err) { setExp({ busy: false, error: err?.message }); }
  };
  const s = box.data?.summary;
  const p = s?.participants;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 pb-16 sm:p-6">
      <PageHeader
        icon={GraduationCap}
        title="Training and Capacity Development"
        subtitle="Programmes held by SARRA HQ, District SARRA Centres and PIAs — each records its own."
        actions={(
          <>
            <ActionButton variant="secondary" size="sm" icon={FileSpreadsheet} loading={exp.busy} onClick={exportExcel}>Excel</ActionButton>
            {box.data?.permissions?.canCreate && <Link href={`${base}/training/new`} className={linkButton}><Plus className="h-4 w-4" aria-hidden="true" />New programme</Link>}
          </>
        )}
      />
      {exp.error && <Notice tone="error">{exp.error}</Notice>}

      {s && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[['Programmes', num(s.programmes)], ['Participants', num(p.total)], ['Female', `${num(p.female)}${p.total ? ` (${Math.round((p.female / p.total) * 100)}%)` : ''}`], ['Officers / staff', num(p.officer.total)], ['Public representatives', num(p.representative.total)], ['Community', num(p.community.total)]].map(([label, value]) => (
            <div key={label} className={`rounded-2xl border px-4 py-3 shadow-sm ${CARD_COLORS[colorFor(label)].card}`}><dt className={`text-[13px] font-bold ${CARD_COLORS[colorFor(label)].label}`}>{label}</dt><dd className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">{value}</dd></div>
          ))}
        </dl>
      )}
      {s && s.programmes > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          <Breakdown title="By level" rows={s.byLevel} />
          <Breakdown title="By organiser" rows={s.byOrganiser} />
          <Breakdown title="By district" rows={s.byDistrict.slice(0, 8)} />
        </div>
      )}

      <section className={card}>
        <header className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-3">
          <FilterSelect id="tr-level" label="Level" value={filters.level} onChange={(v) => set('level', v)} allLabel="All levels" options={Object.entries(TRAINING_LEVELS).map(([value, label]) => ({ value, label }))} />
          {user?.role !== USER_ROLES.PIA_OFFICER && <FilterSelect id="tr-org" label="Organised by" value={filters.organiser} onChange={(v) => set('organiser', v)} allLabel="Everyone" options={ORGANISERS} />}
          {stateWide && <FilterSelect id="tr-district" label="District" value={filters.district} onChange={(v) => set('district', v)} allLabel="All districts" options={DISTRICTS} />}
          <label htmlFor="tr-from" className="flex flex-col gap-1 text-xs font-medium text-slate-500">From<input id="tr-from" type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" /></label>
          <label htmlFor="tr-to" className="flex flex-col gap-1 text-xs font-medium text-slate-500">To<input id="tr-to" type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" /></label>
          <label htmlFor="tr-search" className="flex flex-col gap-1 text-xs font-medium text-slate-500">Search<input id="tr-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Subject, place, department" className="w-60 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" /></label>
        </header>
        {box.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading programmes">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" title="Unable to load training programmes." action={<RetryButton onClick={() => setBox((b) => ({ ...b, attempt: b.attempt + 1 }))} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && (box.data?.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5">Programme</th>
                  <th scope="col" className="px-3 py-2.5">Level &amp; place</th>
                  <th scope="col" className="px-3 py-2.5">Organised by</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Officers</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Representatives</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Community</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Total (F)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {box.data.items.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <th scope="row" className="max-w-[22rem] px-5 py-3 text-left font-normal">
                      <Link href={`${base}/training/${t.id}`} className="font-semibold text-navy hover:underline">{t.subject}</Link>
                      <span className="block text-xs text-slate-500">{day(t.date)} · <span className="font-mono">{t.refNo}</span></span>
                    </th>
                    <td className="px-3 py-3">{t.levelLabel}<span className="block text-xs text-slate-500">{[t.gramPanchayat?.name, t.block?.name, t.district].filter(Boolean).join(', ')} · {t.place}</span></td>
                    <td className="px-3 py-3">{t.organiser.unitName}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(t.participants.officer.total)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(t.participants.representative.total)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(t.participants.community.total)}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{num(t.participants.total)} <span className="text-xs font-normal text-slate-500">({num(t.participants.female)})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-5 py-12 text-center text-sm text-slate-500">No training programme recorded{Object.values(filters).some(Boolean) ? ' for these filters' : ' yet'}.{box.data?.permissions?.canCreate ? ' Use “New programme” to record one.' : ''}</p>)}
      </section>
      {box.data?.pagination?.totalPages > 1 && <Pagination currentPage={box.data.pagination.page} totalPages={box.data.pagination.totalPages} totalItems={box.data.pagination.total} limit={20} onPageChange={setPage} />}
    </div>
  );
}
