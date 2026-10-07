"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, ClipboardList, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ActionLink, COLORS, Card, Empty, FilingCard, HomeShell, Meter, Metric, MoneyFlow, SeeAll, TaskList, TrendBars, ago, lakh, shortLakh, td, th, useHome } from './HomeKit';

function DistrictTable({ rows }) {
  if (rows.length === 0) return <div className="p-5"><Empty>No sanctioned project yet.</Empty></div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <caption className="sr-only">District performance</caption>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th scope="col" className={`${th} pl-5`}>District</th>
            <th scope="col" className={`${th} text-right`}>Projects</th>
            <th scope="col" className={`${th} text-right`}>Released</th>
            <th scope="col" className={`${th} w-44`}>Spent of released</th>
            <th scope="col" className={`${th} text-right`}>Physical</th>
            <th scope="col" className={th}>Reports for the month</th>
            <th scope="col" className={`${th} pr-5 text-right`}>For State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.name} className="transition-colors hover:bg-slate-50/60">
              <th scope="row" className={`${td} pl-5 text-left font-semibold text-slate-900`}>{row.name}</th>
              <td className={`${td} text-right tabular-nums`}>{row.projects}</td>
              <td className={`${td} text-right tabular-nums`}>{shortLakh(row.releasedLakh)}</td>
              <td className={td}>
                <span className="text-xs font-semibold tabular-nums text-slate-700">{row.utilisationPercent}%</span>
                <div className="mt-1"><Meter percent={row.utilisationPercent} color={COLORS.spent} label={`${row.name}: spent of released`} /></div>
              </td>
              <td className={`${td} text-right tabular-nums`}>{row.physicalPercent}%</td>
              <td className={`${td} tabular-nums`}>
                {row.expected === 0 ? <span className="text-xs text-slate-400">None expected</span> : <>{row.filed} of {row.expected} filed</>}
                {row.overdue > 0 && <span className="ml-2 inline-block rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">{row.overdue} overdue</span>}
              </td>
              <td className={`${td} pr-5 text-right tabular-nums ${row.awaitingState ? 'font-semibold text-amber-700' : ''}`}>{row.awaitingState}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportList({ reports, empty, showWait = false }) {
  if (reports.length === 0) return <div className="p-5"><Empty>{empty}</Empty></div>;
  return (
    <ul className="divide-y divide-slate-100">
      {reports.map((report) => {
        const body = (
          <>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">{report.department} · {report.period}</span>
              <span className="block truncate text-xs text-slate-500">{report.projectCode} · {report.district}{!showWait ? ` · filed ${ago(report.submittedAt)}` : ''}</span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-2">
              {showWait
                ? <span className="text-xs font-semibold tabular-nums text-slate-600">{report.daysWaiting === 0 ? 'today' : `${report.daysWaiting} day${report.daysWaiting === 1 ? '' : 's'}`}</span>
                : <Badge status={report.status} />}
              {report.href && <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
            </span>
          </>
        );
        const cls = 'flex flex-wrap items-center justify-between gap-3 px-5 py-3';
        return <li key={report.id}>{report.href ? <Link href={report.href} className={`${cls} transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50`}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
      })}
    </ul>
  );
}

function Overview({ data, deadlinesHref }) {
  const k = data.kpis;
  const o = data.outcomes;
  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Sanctioned projects" value={String(k.projects)} sub={`${k.inProgress} in progress · ${k.closed} closed · ${k.districts} district${k.districts === 1 ? '' : 's'}`} />
        <Metric label="Funds released" value={lakh(k.releasedLakh)} sub={`${k.releasePercent}% of ${lakh(k.sanctionedLakh)}`} />
        <Metric label="Expenditure reported" value={lakh(k.spentLakh)} sub={`${k.utilisationPercent}% of releases · ${lakh(k.unspentLakh)} unspent`} />
        <Metric label="Physical progress" value={`${k.physicalPercent}%`} sub={`From ${k.reports} monthly report${k.reports === 1 ? '' : 's'}`} />
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FilingCard period={data.period} expected={k.expected} filed={k.filed} overdue={k.overdue} href={deadlinesHref} />
        <Card title="Where reports stand" description="All monthly reports filed so far.">
          <dl className="space-y-2.5 text-sm">
            {[['With district for review', k.awaitingDistrict], ['Approved, awaiting State', k.awaitingState], ['Verified by State', k.verified]].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3"><dt className="text-slate-600">{label}</dt><dd className="font-semibold tabular-nums text-slate-900">{value}</dd></div>
            ))}
          </dl>
        </Card>
        <Card title="Outcome tracking" description="Projects with a baseline, and measured again.">
          {o.projects === 0 ? <Empty>No sanctioned project yet.</Empty> : (
            <dl className="space-y-3 text-sm">
              {[['Baseline recorded', o.withBaseline], ['Measured after baseline', o.measured]].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3"><dt className="text-slate-600">{label}</dt><dd className="font-semibold tabular-nums text-slate-900">{value} of {o.projects}</dd></div>
                  <Meter percent={(value / o.projects) * 100} label={label} />
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>

      <Card title="District performance" description="Funds, progress and reporting for each district with sanctioned projects." padded={false}>
        <DistrictTable rows={data.districts} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="State funds"><MoneyFlow sanctionedLakh={k.sanctionedLakh} releasedLakh={k.releasedLakh} spentLakh={k.spentLakh} /></Card>
        <Card title="Last six months" description="Funds released and expenditure reported, by month."><TrendBars trend={data.trend} /></Card>
      </div>
    </>
  );
}

/** Home of the M&E administrator: verify reports for the State and watch every district. */
export function MonitoringAdminHome() {
  const home = useHome();
  const data = home.data;
  return (
    <HomeShell
      home={home}
      roleLine="Monitoring & Evaluation · Administrator"
      actions={<><ActionLink href="/dashboard/mnd-admin/analytics" icon={BarChart3}>Analytics</ActionLink><ActionLink href="/dashboard/mnd-admin/mpr" icon={ClipboardList} primary>All Reports</ActionLink></>}
    >
      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3"><TaskList tasks={data.tasks} emptyText="No report is waiting for State verification and nothing is overdue." /></div>
            <Card className="lg:col-span-2" title="To verify for the State" description="Approved by the district, longest wait first." aside={<SeeAll href="/dashboard/mnd-admin/mpr" />} padded={false}>
              <ReportList reports={data.verifyQueue} empty="No report is waiting for verification." showWait />
            </Card>
          </div>
          <Overview data={data} deadlinesHref="/dashboard/mnd-admin/deadlines" />
        </>
      )}
    </HomeShell>
  );
}

const LEGACY_LINKS = [
  ['Abstract 55', '/dashboard/mnd/abstract55'], ['Head 55-01 (Spring)', '/dashboard/mnd/head55-01'], ['Head 55-02 (River)', '/dashboard/mnd/head55-02'],
  ['Head 55-03 (Major River)', '/dashboard/mnd/head55-03'], ['Head 55-04 (Ground Water)', '/dashboard/mnd/head55-04'],
];

/** Home of an M&E officer: own compiled reports first, then the State picture (read only). */
export function MonitoringOfficerHome() {
  const home = useHome();
  const data = home.data;
  const stats = data?.legacy?.stats || {};
  const drafts = data?.legacy?.actionRequired || [];
  return (
    <HomeShell
      home={home}
      roleLine="Monitoring & Evaluation · Officer"
      actions={<><ActionLink href="/dashboard/mnd/analytics" icon={BarChart3}>Analytics</ActionLink><ActionLink href="/dashboard/mnd/mpr" icon={FileText} primary>My Reports</ActionLink></>}
    >
      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3" title="My compiled reports" description="Abstract 55 and head-wise reports you prepare." aside={<SeeAll href="/dashboard/mnd/mpr" />}>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Drafts', stats.drafts, stats.drafts ? 'text-amber-700' : ''], ['Submitted', stats.submitted, ''], ['Approved', stats.approved, 'text-emerald-700'], ['Rejected', stats.rejected, stats.rejected ? 'text-red-700' : '']].map(([label, value, tone]) => (
                  <div key={label} className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className={`text-xl font-bold tabular-nums ${tone || 'text-slate-900'}`}>{value ?? 0}</dd>
                  </div>
                ))}
              </dl>
              {drafts.length > 0 && (
                <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {drafts.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
                        <span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{item.title}</span><span className="block truncate text-xs text-slate-500">{item.subtitle}</span></span>
                        <Badge status={item.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="lg:col-span-2" title="Prepare a report" description="Open a form to start or continue.">
              <ul className="space-y-2">
                {LEGACY_LINKS.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-navy/40 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                      {label} <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <h2 className="pt-2 text-sm font-semibold text-slate-900">State picture <span className="font-normal text-slate-500">(project reporting, read only)</span></h2>
          <Overview data={data} deadlinesHref={null} />

          <Card title="Latest project reports" description="Most recently filed by PIA officers across the State." padded={false}>
            <ReportList reports={data.recentReports} empty="No project report has been filed yet." />
          </Card>
        </>
      )}
    </HomeShell>
  );
}
