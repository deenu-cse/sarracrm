"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { AlarmClock, ArrowRight, CalendarClock, CheckCircle2 } from 'lucide-react';
import { fetchDeadlines } from '@/lib/lifecycleApi';
import { Notice, RetryButton, Skeleton, useMasterList } from '@/components/projects/create/parts';
import { EmptyNote, ExportButton, Panel, StatTile, downloadCsv, formatDay } from '@/components/projects/detail/shared';
import { useT } from '@/contexts/LanguageContext';

/** Where things open for each role. */
const LINKS = {
  PIA_OFFICER: {
    report: (id) => `/dashboard/officer/mprs/report/${id}`,
    project: (id) => `/dashboard/officer/projects/${id}`,
    file: (item) => `/dashboard/officer/forms/new?projectId=${item.projectId}&departmentId=${item.departmentId}&fy=${item.financialYear}&month=${item.reportingMonth}`,
  },
  DD_LEVEL: { report: (id) => `/dashboard/dd/mpr-review/project/${id}`, project: (id) => `/dashboard/dd/projects/${id}` },
  SUPER_ADMIN: { report: (id) => `/dashboard/admin/projects/mpr/${id}`, project: (id) => `/dashboard/admin/projects/${id}` },
  MND_SUPER_ADMIN: { report: (id) => `/dashboard/mnd-admin/mpr/project/${id}`, project: null },
  MND_OFFICER: { report: null, project: null },
};

const STATE = {
  OVERDUE: { label: 'Overdue', cls: 'border-red-200 bg-red-50 text-red-800' },
  DUE_SOON: { label: 'Due soon', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  DUE: { label: 'Due', cls: 'border-sky-200 bg-sky-50 text-sky-800' },
  FILED: { label: 'Filed', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  SKIPPED: { label: 'Skipped', cls: 'border-slate-200 bg-slate-50 text-slate-600' },
};

const when = (item, t = (text) => text) => {
  if (item.state === 'OVERDUE') return t(item.daysOverdue === 1 ? '{count} day overdue' : '{count} days overdue', { count: item.daysOverdue });
  if (item.state === 'DUE' || item.state === 'DUE_SOON') return item.daysLeft === 0 ? t('Due today') : t(item.daysLeft === 1 ? '{count} day left' : '{count} days left', { count: item.daysLeft });
  if (item.state === 'SKIPPED') return t('A later month was filed');
  return '';
};

const cellLink = 'inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40';

/**
 * Compact notice for a PIA officer: what is overdue or due soon, with a link
 * straight into the form for that month. Renders nothing when all is in order.
 */
export function DeadlineBanner() {
  const t = useT();
  const box = useMasterList(async () => [await fetchDeadlines()], 'deadlines-banner');
  const data = box.items[0];
  if (!data) return null;
  const pending = data.items.filter((item) => ['OVERDUE', 'DUE_SOON', 'DUE'].includes(item.state));
  if (!pending.length && !data.corrections.length) return null;
  const overdue = pending.filter((item) => item.state === 'OVERDUE');
  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <Notice tone={overdue.length ? 'error' : 'warning'} title={overdue.length
          ? `${overdue.length} monthly report${overdue.length === 1 ? ' is' : 's are'} overdue for ${data.period.label}`
          : `${data.period.label} report${pending.length === 1 ? ' is' : 's are'} due by ${formatDay(data.period.dueDate)}`}>
          <ul className="mt-1 space-y-1">
            {pending.map((item) => (
              <li key={`${item.projectId}-${item.departmentId}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span><span className="font-mono text-xs">{item.projectCode}</span> {item.departmentName} <span className="opacity-80">({when(item, t)})</span></span>
                <Link href={LINKS.PIA_OFFICER.file(item)} className="inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2">{t('File now')} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </Notice>
      )}
    </div>
  );
}

/** Full deadlines view: reports due for last month, reports awaiting review, and corrections pending. */
export function DeadlinesBoard({ role }) {
  const t = useT();
  const box = useMasterList(async () => [await fetchDeadlines()], 'deadlines');
  const data = box.items[0];
  const [filter, setFilter] = useState('PENDING');
  const links = LINKS[role] || LINKS.MND_OFFICER;
  const isPia = role === 'PIA_OFFICER';

  if (!data && !box.error) return <div className="space-y-3" role="status" aria-label="Loading deadlines"><Skeleton className="h-20" /><Skeleton className="h-64" /></div>;
  if (box.error || !data) return <Notice tone="error" title="Unable to load deadlines." action={<RetryButton onClick={box.reload} />}>{box.error}</Notice>;

  const { summary, period, nextPeriod, rule } = data;
  const rows = data.items.filter((item) => (filter === 'ALL' ? true : filter === 'PENDING' ? ['OVERDUE', 'DUE_SOON', 'DUE'].includes(item.state) : item.state === filter));
  const filters = [
    { id: 'PENDING', label: `${t('Not filed')} (${summary.overdue + summary.dueSoon + summary.due})` },
    { id: 'OVERDUE', label: `${t('Overdue')} (${summary.overdue})` },
    { id: 'FILED', label: `${t('Filed')} (${summary.filed})` },
    { id: 'ALL', label: `${t('All')} (${data.items.length})` },
  ];
  const exportRows = () => downloadCsv(`MPR-deadlines-${period.label}.csv`,
    ['Project ID', 'Project', 'District', 'Department', 'PIA Officer', 'Month', 'Due Date', 'Status', 'Days Overdue', 'MPR No.'],
    data.items.map((item) => [item.projectCode, item.projectName, item.district, item.departmentName, item.officer?.name || '', item.period, item.dueDate, STATE[item.state].label, item.daysOverdue || '', item.mprNo || '']));

  return (
    <div className="space-y-5">
      <Notice tone="info" title={t('The report for {period} was due on {date}', { period: period.label, date: formatDay(period.dueDate) })}>
        {t("Each month's progress report is due by day {day} of the next month. {next} is due by {date}.", { day: rule.mprDueDay, next: nextPeriod.label, date: formatDay(nextPeriod.dueDate) })}
        {' '}{t(rule.remindersEnabled ? 'Reminders go out automatically.' : 'Automatic reminders are switched off.')}
      </Notice>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile icon={CalendarClock} label={t('Reports expected')} value={String(summary.expected)} sub={period.label} />
        <StatTile icon={CheckCircle2} label={t('Filed')} value={String(summary.filed)} sub={summary.expected ? `${Math.round((summary.filed / summary.expected) * 100)}% of expected` : ''} tone={summary.expected > 0 && summary.filed === summary.expected ? 'success' : 'default'} />
        <StatTile icon={AlarmClock} label={t('Overdue')} value={String(summary.overdue)} tone={summary.overdue ? 'warning' : 'default'} />
        <StatTile label={t('Due, not yet filed')} value={String(summary.dueSoon + summary.due)} />
        <StatTile label={t(isPia ? 'With district for review' : 'Awaiting district review')} value={String(summary.reviewsWaiting)} sub={summary.reviewsOverdue ? `${summary.reviewsOverdue} beyond ${rule.districtReviewDays} days` : ''} tone={summary.reviewsOverdue ? 'warning' : 'default'} />
        <StatTile label={t('Returned, not corrected')} value={String(summary.corrections)} tone={summary.corrections ? 'warning' : 'default'} />
      </dl>

      <Panel
        title={t('Monthly reports for {period}', { period: period.label })}
        description={t("One row for every department that owes this month's report.")}
        padded={false}
        aside={(
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Filter by status" className="flex gap-1.5">
              {filters.map((item) => (
                <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${filter === item.id ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                  {item.label}
                </button>
              ))}
            </div>
            <ExportButton onClick={exportRows} disabled={!data.items.length} />
          </div>
        )}
      >
        {rows.length === 0 ? (
          <div className="p-5"><EmptyNote>{t(data.items.length === 0 ? 'No department owes a report for this month.' : filter === 'PENDING' ? 'Every expected report has been filed.' : 'Nothing in this list.')}</EmptyNote></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">{t('Project')}</th>
                  {!isPia && <th scope="col" className="px-3 py-2.5">{t('District')}</th>}
                  <th scope="col" className="px-3 py-2.5">{t('Department')}</th>
                  {!isPia && <th scope="col" className="px-3 py-2.5">{t('PIA Officer')}</th>}
                  <th scope="col" className="px-3 py-2.5">{t('Status')}</th>
                  <th scope="col" className="px-5 py-2.5"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((item) => (
                  <tr key={`${item.projectId}-${item.departmentId}`} className="transition-colors hover:bg-slate-50/60">
                    <th scope="row" className="px-5 py-3 text-left">
                      <span className="block font-mono text-xs font-semibold text-slate-700">{item.projectCode}</span>
                      <span className="block max-w-xs truncate font-medium text-slate-900">{item.projectName}</span>
                    </th>
                    {!isPia && <td className="px-3 py-3 text-slate-700">{item.district}</td>}
                    <td className="px-3 py-3 text-slate-700">{item.departmentName}</td>
                    {!isPia && <td className="px-3 py-3 text-slate-700">{item.officer?.name || '—'}</td>}
                    <td className="px-3 py-3">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${STATE[item.state].cls}`}>{t(STATE[item.state].label)}</span>
                      {when(item, t) && <span className="ml-2 text-xs tabular-nums text-slate-600">{when(item, t)}</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {item.mprId && links.report && <Link href={links.report(item.mprId)} className={cellLink}>{t('Open report')} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
                      {!item.mprId && isPia && item.state !== 'SKIPPED' && <Link href={links.file(item)} className={cellLink}>{t('File report')} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
                      {!item.mprId && !isPia && links.project && <Link href={links.project(item.projectId)} className={cellLink}>{t('Open project')} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title={`${t(isPia ? 'With district for review' : 'Awaiting district review')} (${data.reviews.length})`} description={t('The district has {days} days to approve or return a report.', { days: rule.districtReviewDays })} padded={false}>
          {data.reviews.length === 0 ? <div className="p-5"><EmptyNote>{t('No report is waiting for review.')}</EmptyNote></div> : (
            <ul className="divide-y divide-slate-100">
              {data.reviews.map((review) => (
                <li key={review.mprId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-900">{review.departmentName}, {review.period}</span>
                    <span className="block text-xs text-slate-500"><span className="font-mono">{review.mprNo}</span> · {review.projectCode}{!isPia ? ` · ${review.district}` : ''}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className={`text-xs font-semibold tabular-nums ${review.overdue ? 'text-red-700' : 'text-slate-600'}`}>{review.daysWaiting} day{review.daysWaiting === 1 ? '' : 's'} waiting</span>
                    {links.report && <Link href={links.report(review.mprId)} className={cellLink}>Open <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`${t('Returned, not corrected')} (${data.corrections.length})`} description={t('The PIA officer must correct and resubmit these before filing another month.')} padded={false}>
          {data.corrections.length === 0 ? <div className="p-5"><EmptyNote>{t('No returned report is pending.')}</EmptyNote></div> : (
            <ul className="divide-y divide-slate-100">
              {data.corrections.map((item) => (
                <li key={item.mprId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-900">{item.departmentName}, {item.period}</span>
                    <span className="block text-xs text-slate-500"><span className="font-mono">{item.mprNo}</span> · {item.projectCode} · returned by {item.returnedBy}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-semibold tabular-nums text-amber-800">{item.daysPending} day{item.daysPending === 1 ? '' : 's'} pending</span>
                    {links.report && <Link href={links.report(item.mprId)} className={cellLink}>Open <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {!isPia && data.districts.length > 1 && (
        <Panel title="District-wise filing" description={`Reports for ${period.label}.`} padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">District</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Expected</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Filed</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Overdue</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Not yet due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.districts.map((row) => (
                  <tr key={row.district}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-slate-900">{row.district}</th>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.expected}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.filed}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${row.overdue ? 'font-semibold text-red-700' : ''}`}>{row.overdue}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{row.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
