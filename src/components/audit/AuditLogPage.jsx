"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, BadgeCheck, Ban, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, FolderKanban, IndianRupee, KeyRound, Lock, LogIn,
  RotateCcw, ScrollText, Search, Settings, Users, X,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { formatLakh } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { ExportButton, downloadCsv } from '@/components/projects/detail/shared';
import BusinessAuditView from '@/components/review/BusinessAuditView';

/** What each recorded action means, in words, and which group it belongs to. */
const ACTIONS = {
  GENERATE_PROJECT_ID: ['Project ID generated', 'projects'], CREATE_SANCTION: ['Project created / resubmitted', 'projects'], CHECKER_VERIFY_SANCTION: ['Verified by Checker', 'projects'],
  APPROVE_SANCTION: ['Approved by Approver', 'projects'], REJECT_SANCTION: ['Rejected', 'projects'], FORWARD_SANCTION_TO_DISTRICT: ['Forwarded to district', 'projects'],
  DISTRICT_ACCEPT_SANCTION: ['Accepted by district', 'projects'], FORWARD_SANCTION_TO_PIA: ['PIA officers assigned', 'projects'], PIA_ACCEPT_SANCTION: ['Accepted by PIA officer', 'projects'],
  PROJECT_REVISION: ['Revised estimate proposed', 'projects'], PIA_TRANSFER: ['PIA charge handed over', 'projects'],
  BUDGET_ALLOCATE: ['Budget released', 'budget'], BUDGET_DOCUMENT_UPLOAD: ['Release order uploaded', 'budget'], BUDGET_REVERSE: ['Budget release reversed', 'budget'],
  MPR_SUBMIT: ['Monthly report submitted', 'reports'], MPR_RESUBMIT: ['Monthly report resubmitted', 'reports'], MPR_APPROVE: ['Monthly report approved / verified', 'reports'],
  MPR_RETURN: ['Monthly report returned', 'reports'], MPR_REJECT: ['Monthly report rejected', 'reports'], MPR_EVIDENCE_UPLOAD: ['Report evidence changed', 'reports'],
  FORM_SUBMIT: ['Form submitted', 'reports'], FORM_RESUBMIT: ['Form resubmitted', 'reports'], FORM_APPROVE: ['Form approved', 'reports'], FORM_REJECT: ['Form rejected', 'reports'], FORM_DRAFT_SAVE: ['Draft saved', 'reports'],
  PROJECT_COMPLETION: ['Completion report', 'closure'], PROJECT_CLOSE: ['Project closure', 'closure'], OUTCOME_RECORD: ['Outcome reading', 'closure'],
  USER_CREATE: ['User added', 'users'], USER_SUSPEND: ['User suspended', 'users'], USER_DEACTIVATE: ['User deactivated', 'users'], USER_RESTORE: ['User restored', 'users'], PASSWORD_CHANGE: ['Password changed', 'users'],
  LOGIN: ['Signed in', 'access'], LOGOUT: ['Signed out', 'access'], TOKEN_REFRESH: ['Session renewed', 'access'], BOOTSTRAP: ['System set up', 'access'],
  SETTINGS_UPDATE: ['Settings changed', 'system'], REPORT_DISPATCH: ['Reminders / summary sent', 'system'],
  CREATE_BLOCK: ['Block added', 'system'], CREATE_GRAM_PANCHAYAT: ['Gram Panchayat added', 'system'], CREATE_VILLAGE: ['Village added', 'system'], CREATE_DEPARTMENT: ['Department added', 'system'],
};

const GROUPS = [
  { id: 'projects', label: 'Projects', icon: FolderKanban, cls: 'border-sky-200 bg-sky-50 text-sky-800' },
  { id: 'budget', label: 'Budget', icon: IndianRupee, cls: 'border-orange-200 bg-orange-50 text-orange-800' },
  { id: 'reports', label: 'Monthly reports', icon: ClipboardList, cls: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
  { id: 'closure', label: 'Closure & outcomes', icon: Lock, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { id: 'users', label: 'Users', icon: Users, cls: 'border-violet-200 bg-violet-50 text-violet-800' },
  { id: 'access', label: 'Sign-in', icon: LogIn, cls: 'border-slate-200 bg-slate-100 text-slate-700' },
  { id: 'system', label: 'Settings', icon: Settings, cls: 'border-amber-200 bg-amber-50 text-amber-800' },
];
const GROUP_BY_ID = Object.fromEntries(GROUPS.map((group) => [group.id, group]));
const actionsOf = (groupId) => Object.entries(ACTIONS).filter(([, [, group]]) => group === groupId).map(([action]) => action);
const ICON_OVERRIDE = { REJECT_SANCTION: Ban, MPR_RETURN: RotateCcw, BUDGET_REVERSE: RotateCcw, APPROVE_SANCTION: BadgeCheck, MPR_APPROVE: BadgeCheck, PASSWORD_CHANGE: KeyRound };

const ROLES = [['SUPER_ADMIN', 'State'], ['DD_LEVEL', 'District Director'], ['PIA_OFFICER', 'PIA officer'], ['MND_SUPER_ADMIN', 'M&E admin'], ['MND_OFFICER', 'M&E officer']];
const ROLE_LABEL = Object.fromEntries(ROLES);
const EMPTY = { group: '', role: '', search: '', from: '', to: '' };
const LIMIT = 25;

const moment = (value) => (value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—');
const words = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/\bLakh\b/i, '').trim().replace(/^./, (c) => c.toUpperCase());
const TECHNICAL = ['method', 'originalUrl', 'statusCode'];

/** One readable line about what the action was done to, from the details recorded with it. */
const summaryOf = (log) => {
  const m = log.metadata || {};
  const subject = m.mprNo || m.project || m.projectId || m.code || m.sanctionId || m.indicatorName || '';
  const parts = [
    subject,
    m.department || m.departmentName,
    m.period,
    m.stage && words(String(m.stage).toLowerCase()),
    m.kind && words(String(m.kind).toLowerCase()),
    typeof m.amountLakh === 'number' && formatLakh(m.amountLakh),
    typeof m.totalLakh === 'number' && formatLakh(m.totalLakh),
    typeof m.financialCurrentLakh === 'number' && `${formatLakh(m.financialCurrentLakh)} this month`,
    typeof m.unspentLakh === 'number' && m.unspentLakh > 0 && `${formatLakh(m.unspentLakh)} unspent`,
    typeof m.value === 'number' && `${m.value} ${m.unit || ''}`.trim(),
    m.reason && `Reason: ${m.reason}`,
  ].filter(Boolean);
  return parts.join(' · ');
};

const detailValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number' && /Lakh$/.test(key)) return formatLakh(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (/At$|Date$/.test(key) && !Number.isNaN(Date.parse(value))) return moment(value);
  return String(value);
};

function ActionBadge({ action }) {
  const [label, groupId] = ACTIONS[action] || [words(String(action || 'Unknown').toLowerCase()), 'system'];
  const group = GROUP_BY_ID[groupId] || GROUP_BY_ID.system;
  const Icon = ICON_OVERRIDE[action] || group.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${group.cls}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</span>;
}

function ActivityLog() {
  const [filters, setFilters] = useState(EMPTY);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [box, setBox] = useState({ logs: [], stats: { total: 0, today: 0, byAction: [] }, pages: 1, total: 0, loading: true, error: '' });
  const [open, setOpen] = useState(null);
  const requestRef = useRef(0);

  // Search waits for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => { setFilters((current) => (current.search === searchText.trim() ? current : { ...current, search: searchText.trim() })); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const load = useCallback(() => {
    const requestId = ++requestRef.current;
    setBox((current) => ({ ...current, loading: true, error: '' }));
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filters.group) params.set('actions', actionsOf(filters.group).join(','));
    if (filters.role) params.set('role', filters.role);
    if (filters.search) params.set('search', filters.search);
    if (filters.from) params.set('from', new Date(`${filters.from}T00:00:00`).toISOString());
    if (filters.to) params.set('to', new Date(`${filters.to}T23:59:59.999`).toISOString());
    axiosInstance.get(`/admin/audit-logs?${params}`)
      .then(({ data: body }) => {
        if (requestRef.current !== requestId) return;
        setBox({ logs: body?.data?.logs || [], stats: body?.data?.stats || { total: 0, today: 0, byAction: [] }, pages: body?.pagination?.totalPages || 1, total: body?.pagination?.total || 0, loading: false, error: '' });
        setOpen(null);
      })
      .catch((err) => { if (requestRef.current === requestId) setBox((current) => ({ ...current, loading: false, error: err?.response?.status === 403 ? 'You do not have permission to see the audit log.' : 'Unable to load the audit log. Please try again.' })); });
  }, [filters, page]);
  useEffect(() => { load(); }, [load]);

  const set = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const active = Object.entries(filters).filter(([, value]) => value).length;
  const clear = () => { setFilters(EMPTY); setSearchText(''); setPage(1); };
  const dateError = filters.from && filters.to && filters.from > filters.to ? 'The start date is after the end date.' : '';

  const exportPage = () => downloadCsv('audit-log.csv',
    ['When', 'Who', 'E-mail', 'Role', 'Action', 'About', 'IP address', 'Request'],
    box.logs.map((log) => [moment(log.timestamp), log.performerName, log.performerEmail, ROLE_LABEL[log.performedByRole] || log.performedByRole || '', (ACTIONS[log.action] || [log.action])[0], summaryOf(log), log.ipAddress || '', `${log.metadata?.method || ''} ${log.metadata?.originalUrl || ''}`.trim()]));

  const top = box.stats.byAction.slice(0, 4);
  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-[border-color,box-shadow] hover:border-slate-400 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20';

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"><dt className="text-xs font-medium text-slate-500">{active ? 'Matching entries' : 'Entries on record'}</dt><dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{box.stats.total.toLocaleString('en-IN')}</dd><dd className="text-xs text-slate-500">Kept for one year</dd></div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"><dt className="text-xs font-medium text-slate-500">Today</dt><dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{box.stats.today.toLocaleString('en-IN')}</dd><dd className="text-xs text-slate-500">{active ? 'With these filters' : 'All actions'}</dd></div>
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <dt className="text-xs font-medium text-slate-500">Most frequent</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {top.length === 0 ? <span className="text-sm text-slate-400">Nothing recorded yet</span> : top.map((item) => (
              <span key={item.action} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">{(ACTIONS[item.action] || [words(String(item.action).toLowerCase())])[0]}<span className="font-bold tabular-nums text-slate-900">{item.count}</span></span>
            ))}
          </dd>
        </div>
      </dl>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Filters">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Kind of activity">
          {[{ id: '', label: 'Everything' }, ...GROUPS].map((group) => (
            <button key={group.id || 'all'} type="button" role="tab" aria-selected={filters.group === group.id} onClick={() => set('group', group.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${filters.group === group.id ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              {group.icon && <group.icon className="h-3.5 w-3.5" aria-hidden="true" />}{group.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="relative">
            <label htmlFor="audit-search" className="sr-only">Search by person, e-mail, action or IP address</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="audit-search" type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search person, e-mail, action or IP address" className={`${input} pl-9`} />
          </div>
          <div><label htmlFor="audit-role" className="sr-only">Role</label>
            <select id="audit-role" value={filters.role} onChange={(event) => set('role', event.target.value)} className={input}>
              <option value="">All roles</option>{ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></div>
          <div><label htmlFor="audit-from" className="sr-only">From date</label><input id="audit-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => set('from', event.target.value)} className={input} title="From date" /></div>
          <div><label htmlFor="audit-to" className="sr-only">To date</label><input id="audit-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => set('to', event.target.value)} className={input} title="To date" /></div>
          <button type="button" onClick={clear} disabled={!active && !searchText} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50">
            <X className="h-4 w-4" aria-hidden="true" /> Clear
          </button>
        </div>
        {dateError && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{dateError}</p>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Activity <span className="font-normal text-slate-500">newest first</span></h2>
          <ExportButton onClick={exportPage} disabled={!box.logs.length}>Export this page</ExportButton>
        </header>

        {box.loading && box.logs.length === 0 && <div className="space-y-2 p-5" role="status" aria-label="Loading audit log">{[0, 1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" action={<RetryButton onClick={load} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && box.logs.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">{active ? 'Nothing matches these filters.' : 'No activity has been recorded yet.'}</p>}

        {box.logs.length > 0 && (
          <div className={`overflow-x-auto transition-opacity ${box.loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[900px] text-sm">
              <caption className="sr-only">Audit log</caption>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">When</th>
                  <th scope="col" className="px-3 py-2.5">Who</th>
                  <th scope="col" className="px-3 py-2.5">Action</th>
                  <th scope="col" className="px-3 py-2.5">About</th>
                  <th scope="col" className="px-5 py-2.5"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {box.logs.map((log) => {
                  const expanded = open === log._id;
                  const details = Object.entries(log.metadata || {}).filter(([key, value]) => !TECHNICAL.includes(key) && value !== undefined && value !== null && value !== '');
                  return (
                    <React.Fragment key={log._id}>
                      <tr className={`align-top transition-colors ${expanded ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-700">{moment(log.timestamp)}</td>
                        <td className="px-3 py-3">
                          <span className="block font-semibold text-slate-900">{log.performerName || 'System'}</span>
                          <span className="block text-xs text-slate-500">{ROLE_LABEL[log.performedByRole] || log.performedByRole || 'Not signed in'}</span>
                        </td>
                        <td className="px-3 py-3"><ActionBadge action={log.action} /></td>
                        <td className="max-w-md px-3 py-3 text-slate-700">{summaryOf(log) || <span className="text-slate-400">—</span>}</td>
                        <td className="px-5 py-3 text-right">
                          <button type="button" onClick={() => setOpen(expanded ? null : log._id)} aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} details of ${(ACTIONS[log.action] || [log.action])[0]} by ${log.performerName || 'System'}`}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-5 pb-4">
                            <dl className="wz-fade-in grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                              {details.map(([key, value]) => (
                                <div key={key} className="min-w-0"><dt className="text-xs text-slate-500">{words(key)}</dt><dd className="break-words font-medium text-slate-900">{detailValue(key, value)}</dd></div>
                              ))}
                              <div className="min-w-0"><dt className="text-xs text-slate-500">E-mail</dt><dd className="break-words font-medium text-slate-900">{log.performerEmail || '—'}</dd></div>
                              <div className="min-w-0"><dt className="text-xs text-slate-500">IP address</dt><dd className="font-mono text-xs text-slate-900">{log.ipAddress || '—'}</dd></div>
                              <div className="min-w-0"><dt className="text-xs text-slate-500">Request</dt><dd className="break-all font-mono text-xs text-slate-900">{log.metadata?.method} {log.metadata?.originalUrl || '—'}</dd></div>
                              <div className="min-w-0 sm:col-span-2 lg:col-span-3"><dt className="text-xs text-slate-500">Browser</dt><dd className="break-words text-xs text-slate-600">{log.userAgent || '—'}</dd></div>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {box.total > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
            <p className="tabular-nums">{((page - 1) * LIMIT + 1).toLocaleString('en-IN')} to {Math.min(page * LIMIT, box.total).toLocaleString('en-IN')} of {box.total.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || box.loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Newer</button>
              <span className="tabular-nums">Page {page} of {box.pages}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(box.pages, value + 1))} disabled={page >= box.pages || box.loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50">Older <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}

const TABS = [{ id: 'log', label: 'Activity log', icon: Activity }, { id: 'timeline', label: 'Project timeline', icon: FolderKanban }];

/** Audit: every recorded action across the system, and the step-by-step history of one project. */
export function AuditLogPage() {
  const [tab, setTab] = useState('log');
  return (
    <div className="mx-auto max-w-7xl p-4 pb-16 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true"><ScrollText className="h-5 w-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500">Who did what, and when. Entries cannot be edited or deleted.</p>
        </div>
      </div>
      <div className="mb-5 border-b border-slate-200">
        <div role="tablist" aria-label="Audit views" className="-mb-px flex gap-1">
          {TABS.map((item) => (
            <button key={item.id} type="button" role="tab" id={`audit-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`audit-panel-${item.id}`} onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40 ${tab === item.id ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}>
              <item.icon className="h-4 w-4" aria-hidden="true" />{item.label}
            </button>
          ))}
        </div>
      </div>
      <div key={tab} role="tabpanel" id={`audit-panel-${tab}`} aria-labelledby={`audit-tab-${tab}`} className="wz-fade-in">
        {tab === 'log' ? <ActivityLog /> : <BusinessAuditView />}
      </div>
    </div>
  );
}
