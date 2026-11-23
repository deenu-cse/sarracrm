"use client";
import React from 'react';
import Link from 'next/link';
import { BarChart3, CalendarClock, ListChecks, Lock, ScrollText, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/analytics/AnalyticsParts';
import { ProjectOverview } from '@/components/projects/ProjectOverview';
import { ActionLink, Card, Empty, HomeShell, Metric, MoneyFlow, PendingStages, ReportRows, SeeAll, TaskList, TrendBars, ago, lakh, rowLink, shortLakh, td, th, useHome } from './HomeKit';

/** District-wise comparison in the report design: sanctioned, expenditure and balance, progress and reports. */
export const DISTRICT_COLUMNS = [
  { key: 'name', label: 'District' },
  { key: 'projects', label: 'Projects', align: 'right', sum: true },
  { key: 'sanctionedLakh', label: 'Sanctioned', money: true, sum: true, group: 'Financial', tone: 'blue' },
  { key: 'spentLakh', label: 'Expenditure', money: true, sum: true, group: 'Financial', tone: 'blue' },
  { key: 'balanceLakh', label: 'Balance', money: true, sum: true, group: 'Financial', tone: 'blue' },
  { key: 'financialPercent', label: '% Spent', percent: true, group: 'Progress', tone: 'green', total: (rows) => { const b = rows.reduce((s, r) => s + (Number(r.sanctionedLakh) || 0), 0); const x = rows.reduce((s, r) => s + (Number(r.spentLakh) || 0), 0); return b > 0 ? Math.round((x / b) * 1000) / 10 : 0; } },
  { key: 'physicalPercent', label: '% Physical', percent: true, group: 'Progress', tone: 'green' },
  { key: 'inReview', label: 'In verification', align: 'right', sum: true, group: 'Monthly reports', tone: 'orange' },
];

const ROLE_TEXT = {
  MAKER: { line: 'SARRA HQ · Maker', empty: 'No returned project, project to forward or report to compile is waiting on you.' },
  CHECKER: { line: 'SARRA HQ · Checker', empty: 'No project, target revision or report is waiting for your verification.' },
  APPROVER: { line: 'SARRA HQ · Approver', empty: 'No project, target revision, report or closure is waiting for your approval.' },
  ADMIN: { line: 'SARRA HQ · Administrator', empty: 'Every district with projects has an active District Maker.' },
};

const STAGE_HREF = '/dashboard/admin/projects';

/** Consolidated SARRA HQ dashboard. Maker, Checker, Approver and the administrator each see their own work first. */
export function StateHome() {
  const home = useHome();
  const data = home.data;
  const role = data?.workflowRole || 'ADMIN';
  const text = ROLE_TEXT[role] || ROLE_TEXT.ADMIN;
  const k = data?.kpis;

  const actions = {
    MAKER: null,
    CHECKER: <ActionLink href={STAGE_HREF} icon={ListChecks} primary>Project Status</ActionLink>,
    APPROVER: <ActionLink href={STAGE_HREF} icon={ListChecks} primary>Project Status</ActionLink>,
    ADMIN: <><ActionLink href="/dashboard/admin/audit-logs" icon={ScrollText}>Audit Logs</ActionLink><ActionLink href="/dashboard/admin/users/new" icon={UserPlus} primary>Add User</ActionLink></>,
  }[role];

  const metrics = k && {
    MAKER: [
      ['Projects created', String(k.projects), `${k.pendingChecker} with Checker · ${k.pendingApprover} with Approver`, 'default', STAGE_HREF],
      ['Returned to you', String(k.returned), 'To correct and resubmit', k.returned ? 'danger' : 'default', `${STAGE_HREF}?group=REJECTED`],
      ['Reports to compile', String(k.myActions), `${k.mprInReview} in verification across the State`, k.myActions ? 'warning' : 'default', '/dashboard/admin/mprs'],
      ['Sanctioned amount', lakh(k.sanctionedLakh), `${k.sanctioned} sanctioned project${k.sanctioned === 1 ? '' : 's'}`],
    ],
    CHECKER: [
      ['Projects to verify', String(k.pendingChecker), 'DPR, targets and allocation', k.pendingChecker ? 'warning' : 'default', `${STAGE_HREF}?group=PENDING`],
      ['Reports to verify', String(k.myActions), 'State-level data consistency', k.myActions ? 'warning' : 'default', '/dashboard/admin/mprs'],
      ['Sanctioned', String(k.sanctioned), lakh(k.sanctionedLakh)],
      ['Returned to Maker', String(k.returned), 'Back with the HQ Maker'],
    ],
    APPROVER: [
      ['Projects to sanction', String(k.pendingApprover), 'Verified by the HQ Checker', k.pendingApprover ? 'warning' : 'default', `${STAGE_HREF}?group=PENDING`],
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

          <Card title="Project Overview" description="Every project of the State: pending with HQ, approved (sanctioned) or rejected (returned to the HQ Maker)." aside={<SeeAll href={STAGE_HREF}>Project Status</SeeAll>}>
            <ProjectOverview
              counts={{ '': k.projects, PENDING: k.pendingChecker + k.pendingApprover, APPROVED: k.sanctioned, REJECTED: k.returned }}
              hrefFor={(group) => (group ? `${STAGE_HREF}?group=${group}` : STAGE_HREF)}
            />
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

          <div className="grid grid-cols-1 gap-6">
            <Card title="Recently changed projects" aside={<SeeAll href={STAGE_HREF} />} padded={false}>
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
            <Card title="District-wise comparison" description="Sanctioned amount, expenditure and balance, physical progress and reports in verification." aside={<SeeAll href="/dashboard/admin/deadlines"><CalendarClock className="h-3 w-3" aria-hidden="true" /> Deadlines</SeeAll>} padded={false}>
              <DataTable rows={data.districts} columns={DISTRICT_COLUMNS} rowKey={(row) => row.name} caption="Districts" csvName="district_comparison.csv"
                defaultSort={{ key: 'name', direction: 'asc' }} minWidth={820} emptyText="No sanctioned project yet." />
            </Card>
          </div>
        </>
      )}
    </HomeShell>
  );
}
