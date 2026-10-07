"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FolderKanban, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ActionLink, COLORS, Card, Empty, FilingCard, HomeShell, Meter, Metric, MoneyFlow, SeeAll, TaskList, lakh, rowLink, shortLakh, td, th, useHome } from './HomeKit';

/** Home of a District Director: what is waiting on me, and how the district's projects and officers are doing. */
export function DistrictHome() {
  const home = useHome();
  const data = home.data;
  return (
    <HomeShell
      home={home}
      roleLine={`District Director${data?.scope?.district ? ` · ${data.scope.district}` : ''}`}
      actions={<><ActionLink href="/dashboard/dd/projects" icon={FolderKanban}>District Projects</ActionLink><ActionLink href="/dashboard/dd/mpr-review" icon={ClipboardCheck} primary>Review Reports</ActionLink></>}
    >
      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><TaskList tasks={data.tasks} emptyText="No project, report or completion is waiting on the district." /></div>
            <FilingCard period={data.period} expected={data.kpis.expected} filed={data.kpis.filed} overdue={data.kpis.overdue} href="/dashboard/dd/deadlines" />
          </div>

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Projects in the district" value={String(data.kpis.projects)} sub={`${data.kpis.active} in progress · ${data.kpis.closed} closed`} href="/dashboard/dd/projects" />
            <Metric label="Funds released" value={lakh(data.kpis.releasedLakh)} sub={`${data.kpis.releasePercent}% of ${lakh(data.kpis.sanctionedLakh)}`} />
            <Metric label="Expenditure reported" value={lakh(data.kpis.spentLakh)} sub={`${data.kpis.utilisationPercent}% of releases · ${lakh(data.kpis.unspentLakh)} unspent`} />
            <Metric label="Physical progress" value={`${data.kpis.physicalPercent}%`} sub="Average of the latest reports" />
          </dl>

          <Card title="Projects" description="Every project forwarded to the district, most recently changed first." aside={<SeeAll href="/dashboard/dd/projects" />} padded={false}>
            {data.projects.length === 0 ? <div className="p-5"><Empty>No project has been forwarded to your district yet.</Empty></div> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <caption className="sr-only">Projects of the district</caption>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th scope="col" className={`${th} pl-5`}>Project</th>
                      <th scope="col" className={th}>Stage</th>
                      <th scope="col" className={th}>PIA officers</th>
                      <th scope="col" className={`${th} text-right`}>Released</th>
                      <th scope="col" className={`${th} w-44`}>Spent of budget</th>
                      <th scope="col" className={`${th} pr-5`}>Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.projects.slice(0, 8).map((project) => (
                      <tr key={project.id} className="transition-colors hover:bg-slate-50/60">
                        <th scope="row" className={`${td} pl-5 text-left font-normal`}>
                          <Link href={project.href} className={`block max-w-xs truncate ${rowLink}`}>{project.name}</Link>
                          <span className="font-mono text-xs text-slate-500">{project.code}</span>
                        </th>
                        <td className={td}>{project.closed ? <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"><Lock className="h-3 w-3" aria-hidden="true" /> Closed</span> : <Badge status={project.status} />}</td>
                        <td className={`${td} tabular-nums`}>
                          {project.accepted} of {project.departments} accepted
                          {project.assigned < project.departments && <span className="block text-xs font-semibold text-amber-700">{project.departments - project.assigned} not assigned</span>}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{shortLakh(project.releasedLakh)}<span className="block text-xs text-slate-500">of {shortLakh(project.sanctionedLakh)}</span></td>
                        <td className={td}>
                          <span className="text-xs font-semibold tabular-nums text-slate-700">{project.spendPercent}%</span>
                          <div className="mt-1"><Meter percent={project.spendPercent} color={COLORS.spent} label={`${project.code}: spent of budget`} /></div>
                        </td>
                        <td className={`${td} pr-5`}>
                          {project.overdue > 0 && <span className="mr-1.5 inline-block rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">{project.overdue} overdue</span>}
                          {project.awaitingReview > 0 && <span className="inline-block rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">{project.awaitingReview} to review</span>}
                          {!project.overdue && !project.awaitingReview && <span className="text-xs text-slate-400">Nothing pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="PIA officers" description="Who holds what, and who is behind on reporting." padded={false}>
              {data.officers.length === 0 ? <div className="p-5"><Empty>No PIA officer holds a department yet.</Empty></div> : (
                <ul className="divide-y divide-slate-100">
                  {data.officers.map((officer) => (
                    <li key={officer.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy/10 text-sm font-bold text-navy" aria-hidden="true">{officer.name.trim().charAt(0).toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">{officer.name}</span>
                          <span className="block truncate text-xs text-slate-500">{officer.department} · {officer.departments} department{officer.departments === 1 ? '' : 's'}</span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                        {officer.overdue > 0 && <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-red-800">{officer.overdue} overdue</span>}
                        {officer.corrections > 0 && <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">{officer.corrections} to correct</span>}
                        {officer.notAccepted > 0 && <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">{officer.notAccepted} not accepted</span>}
                        {officer.awaitingReview > 0 && <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-800">{officer.awaitingReview} with you</span>}
                        {!officer.overdue && !officer.corrections && !officer.notAccepted && !officer.awaitingReview && <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800">Up to date</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="space-y-6">
              <Card title="Review queue" description="Reports waiting for your approval, longest wait first." aside={<SeeAll href="/dashboard/dd/mpr-review" />} padded={false}>
                {data.reviewQueue.length === 0 ? <div className="p-5"><Empty>No report is waiting for review.</Empty></div> : (
                  <ul className="divide-y divide-slate-100">
                    {data.reviewQueue.map((report) => (
                      <li key={report.id}>
                        <Link href={report.href} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">{report.department} · {report.period}</span>
                            <span className="block truncate text-xs text-slate-500">{report.projectCode} · {report.officer}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className={`text-xs font-semibold tabular-nums ${report.overdue ? 'text-red-700' : 'text-slate-600'}`}>{report.daysWaiting === 0 ? 'today' : `${report.daysWaiting} day${report.daysWaiting === 1 ? '' : 's'}`}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="District funds">
                <MoneyFlow sanctionedLakh={data.kpis.sanctionedLakh} releasedLakh={data.kpis.releasedLakh} spentLakh={data.kpis.spentLakh} />
              </Card>
            </div>
          </div>
        </>
      )}
    </HomeShell>
  );
}
