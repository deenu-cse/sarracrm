"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, BarChart3, Building2, ClipboardList, FolderKanban, IndianRupee, RefreshCw, Target, UserCheck, Wallet, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SANCTION_STATUS_LABELS, PROJECT_MPR_STATUS_LABELS } from '@/constants/status';
import { PendingStages } from '@/components/home/HomeKit';
import { fetchProjectAnalytics } from '@/lib/mprApi';
import { formatIndian, formatLakh } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { CellMeter, ComparisonChart, DataTable, EmptyState, Kpi, Panel, TrendChart } from './AnalyticsParts';
import { DistrictMap } from './DistrictMap';
import { OutcomesAnalytics } from './OutcomesAnalytics';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'map', label: 'Map View' },
  { id: 'districts', label: 'Districts' },
  { id: 'departments', label: 'Departments & Heads' },
  { id: 'pia', label: 'PIA-wise' },
  { id: 'funds', label: 'Funds' },
  { id: 'activities', label: 'Activities' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'outcomes', label: 'Outcomes' },
];

const MPR_STATUS_OPTIONS = Object.entries(PROJECT_MPR_STATUS_LABELS).filter(([key]) => key !== 'DRAFT');
const PROJECT_STATUS_OPTIONS = ['PENDING_CHECKER', 'PENDING_APPROVER', 'SANCTIONED', 'FORWARDED_TO_DISTRICT', 'DISTRICT_ACCEPTED', 'FORWARDED_TO_PIA', 'PIA_ACCEPTED', 'REJECTED'];
const EMPTY_FILTERS = { financialYear: '', month: '', district: '', department: '', headCode: '', projectStatus: '', mprStatus: '' };

const selectClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-[border-color,box-shadow] duration-150 hover:border-slate-400 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20';
const date = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${selectClass} ${value ? 'border-navy/60 font-medium' : ''}`}>
        {children}
      </select>
    </div>
  );
}

const moneyColumns = [
  { key: 'budgetLakh', label: 'Sanctioned', align: 'right', render: (r) => formatLakh(r.budgetLakh) },
  { key: 'spentLakh', label: 'Spent', align: 'right', render: (r) => formatLakh(r.spentLakh) },
  { key: 'balanceLakh', label: 'Balance', align: 'right', render: (r) => formatLakh(r.balanceLakh) },
  { key: 'spendPercent', label: 'Financial', align: 'right', render: (r) => <CellMeter percent={r.spendPercent} tone="emerald" /> },
  { key: 'physicalPercent', label: 'Physical', align: 'right', render: (r) => <CellMeter percent={r.physicalPercent} /> },
];
const reportColumns = [
  { key: 'reports', label: 'Reports', align: 'right' },
  { key: 'atPia', label: 'At PIA', align: 'right' },
  { key: 'atDistrict', label: 'At District', align: 'right' },
  { key: 'atHq', label: 'At HQ', align: 'right' },
  { key: 'verified', label: 'Verified', align: 'right' },
];

function UnitList({ rows, extra, empty }) {
  if (!rows.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((row) => (
        <li key={`${row.projectId}-${row.department}`} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{row.department} <span className="font-normal text-slate-500">· {row.district}</span></p>
            <p className="truncate text-xs text-slate-500"><span className="font-mono">{row.projectCode}</span> — {row.projectName}</p>
          </div>
          {extra && <div className="text-right text-xs tabular-nums text-slate-700">{extra(row)}</div>}
        </li>
      ))}
    </ul>
  );
}

/**
 * State-wide analytics for SARRA HQ and the M&E administrator: projects,
 * expenditure against the sanctioned allocation, physical progress against
 * approved DPR targets, the three-tier verification of monthly reports and
 * reporting discipline, across every district and PIA.
 *
 * Every figure is calculated by the backend for the selected filters. The
 * filters live in the URL, so a view can be bookmarked or shared.
 */
export function ProjectAnalyticsDashboard({ initialFilters = {}, legacyHref, reportHref = (id) => `/dashboard/mnd-admin/mpr/project/${id}` }) {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...initialFilters });
  const [tab, setTab] = useState('overview');
  const [box, setBox] = useState({ data: null, loading: true, error: '' });
  const [cumulative, setCumulative] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(() => {
    const requestId = ++requestRef.current;
    setBox((current) => ({ ...current, loading: true, error: '' }));
    fetchProjectAnalytics(filters)
      .then((data) => { if (requestRef.current === requestId) setBox({ data, loading: false, error: '' }); })
      .catch((err) => { if (requestRef.current === requestId) setBox((current) => ({ data: current.data, loading: false, error: err?.message || 'Unable to load analytics. Please try again.' })); });
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`);
  }, [filters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'financialYear' && !value ? { month: '' } : {}) }));
  const drillTo = (key, value) => { setFilter(key, value); setTab('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const { data } = box;
  const active = Object.entries(filters).filter(([, value]) => value);
  const chipLabels = useMemo(() => ({
    financialYear: (v) => `FY ${v}`, month: (v) => v, district: (v) => v, department: (v) => v,
    headCode: (v) => `Head ${v}`, projectStatus: (v) => SANCTION_STATUS_LABELS[v] || v,
    mprStatus: (v) => MPR_STATUS_OPTIONS.find(([key]) => key === v)?.[1] || v,
  }), []);

  if (!data && box.loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6" role="status" aria-label="Loading analytics">
        <Skeleton className="h-12 w-80" /><Skeleton className="h-24" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, n) => <Skeleton key={n} className="h-24" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!data) {
    return <div className="mx-auto max-w-2xl p-6 pt-10"><Notice tone="error" title="Unable to load analytics." action={<RetryButton onClick={load} />}>{box.error}</Notice></div>;
  }

  const { kpis, options, compliance, attention } = data;
  const scopeNote = filters.financialYear ? `in ${filters.month ? `${filters.month}, ` : ''}FY ${filters.financialYear}` : 'all time';
  const reportTotal = kpis.reports;
  const statusSegments = [
    ['At PIA verification', data.reportStatus.atPia, 'bg-amber-500', ''],
    ['At District verification', data.reportStatus.atDistrict, 'bg-sky-500', ''],
    ['At HQ verification', data.reportStatus.atHq, 'bg-indigo-500', ''],
    ['Verified by State', data.reportStatus.verified, 'bg-emerald-600', 'VERIFIED_BY_STATE'],
    ['Returned for correction', data.reportStatus.returned, 'bg-red-500', 'RETURNED_FOR_CORRECTION'],
  ];
  const pipelineMax = Math.max(1, ...data.pipeline.map((stage) => stage.projects));

  return (
    <div className="mx-auto max-w-[1500px] p-4 pb-16 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><BarChart3 className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">State Analytics</h1>
            <p className="text-sm text-slate-500">Projects, expenditure against the sanctioned allocation and monthly progress across every district and PIA. Amounts in ₹ Lakh.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Updated {new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <button type="button" onClick={load} disabled={box.loading} aria-label="Refresh analytics" className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 transition-[background-color,border-color] duration-150 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${box.loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <section aria-label="Filters" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <FilterSelect id="f-fy" label="Financial Year" value={filters.financialYear} onChange={(v) => setFilter('financialYear', v)}>
            <option value="">All years</option>
            {options.financialYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </FilterSelect>
          <FilterSelect id="f-month" label="Month" value={filters.month} onChange={(v) => setFilter('month', v)}>
            <option value="">All months</option>
            {options.months.map((month) => <option key={month} value={month}>{month}</option>)}
          </FilterSelect>
          <FilterSelect id="f-district" label="District" value={filters.district} onChange={(v) => setFilter('district', v)}>
            <option value="">All districts</option>
            {options.districts.map((district) => <option key={district} value={district}>{district}</option>)}
          </FilterSelect>
          <FilterSelect id="f-department" label="Department" value={filters.department} onChange={(v) => setFilter('department', v)}>
            <option value="">All departments</option>
            {options.departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </FilterSelect>
          <FilterSelect id="f-head" label="Head" value={filters.headCode} onChange={(v) => setFilter('headCode', v)}>
            <option value="">All heads</option>
            {options.heads.map((head) => <option key={head.code} value={head.code}>{head.code} — {head.name}</option>)}
          </FilterSelect>
          <FilterSelect id="f-project-status" label="Project Stage" value={filters.projectStatus} onChange={(v) => setFilter('projectStatus', v)}>
            <option value="">All stages</option>
            {PROJECT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{SANCTION_STATUS_LABELS[status] || status}</option>)}
          </FilterSelect>
          <FilterSelect id="f-mpr-status" label="Report Status" value={filters.mprStatus} onChange={(v) => setFilter('mprStatus', v)}>
            <option value="">All reports</option>
            {MPR_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
        </div>
        {active.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">Showing:</span>
            {active.map(([key, value]) => (
              <button key={key} type="button" onClick={() => setFilter(key, '')} aria-label={`Remove filter ${chipLabels[key](value)}`} className="inline-flex items-center gap-1 rounded-full border border-navy/30 bg-navy/[0.06] py-0.5 pl-2.5 pr-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                {chipLabels[key](value)} <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="ml-1 text-xs font-semibold text-slate-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">Clear all</button>
          </div>
        )}
      </section>

      {box.error && <div className="mt-4"><Notice tone="error" action={<RetryButton onClick={load} />}>{box.error} Showing the last loaded figures.</Notice></div>}

      {/* Headline figures */}
      <dl className={`mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 transition-opacity duration-200 ${box.loading ? 'opacity-60' : ''}`} aria-busy={box.loading}>
        <Kpi icon={FolderKanban} label="Projects" value={formatIndian(kpis.projects)} sub={`${kpis.activeProjects} active · ${kpis.sanctionedProjects} sanctioned · ${data.byDistrict.length} district${data.byDistrict.length === 1 ? '' : 's'}`} />
        <Kpi icon={IndianRupee} label="Sanctioned Budget" value={formatLakh(kpis.budgetLakh)} sub={`SARRA share ${formatLakh(kpis.sarraShareLakh)}`} />
        <Kpi icon={Target} label="Expenditure Reported" value={formatLakh(kpis.spentLakh)} sub={`${kpis.spendPercent}% of sanctioned · ${scopeNote}`} meter={kpis.spendPercent} />
        <Kpi icon={Wallet} label="Balance" value={formatLakh(kpis.balanceLakh)} sub="Sanctioned but not yet reported as spent" tone={kpis.balanceLakh > 0 ? 'warning' : 'default'} />
        <Kpi icon={Target} label="Physical Achievement" value={`${kpis.physicalPercent}%`} sub="Average of each department's latest report" meter={kpis.physicalPercent} tone={kpis.physicalPercent >= 100 ? 'success' : 'default'} />
        <Kpi icon={ClipboardList} label="Progress Reports" value={formatIndian(kpis.reports)} sub={`${kpis.pendingActions} pending action${kpis.pendingActions === 1 ? '' : 's'} · ${kpis.verified} verified`} />
        <Kpi icon={UserCheck} label="PIA Departments" value={`${kpis.piaAccepted} / ${kpis.departments}`} sub={`accepted · ${kpis.piaAssigned} assigned`} meter={kpis.departments ? Math.round((kpis.piaAccepted / kpis.departments) * 100) : 0} />
      </dl>

      {/* Tabs */}
      <div className="mt-6 border-b border-slate-200">
        <div role="tablist" aria-label="Analytics sections" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((item) => {
            const count = item.id === 'funds' ? attention.lagging.length : item.id === 'reporting' ? compliance.missingCount : 0;
            return (
              <button key={item.id} type="button" role="tab" id={`an-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`an-panel-${item.id}`} onClick={() => setTab(item.id)}
                className={`flex flex-shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40 ${tab === item.id ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}>
                {item.label}
                {count > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-800">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div key={tab} role="tabpanel" id={`an-panel-${tab}`} aria-labelledby={`an-tab-${tab}`} className={`wz-fade-in mt-5 space-y-5 transition-opacity duration-200 ${box.loading ? 'opacity-60' : ''}`}>
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <Panel
                className="xl:col-span-2"
                title="Expenditure Reported"
                description={cumulative ? 'Running total over time.' : 'Reported as spent in the monthly progress reports, month by month.'}
                aside={(
                  <div role="group" aria-label="Trend view" className="flex rounded-lg border border-slate-300 p-0.5 text-xs font-semibold">
                    {[['Monthly', false], ['Running total', true]].map(([label, value]) => (
                      <button key={label} type="button" aria-pressed={cumulative === value} onClick={() => setCumulative(value)} className={`rounded-md px-2.5 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${cumulative === value ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
                    ))}
                  </div>
                )}
              >
                {data.monthlyTrend.length === 0 ? <EmptyState>No expenditure reported for these filters.</EmptyState> : (
                  <>
                    <div className="h-72"><TrendChart data={data.monthlyTrend} cumulative={cumulative} /></div>
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer text-xs font-semibold text-navy hover:underline">View as table</summary>
                      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full min-w-[520px] text-sm">
                          <thead><tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"><th scope="col" className="px-3 py-2">Month</th><th scope="col" className="px-3 py-2 text-right">Spent</th><th scope="col" className="px-3 py-2 text-right">Running total</th><th scope="col" className="px-3 py-2 text-right">Reports</th><th scope="col" className="px-3 py-2 text-right">Verified</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.monthlyTrend.map((row) => (
                              <tr key={row.period}><th scope="row" className="px-3 py-1.5 text-left font-medium text-slate-900">{row.period}</th><td className="px-3 py-1.5 text-right tabular-nums">{formatLakh(row.spentLakh)}</td><td className="px-3 py-1.5 text-right tabular-nums">{formatLakh(row.cumulativeSpentLakh)}</td><td className="px-3 py-1.5 text-right tabular-nums">{row.reports}</td><td className="px-3 py-1.5 text-right tabular-nums">{row.verified}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </>
                )}
              </Panel>

              <Panel title="Progress Reports by Status" description={`${reportTotal} report${reportTotal === 1 ? '' : 's'} ${scopeNote}.`}>
                {reportTotal === 0 ? <EmptyState>No reports for these filters.</EmptyState> : (
                  <>
                    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Share of reports by status">
                      {statusSegments.filter(([, count]) => count > 0).map(([label, count, color]) => <div key={label} className={`h-full ${color}`} style={{ width: `${(count / reportTotal) * 100}%` }} />)}
                    </div>
                    <ul className="mt-4 space-y-1">
                      {statusSegments.map(([label, count, color, status]) => (
                        <li key={label}>
                          <button type="button" disabled={!status} onClick={() => setFilter('mprStatus', filters.mprStatus === status ? '' : status)} aria-pressed={Boolean(status) && filters.mprStatus === status}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${filters.mprStatus === status ? 'bg-navy/[0.06]' : ''}`}>
                            <span className="flex items-center gap-2 text-slate-700"><span className={`h-2.5 w-2.5 rounded-sm ${color}`} aria-hidden="true" />{label}</span>
                            <span className="font-semibold tabular-nums text-slate-900">{count}<span className="ml-1.5 text-xs font-normal text-slate-500">{Math.round((count / reportTotal) * 100)}%</span></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[11px] text-slate-400">Select a final status to filter the whole page, or use the Report Status filter for a single step.</p>
                  </>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <Panel className="xl:col-span-2" title="Project Pipeline" description="Projects at each stage, from creation to active reporting. Select a stage to filter.">
                <ul className="space-y-2">
                  {data.pipeline.map((stage) => (
                    <li key={stage.status}>
                      <button type="button" onClick={() => setFilter('projectStatus', filters.projectStatus === stage.status ? '' : stage.status)} aria-pressed={filters.projectStatus === stage.status}
                        className={`grid w-full grid-cols-12 items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${filters.projectStatus === stage.status ? 'bg-navy/[0.06]' : ''}`}>
                        <span className="col-span-5 truncate text-slate-700 sm:col-span-4">{SANCTION_STATUS_LABELS[stage.status] || stage.status}</span>
                        <span className="col-span-4 sm:col-span-5" aria-hidden="true"><span className="block h-2.5 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full transition-[width] duration-500 ${stage.status === 'REJECTED' ? 'bg-red-500' : 'bg-navy'}`} style={{ width: `${(stage.projects / pipelineMax) * 100}%` }} /></span></span>
                        <span className="col-span-1 text-right font-semibold tabular-nums text-slate-900">{stage.projects}</span>
                        <span className="col-span-2 text-right text-xs tabular-nums text-slate-500">{formatLakh(stage.budgetLakh)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Needs Attention" description="Open the tab for the full list.">
                <ul className="space-y-2">
                  {[
                    ['Departments spending well ahead of physical progress', attention.lagging.length, 'funds'],
                    [`Departments that did not report for ${compliance.period}`, compliance.missingCount, 'reporting'],
                    ['Departments without PIA or reporting responsibility', attention.unassignedCount, 'reporting'],
                    ['Reports pending a Maker, Checker or Approver action', kpis.pendingActions, 'reporting'],
                    ['Reports returned for correction', data.reportStatus.returned, 'reporting'],
                  ].map(([label, count, target]) => (
                    <li key={label}>
                      <button type="button" onClick={() => setTab(target)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                        <span className="flex items-start gap-2 text-slate-700">
                          {count > 0 && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" aria-hidden="true" />}{label}
                        </span>
                        <span className={`font-bold tabular-nums ${count > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </>
        )}

        {tab === 'map' && (
          <Panel title="District Map" description="Each district coloured by the figure you choose, for the filters above.">
            <DistrictMap rows={data.byDistrict} selected={filters.district} onSelect={(name) => setFilter('district', filters.district === name ? '' : name)} />
          </Panel>
        )}

        {tab === 'outcomes' && <OutcomesAnalytics district={filters.district} headCode={filters.headCode} />}

        {tab === 'districts' && (
          <>
            <Panel title="District Comparison" description="Sanctioned amount and expenditure reported for each of the 13 districts.">
              {data.byDistrict.length === 0 ? <EmptyState>No districts for these filters.</EmptyState> : <ComparisonChart rows={data.byDistrict} />}
            </Panel>
            <Panel title="District-wise Detail" description="Select a district to filter the whole page to it." padded={false}>
              <DataTable
                rows={data.byDistrict}
                caption="Figures for each district"
                csvName="district_analytics.csv"
                rowKey={(row) => row.name}
                rowLabel={(row) => `Filter to ${row.name}`}
                onRowClick={(row) => drillTo('district', row.name)}
                defaultSort={{ key: 'budgetLakh', direction: 'desc' }}
                minWidth={1180}
                columns={[
                  { key: 'name', label: 'District', render: (r) => <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{r.name}</span> },
                  { key: 'projects', label: 'Projects', align: 'right' },
                  { key: 'departments', label: 'Depts', align: 'right' },
                  ...moneyColumns.map((c) => ({ ...c, csv: (r) => r[c.key] })),
                  ...reportColumns,
                ]}
              />
            </Panel>
          </>
        )}

        {tab === 'departments' && (
          <>
            <Panel title="Department Comparison" description="Each department across all its projects.">
              {data.byDepartment.length === 0 ? <EmptyState>No departments for these filters.</EmptyState> : <ComparisonChart rows={data.byDepartment} />}
            </Panel>
            <Panel title="Department-wise Detail" description="Select a department to filter the whole page to it." padded={false}>
              <DataTable
                rows={data.byDepartment}
                caption="Figures for each department"
                csvName="department_analytics.csv"
                rowKey={(row) => row.name}
                rowLabel={(row) => `Filter to ${row.name}`}
                onRowClick={(row) => drillTo('department', row.name)}
                defaultSort={{ key: 'budgetLakh', direction: 'desc' }}
                minWidth={1180}
                columns={[
                  { key: 'name', label: 'Department' },
                  { key: 'projects', label: 'Projects', align: 'right' },
                  { key: 'piaAccepted', label: 'PIA Accepted', align: 'right', render: (r) => `${r.piaAccepted} / ${r.departments}`, csv: (r) => `${r.piaAccepted}/${r.departments}` },
                  ...moneyColumns.map((c) => ({ ...c, csv: (r) => r[c.key] })),
                  ...reportColumns,
                ]}
              />
            </Panel>
            <Panel title="Head-wise Detail" description="Budget heads 55-01 to 55-04." padded={false}>
              <DataTable
                rows={data.byHead}
                caption="Figures for each budget head"
                csvName="head_analytics.csv"
                rowKey={(row) => row.name}
                defaultSort={{ key: 'name', direction: 'asc' }}
                minWidth={1000}
                columns={[{ key: 'name', label: 'Head' }, { key: 'projects', label: 'Projects', align: 'right' }, ...moneyColumns.map((c) => ({ ...c, csv: (r) => r[c.key] })), { key: 'reports', label: 'Reports', align: 'right' }]}
              />
            </Panel>
          </>
        )}

        {tab === 'pia' && (
          <Panel title="PIA-wise Physical and Financial Performance" description="Each PIA Maker on each department and district, for the filters above." padded={false}>
            <DataTable
              rows={data.byPia}
              caption="Figures for each PIA"
              csvName="pia_analytics.csv"
              rowKey={(row) => row.name}
              defaultSort={{ key: 'budgetLakh', direction: 'desc' }}
              minWidth={1180}
              columns={[
                { key: 'name', label: 'PIA' },
                { key: 'projects', label: 'Projects', align: 'right' },
                ...moneyColumns.map((c) => ({ ...c, csv: (r) => r[c.key] })),
                ...reportColumns,
              ]}
            />
          </Panel>
        )}

        {tab === 'funds' && (
          <>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Sanctioned Amount" value={formatLakh(kpis.budgetLakh)} sub={`SARRA share ${formatLakh(kpis.sarraShareLakh)}`} />
              <Kpi label="Expenditure" value={formatLakh(kpis.spentLakh)} sub={`${kpis.spendPercent}% of sanctioned`} meter={kpis.spendPercent} />
              <Kpi label="Balance" value={formatLakh(kpis.balanceLakh)} sub={filters.financialYear ? 'Against expenditure in the selected period' : 'Of the sanctioned amount'} />
              <Kpi label="Physical Achievement" value={`${kpis.physicalPercent}%`} sub="Against approved DPR targets" meter={kpis.physicalPercent} />
            </dl>
            <Panel title="Spending Well Ahead of Physical Progress" description="Departments whose latest report shows financial progress at least 25 points ahead of physical progress.">
              <UnitList rows={attention.lagging} empty="No department's spending is far ahead of its physical progress."
                extra={(row) => <><span className="block font-semibold text-amber-700">{row.financialPercent}% financial</span>{row.physicalPercent}% physical</>} />
            </Panel>
          </>
        )}

        {tab === 'activities' && (
          <Panel title="Activity-wise Progress" description={`Planned targets across the selected projects against progress reported ${scopeNote}. Largest financial targets first.`} padded={false}>
            <DataTable
              rows={data.activityProgress}
              caption="Planned and achieved figures for each activity"
              csvName="activity_analytics.csv"
              rowKey={(row) => row.name}
              defaultSort={{ key: 'financialTargetLakh', direction: 'desc' }}
              minWidth={1080}
              columns={[
                { key: 'name', label: 'Activity', render: (r) => <>{r.name}<span className="block text-xs font-normal text-slate-500">Unit: {r.unit || '—'} · {r.departments} department plan{r.departments === 1 ? '' : 's'}</span></> },
                { key: 'physicalTarget', label: 'Physical Target', align: 'right', render: (r) => (r.physicalTarget > 0 ? formatIndian(r.physicalTarget, { maxDecimals: 3 }) : '—') },
                { key: 'physicalDone', label: 'Achieved', align: 'right', render: (r) => (r.physicalTarget > 0 ? formatIndian(r.physicalDone, { maxDecimals: 3 }) : '—') },
                { key: 'physicalPercent', label: 'Physical %', align: 'right', render: (r) => (r.physicalTarget > 0 ? <CellMeter percent={r.physicalPercent} /> : '—') },
                { key: 'financialTargetLakh', label: 'Financial Target', align: 'right', render: (r) => formatLakh(r.financialTargetLakh) },
                { key: 'financialDoneLakh', label: 'Spent', align: 'right', render: (r) => formatLakh(r.financialDoneLakh) },
                { key: 'financialPercent', label: 'Financial %', align: 'right', render: (r) => <CellMeter percent={r.financialPercent} tone="emerald" /> },
              ]}
            />
          </Panel>
        )}

        {tab === 'reporting' && (
          <>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <Panel title={`Reporting Compliance — ${compliance.period}`} description="Departments ready for reporting (PIA accepted, or district reporting assigned) that filed a report for the last completed month.">
                <p className="text-3xl font-bold tabular-nums text-slate-900">{compliance.percent}%</p>
                <p className="text-xs text-slate-500">{compliance.filed} of {compliance.expected} departments reported</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`Compliance ${compliance.percent}%`}>
                  <div className={`h-full rounded-full transition-[width] duration-500 ${compliance.percent >= 90 ? 'bg-emerald-600' : compliance.percent >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${compliance.percent}%` }} />
                </div>
              </Panel>
              <Panel className="xl:col-span-2" title={`Did Not Report for ${compliance.period}`} description={compliance.missingCount > compliance.missing.length ? `Showing ${compliance.missing.length} of ${compliance.missingCount}.` : undefined}>
                <UnitList rows={compliance.missing} empty={compliance.expected ? 'Every department reported.' : 'No department was due to report for that month.'} />
              </Panel>
            </div>
            <Panel title="Pending Maker, Checker and Approver actions" description="Reports waiting at each step of the three tiers, with the longest wait.">
              <PendingStages stages={data.pendingByStage} />
            </Panel>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <Panel className="xl:col-span-2" title="Latest Progress Reports" description="Most recently submitted, for the selected filters." padded={false}>
                {data.recentReports.length === 0 ? <div className="p-5"><EmptyState>No reports for these filters.</EmptyState></div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm">
                      <thead><tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th scope="col" className="px-5 py-2.5">Report</th><th scope="col" className="px-3 py-2.5">District / Department</th><th scope="col" className="px-3 py-2.5 text-right">Spent</th><th scope="col" className="px-3 py-2.5 text-right">Physical</th><th scope="col" className="px-3 py-2.5">Status</th><th scope="col" className="px-5 py-2.5">Submitted</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.recentReports.map((report) => (
                          <tr key={report.id} className="transition-colors hover:bg-slate-50/60">
                            <th scope="row" className="px-5 py-2.5 text-left">
                              <Link href={reportHref(report.id)} className="font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">{report.period}</Link>
                              <span className="block font-mono text-xs font-normal text-slate-500">{report.mprNo}</span>
                            </th>
                            <td className="px-3 py-2.5 text-slate-700">{report.district} · {report.department}<span className="block font-mono text-xs text-slate-400">{report.projectCode}</span></td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{formatLakh(report.spentLakh)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{report.physicalPercent}%</td>
                            <td className="px-3 py-2.5"><Badge status={report.status} /></td>
                            <td className="px-5 py-2.5 text-xs text-slate-600">{report.submittedBy || '—'}<span className="block text-slate-400">{date(report.submittedAt)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
              <Panel title="Waiting for PIA / Reporting Assignment" description="Departments on district-accepted projects that are not yet ready for reporting.">
                <UnitList rows={attention.unassigned} empty="Every department is ready for reporting." />
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
