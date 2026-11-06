"use client";
import React from 'react';
import Link from 'next/link';
import { BarChart3, CalendarClock, ClipboardCheck, FolderKanban, Lock, PlusCircle, ScrollText, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ActionLink, Card, Empty, HomeShell, Metric, MoneyFlow, PendingStages, ReportRows, SeeAll, TaskList, TrendBars, ago, lakh, rowLink, shortLakh, td, th, useHome } from './HomeKit';

const ROLE_TEXT = {
  MAKER: { line: 'SARRA HQ · Maker', empty: 'No returned project, project to forward or report to compile is waiting on you.' },
  CHECKER: { line: 'SARRA HQ · Checker', empty: 'No project, target revision or report is waiting for your verification.' },
  APPROVER: { line: 'SARRA HQ · Approver', empty: 'No project, target revision, report or closure is waiting for your approval.' },
  ADMIN: { line: 'SARRA HQ · Administrator', empty: 'Every district with projects has an active District Maker.' },
};

const STAGE_HREF = '/dashboard/admin/projects';

/** Where every project stands, from creation to closure. The step that belongs to this role is marked. */
function Pipeline({ stages, mine }) {
  const flow = stages.filter((stage) => stage.status !== 'REJECTED');
  const returned = stages.find((stage) => stage.status === 'REJECTED');
  const top = Math.max(...flow.map((stage) => stage.count), 1);
  return (
    <div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {flow.map((stage, index) => {
          const own = mine.includes(stage.status);
          return (
            <li key={stage.status} className={`rounded-lg border px-3 py-2.5 ${own ? 'border-navy bg-navy/[0.04]' : 'border-slate-200 bg-white'}`}>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span className="tabular-nums text-slate-400">{index + 1}</span>{stage.label}
              </p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${stage.count ? 'text-slate-900' : 'text-slate-300'}`}>{stage.count}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-navy" style={{ width: `${(stage.count / top) * 100}%` }} /></div>
              {own && <p className="mt-1.5 text-[11px] font-semibold text-navy">Your step</p>}
            </li>
          );
        })}
      </ol>
      {returned?.count > 0 && <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-red-700">{returned.count} returned</span> to the HQ Maker for correction and resubmission.</p>}
    </div>
  );
}

const MINE = { MAKER: ['SANCTIONED'], CHECKER: ['PENDING_CHECKER'], APPROVER: ['PENDING_APPROVER'], ADMIN: [] };

/** Consolidated SARRA HQ dashboard. Maker, Checker, Approver and the administrator each see their own work first. */
export function StateHome() {
  const home = useHome();
  const data = home.data;
  const role = data?.workflowRole || 'ADMIN';
  const text = ROLE_TEXT[role] || ROLE_TEXT.ADMIN;
  const k = data?.kpis;

  const actions = {
    MAKER: <><ActionLink href="/dashboard/admin/mprs" icon={ClipboardCheck}>MPR Verification</ActionLink><ActionLink href="/dashboard/admin/projects/create" icon={PlusCircle} primary>New Project</ActionLink></>,
    CHECKER: <><ActionLink href="/dashboard/admin/mprs" icon={ClipboardCheck}>MPR Verification</ActionLink><ActionLink href={STAGE_HREF} icon={FolderKanban} primary>Projects</ActionLink></>,
    APPROVER: <><ActionLink href="/dashboard/admin/mprs" icon={ClipboardCheck}>MPR Verification</ActionLink><ActionLink href={STAGE_HREF} icon={FolderKanban} primary>Projects</ActionLink></>,
    ADMIN: <><ActionLink href="/dashboard/admin/audit-logs" icon={ScrollText}>Audit Logs</ActionLink><ActionLink href="/dashboard/admin/users/new" icon={UserPlus} primary>Add User</ActionLink></>,
  }[role];

  const metrics = k && {
    MAKER: [
      ['Projects created', String(k.projects), `${k.pendingChecker} with Checker · ${k.pendingApprover} with Approver`, 'default', STAGE_HREF],
      ['Returned to you', String(k.returned), 'To correct and resubmit', k.returned ? 'danger' : 'default', STAGE_HREF],
      ['Reports to compile', String(k.myActions), `${k.mprInReview} in verification across the State`, k.myActions ? 'warning' : 'default', '/dashboard/admin/mprs'],
      ['Sanctioned amount', lakh(k.sanctionedLakh), `${k.sanctioned} sanctioned project${k.sanctioned === 1 ? '' : 's'}`],
    ],
    CHECKER: [
      ['Projects to verify', String(k.pendingChecker), 'DPR, targets and allocation', k.pendingChecker ? 'warning' : 'default', STAGE_HREF],
      ['Reports to verify', String(k.myActions), 'State-level data consistency', k.myActions ? 'warning' : 'default', '/dashboard/admin/mprs'],
      ['Sanctioned', String(k.sanctioned), lakh(k.sanctionedLakh)],
      ['Returned to Maker', String(k.returned), 'Back with the HQ Maker'],
    ],
    APPROVER: [
      ['Projects to sanction', String(k.pendingApprover), 'Verified by the HQ Checker', k.pendingApprover ? 'warning' : 'default', STAGE_HREF],
      ['Reports for final approval', String(k.myActions), `${k.mprVerified} verified by State so far`, k.myActions ? 'warning' : 'default', '/dashboard/admin/mprs'],
      ['Active projects', String(k.inProgress), `${k.physicalPercent}% average physical progress`],
      ['Closed', String(k.closed), 'Completed and closed'],
    ],
    ADMIN: [
      ['Users', String(data.users?.total ?? 0), `${data.users?.active ?? 0} active`, 'default', '/dashboard/admin/users'],
      ['Account requests', String(data.users?.pendingApproval ?? 0), 'Awaiting a tier Approver', data.users?.pendingApproval ? 'warning' : 'default', '/dashboard/admin/users'],
      ['Projects', String(k.projects), `${k.sanctioned} sanctioned · ${k.closed} closed`, 'default', STAGE_HREF],
      ['Sanctioned amount', lakh(k.sanctionedLakh), `${lakh(k.spentLakh)} spent`],
    ],
  }[role];

  return (
    <HomeShell home={home} roleLine={text.line} actions={actions}>
      {data && (
        <>
          <TaskList tasks={data.tasks} emptyText={text.empty} />

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(([label, value, sub, tone, href]) => <Metric key={label} label={label} value={value} sub={sub} tone={tone} href={href} />)}
          </dl>

          {role !== 'ADMIN' && data.reviewQueue?.length > 0 && (
            <Card title="Reports awaiting your action" description={`At the ${data.roleLabel} step, longest wait first.`} aside={<SeeAll href="/dashboard/admin/mprs" />} padded={false}>
              <ReportRows reports={data.reviewQueue} empty="Nothing is waiting." />
            </Card>
          )}

          {role === 'ADMIN' && data.users && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3" title="Users by tier and role" description="Active accounts out of all accounts in each role." aside={<SeeAll href="/dashboard/admin/users">Manage users</SeeAll>} padded={false}>
                <table className="w-full">
                  <caption className="sr-only">Users by role</caption>
                  <thead><tr className="border-b border-slate-100 bg-slate-50/70"><th scope="col" className={`${th} pl-5`}>Role</th><th scope="col" className={`${th} text-right`}>Active</th><th scope="col" className={`${th} pr-5 text-right`}>All</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.users.groups.map((group) => (
                      <tr key={group.label}>
                        <th scope="row" className={`${td} pl-5 text-left font-medium text-slate-900`}><span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{group.label}</span></th>
                        <td className={`${td} text-right font-semibold tabular-nums ${group.active === 0 ? 'text-red-700' : 'text-slate-900'}`}>{group.active}</td>
                        <td className={`${td} pr-5 text-right tabular-nums`}>{group.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card className="lg:col-span-2" title="Newest accounts" padded={false}>
                {data.users.recent.length === 0 ? <div className="p-5"><Empty>No accounts yet.</Empty></div> : (
                  <ul className="divide-y divide-slate-100">
                    {data.users.recent.map((account) => (
                      <li key={account.id} className="px-5 py-3">
                        <p className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900"><span className="truncate">{account.name}</span>{account.status !== 'ACTIVE' && <span className="flex-shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">{account.status.toLowerCase()}</span>}</p>
                        <p className="truncate text-xs text-slate-500">{account.role} · added {ago(account.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          <Card title="Project pipeline" description="How many projects are at each step right now." aside={<SeeAll href={STAGE_HREF}>All projects</SeeAll>}>
            <Pipeline stages={data.pipeline} mine={MINE[role] || []} />
          </Card>

          <Card title="MPR pending actions by step" description="Reports of the whole State waiting at each Maker, Checker and Approver step of the three tiers." aside={<SeeAll href="/dashboard/admin/mprs">MPR verification</SeeAll>}>
            <PendingStages stages={data.pendingByStage} />
            <p className="mt-3 text-xs text-slate-500">{k.mprVerified} verified by State · {k.mprReturned} returned for correction.</p>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="State funds" description="Sanctioned projects, all 13 districts." aside={<SeeAll href="/dashboard/admin/analytics"><BarChart3 className="h-3 w-3" aria-hidden="true" /> Analytics</SeeAll>}>
              <MoneyFlow sanctionedLakh={k.sanctionedLakh} spentLakh={k.spentLakh} balanceLakh={k.balanceLakh} />
            </Card>
            <Card title="Last six months" description="Expenditure reported each month, with reports filed and verified.">
              <TrendBars trend={data.trend} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2" title="Recently changed projects" aside={<SeeAll href={STAGE_HREF} />} padded={false}>
              {data.recentProjects.length === 0 ? <div className="p-5"><Empty>No project has been created yet.</Empty></div> : (
                <ul className="divide-y divide-slate-100">
                  {data.recentProjects.map((project) => (
                    <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <span className="min-w-0">
                        <Link href={project.href} className={`block max-w-xs truncate text-sm ${rowLink}`}>{project.name}</Link>
                        <span className="block truncate text-xs text-slate-500"><span className="font-mono">{project.code}</span> · {project.district} · changed {ago(project.updatedAt)}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums text-slate-700">{shortLakh(project.totalLakh)}</span>
                        {project.closed ? <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"><Lock className="h-3 w-3" aria-hidden="true" /> Closed</span> : <Badge status={project.status} kind="project" />}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="lg:col-span-3" title="District-wise comparison" description="Sanctioned amount, expenditure, physical progress and reports in verification." aside={<SeeAll href="/dashboard/admin/deadlines"><CalendarClock className="h-3 w-3" aria-hidden="true" /> Deadlines</SeeAll>} padded={false}>
              {data.districts.length === 0 ? <div className="p-5"><Empty>No sanctioned project yet.</Empty></div> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <caption className="sr-only">Districts</caption>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th scope="col" className={`${th} pl-5`}>District</th>
                        <th scope="col" className={`${th} text-right`}>Projects</th>
                        <th scope="col" className={`${th} text-right`}>Sanctioned</th>
                        <th scope="col" className={`${th} text-right`}>Spent</th>
                        <th scope="col" className={`${th} text-right`}>Physical</th>
                        <th scope="col" className={`${th} pr-5 text-right`}>In verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.districts.map((row) => (
                        <tr key={row.name}>
                          <th scope="row" className={`${td} pl-5 text-left font-medium text-slate-900`}>{row.name}</th>
                          <td className={`${td} text-right tabular-nums`}>{row.projects}</td>
                          <td className={`${td} text-right tabular-nums`}>{shortLakh(row.sanctionedLakh)}</td>
                          <td className={`${td} text-right tabular-nums`}>{row.financialPercent}%</td>
                          <td className={`${td} text-right tabular-nums`}>{row.physicalPercent}%</td>
                          <td className={`${td} pr-5 text-right tabular-nums ${row.inReview ? 'font-semibold text-amber-700' : ''}`}>{row.inReview}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </HomeShell>
  );
}
