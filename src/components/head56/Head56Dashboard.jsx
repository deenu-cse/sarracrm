"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, CalendarCheck, IndianRupee, PiggyBank, Wallet } from 'lucide-react';
import { fetchH56Dashboard } from '@/lib/head56Api';
import { DISTRICTS } from '@/constants/districts';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { Badge } from '@/components/ui/Badge';
import { CellMeter, ComparisonChart, DataTable, EmptyState, Kpi, Panel, TrendChart } from '@/components/analytics/AnalyticsParts';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { Head56ReviewPanel } from './Head56Review';
import { FilterSelect, FY_MONTHS, LevelPill, Tabs, amount, fyOptions, lakh, pct, qty, useH56Base } from './shared';

const utilTone = (value) => (value > 100 ? 'red' : value >= 90 ? 'amber' : 'emerald');
const moneyColumns = [
  { key: 'budgetLakh', label: 'Budget', align: 'right', render: (r) => amount(r.budgetLakh) },
  { key: 'spentLakh', label: 'Expenditure', align: 'right', render: (r) => amount(r.spentLakh) },
  { key: 'balanceLakh', label: 'Balance', align: 'right', render: (r) => <span className={r.balanceLakh < 0 ? 'font-semibold text-red-700' : ''}>{amount(r.balanceLakh)}</span> },
  { key: 'utilisationPercent', label: 'Utilisation', align: 'right', render: (r) => <CellMeter percent={r.utilisationPercent} tone={utilTone(r.utilisationPercent)} /> },
];

/**
 * Head 56 dashboard (HQ: State; District: its Centre and PIAs; PIA: its own unit):
 * budget, expenditure, balance and utilisation, by head, sub-head, district, PIA
 * and month, physical target against achievement, reporting status and the
 * monthly CEO / ACEO / CFO review.
 */
export function Head56Dashboard({ financialYear, onYearChange }) {
  const base = useH56Base();
  const { user } = useAuth();
  const stateWide = [USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(user?.role);
  const [filters, setFilters] = useState({ month: '', district: '', level: '', verifiedOnly: false });
  const [view, setView] = useState('heads');
  const [cumulative, setCumulative] = useState(false);
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });

  useEffect(() => {
    let live = true;
    setBox((current) => ({ ...current, loading: true, error: '' }));
    fetchH56Dashboard({ financialYear, ...filters })
      .then((data) => live && setBox((current) => ({ ...current, data, loading: false })))
      .catch((err) => live && setBox((current) => ({ ...current, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [financialYear, filters, box.attempt]);

  const set = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const reload = () => setBox((current) => ({ ...current, attempt: current.attempt + 1 }));
  const data = box.data;
  const k = data?.kpis;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm" aria-label="Filters">
        <FilterSelect id="h56-fy" label="Financial year" value={financialYear} onChange={onYearChange} options={fyOptions()} />
        <FilterSelect id="h56-month" label="Up to month" value={filters.month} onChange={(v) => set('month', v)} allLabel="Year to date" options={FY_MONTHS} />
        {stateWide && <FilterSelect id="h56-district" label="District" value={filters.district} onChange={(v) => set('district', v)} allLabel="All districts" options={DISTRICTS} />}
        {user?.role !== USER_ROLES.PIA_OFFICER && <FilterSelect id="h56-level" label="Level" value={filters.level} onChange={(v) => set('level', v)} allLabel="All levels" options={[{ value: 'HQ', label: 'SARRA HQ' }, { value: 'DISTRICT', label: 'District SARRA Centres' }, { value: 'PIA', label: 'PIAs' }]} />}
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" checked={filters.verifiedOnly} onChange={(event) => set('verifiedOnly', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />
          Verified by State only
        </label>
      </section>

      {box.loading && !data && <div className="space-y-4" role="status" aria-label="Loading dashboard"><div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{[0, 1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-24" />)}</div><Skeleton className="h-72" /></div>}
      {box.error && <Notice tone="error" title="Unable to load the dashboard." action={<RetryButton onClick={reload} />}>{box.error}</Notice>}

      {data && (
        <div className={`space-y-5 transition-opacity ${box.loading ? 'opacity-60' : ''}`}>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <Kpi icon={Wallet} label="Total budget (Head 56)" value={lakh(k.budgetLakh)} sub={k.deptShareLakh ? `+ dept. share ${lakh(k.deptShareLakh)}` : `${k.units} unit${k.units === 1 ? '' : 's'} allocated`} />
            <Kpi icon={IndianRupee} label="Total expenditure" value={lakh(k.spentLakh)} sub={`Verified ${lakh(k.verifiedLakh)}`} />
            <Kpi icon={PiggyBank} label="Available balance" value={lakh(k.balanceLakh)} tone={k.balanceLakh < 0 ? 'danger' : 'default'} />
            <Kpi icon={Activity} label="Utilisation" value={pct(k.utilisationPercent)} meter={k.utilisationPercent} tone={k.utilisationPercent > 100 ? 'danger' : 'success'} sub="Expenditure ÷ approved budget" />
            <Kpi icon={CalendarCheck} label={`Reports — ${data.focus.label}`} value={`${k.unitsFiled} / ${k.units}`} sub={`${k.unitsVerified} verified · ${k.unitsMissing} not filed`} tone={k.unitsMissing ? 'warning' : 'success'} />
            <Kpi icon={AlertTriangle} label="In approval chain" value={k.inReview} sub={k.allocationsPending ? `${k.allocationsPending} allocation(s) awaiting HQ` : 'Reports waiting for a step'} tone={k.inReview ? 'warning' : 'default'} />
          </dl>

          <div className="grid gap-5 xl:grid-cols-5">
            <Panel className="xl:col-span-3" title="Monthly expenditure trend" description={`${data.financialYear}, ₹ lakh${data.verifiedOnly ? ' — verified reports only' : ''}`} aside={(
              <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs font-semibold" role="group" aria-label="Trend view">
                {[[false, 'Monthly'], [true, 'Cumulative']].map(([value, label]) => <button key={label} type="button" onClick={() => setCumulative(value)} aria-pressed={cumulative === value} className={`rounded-md px-2.5 py-1 ${cumulative === value ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}
              </div>
            )}>
              {data.trend.length ? <div className="h-72"><TrendChart data={data.trend.map((m) => ({ ...m, cumulativeSpentLakh: m.cumulativeLakh }))} cumulative={cumulative} /></div> : <EmptyState>No month of this year has started.</EmptyState>}
            </Panel>
            <Panel className="xl:col-span-2" title="Budget against expenditure by level" description="SARRA HQ, District SARRA Centres and PIAs">
              {data.byLevel.length ? <ComparisonChart rows={data.byLevel.map((l) => ({ ...l, name: l.label }))} /> : <EmptyState>No published allocation.</EmptyState>}
            </Panel>
          </div>

          <Panel title="Reports" padded={false} aside={<Tabs label="Report views" value={view} onChange={setView} tabs={[
            { id: 'heads', label: 'Head-wise' }, { id: 'subheads', label: 'Sub-head-wise' }, ...(data.scope.level === 'PIA' ? [] : [{ id: 'districts', label: 'District-wise' }]),
            { id: 'pias', label: 'PIA-wise' }, { id: 'physical', label: 'Physical progress' }, { id: 'status', label: `Reporting status — ${data.focus.label}` },
          ]} />}>
            {view === 'heads' && (
              <DataTable csvName={`Head56-headwise-${data.financialYear}.csv`} caption="Head-wise budget and expenditure" rowKey={(r) => r.code} defaultSort={{ key: 'code', direction: 'asc' }} rows={data.byGroup} minWidth={800}
                columns={[{ key: 'code', label: 'Head' }, { key: 'name', label: 'Sub-head', render: (r) => <span>{r.name}{r.nameHindi && <span className="block text-xs text-slate-500">{r.nameHindi}</span>}</span> }, ...moneyColumns]} />
            )}
            {view === 'subheads' && (
              <DataTable csvName={`Head56-subheadwise-${data.financialYear}.csv`} caption="Sub-head-wise budget and expenditure" rowKey={(r) => r.code} defaultSort={{ key: 'code', direction: 'asc' }} rows={data.bySubHead}
                columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Line', render: (r) => <span>{r.name}{r.groupName && <span className="block text-xs text-slate-500">{r.groupName}</span>}</span> }, ...moneyColumns]} />
            )}
            {view === 'districts' && (
              <DataTable csvName={`Head56-districtwise-${data.financialYear}.csv`} caption="District-wise budget and expenditure" rowKey={(r) => r.district} defaultSort={{ key: 'district', direction: 'asc' }} rows={data.byDistrict} emptyText="No district in this selection."
                columns={[{ key: 'district', label: 'District' }, { key: 'units', label: 'Units', align: 'right' }, ...moneyColumns.slice(0, 2), { key: 'dscSpentLakh', label: 'DSC exp.', align: 'right', render: (r) => amount(r.dscSpentLakh) }, { key: 'piaSpentLakh', label: 'PIA exp.', align: 'right', render: (r) => amount(r.piaSpentLakh) }, ...moneyColumns.slice(2), { key: 'verifiedReports', label: 'Verified reports', align: 'right' }]} />
            )}
            {view === 'pias' && (
              <DataTable csvName={`Head56-PIAwise-${data.financialYear}.csv`} caption="PIA-wise budget and expenditure" rowKey={(r) => r.unitKey} defaultSort={{ key: 'district', direction: 'asc' }} rows={data.byPia} emptyText="No PIA has a published Head 56 allocation in this selection."
                columns={[{ key: 'departmentName', label: 'PIA (department)' }, { key: 'district', label: 'District' }, { key: 'deptShareLakh', label: 'Dept. share', align: 'right', render: (r) => amount(r.deptShareLakh) }, ...moneyColumns, { key: 'lastPeriod', label: 'Latest report', render: (r) => (r.lastStatus ? <span className="flex flex-col gap-1">{r.lastPeriod}<Badge status={r.lastStatus} /></span> : <span className="text-slate-400">None</span>) }]} />
            )}
            {view === 'physical' && (
              <DataTable csvName={`Head56-physical-${data.financialYear}.csv`} caption="Physical target against achievement" rowKey={(r) => r.code} defaultSort={{ key: 'code', direction: 'asc' }} rows={data.physical} emptyText="No line with a physical target in this selection."
                columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Line' }, { key: 'unit', label: 'Unit' }, { key: 'physicalTarget', label: 'Target', align: 'right', render: (r) => qty(r.physicalTarget) }, { key: 'physicalAchieved', label: 'Achieved', align: 'right', render: (r) => qty(r.physicalAchieved) }, { key: 'physicalPercent', label: 'Achievement', align: 'right', render: (r) => <CellMeter percent={r.physicalPercent} tone="navy" /> }]} />
            )}
            {view === 'status' && (
              <DataTable csvName={`Head56-reporting-${data.focus.reportingMonth}-${data.financialYear}.csv`} caption="Reporting status of every allocated unit" rowKey={(r) => r.unitKey} defaultSort={{ key: 'level', direction: 'asc' }} rows={data.reporting} emptyText="No unit has a published allocation."
                columns={[
                  { key: 'unitName', label: 'Unit', render: (r) => (r.mprId ? <Link href={`${base}/report/${r.mprId}`} className="font-semibold text-navy hover:underline">{r.unitName}</Link> : r.unitName) },
                  { key: 'level', label: 'Level', render: (r) => <LevelPill level={r.level} label={r.levelLabel} /> },
                  { key: 'statusLabel', label: 'Status', render: (r) => (r.status === 'NOT_FILED' ? <span className="font-semibold text-red-700">Not filed</span> : <span className="flex flex-col gap-1"><Badge status={r.status} />{r.awaiting && <span className="text-xs text-slate-500">With {r.awaiting}</span>}</span>) },
                  { key: 'spentLakh', label: 'Expenditure in month', align: 'right', render: (r) => amount(r.spentLakh) },
                ]} />
            )}
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Reports in the approval chain" description="Head 56 reports waiting at each step">
              <ul className="divide-y divide-slate-100">
                {data.pendingByStage.map((stage) => (
                  <li key={stage.status} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span><span className={`mr-2 inline-block w-16 text-[10px] font-bold uppercase tracking-wider ${stage.tier === 'HQ' ? 'text-indigo-700' : stage.tier === 'DISTRICT' ? 'text-cyan-700' : 'text-amber-700'}`}>{stage.tier}</span>{stage.owner}</span>
                    <span className={`tabular-nums ${stage.count ? 'font-bold text-slate-900' : 'text-slate-400'}`}>{stage.count}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Head56ReviewPanel dashboard={data} financialYear={financialYear} onChanged={reload} />
          </div>
        </div>
      )}
    </div>
  );
}
