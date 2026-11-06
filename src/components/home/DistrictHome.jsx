"use client";
import React from 'react';
import Link from 'next/link';
import { ClipboardCheck, ClipboardPen, FolderKanban, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ActionLink, COLORS, Card, Empty, FilingCard, HomeShell, Meter, Metric, MoneyFlow, PendingStages, ReportRows, SeeAll, TaskList, lakh, rowLink, shortLakh, td, th, useHome } from './HomeKit';

const EMPTY = {
  MAKER: 'No project to accept or assign, and no report is waiting for you.',
  CHECKER: 'No report or completion is waiting for your verification.',
  APPROVER: 'No report or completion is waiting for your approval.',
};

/**
 * Home of the District SARRA Centre. The District Maker accepts projects,
 * assigns PIAs and reporting responsibility and receives PIA reports; the
 * Checker verifies and the Approver approves and forwards to HQ.
 */
export function DistrictHome() {
  const home = useHome();
  const data = home.data;
  const role = data?.workflowRole || 'MAKER';
  const k = data?.kpis;
  return (
    <HomeShell
      home={home}
      roleLine={`${data?.roleLabel || 'District'}${data?.scope?.district ? ` · ${data.scope.district}` : ''}`}
      actions={(
        <>
          <ActionLink href="/dashboard/dd/projects" icon={FolderKanban}>District Projects</ActionLink>
          {role === 'MAKER' && <ActionLink href="/dashboard/dd/mprs" icon={ClipboardPen}>District Entry MPRs</ActionLink>}
          <ActionLink href="/dashboard/dd/mpr-review" icon={ClipboardCheck} primary>MPR Verification</ActionLink>
        </>
      )}
    >
      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><TaskList tasks={data.tasks} emptyText={EMPTY[role] || EMPTY.MAKER} /></div>
            <FilingCard period={data.period} expected={k.expected} filed={k.filed} overdue={k.overdue} href="/dashboard/dd/deadlines" />
          </div>

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Projects in the district" value={String(k.projects)} sub={`${k.active} active · ${k.closed} closed`} href="/dashboard/dd/projects" />
            <Metric label="Sanctioned amount" value={lakh(k.sanctionedLakh)} sub={`${lakh(k.spentLakh)} spent · ${k.financialPercent}%`} />
            <Metric label="Balance" value={lakh(k.balanceLakh)} sub={`Physical progress ${k.physicalPercent}%`} />
            <Metric label="Waiting for you" value={String(k.myActions)} sub={`${k.inReview} in verification · ${k.returned} returned`} tone={k.myActions ? 'warning' : 'default'} href="/dashboard/dd/mpr-review" />
          </dl>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Awaiting your action" description={`Reports at the ${data.roleLabel} step, longest wait first.`} aside={<SeeAll href="/dashboard/dd/mpr-review" />} padded={false}>
              <ReportRows reports={data.reviewQueue} empty="No report is waiting for your action." />
            </Card>
            <Card title="Pending actions by step" description="Reports of the district waiting at each Maker, Checker and Approver step.">
              <PendingStages stages={data.pendingByStage} />
            </Card>
          </div>

          <Card title="Projects" description="Every project forwarded to the district, most recently changed first." aside={<SeeAll href="/dashboard/dd/projects" />} padded={false}>
            {data.projects.length === 0 ? <div className="p-5"><Empty>No project has been forwarded to your district yet.</Empty></div> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <caption className="sr-only">Projects of the district</caption>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th scope="col" className={`${th} pl-5`}>Project</th>
                      <th scope="col" className={th}>Stage</th>
                      <th scope="col" className={th}>Departments</th>
                      <th scope="col" className={`${th} text-right`}>Sanctioned</th>
                      <th scope="col" className={`${th} w-44`}>Spent</th>
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
                        <td className={td}>{project.closed ? <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"><Lock className="h-3 w-3" aria-hidden="true" /> Closed</span> : <Badge status={project.status} kind="project" />}</td>
                        <td className={`${td} tabular-nums`}>
                          {project.accepted} of {project.departments} ready
                          {project.districtEntry > 0 && <span className="block text-xs text-cyan-700">{project.districtEntry} district entry</span>}
                          {project.assigned < project.departments && <span className="block text-xs font-semibold text-amber-700">{project.departments - project.assigned} not assigned</span>}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{shortLakh(project.sanctionedLakh)}<span className="block text-xs text-slate-500">balance {shortLakh(project.balanceLakh)}</span></td>
                        <td className={td}>
                          <span className="text-xs font-semibold tabular-nums text-slate-700">{project.financialPercent}%</span>
                          <div className="mt-1"><Meter percent={project.financialPercent} color={COLORS.spent} label={`${project.code}: spent of sanctioned`} /></div>
                        </td>
                        <td className={`${td} pr-5`}>
                          {project.overdue > 0 && <span className="mr-1.5 inline-block rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">{project.overdue} overdue</span>}
                          {project.inReview > 0 && <span className="inline-block rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">{project.inReview} in verification</span>}
                          {!project.overdue && !project.inReview && <span className="text-xs text-slate-400">Nothing pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Reporting Makers" description="PIA Makers and District Technical Staff: who reports what, and who is behind." padded={false}>
              {data.officers.length === 0 ? <div className="p-5"><Empty>No department has a reporting Maker yet.</Empty></div> : (
                <ul className="divide-y divide-slate-100">
                  {data.officers.map((officer) => (
                    <li key={officer.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy/10 text-sm font-bold text-navy" aria-hidden="true">{officer.name.trim().charAt(0).toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">{officer.name}</span>
                          <span className="block truncate text-xs text-slate-500">{officer.tier}{officer.department ? ` · ${officer.department}` : ''} · {officer.departments} department{officer.departments === 1 ? '' : 's'}</span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                        {officer.overdue > 0 && <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-red-800">{officer.overdue} overdue</span>}
                        {officer.corrections > 0 && <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">{officer.corrections} to correct</span>}
                        {officer.notAccepted > 0 && <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">{officer.notAccepted} not ready</span>}
                        {officer.inReview > 0 && <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-800">{officer.inReview} in verification</span>}
                        {!officer.overdue && !officer.corrections && !officer.notAccepted && !officer.inReview && <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800">Up to date</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="District funds" description="Sanctioned allocation against reported expenditure.">
              <MoneyFlow sanctionedLakh={k.sanctionedLakh} spentLakh={k.spentLakh} balanceLakh={k.balanceLakh} />
            </Card>
          </div>
        </>
      )}
    </HomeShell>
  );
}
