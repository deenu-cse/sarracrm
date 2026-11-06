"use client";
import React, { useEffect, useState } from 'react';
import { downloadH56Statement, fetchH56Statement } from '@/lib/head56Api';
import { DISTRICTS } from '@/constants/districts';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { Notice, RetryButton, Skeleton } from '@/components/projects/create/parts';
import { Head56Table } from './Head56Table';
import { DownloadButtons, FilterSelect, fyOptions, startedMonths } from './shared';

/** The consolidated Prarup-2 statement of a month for a selection of units, with Excel and PDF export. */
export function Head56Statement({ financialYear, onYearChange }) {
  const { user } = useAuth();
  const stateWide = [USER_ROLES.SUPER_ADMIN, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_OFFICER].includes(user?.role);
  const months = startedMonths(financialYear);
  const [filters, setFilters] = useState({ month: '', district: '', level: '', verifiedOnly: false });
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });

  useEffect(() => {
    let live = true;
    setBox((current) => ({ ...current, loading: true, error: '' }));
    fetchH56Statement({ financialYear, ...filters })
      .then((data) => live && setBox((current) => ({ ...current, data, loading: false })))
      .catch((err) => live && setBox((current) => ({ ...current, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [financialYear, filters, box.attempt]);

  const set = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const data = box.data;
  const query = { financialYear, ...filters, month: filters.month || data?.reportingMonth || '' };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect id="st-fy" label="Financial year" value={financialYear} onChange={onYearChange} options={fyOptions()} />
          <FilterSelect id="st-month" label="Month" value={filters.month} onChange={(v) => set('month', v)} allLabel="Last completed month" options={months} />
          {stateWide && <FilterSelect id="st-district" label="District" value={filters.district} onChange={(v) => set('district', v)} allLabel="Whole State" options={DISTRICTS} />}
          {user?.role !== USER_ROLES.PIA_OFFICER && <FilterSelect id="st-level" label="Level" value={filters.level} onChange={(v) => set('level', v)} allLabel="All levels" options={[{ value: 'HQ', label: 'SARRA HQ' }, { value: 'DISTRICT', label: 'District SARRA Centres' }, { value: 'PIA', label: 'PIAs' }]} />}
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={filters.verifiedOnly} onChange={(event) => set('verifiedOnly', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />
            Verified by State only
          </label>
        </div>
        {data && <DownloadButtons onDownload={(format) => downloadH56Statement(query, format)} />}
      </section>

      {box.loading && !data && <Skeleton className="h-96" />}
      {box.error && <Notice tone="error" title="Unable to load the statement." action={<RetryButton onClick={() => setBox((current) => ({ ...current, attempt: current.attempt + 1 }))} />}>{box.error}</Notice>}
      {data && (
        <section className={`rounded-xl border border-slate-200 bg-white shadow-sm transition-opacity ${box.loading ? 'opacity-60' : ''}`}>
          <header className="border-b border-slate-100 px-5 py-3">
            <p className="text-xs font-semibold text-slate-500">SARRA अन्तर्गत 56-गैर वेतन हेतु अनुदान के अन्तर्गत आवंटित बजट के सापेक्ष वित्तीय एवं भौतिक प्रगति विवरण प्रारूप –2</p>
            <h2 className="mt-1 text-sm font-semibold text-slate-900">{data.scopeLabel} · FY {data.financialYear}, {data.period}</h2>
            <p className="text-xs text-slate-500">{data.units} unit allocation(s) · {data.reports} report(s) filed for the month · {data.verifiedOnly ? 'verified reports only' : 'all filed reports (in the chain, returned or verified)'} · amounts in ₹ lakh</p>
          </header>
          <Head56Table rows={data.rows} total={data.total} variant="STATEMENT" caption={`Prarup-2 statement, ${data.period}`} />
        </section>
      )}
    </div>
  );
}
