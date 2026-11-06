"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, ClipboardPlus, FolderKanban, Lock } from 'lucide-react';
import { ActionLink, COLORS, Card, Empty, Meter, Metric, MoneyFlow, ReportRows, SeeAll, TaskList, HomeShell, day, lakh, shortLakh, useHome } from './HomeKit';

const DUE = {
  OVERDUE: { cls: 'border-red-200 bg-red-50 text-red-800', text: (due) => `${due.period} report ${due.daysOverdue} day${due.daysOverdue === 1 ? '' : 's'} overdue` },
  DUE_SOON: { cls: 'border-amber-200 bg-amber-50 text-amber-800', text: (due) => `${due.period} report due ${due.daysLeft ? `in ${due.daysLeft} day${due.daysLeft === 1 ? '' : 's'}` : 'today'}` },
  DUE: { cls: 'border-sky-200 bg-sky-50 text-sky-800', text: (due) => `${due.period} report due in ${due.daysLeft} days` },
};

/** One department of the PIA: where the money and the work stand, and the next step. */
function Holding({ item, maker }) {
  const fileHref = item.due?.draftId
    ? `/dashboard/officer/forms/new?mprId=${item.due.draftId}`
    : item.due ? `/dashboard/officer/forms/new?projectId=${item.projectId}&departmentId=${item.departmentId}&fy=${item.due.financialYear}&month=${item.due.reportingMonth}` : `/dashboard/officer/forms/new?projectId=${item.projectId}&departmentId=${item.departmentId}`;
  const districtEntry = item.reportingMode === 'DISTRICT';
  const done = item.closed || ['SUBMITTED', 'DISTRICT_VERIFIED'].includes(item.completion) || districtEntry || !maker;
  let state = null;
  if (item.closed) state = <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"><Lock className="h-3 w-3" aria-hidden="true" /> Closed</span>;
  else if (item.completion === 'DISTRICT_VERIFIED') state = <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Completion verified</span>;
  else if (item.completion === 'SUBMITTED') state = <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Completion with district</span>;
  else if (!item.accepted) state = <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">{maker ? 'Waiting for your acceptance' : 'Waiting for PIA Maker acceptance'}</span>;
  else if (districtEntry) state = <span className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800">Reported by District Technical Staff</span>;
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
          <dt className="flex items-baseline justify-between text-xs text-slate-500"><span>Spent of allocation</span><span className="font-semibold tabular-nums text-slate-900">{item.financialPercent}%</span></dt>
          <dd className="mt-1"><Meter percent={item.financialPercent} color={COLORS.spent} label={`${item.department}: financial progress`} /></dd>
        </div>
      </dl>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
        <div><dt className="text-slate-500">Sanctioned</dt><dd className="font-semibold tabular-nums text-slate-900">{shortLakh(item.sanctionedLakh)}</dd></div>
        <div><dt className="text-slate-500">Spent</dt><dd className="font-semibold tabular-nums text-slate-900">{shortLakh(item.spentLakh)}</dd></div>
        <div><dt className="text-slate-500">Balance</dt><dd className="font-semibold tabular-nums text-slate-900">{shortLakh(item.balanceLakh)}</dd></div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          {item.lastReport ? <>Last report: <Link href={`/dashboard/officer/mprs/report/${item.lastReport.id}`} className="font-semibold text-navy hover:underline">{item.lastReport.period}</Link></> : 'No report filed yet'}
        </p>
        {maker && !item.accepted && !item.closed
          ? <Link href={item.href} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">Open and accept <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
          : !done && <Link href={fileHref} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">{item.due?.draftId ? 'Continue draft' : 'File monthly report'} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
      </div>
    </li>
  );
}

/**
 * Home of a PIA user. The Maker sees what to accept, file and correct; the
 * Checker and Approver see the reports waiting for their verification.
 */
export function OfficerHome() {
  const home = useHome();
  const data = home.data;
  const maker = (data?.workflowRole || 'MAKER') === 'MAKER';
  const k = data?.kpis;
  return (
    <HomeShell
      home={home}
      roleLine={`${data?.roleLabel || 'PIA'}${data?.scope?.department ? ` · ${data.scope.department}` : ''}${data?.scope?.district ? ` · ${data.scope.district}` : ''}`}
      actions={maker
        ? <><ActionLink href="/dashboard/officer/projects" icon={FolderKanban}>My Projects</ActionLink><ActionLink href="/dashboard/officer/forms/new" icon={ClipboardPlus} primary>New Monthly Report</ActionLink></>
        : <><ActionLink href="/dashboard/officer/projects" icon={FolderKanban}>Projects</ActionLink><ActionLink href="/dashboard/officer/mprs" icon={ClipboardCheck} primary>MPR Verification</ActionLink></>}
    >
      {data && (
        <>
          <TaskList
            tasks={data.tasks}
            emptyText={maker ? `Reports are filed up to ${data.period.label}. ${data.period.nextLabel} is due by ${day(data.period.nextDueDate)}.` : 'No report is waiting for your verification.'}
          />

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label={maker ? 'Departments with me' : 'Departments'} value={String(k.departments)} sub={`on ${k.projects} project${k.projects === 1 ? '' : 's'}`} href="/dashboard/officer/projects" />
            <Metric label="Sanctioned allocation" value={lakh(k.sanctionedLakh)} sub={`${lakh(k.spentLakh)} spent · ${k.financialPercent}%`} />
            <Metric label="Balance" value={lakh(k.balanceLakh)} sub="Sanctioned but not yet spent" tone={k.balanceLakh > 0 ? 'warning' : 'default'} />
            {maker
              ? <Metric label="Reports in verification" value={String(k.inVerification)} sub={`${k.verified} verified · ${k.returned} returned · ${k.drafts} draft${k.drafts === 1 ? '' : 's'}`} tone={k.returned ? 'danger' : 'default'} href="/dashboard/officer/mprs" />
              : <Metric label="Waiting for you" value={String(k.myActions)} sub={`${k.inVerification} in verification · ${k.verified} verified`} tone={k.myActions ? 'warning' : 'default'} href="/dashboard/officer/mprs" />}
          </dl>

          {!maker && (
            <Card title="Awaiting your verification" description={`Reports of ${data.scope.department || 'your department'} at the ${data.roleLabel} step.`} aside={<SeeAll href="/dashboard/officer/mprs" />} padded={false}>
              <ReportRows reports={data.queue} empty="No report is waiting for your verification." />
            </Card>
          )}

          <section aria-labelledby="my-departments">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="my-departments" className="text-sm font-semibold text-slate-900">{maker ? 'My departments' : 'Departments of my PIA'}</h2>
              <SeeAll href="/dashboard/officer/projects">All projects</SeeAll>
            </div>
            {data.holdings.length === 0
              ? <Empty>No project has been assigned yet. You will be notified when the District Maker assigns one.</Empty>
              : <ul className={`grid grid-cols-1 gap-4 ${data.holdings.length > 1 ? 'lg:grid-cols-2' : ''}`}>{data.holdings.map((item) => <Holding key={`${item.projectId}-${item.departmentId}`} item={item} maker={maker} />)}</ul>}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2" title="Funds" description="Sanctioned allocation of the departments on open projects.">
              <MoneyFlow sanctionedLakh={k.sanctionedLakh} spentLakh={k.spentLakh} balanceLakh={k.balanceLakh} />
            </Card>
            <Card className="lg:col-span-3" title="Recent reports" aside={<SeeAll href="/dashboard/officer/mprs" />} padded={false}>
              <ReportRows reports={data.recentReports} empty={maker ? 'You have not filed a monthly report yet.' : 'No report has been submitted yet.'} />
            </Card>
          </div>
        </>
      )}
    </HomeShell>
  );
}
