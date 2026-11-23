"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FileSpreadsheet, Inbox, Landmark, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { DISTRICTS } from '@/constants/districts';
import { Pagination } from '@/components/ui/Pagination';
import { ActionButton, Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { Tabs, FilterSelect } from '@/components/head56/shared';
import { downloadDnssExcel, downloadMeetingsExcel, fetchDnssList, fetchMeetings } from '@/lib/formsApi';
import { CARD_COLORS, colorFor } from '@/lib/cardColors';
import { PageHeader, StatusPill, card, day, linkButton, num, useRoleBase } from './shared';

export const COMMITTEES = {
  HPC: { code: 'HPC', name: 'High Power Committee', by: 'HQ Maker' },
  SLEC: { code: 'SLEC', name: 'State Level Executive Committee', by: 'HQ Maker' },
  DLEC: { code: 'DLEC', name: 'District Level Executive Committee', by: 'District Maker' },
};
const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' }, { value: 'PENDING_APPROVAL', label: 'Pending HQ Approver' },
  { value: 'RETURNED', label: 'Returned to Maker' }, { value: 'APPROVED', label: 'Approved by HQ' },
];
const years = () => { const y = new Date().getFullYear(); return [y, y - 1, y - 2, y - 3].map(String); };

function useExport(run) {
  const [state, setState] = useState({ busy: false, error: '' });
  const go = async () => {
    setState({ busy: true, error: '' });
    try { await run(); setState({ busy: false, error: '' }); } catch (err) { setState({ busy: false, error: err?.message || 'The file could not be prepared.' }); }
  };
  return [state, go];
}

function Stat({ label, value, tone = 'text-slate-900' }) {
  const c = CARD_COLORS[colorFor(label)];
  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${c.card}`}>
      <dt className={`text-[15px] font-extrabold ${c.label}`}>{label}</dt>
      <dd className={`mt-1 text-2xl font-extrabold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function MeetingTable({ items, base, showDistrict }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-2.5">Meeting</th>
            {showDistrict && <th scope="col" className="px-3 py-2.5">District</th>}
            <th scope="col" className="px-3 py-2.5">Date &amp; place</th>
            <th scope="col" className="px-3 py-2.5 text-right">Male</th>
            <th scope="col" className="px-3 py-2.5 text-right">Female</th>
            <th scope="col" className="px-3 py-2.5 text-right">Total</th>
            <th scope="col" className="px-3 py-2.5">Attached</th>
            <th scope="col" className="px-5 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((m) => (
            <tr key={m.id} className="hover:bg-slate-50/60">
              <th scope="row" className="px-5 py-3 text-left font-normal">
                <Link href={`${base}/committees/meeting/${m.id}`} className="font-semibold text-navy hover:underline">{m.type} meeting no. {m.meetingNo}</Link>
                <span className="block font-mono text-xs text-slate-500">{m.refNo}</span>
              </th>
              {showDistrict && <td className="px-3 py-3">{m.district}</td>}
              <td className="px-3 py-3"><span className="block font-medium text-slate-800">{day(m.meetingDate)}</span><span className="block max-w-[16rem] truncate text-xs text-slate-500" title={m.place}>{m.place}</span></td>
              <td className="px-3 py-3 text-right tabular-nums">{num(m.participants.male)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{num(m.participants.female)}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">{num(m.participants.total)}</td>
              <td className="px-3 py-3 text-xs text-slate-600">{m.minutes ? 'Minutes' : <span className="text-amber-700">No minutes</span>} · {m.photographs} photo{m.photographs === 1 ? '' : 's'}</td>
              <td className="px-5 py-3"><StatusPill status={m.status} label={m.statusLabel} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Meetings of one committee: what waits for the HQ Approver, the register, and the Excel. */
function MeetingList({ type, stateWide }) {
  const base = useRoleBase();
  const committee = COMMITTEES[type];
  const [filters, setFilters] = useState({ year: '', status: '', district: '' });
  const [page, setPage] = useState(1);
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });
  const [pending, setPending] = useState([]);
  const [exp, runExport] = useExport(() => downloadMeetingsExcel({ type, year: filters.year, district: filters.district }));

  useEffect(() => {
    let live = true;
    setBox((b) => ({ ...b, loading: true, error: '' }));
    fetchMeetings({ type, ...filters, page, limit: 20 })
      .then((data) => live && setBox((b) => ({ ...b, data, loading: false })))
      .catch((err) => live && setBox((b) => ({ ...b, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [type, filters, page, box.attempt]);

  const canApprove = box.data?.permissions?.canApprove;
  useEffect(() => {
    if (!canApprove) { setPending([]); return; }
    fetchMeetings({ type, status: 'PENDING_APPROVAL', limit: 50 }).then((data) => setPending(data.items || [])).catch(() => setPending([]));
  }, [canApprove, type, box.attempt]);

  const set = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const summary = box.data?.summary;
  const canCreate = box.data?.permissions?.canCreate?.[type];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600"><strong>{committee.name}</strong> — entered by the {committee.by}, approved by the HQ Approver. The PDF of each meeting can be downloaded from it.</p>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton variant="secondary" size="sm" icon={FileSpreadsheet} loading={exp.busy} onClick={runExport}>Excel register</ActionButton>
          {canCreate && <Link href={`${base}/committees/meeting/new?type=${type}`} className={linkButton}><Plus className="h-4 w-4" aria-hidden="true" />New {type} meeting</Link>}
        </div>
      </div>
      {exp.error && <Notice tone="error">{exp.error}</Notice>}

      {summary && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Meetings" value={num(summary.meetings)} />
          <Stat label="Approved by HQ" value={num(summary.approved)} tone="text-emerald-700" />
          <Stat label="Pending HQ Approver" value={num(summary.pending)} tone={summary.pending ? 'text-amber-700' : 'text-slate-900'} />
          <Stat label="Male participants" value={num(summary.male)} />
          <Stat label="Female participants" value={num(summary.female)} />
        </dl>
      )}

      {canApprove && (
        <section className={card}>
          <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <Inbox className="h-4 w-4 text-navy" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">Awaiting your approval</h2>
            {pending.length > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{pending.length}</span>}
          </header>
          {pending.length ? <MeetingTable items={pending} base={base} showDistrict={type === 'DLEC'} /> : <p className="px-5 py-6 text-center text-sm text-slate-500">No {type} meeting is waiting for your approval.</p>}
        </section>
      )}

      <section className={card}>
        <header className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-3">
          <FilterSelect id={`${type}-year`} label="Year" value={filters.year} onChange={(v) => set('year', v)} allLabel="All years" options={years()} />
          <FilterSelect id={`${type}-status`} label="Status" value={filters.status} onChange={(v) => set('status', v)} allLabel="All statuses" options={STATUS_OPTIONS} />
          {type === 'DLEC' && stateWide && <FilterSelect id={`${type}-district`} label="District" value={filters.district} onChange={(v) => set('district', v)} allLabel="All districts" options={DISTRICTS} />}
        </header>
        {box.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading meetings">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" title="Unable to load meetings." action={<RetryButton onClick={() => setBox((b) => ({ ...b, attempt: b.attempt + 1 }))} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && (box.data?.items?.length
          ? <MeetingTable items={box.data.items} base={base} showDistrict={type === 'DLEC'} />
          : <p className="px-5 py-12 text-center text-sm text-slate-500">No {type} meeting recorded{filters.year || filters.status ? ' for these filters' : ' yet'}.{canCreate ? ` Use “New ${type} meeting” to enter one.` : ''}</p>)}
      </section>
      {box.data?.pagination?.totalPages > 1 && <Pagination currentPage={box.data.pagination.page} totalPages={box.data.pagination.totalPages} totalItems={box.data.pagination.total} limit={20} onPageChange={setPage} />}
    </div>
  );
}

/** DNSS of every Gram Panchayat, with members by gender. */
function DnssList({ stateWide }) {
  const base = useRoleBase();
  const [filters, setFilters] = useState({ district: '', search: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });
  const [exp, runExport] = useExport(() => downloadDnssExcel({ district: filters.district }));

  useEffect(() => {
    const timer = setTimeout(() => { setFilters((f) => (f.search === search ? f : { ...f, search })); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let live = true;
    setBox((b) => ({ ...b, loading: true, error: '' }));
    fetchDnssList({ ...filters, page, limit: 25 })
      .then((data) => live && setBox((b) => ({ ...b, data, loading: false })))
      .catch((err) => live && setBox((b) => ({ ...b, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [filters, page, box.attempt]);

  const summary = box.data?.summary;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600"><strong>Dhara Naula Sanrakshan Samiti (DNSS)</strong> — one per Gram Panchayat, entered by the District Maker.</p>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton variant="secondary" size="sm" icon={FileSpreadsheet} loading={exp.busy} onClick={runExport}>Excel register</ActionButton>
          {box.data?.permissions?.canCreate && <Link href={`${base}/committees/dnss/new`} className={linkButton}><Plus className="h-4 w-4" aria-hidden="true" />New DNSS</Link>}
        </div>
      </div>
      {exp.error && <Notice tone="error">{exp.error}</Notice>}
      {summary && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="DNSS committees" value={num(summary.committees)} />
          <Stat label="Groups" value={num(summary.groups)} />
          <Stat label="Members" value={num(summary.members.total)} />
          <Stat label="Female members" value={`${num(summary.members.female)} (${summary.members.femalePercent}%)`} />
          <Stat label="Male members" value={`${num(summary.members.male)} (${summary.members.malePercent}%)`} />
        </dl>
      )}
      <section className={card}>
        <header className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-3">
          {stateWide && <FilterSelect id="dnss-district" label="District" value={filters.district} onChange={(v) => { setFilters((f) => ({ ...f, district: v })); setPage(1); }} allLabel="All districts" options={DISTRICTS} />}
          <label htmlFor="dnss-search" className="flex flex-col gap-1 text-xs font-medium text-slate-500">Search
            <input id="dnss-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Gram Panchayat, block or chairperson" className="w-72 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" />
          </label>
        </header>
        {box.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading DNSS">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!box.loading && box.error && <div className="p-5"><Notice tone="error" title="Unable to load DNSS committees." action={<RetryButton onClick={() => setBox((b) => ({ ...b, attempt: b.attempt + 1 }))} />}>{box.error}</Notice></div>}
        {!box.loading && !box.error && (box.data?.items?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5">Gram Panchayat</th>
                  <th scope="col" className="px-3 py-2.5">Block / District</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Groups</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Members</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Female</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Male</th>
                  <th scope="col" className="px-3 py-2.5">Gram Pradhan / Chairperson</th>
                  <th scope="col" className="px-5 py-2.5">Formed on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {box.data.items.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <th scope="row" className="px-5 py-3 text-left font-normal"><Link href={`${base}/committees/dnss/${d.id}`} className="font-semibold text-navy hover:underline">{d.gramPanchayat?.name}</Link></th>
                    <td className="px-3 py-3">{d.block?.name}<span className="block text-xs text-slate-500">{d.district}</span></td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(d.groups)}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{num(d.members.total)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(d.members.female)} <span className="text-xs text-slate-500">({d.members.femalePercent}%)</span></td>
                    <td className="px-3 py-3 text-right tabular-nums">{num(d.members.male)} <span className="text-xs text-slate-500">({d.members.malePercent}%)</span></td>
                    <td className="px-3 py-3">{d.chairperson}<span className="block text-xs text-slate-500">{d.contactNumber}</span></td>
                    <td className="px-5 py-3">{day(d.formationDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-5 py-12 text-center text-sm text-slate-500">No DNSS recorded{filters.search || filters.district ? ' for these filters' : ' yet'}.{box.data?.permissions?.canCreate ? ' Use “New DNSS” to enter one.' : ''}</p>)}
      </section>
      {box.data?.pagination?.totalPages > 1 && <Pagination currentPage={box.data.pagination.page} totalPages={box.data.pagination.totalPages} totalItems={box.data.pagination.total} limit={25} onPageChange={setPage} />}
    </div>
  );
}

/**
 * Committees: HPC and SLEC (HQ), DLEC (district) — each meeting goes to the HQ
 * Approver — and the DNSS of each Gram Panchayat. A district sees its own DLEC and DNSS.
 */
export function CommitteesHub() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const district = user?.role === USER_ROLES.DD_LEVEL;
  const stateWide = [USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(user?.role);
  const tabs = [
    ...(district ? [] : [{ id: 'HPC', label: 'HPC Details' }, { id: 'SLEC', label: 'SLEC Details' }]),
    { id: 'DLEC', label: 'DLEC Details' },
    { id: 'DNSS', label: 'DNSS' },
  ];
  const requested = params.get('tab');
  const tab = tabs.some((t) => t.id === requested) ? requested : tabs[0].id;
  const choose = (id) => router.replace(`${pathname}?tab=${id}`, { scroll: false });

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 pb-16 sm:p-6">
      <PageHeader icon={Landmark} title="Committees" subtitle={district ? `${user?.district} — DLEC meetings and Dhara Naula Sanrakshan Samiti` : 'HPC, SLEC and DLEC meetings (approved by the HQ Approver) and Dhara Naula Sanrakshan Samiti'} />
      <Tabs tabs={tabs} value={tab} onChange={choose} label="Committees" />
      {tab === 'DNSS' ? <DnssList stateWide={stateWide} /> : <MeetingList key={tab} type={tab} stateWide={stateWide} />}
    </div>
  );
}
