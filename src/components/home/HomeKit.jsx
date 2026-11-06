"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import axiosInstance from '@/lib/axiosInstance';
import { request } from '@/lib/projectApi';
import { useAuth } from '@/hooks/useAuth';
import { formatIndian, formatLakh } from '@/lib/numeric';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';

/** Shared pieces of the role home pages. Each role composes its own page from these. */

export const COLORS = { sanctioned: '#2a78d6', spent: '#1baf7a', balance: '#eb6834' };
export const count = (value) => formatIndian(value || 0, { maxDecimals: 0 });
export const lakh = (value) => formatLakh(value || 0);
/** Shorter money for tight places: "₹ 12.50 L". */
export const shortLakh = (value) => lakh(value).replace(' Lakh', ' L');
export const day = (value) => {
  if (!value) return '—';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const ago = (value) => {
  if (!value) return '';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return days < 30 ? `${days} days ago` : new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Loads the signed-in role's home data. */
export function useHome() {
  const [box, setBox] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(() => {
    setBox((current) => ({ ...current, loading: true, error: '' }));
    return request(() => axiosInstance.get('/monitoring/home'), 'Unable to load your home page. Please try again.')
      .then((data) => setBox({ data, loading: false, error: '' }))
      .catch((err) => setBox((current) => ({ data: current.data, loading: false, error: err?.message || 'Unable to load your home page. Please try again.' })));
  }, []);
  useEffect(() => { load(); }, [load]);
  return { ...box, reload: load };
}

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  return hour < 17 ? 'Good afternoon' : 'Good evening';
};

/** Page frame: greeting, who you are, today's date, the main actions, then the page. */
export function HomeShell({ home, roleLine, actions, children }) {
  const { user } = useAuth();
  const [today, setToday] = useState('');
  const [hello, setHello] = useState('Welcome');
  // Set on the client only, so the server and first client render agree.
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    setHello(greeting());
  }, []);

  if (home.loading && !home.data) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6" role="status" aria-label="Loading your home page">
        <Skeleton className="h-14 w-96 max-w-full" />
        <Skeleton className="h-40" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-24" />)}</div>
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (!home.data) {
    return <div className="mx-auto max-w-2xl p-6 pt-10"><Notice tone="error" title="Unable to load your home page." action={<RetryButton onClick={home.reload} />}>{home.error}</Notice></div>;
  }

  return (
    <div className="mx-auto max-w-7xl p-4 pb-16 sm:p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{roleLine}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{hello}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{today || ' '}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={home.reload} disabled={home.loading} aria-label="Refresh" title="Refresh"
            className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${home.loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          {actions}
        </div>
      </header>
      {home.error && <div className="mb-5"><Notice tone="error" action={<RetryButton onClick={home.reload} />}>{home.error}</Notice></div>}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

const linkBase = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
export function ActionLink({ href, icon: Icon, children, primary = false }) {
  return (
    <Link href={href} className={`${linkBase} ${primary ? 'bg-navy text-white shadow-sm hover:bg-navy-light hover:shadow-md focus-visible:ring-navy/50' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-400/50'}`}>
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}{children}
    </Link>
  );
}

export function Card({ title, description, aside, children, padded = true, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || aside) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {aside}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function SeeAll({ href, children = 'See all' }) {
  return <Link href={href} className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">{children} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>;
}

export function Empty({ children }) {
  return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">{children}</p>;
}

const TONES = {
  danger: { bar: 'bg-red-600', chip: 'bg-red-100 text-red-800', Icon: AlertTriangle, icon: 'text-red-600' },
  warning: { bar: 'bg-amber-500', chip: 'bg-amber-100 text-amber-900', Icon: AlertTriangle, icon: 'text-amber-600' },
  info: { bar: 'bg-sky-500', chip: 'bg-sky-100 text-sky-900', Icon: Info, icon: 'text-sky-600' },
};

/** "Needs your action": the first thing on every home page. Most urgent first. */
export function TaskList({ tasks, emptyTitle = 'Nothing is waiting for you', emptyText = 'You are up to date.' }) {
  const order = { danger: 0, warning: 1, info: 2 };
  const sorted = [...tasks].sort((a, b) => order[a.tone] - order[b.tone]);
  const total = tasks.reduce((sum, item) => sum + (item.count || 1), 0);
  return (
    <section aria-labelledby="home-tasks" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 id="home-tasks" className="text-sm font-semibold text-slate-900">Needs your action</h2>
        {total > 0 && <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold tabular-nums text-white">{total}</span>}
      </header>
      {sorted.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600" aria-hidden="true"><CheckCircle2 className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{emptyTitle}</p>
            <p className="text-sm text-slate-500">{emptyText}</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {sorted.map((item) => {
            const tone = TONES[item.tone] || TONES.info;
            return (
              <li key={item.key} className="relative">
                <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden="true" />
                <Link href={item.href} className="group flex items-center gap-4 py-3.5 pl-6 pr-5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40">
                  <tone.Icon className={`h-5 w-5 flex-shrink-0 ${tone.icon}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                    {item.detail && <span className="block truncate text-sm text-slate-500">{item.detail}</span>}
                  </span>
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors group-hover:border-navy group-hover:text-navy">
                    {item.cta} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function Metric({ label, value, sub, tone = 'default', icon: Icon, href }) {
  const tones = { default: 'text-slate-900', success: 'text-emerald-700', warning: 'text-amber-700', danger: 'text-red-700' };
  const body = (
    <>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">{Icon && <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}{label}</dt>
      <dd className={`mt-1 text-xl font-bold tabular-nums ${tones[tone] || tones.default}`}>{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-xs text-slate-500">{sub}</dd>}
    </>
  );
  const cls = 'block rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm';
  return href
    ? <Link href={href} className={`${cls} transition-[border-color,box-shadow] hover:border-navy/40 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40`}>{body}</Link>
    : <div className={cls}>{body}</div>;
}

export function Meter({ percent, color = '#0a3d62', label }) {
  const value = Math.max(0, Math.min(100, percent || 0));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

/** Sanctioned, spent and balance as three bars on one scale. */
export function MoneyFlow({ sanctionedLakh, spentLakh, balanceLakh }) {
  const top = Math.max(sanctionedLakh || 0, spentLakh || 0);
  const share = (value) => (sanctionedLakh > 0 ? `${Math.floor(((value || 0) / sanctionedLakh) * 1000) / 10}% of sanctioned` : '');
  const rows = [
    { key: 'sanctioned', label: 'Sanctioned', value: sanctionedLakh || 0, note: '' },
    { key: 'spent', label: 'Expenditure', value: spentLakh || 0, note: share(spentLakh) },
    { key: 'balance', label: 'Balance', value: balanceLakh ?? Math.max(0, (sanctionedLakh || 0) - (spentLakh || 0)), note: share(balanceLakh) },
  ];
  if (top <= 0) return <Empty>No budget has been sanctioned yet.</Empty>;
  return (
    <dl className="space-y-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-700"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[row.key] }} aria-hidden="true" />{row.label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-slate-900">{lakh(row.value)}{row.note && <span className="ml-2 text-xs font-normal text-slate-500">{row.note}</span>}</dd>
          </div>
          <div className="h-3 w-full overflow-hidden rounded bg-slate-100" aria-hidden="true">
            <div className="h-full rounded transition-[width] duration-500 ease-out" style={{ width: `${(row.value / top) * 100}%`, backgroundColor: COLORS[row.key] }} />
          </div>
        </div>
      ))}
    </dl>
  );
}

/** Expenditure reported in each of the last six months, with the reports filed and verified. */
export function TrendBars({ trend }) {
  const [hover, setHover] = useState(null);
  const top = Math.max(...trend.map((item) => item.spentLakh || 0), 0);
  if (top <= 0) return <Empty>No expenditure was reported in the last six months.</Empty>;
  const width = 560; const height = 190; const pad = { left: 8, right: 8, top: 12, bottom: 24 };
  const band = (width - pad.left - pad.right) / trend.length;
  const bar = Math.min(34, band - 14);
  const y = (value) => pad.top + (1 - value / top) * (height - pad.top - pad.bottom);
  const shown = hover !== null ? trend[hover] : null;
  return (
    <figure>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Expenditure reported, last six months">
          {[0.5, 1].map((share) => <line key={share} x1={pad.left} x2={width - pad.right} y1={y(top * share)} y2={y(top * share)} stroke="#e2e8f0" strokeWidth="1" />)}
          <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="#cbd5e1" strokeWidth="1" />
          {trend.map((item, index) => {
            const center = pad.left + band * index + band / 2;
            const rect = (value, x, color) => {
              const h = Math.max(value > 0 ? 2 : 0, y(0) - y(value));
              return <path d={`M${x},${y(0)} v${-(h - Math.min(4, h))} q0,${-Math.min(4, h)} ${Math.min(4, h)},${-Math.min(4, h)} h${bar - 2 * Math.min(4, h)} q${Math.min(4, h)},0 ${Math.min(4, h)},${Math.min(4, h)} v${h - Math.min(4, h)} z`} fill={color} />;
            };
            return (
              <g key={item.label}>
                {hover === index && <rect x={pad.left + band * index + 2} y={pad.top} width={band - 4} height={height - pad.top - pad.bottom} fill="#f1f5f9" rx="4" />}
                {rect(item.spentLakh, center - bar / 2, COLORS.spent)}
                <text x={center} y={height - 7} textAnchor="middle" fontSize="11" fill="#64748b">{item.label}</text>
                <rect x={pad.left + band * index} y={0} width={band} height={height} fill="transparent" tabIndex={0} role="img"
                  aria-label={`${item.label}: spent ${lakh(item.spentLakh)}, ${item.reports || 0} reports filed, ${item.verified || 0} verified`}
                  onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} style={{ outline: 'none' }} />
              </g>
            );
          })}
        </svg>
        {shown && (
          <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg" style={{ left: `${((pad.left + band * hover + band / 2) / width) * 100}%` }}>
            <span className="block font-semibold">{shown.label}</span>
            <span className="block tabular-nums">Spent {lakh(shown.spentLakh)}</span>
            <span className="block tabular-nums">{shown.reports || 0} reports · {shown.verified || 0} verified</span>
          </div>
        )}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS.spent }} aria-hidden="true" />Expenditure reported</span>
        <span className="text-slate-400">Highest month: {lakh(top)}</span>
      </figcaption>
    </figure>
  );
}

/** How many of the reports expected for last month have been filed. */
export function FilingCard({ period, expected, filed, overdue, href }) {
  const share = expected > 0 ? Math.round((filed / expected) * 100) : 0;
  return (
    <Card title={`Monthly reports for ${period.label}`} description={`Due by ${day(period.dueDate)}. ${period.nextLabel} is due by ${day(period.nextDueDate)}.`} aside={href && <SeeAll href={href}>Deadlines</SeeAll>}>
      {expected === 0 ? <Empty>No report was expected for this month.</Empty> : (
        <>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-slate-900">{filed}</span>
            <span className="text-sm text-slate-500">of {expected} filed ({share}%)</span>
          </p>
          <div className="mt-3"><Meter percent={share} color={filed === expected ? COLORS.spent : '#0a3d62'} label={`Reports filed for ${period.label}`} /></div>
          <p className={`mt-3 text-sm ${overdue ? 'font-semibold text-red-700' : 'text-slate-500'}`}>{overdue ? `${overdue} overdue` : expected === filed ? 'Every expected report is in.' : `${expected - filed} not yet filed, none overdue.`}</p>
        </>
      )}
    </Card>
  );
}

const TIER_OF_OWNER = (owner) => (owner?.startsWith('HQ') ? 'HQ' : owner?.startsWith('District') ? 'District' : 'PIA');

/** Reports waiting at each step of the chain: the pending Maker, Checker and Approver actions. */
export function PendingStages({ stages = [] }) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);
  if (!stages.length || total === 0) return <Empty>No report is waiting at any verification step.</Empty>;
  const groups = ['PIA', 'District', 'HQ'].map((tier) => ({ tier, rows: stages.filter((stage) => TIER_OF_OWNER(stage.owner) === tier) })).filter((group) => group.rows.length);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {groups.map((group) => (
        <div key={group.tier} className="rounded-lg border border-slate-200">
          <p className="border-b border-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{group.tier}</p>
          <ul className="divide-y divide-slate-100">
            {group.rows.map((stage) => (
              <li key={stage.status} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="text-slate-700">{stage.owner}</span>
                <span className="text-right">
                  <span className={`block font-bold tabular-nums ${stage.count ? 'text-slate-900' : 'text-slate-300'}`}>{stage.count}</span>
                  {stage.count > 0 && <span className={`block text-[11px] ${stage.oldestDays > 5 ? 'text-red-700' : 'text-slate-400'}`}>oldest {stage.oldestDays}d</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Compact list of reports (queue, recent): period, project, where it stands. */
export function ReportRows({ reports = [], empty }) {
  if (!reports.length) return <div className="p-5"><Empty>{empty}</Empty></div>;
  return (
    <ul className="divide-y divide-slate-100">
      {reports.map((report) => {
        const body = (
          <>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">{report.department} — {report.period}</span>
              <span className="block truncate text-xs text-slate-500"><span className="font-mono">{report.mprNo}</span> · {report.projectCode}{report.district ? ` · ${report.district}` : ''}{report.entryMode === 'DISTRICT' ? ' · district entry' : ''}</span>
            </span>
            <span className="flex flex-shrink-0 flex-col items-end gap-1">
              <Badge status={report.status} />
              {report.awaiting && <span className={`text-[11px] ${report.daysWaiting > 5 ? 'font-semibold text-red-700' : 'text-slate-400'}`}>waiting {report.daysWaiting}d</span>}
            </span>
          </>
        );
        return (
          <li key={report.id}>
            {report.href
              ? <Link href={report.href} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">{body}</Link>
              : <div className="flex items-center justify-between gap-3 px-5 py-3">{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export const th = 'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500';
export const td = 'px-3 py-3 text-sm text-slate-700';
export const rowLink = 'font-semibold text-slate-900 hover:text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40';
