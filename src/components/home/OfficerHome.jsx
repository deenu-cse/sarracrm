"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardPlus, FolderKanban, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ActionLink, COLORS, Card, Empty, Meter, Metric, MoneyFlow, SeeAll, TaskList, HomeShell, ago, day, lakh, shortLakh, useHome } from './HomeKit';

const DUE = {
  OVERDUE: { cls: 'border-red-200 bg-red-50 text-red-800', text: (due) => `${due.period} report ${due.daysOverdue} day${due.daysOverdue === 1 ? '' : 's'} overdue` },
  DUE_SOON: { cls: 'border-amber-200 bg-amber-50 text-amber-800', text: (due) => `${due.period} report due ${due.daysLeft ? `in ${due.daysLeft} day${due.daysLeft === 1 ? '' : 's'}` : 'today'}` },
  DUE: { cls: 'border-sky-200 bg-sky-50 text-sky-800', text: (due) => `${due.period} report due in ${due.daysLeft} days` },
};

/** One department the officer holds: where the money and the work stand, and the next step. */
function Holding({ item }) {
  const fileHref = item.due ? `/dashboard/officer/forms/new?projectId=${item.projectId}&departmentId=${item.departmentId}&fy=${item.due.financialYear}&month=${item.due.reportingMonth}` : `/dashboard/officer/forms/new?projectId=${item.projectId}&departmentId=${item.departmentId}`;
  const done = item.closed || ['SUBMITTED', 'DISTRICT_VERIFIED'].includes(item.completion);
  let state = null;
  if (item.closed) state = <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"><Lock className="h-3 w-3" aria-hidden="true" /> Closed</span>;
  else if (item.completion === 'DISTRICT_VERIFIED') state = <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Completion verified</span>;
  else if (item.completion === 'SUBMITTED') state = <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Completion with district</span>;
  else if (!item.accepted) state = <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Waiting for your acceptance</span>;
  else if (item.due) state = <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${DUE[item.due.state].cls}`}>{DUE[item.due.state].text(item.due)}</span>;
  else state = <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Reporting up to date</span>;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={item.href} className="block truncate text-sm font-semibold text-slate-900 hover:text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">{item.name}</Link>
          <p className="text-xs text-slate-500"><span className="font-mono">{item.code}</span> · {item.department}</p>
        </div>
        {state}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
        <div>
          <dt className="flex items-baseline justify-between text-xs text-slate-500"><span>Physical progress</span><span className="font-semibold tabular-nums text-slate-900">{item.physicalPercent}%</span></dt>
          <dd className="mt-1"><Meter percent={item.physicalPercent} label={`${item.department}: physical progress`} /></dd>
        </div>
        <div>
          <dt className="flex items-baseline justify-between text-xs text-slate-500"><span>Spent of budget</span><span className="font-semibold tabular-nums text-slate-900">{item.financialPercent}%</span></dt>
          <dd className="mt-1"><Meter percent={item.financialPercent} color={COLORS.spent} label={`${item.department}: financial progress`} /></dd>
        </div>
      </dl>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
        <div><dt className="text-slate-500">Budget</dt><dd className="font-semibold tabular-nums text-slate-900">{shortLakh(item.sanctionedLakh)}</dd></div>
        <div><dt className="text-slate-500">Released</dt><dd className="font-semibold tabular-nums text-slate-900">{shortLakh(item.releasedLakh)}</dd></div>
        <div><dt className="text-slate-500">Spent</dt><dd className="font-semibold tabular-nums text-slate-900">{shortLakh(item.spentLakh)}</dd></div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          {item.lastReport ? <>Last report: <Link href={`/dashboard/officer/mprs/report/${item.lastReport.id}`} className="font-semibold text-navy hover:underline">{item.lastReport.period}</Link></> : 'No report filed yet'}
        </p>
        {!item.accepted && !item.closed
          ? <Link href={item.href} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">Open and accept <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
          : !done && <Link href={fileHref} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">File monthly report <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
      </div>
    </li>
  );
}

/** Home of a PIA officer: what to file, and how each of my departments is doing. */
export function OfficerHome() {
  const home = useHome();
  const data = home.data;
  return (
    <HomeShell
      home={home}
      roleLine={`PIA Officer${data?.scope?.department ? ` · ${data.scope.department}` : ''}${data?.scope?.district ? ` · ${data.scope.district}` : ''}`}
      actions={<><ActionLink href="/dashboard/officer/projects" icon={FolderKanban}>My Projects</ActionLink><ActionLink href="/dashboard/officer/forms/new" icon={ClipboardPlus} primary>New Monthly Report</ActionLink></>}
    >
      {data && (
        <>
          <TaskList tasks={data.tasks} emptyText={`Reports are filed up to ${data.period.label}. ${data.period.nextLabel} is due by ${day(data.period.nextDueDate)}.`} />

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Departments with me" value={String(data.kpis.departments)} sub={`on ${data.kpis.projects} project${data.kpis.projects === 1 ? '' : 's'}`} href="/dashboard/officer/projects" />
            <Metric label="Funds released to me" value={lakh(data.kpis.releasedLakh)} sub={`of ${lakh(data.kpis.sanctionedLakh)} budget`} />
            <Metric label="Unspent balance" value={lakh(data.kpis.unspentLakh)} sub={`${data.kpis.utilisationPercent}% of releases spent`} tone={data.kpis.unspentLakh > 0 ? 'warning' : 'default'} />
            <Metric label="Reports with district" value={String(data.kpis.awaitingDistrict)} sub={`${data.kpis.approved} approved · ${data.kpis.returned} returned`} tone={data.kpis.returned ? 'danger' : 'default'} href="/dashboard/officer/mprs" />
          </dl>

          <section aria-labelledby="my-departments">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="my-departments" className="text-sm font-semibold text-slate-900">My departments</h2>
              <SeeAll href="/dashboard/officer/projects">All projects</SeeAll>
            </div>
            {data.holdings.length === 0
              ? <Empty>No project has been assigned to you yet. You will be notified when the District Director assigns one.</Empty>
              : <ul className={`grid grid-cols-1 gap-4 ${data.holdings.length > 1 ? "lg:grid-cols-2" : ""}`}>{data.holdings.map((item) => <Holding key={`${item.projectId}-${item.departmentId}`} item={item} />)}</ul>}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2" title="My funds" description="Across the departments I hold on open projects.">
              <MoneyFlow sanctionedLakh={data.kpis.sanctionedLakh} releasedLakh={data.kpis.releasedLakh} spentLakh={data.kpis.spentLakh} />
            </Card>
            <Card className="lg:col-span-3" title="My recent reports" aside={<SeeAll href="/dashboard/officer/mprs" />} padded={false}>
              {data.recentReports.length === 0 ? <div className="p-5"><Empty>You have not filed a monthly report yet.</Empty></div> : (
                <ul className="divide-y divide-slate-100">
                  {data.recentReports.map((report) => (
                    <li key={report.id}>
                      <Link href={report.href} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900">{report.period} · {report.department}</span>
                          <span className="block truncate text-xs text-slate-500"><span className="font-mono">{report.mprNo}</span> · {report.projectCode} · filed {ago(report.submittedAt)}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-sm font-semibold tabular-nums text-slate-700">{shortLakh(report.spentLakh)}</span>
                          <Badge status={report.status} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </HomeShell>
  );
}
