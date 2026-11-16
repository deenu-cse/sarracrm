"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CloudRain, Droplets, Plus, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES, workflowRoleOf } from '@/constants/roles';
import { DISTRICTS } from '@/constants/districts';
import { Dialog } from '@/components/ui/Dialog';
import { Pagination } from '@/components/ui/Pagination';
import { ActionButton, Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { DownloadButtons, FilterSelect, Tabs } from '@/components/head56/shared';
import { downloadJsa, fetchJsaConsolidated, fetchJsaReports, fetchJsaSettings, saveJsaSettings } from '@/lib/formsApi';
import { CountInput, PageHeader, card, day, linkButton, num, today, useRoleBase } from './shared';

export const JSA_ACTIVITIES = [
  { key: 'cementedCheckDam', name: 'Cemented Check Dam', nameHindi: 'सीमेंटेड चैक डैम', unit: 'No.' },
  { key: 'checkDam', name: 'Check Dam', nameHindi: 'चैक डैम', unit: 'No.' },
  { key: 'contourTrench', name: 'Contour Trenches', nameHindi: 'कन्टूर ट्रेन्चेज', unit: 'No.' },
  { key: 'rechargePit', name: 'Recharge Pit', nameHindi: 'रिचार्ज पिट', unit: 'No.' },
  { key: 'dugoutPondShaft', name: 'Dugout Pond / Pond / Shaft', nameHindi: 'डगआउट पौण्ड / तालाब / शॉफ्ट', unit: 'No.' },
  { key: 'plantationHa', name: 'Plantation (area)', nameHindi: 'वृक्षारोपण (है०)', unit: 'Ha', decimals: 3 },
  { key: 'plantationNo', name: 'Plantation (plants)', nameHindi: 'वृक्षारोपण (सं०)', unit: 'No.' },
  { key: 'other', name: 'Other', nameHindi: 'अन्य', unit: 'No.' },
];
export const JSA_LEVELS = { VILLAGE: 'Village', BLOCK: 'Block', DISTRICT: 'District' };
export const campaignYears = () => { const y = new Date().getFullYear(); return [y + 1, y, y - 1, y - 2, y - 3].map(String); };

const LEVEL_TONE = { VILLAGE: 'border-emerald-200 bg-emerald-50 text-emerald-800', BLOCK: 'border-sky-200 bg-sky-50 text-sky-800', DISTRICT: 'border-indigo-200 bg-indigo-50 text-indigo-800' };
export const LevelTag = ({ level }) => <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${LEVEL_TONE[level] || ''}`}>{JSA_LEVELS[level] || level}</span>;

/** Prarup-03 by district (village, block and district reports added together) and the potential recharge. */
function Progress({ campaign, setCampaign, stateWide }) {
  const [filters, setFilters] = useState({ asOn: today(), level: '', district: '' });
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let live = true;
    setBox((b) => ({ ...b, loading: true, error: '' }));
    fetchJsaConsolidated({ campaign, ...filters })
      .then((data) => live && setBox((b) => ({ ...b, data, loading: false })))
      .catch((err) => live && setBox((b) => ({ ...b, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [campaign, filters, box.attempt]);

  const r = box.data;
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const shown = r ? r.rows : [];

  return (
    <div className="space-y-5">
      <section className={card}>
        <header className="flex flex-wrap items-end justify-between gap-3 px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect id="jsa-campaign" label="Campaign" value={campaign} onChange={setCampaign} options={campaignYears()} />
            <label htmlFor="jsa-ason" className="flex flex-col gap-1 text-xs font-medium text-slate-500">As on<input id="jsa-ason" type="date" value={filters.asOn} max={today()} onChange={(e) => set('asOn', e.target.value || today())} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" /></label>
            <FilterSelect id="jsa-level" label="Reports" value={filters.level} onChange={(v) => set('level', v)} allLabel="Village + block + district" options={Object.entries(JSA_LEVELS).map(([value, label]) => ({ value, label: `${label} reports only` }))} />
            {stateWide && <FilterSelect id="jsa-district" label="District" value={filters.district} onChange={(v) => set('district', v)} allLabel="All districts" options={DISTRICTS} />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {r?.permissions?.canEditSettings && <ActionButton variant="secondary" size="sm" icon={Settings2} onClick={() => setSettingsOpen(true)}>Recharge factors</ActionButton>}
            <DownloadButtons compact onDownload={(format) => downloadJsa({ campaign, ...filters }, format)} />
          </div>
        </header>
      </section>

      {box.loading && <Skeleton className="h-96" />}
      {!box.loading && box.error && <Notice tone="error" title="Unable to load the JSA progress." action={<RetryButton onClick={() => setBox((b) => ({ ...b, attempt: b.attempt + 1 }))} />}>{box.error}</Notice>}
      {!box.loading && r && (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Reports counted', `${num(r.total.reports)}`, `${r.counts.VILLAGE} village · ${r.counts.BLOCK} block · ${r.counts.DISTRICT} district`],
              ['Streams identified', num(r.total.streams), 'tributaries / streams for treatment'],
              ['Targeted recharge', `${r.recharge.totals.potentialMillion} M cu.m`, `${num(r.recharge.totals.potentialRecharge, 0)} cu.m in the monsoon`],
              [`Recharge as on ${r.asOnLabel}`, `${r.recharge.totals.tillDateMillion} M cu.m`, `${num(r.recharge.totals.rechargeTillDate, 0)} cu.m`],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</dd><dd className="text-xs text-slate-500">{sub}</dd></div>
            ))}
          </dl>

          <section className={card}>
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">जल संरक्षण अभियान {r.campaign} — साप्ताहिक प्रगति प्रारूप-03</h2>
              <p className="text-xs text-slate-500">Treatment plan and progress of tributary rivers / streams by district, as on {r.asOnLabel}. Each place counts with its latest weekly statement on or before that date.</p>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" rowSpan={2} className="border border-slate-200 px-2 py-2">क्र0सं0</th>
                    <th scope="col" rowSpan={2} className="border border-slate-200 px-2 py-2 text-left">जनपद / District</th>
                    <th scope="col" rowSpan={2} className="w-24 border border-slate-200 px-2 py-2">Streams identified</th>
                    {JSA_ACTIVITIES.map((a) => <th key={a.key} scope="colgroup" colSpan={2} className="border border-slate-200 px-2 py-1.5"><span className="block">{a.nameHindi}</span><span className="block font-normal text-slate-500">{a.name} ({a.unit})</span></th>)}
                  </tr>
                  <tr>{JSA_ACTIVITIES.map((a) => <React.Fragment key={a.key}><th scope="col" className="border border-slate-200 px-1.5 py-1 font-medium">लक्ष्य</th><th scope="col" className="border border-slate-200 px-1.5 py-1 font-medium">प्रगति</th></React.Fragment>)}</tr>
                </thead>
                <tbody>
                  {shown.map((row, i) => (
                    <tr key={row.district} className={row.reports ? 'hover:bg-slate-50/60' : 'text-slate-400'}>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{i + 1}</td>
                      <th scope="row" className="border border-slate-200 px-2 py-1.5 text-left font-medium text-slate-800">{row.districtHindi}<span className="block text-[11px] font-normal text-slate-500">{row.district}{row.reports ? ` · ${row.reports} report${row.reports === 1 ? '' : 's'}` : ''}</span></th>
                      <td className="border border-slate-200 px-2 py-1.5 text-right tabular-nums">{num(row.streams)}</td>
                      {JSA_ACTIVITIES.map((a) => <React.Fragment key={a.key}><td className="border border-slate-200 px-1.5 py-1.5 text-right tabular-nums">{num(row.activities[a.key].target)}</td><td className="border border-slate-200 px-1.5 py-1.5 text-right font-semibold tabular-nums">{num(row.activities[a.key].progress)}</td></React.Fragment>)}
                    </tr>
                  ))}
                  <tr className="bg-sky-50 font-bold">
                    <th scope="row" colSpan={2} className="border border-slate-200 px-2 py-2 text-left">योग / Total</th>
                    <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">{num(r.total.streams)}</td>
                    {JSA_ACTIVITIES.map((a) => <React.Fragment key={a.key}><td className="border border-slate-200 px-1.5 py-2 text-right tabular-nums">{num(r.total.activities[a.key].target)}</td><td className="border border-slate-200 px-1.5 py-2 text-right tabular-nums">{num(r.total.activities[a.key].progress)}</td></React.Fragment>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={card}>
            <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
              <CloudRain className="h-4 w-4 text-navy" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Potential recharge — targets and progress of water and soil conservation activities</h2>
                <p className="text-xs text-slate-500">Recharge = structures × average capacity of one structure × refills in the monsoon.</p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-2.5">Activity</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Proposed</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Avg. capacity (cu.m)</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Refills</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Potential recharge (cu.m)</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Completed</th>
                    <th scope="col" className="px-5 py-2.5 text-right">Recharge till date (cu.m)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.recharge.rows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-slate-800">{row.name}</th>
                      <td className="px-3 py-2.5 text-right tabular-nums">{num(row.targetStructures)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{num(row.capacity)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row.refills}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{num(row.potentialRecharge, 0)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{num(row.progressStructures)}</td>
                      <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{num(row.rechargeTillDate, 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-sky-50 font-bold">
                    <th scope="row" className="px-5 py-2.5 text-left">Total</th>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(r.recharge.totals.targetStructures)}</td>
                    <td colSpan={2} />
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(r.recharge.totals.potentialRecharge, 0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(r.recharge.totals.progressStructures)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{num(r.recharge.totals.rechargeTillDate, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-700">Afforestation: target <strong>{num(r.recharge.plantation.target)} Ha</strong>, progress <strong>{num(r.recharge.plantation.progress)} Ha</strong> · Plants: target <strong>{num(r.recharge.plantation.plants.target)}</strong>, planted <strong>{num(r.recharge.plantation.plants.progress)}</strong></p>
          </section>
        </>
      )}
      <FactorsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); setBox((b) => ({ ...b, attempt: b.attempt + 1 })); }} />
    </div>
  );
}

function FactorsDialog({ open, onClose, onSaved }) {
  const [factors, setFactors] = useState(null);
  const [state, setState] = useState({ busy: false, error: '' });
  useEffect(() => {
    if (!open) return;
    setState({ busy: false, error: '' });
    fetchJsaSettings().then((data) => setFactors(Object.fromEntries(Object.entries(data.factors).map(([k, f]) => [k, { capacity: String(f.capacity), refills: String(f.refills) }])))).catch((err) => setState({ busy: false, error: err?.message }));
  }, [open]);
  const save = async () => {
    setState({ busy: true, error: '' });
    try {
      await saveJsaSettings(Object.fromEntries(Object.entries(factors).map(([k, f]) => [k, { capacity: Number(f.capacity) || 0, refills: Number(f.refills) || 0 }])));
      onSaved();
    } catch (err) { setState({ busy: false, error: err?.message }); }
  };
  const nameOf = Object.fromEntries(JSA_ACTIVITIES.map((a) => [a.key, a.name]));
  return (
    <Dialog open={open} onClose={onClose} title="Recharge factors" description="Average capacity of one structure and the number of times it fills in the monsoon." footer={<div className="flex justify-end gap-2"><ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton><ActionButton loading={state.busy} disabled={!factors} onClick={save}>Save</ActionButton></div>}>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {!factors ? <Skeleton className="h-40" /> : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500"><tr><th scope="col" className="py-1">Activity</th><th scope="col" className="w-28 py-1 text-right">Capacity (cu.m)</th><th scope="col" className="w-20 py-1 text-right">Refills</th></tr></thead>
          <tbody>
            {Object.entries(factors).map(([key, f]) => (
              <tr key={key}>
                <th scope="row" className="py-1.5 pr-2 text-left font-medium">{nameOf[key] || key}</th>
                <td className="py-1.5 pl-2"><CountInput id={`f-${key}-c`} decimals={3} value={f.capacity} onChange={(v) => setFactors((all) => ({ ...all, [key]: { ...all[key], capacity: v } }))} /></td>
                <td className="py-1.5 pl-2"><CountInput id={`f-${key}-r`} value={f.refills} onChange={(v) => setFactors((all) => ({ ...all, [key]: { ...all[key], refills: v } }))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Dialog>
  );
}

/** Village, block and district reports — each with its weekly statements. */
function Reports({ campaign, setCampaign, stateWide }) {
  const base = useRoleBase();
  const [filters, setFilters] = useState({ level: '', district: '', search: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });

  useEffect(() => {
    const timer = setTimeout(() => { setFilters((f) => (f.search === search ? f : { ...f, search })); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let live = true;
    setBox((b) => ({ ...b, loading: true, error: '' }));
    fetchJsaReports({ campaign, ...filters, page, limit: 30 })
      .then((data) => live && setBox((b) => ({ ...b, data, loading: false })))
      .catch((err) => live && setBox((b) => ({ ...b, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [campaign, filters, page, box.attempt]);
  const set = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };

  return (
    <section className={card}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect id="jr-campaign" label="Campaign" value={campaign} onChange={setCampaign} options={campaignYears()} />
          <FilterSelect id="jr-level" label="Type" value={filters.level} onChange={(v) => set('level', v)} allLabel="Village, block and district" options={Object.entries(JSA_LEVELS).map(([value, label]) => ({ value, label }))} />
          {stateWide && <FilterSelect id="jr-district" label="District" value={filters.district} onChange={(v) => set('district', v)} allLabel="All districts" options={DISTRICTS} />}
          <label htmlFor="jr-search" className="flex flex-col gap-1 text-xs font-medium text-slate-500">Search<input id="jr-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Village, block or stream" className="w-56 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" /></label>
        </div>
        {box.data?.permissions?.canCreate && <Link href={`${base}/jsa/report/new?campaign=${campaign}`} className={linkButton}><Plus className="h-4 w-4" aria-hidden="true" />New report</Link>}
      </header>
      {box.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading reports">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
      {!box.loading && box.error && <div className="p-5"><Notice tone="error" title="Unable to load JSA reports." action={<RetryButton onClick={() => setBox((b) => ({ ...b, attempt: b.attempt + 1 }))} />}>{box.error}</Notice></div>}
      {!box.loading && !box.error && (box.data?.items?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-2.5">Place</th>
                <th scope="col" className="px-3 py-2.5">Type</th>
                <th scope="col" className="px-3 py-2.5">Latest statement</th>
                <th scope="col" className="px-3 py-2.5 text-right">Check dams (T / P)</th>
                <th scope="col" className="px-3 py-2.5 text-right">Recharge pits (T / P)</th>
                <th scope="col" className="px-5 py-2.5 text-right">Plantation Ha (T / P)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {box.data.items.map((rep) => {
                const a = rep.latest?.activities || {};
                const pair = (k) => (rep.latest ? `${num(a[k]?.target)} / ${num(a[k]?.progress)}` : '—');
                return (
                  <tr key={rep.id} className="hover:bg-slate-50/60">
                    <th scope="row" className="px-5 py-3 text-left font-normal"><Link href={`${base}/jsa/report/${rep.id}`} className="font-semibold text-navy hover:underline">{rep.placeName}</Link><span className="block text-xs text-slate-500">{rep.district}</span></th>
                    <td className="px-3 py-3"><LevelTag level={rep.level} /></td>
                    <td className="px-3 py-3">{rep.latest ? <>As on {day(rep.latest.asOnDate)}<span className="block text-xs text-slate-500">{rep.statements} weekly statement{rep.statements === 1 ? '' : 's'}</span></> : <span className="text-amber-700">No progress yet</span>}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{pair('checkDam')}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{pair('rechargePit')}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{pair('plantationHa')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <p className="px-5 py-12 text-center text-sm text-slate-500">No JSA report for {campaign}{filters.level || filters.search || filters.district ? ' with these filters' : ''}.{box.data?.permissions?.canCreate ? ' Use “New report” to start a village, block or district report.' : ''}</p>)}
      {box.data?.pagination?.totalPages > 1 && <div className="border-t border-slate-100 px-5 py-3"><Pagination currentPage={box.data.pagination.page} totalPages={box.data.pagination.totalPages} totalItems={box.data.pagination.total} limit={30} onPageChange={setPage} /></div>}
    </section>
  );
}

/**
 * Jal Sanrakshan Abhiyan progress (Prarup-03). The District Maker keeps a
 * report per village, block or district and adds progress every week; HQ and
 * M&E see the consolidated report and the potential recharge.
 */
export function JsaHub() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [campaign, setCampaign] = useState(String(new Date().getFullYear()));
  const stateWide = [USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(user?.role);
  const districtMaker = user?.role === USER_ROLES.DD_LEVEL && workflowRoleOf(user) === 'MAKER';
  const tabs = districtMaker
    ? [{ id: 'reports', label: 'Village / Block / District reports' }, { id: 'progress', label: 'Prarup-03 progress' }]
    : [{ id: 'progress', label: 'Prarup-03 progress' }, { id: 'reports', label: 'Village / Block / District reports' }];
  const requested = params.get('tab');
  const tab = tabs.some((t) => t.id === requested) ? requested : tabs[0].id;
  const choose = (id) => router.replace(`${pathname}?tab=${id}`, { scroll: false });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 pb-16 sm:p-6">
      <PageHeader icon={Droplets} title="Jal Sanrakshan Abhiyan — progress" subtitle={`जल संरक्षण अभियान · weekly progress Prarup-03 · ${stateWide ? 'all districts' : user?.district || ''}`} />
      <Tabs tabs={tabs} value={tab} onChange={choose} label="JSA sections" />
      {tab === 'progress' ? <Progress campaign={campaign} setCampaign={setCampaign} stateWide={stateWide} /> : <Reports campaign={campaign} setCampaign={setCampaign} stateWide={stateWide} />}
    </div>
  );
}
