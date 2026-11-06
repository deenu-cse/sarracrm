"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createH56Allocation, fetchH56Allocations } from '@/lib/head56Api';
import { fetchDepartments } from '@/lib/projectApi';
import { DISTRICTS } from '@/constants/districts';
import { Dialog } from '@/components/ui/Dialog';
import { ActionButton, Field, Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { Kpi } from '@/components/analytics/AnalyticsParts';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { AllocationPill, FilterSelect, LevelPill, fyOptions, lakh, moment, selectClass, useH56Base } from './shared';

/** Head 56 allocations of a financial year: one per implementing unit. HQ Maker adds units. */
export function Head56Allocations({ financialYear, onYearChange }) {
  const base = useH56Base();
  const router = useRouter();
  const { user } = useAuth();
  // A PIA sees only its own unit; a district its Centre and PIAs; HQ and M&E every unit.
  const showLevel = user?.role !== USER_ROLES.PIA_OFFICER;
  const showDistrict = [USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(user?.role);
  const [level, setLevel] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState({ loading: true, error: '', data: null, attempt: 0 });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ level: 'PIA', district: '', departmentId: '' });
  const [departments, setDepartments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    fetchH56Allocations({ financialYear, level, district })
      .then((data) => live && setState((current) => ({ ...current, loading: false, data })))
      .catch((err) => live && setState((current) => ({ ...current, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [financialYear, level, district, state.attempt]);

  useEffect(() => {
    if (adding && !departments.length) fetchDepartments().then(setDepartments).catch(() => {});
  }, [adding, departments.length]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await createH56Allocation({ financialYear, ...draft });
      router.push(`${base}/allocation/${result.id}`);
    } catch (err) {
      setError(err?.message || 'The allocation could not be created.');
      setBusy(false);
    }
  };

  const data = state.data;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect id="alloc-fy" label="Financial year" value={financialYear} onChange={onYearChange} options={fyOptions()} />
          {showLevel && <FilterSelect id="alloc-level" label="Level" value={level} onChange={setLevel} allLabel="All levels" options={[{ value: 'HQ', label: 'SARRA HQ' }, { value: 'DISTRICT', label: 'District SARRA Centres' }, { value: 'PIA', label: 'PIAs' }]} />}
          {showDistrict && <FilterSelect id="alloc-district" label="District" value={district} onChange={setDistrict} allLabel="All districts" options={DISTRICTS} />}
        </div>
        {data?.permissions?.canCreate && <ActionButton icon={Plus} onClick={() => { setAdding(true); setError(''); }}>Add Unit Allocation</ActionButton>}
      </div>

      {data && (
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Units with an allocation" value={data.summary.units} />
          <Kpi label="Published" value={data.summary.published} tone="success" />
          <Kpi label="Awaiting HQ Checker / Approver" value={data.summary.awaiting} tone={data.summary.awaiting ? 'warning' : 'default'} />
          <Kpi label="Published budget (SARRA)" value={lakh(data.summary.budgetLakh)} />
          <Kpi label="Departmental share (PIAs)" value={lakh(data.summary.deptShareLakh)} />
        </dl>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {state.loading && <div className="space-y-2 p-5" role="status" aria-label="Loading allocations">{[0, 1, 2].map((n) => <Skeleton key={n} className="h-12" />)}</div>}
        {!state.loading && state.error && <div className="p-5"><Notice tone="error" title="Unable to load allocations." action={<RetryButton onClick={() => setState((current) => ({ ...current, attempt: current.attempt + 1 }))} />}>{state.error}</Notice></div>}
        {!state.loading && !state.error && data?.items?.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No Head 56 allocation for {financialYear} yet.{data.permissions.canCreate ? ' Add the units that receive the Non-Salary Grant: SARRA HQ, each District SARRA Centre and each PIA.' : ' HQ enters and publishes the allocations.'}</p>
        )}
        {!state.loading && !state.error && data?.items?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5">Unit</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Version</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Published budget</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Dept. share</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((item) => (
                  <tr key={item.id} tabIndex={0} onClick={() => router.push(`${base}/allocation/${item.id}`)} onKeyDown={(event) => { if (event.key === 'Enter') router.push(`${base}/allocation/${item.id}`); }} className="cursor-pointer hover:bg-navy/[0.03] focus:outline-none focus-visible:bg-navy/[0.06]">
                    <th scope="row" className="px-5 py-3 text-left font-normal">
                      <span className="block font-semibold text-slate-900">{item.unitName}</span>
                      <span className="mt-1 inline-block"><LevelPill level={item.level} label={item.levelLabel} /></span>
                    </th>
                    <td className="px-3 py-3">
                      <AllocationPill status={item.status} label={item.statusLabel} />
                      {item.revisionPending && <span className="mt-1 block text-[11px] font-medium text-amber-700">Revision in progress — v{item.version} in force</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{item.version ? `v${item.version}` : '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{item.version ? lakh(item.budgetLakh) : <span className="font-normal text-slate-400">Not published</span>}
                      {item.workingBudgetLakh !== item.budgetLakh && <span className="block text-[11px] font-normal text-slate-500">Working: {lakh(item.workingBudgetLakh)}</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{item.level === 'PIA' ? lakh(item.deptShareLakh) : '—'}</td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">{moment(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={adding}
        onClose={() => !busy && setAdding(false)}
        dismissible={!busy}
        title={`Add a Head 56 allocation — FY ${financialYear}`}
        description="Choose the implementing unit. Opening figures are carried forward from its previous year automatically."
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setAdding(false)} disabled={busy}>Cancel</ActionButton>
            <ActionButton icon={Plus} loading={busy} disabled={(draft.level !== 'HQ' && !draft.district) || (draft.level === 'PIA' && !draft.departmentId)} onClick={create}>Create</ActionButton>
          </>
        )}
      >
        <div className="space-y-4">
          <Field id="alloc-new-level" label="Implementing level" required>
            <select id="alloc-new-level" className={`${selectClass} w-full`} value={draft.level} onChange={(event) => setDraft({ level: event.target.value, district: '', departmentId: '' })}>
              <option value="HQ">SARRA HQ</option>
              <option value="DISTRICT">District SARRA Centre</option>
              <option value="PIA">PIA (department in a district)</option>
            </select>
          </Field>
          {draft.level !== 'HQ' && (
            <Field id="alloc-new-district" label="District" required>
              <select id="alloc-new-district" className={`${selectClass} w-full`} value={draft.district} onChange={(event) => setDraft((current) => ({ ...current, district: event.target.value }))}>
                <option value="">Choose</option>
                {DISTRICTS.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </Field>
          )}
          {draft.level === 'PIA' && (
            <Field id="alloc-new-dept" label="PIA department" required>
              <select id="alloc-new-dept" className={`${selectClass} w-full`} value={draft.departmentId} onChange={(event) => setDraft((current) => ({ ...current, departmentId: event.target.value }))}>
                <option value="">Choose</option>
                {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </select>
            </Field>
          )}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Dialog>
    </div>
  );
}
