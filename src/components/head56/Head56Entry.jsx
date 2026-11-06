"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, Save, Send } from 'lucide-react';
import { createH56Report, fetchH56Context, fetchH56EditForm, fetchH56Form, saveH56Report } from '@/lib/head56Api';
import { NumericInput } from '@/components/ui/NumericInput';
import { ActionButton, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { sumMoney } from '@/lib/numeric';
import { Head56Documents } from './Head56Documents';
import { LevelPill, amount, groupLines, lakh, pct, qty, selectClass, useH56Base } from './shared';

const toNum = (value) => { const n = Number(value); return Number.isFinite(n) ? n : 0; };
const round3 = (n) => Math.round(n * 1000) / 1000;

/** First month to offer: the one after the latest filed month, else the latest started month. */
const pickMonth = (months = []) => {
  let latest = -1;
  months.forEach((month, index) => { if (month.report) latest = index; });
  const next = months[latest + 1];
  if (next && !next.reviewed) return next.value;
  return months[months.length - 1]?.value || '';
};

const BLOCKER_LINK = { DRAFT_EXISTS: 'edit', RETURNED_PENDING: 'edit', DRAFT_PENDING: 'edit', DUPLICATE: 'view', OUT_OF_ORDER: 'view' };

/**
 * The Maker's monthly Head 56 report: SARRA HQ, a District SARRA Centre or a PIA.
 * Targets, earlier progress and every total come from the server; the Maker
 * types this month's physical progress and expenditure for each allocated line,
 * saves a draft, attaches bills and vouchers, and submits it for verification.
 */
export function Head56Entry() {
  const base = useH56Base();
  const router = useRouter();
  const params = useSearchParams();
  const reportId = params.get('id');
  const [context, setContext] = useState(null);
  const [period, setPeriod] = useState({ financialYear: '', reportingMonth: '' });
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [remarks, setRemarks] = useState('');
  const [load, setLoad] = useState({ loading: true, error: '', attempt: 0 });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const adopt = (data) => {
    setForm(data);
    setValues(Object.fromEntries((data.rows || []).map((row) => [row.code, {
      physicalCurrent: row.physicalCurrent ? String(row.physicalCurrent) : '',
      expenditureCurrentLakh: row.expenditureCurrentLakh ? String(row.expenditureCurrentLakh) : '',
      remarks: row.remarks || '',
    }])));
    setRemarks(data.remarks || '');
  };

  // An existing draft / returned report, or the Maker's unit and years for a new one.
  useEffect(() => {
    let live = true;
    setLoad((current) => ({ ...current, loading: true, error: '' }));
    setError('');
    setSaved('');
    const work = reportId
      ? fetchH56EditForm(reportId).then((data) => { if (live) { adopt(data); setPeriod({ financialYear: data.period.financialYear, reportingMonth: data.period.reportingMonth }); } })
      : fetchH56Context().then((ctx) => {
        if (!live) return;
        setContext(ctx);
        setForm(null);
        const fy = ctx.financialYears[0];
        setPeriod(fy ? { financialYear: fy.value, reportingMonth: pickMonth(fy.months) } : { financialYear: '', reportingMonth: '' });
      });
    work.then(() => live && setLoad((current) => ({ ...current, loading: false })))
      .catch((err) => live && setLoad((current) => ({ ...current, loading: false, error: err?.message || 'Unable to load the report.' })));
    return () => { live = false; };
  }, [reportId, load.attempt]);

  // New report: the form of the chosen month.
  useEffect(() => {
    if (reportId || !period.financialYear || !period.reportingMonth) return undefined;
    let live = true;
    setForm(null);
    setError('');
    fetchH56Form(period).then((data) => live && adopt(data)).catch((err) => live && setError(err?.message || 'Unable to load the form.'));
    return () => { live = false; };
  }, [reportId, period.financialYear, period.reportingMonth]);

  const documents = form?.documents || [];
  const rows = useMemo(() => (form?.rows || []).map((row) => {
    const entry = values[row.code] || {};
    const phys = row.hasPhysical ? toNum(entry.physicalCurrent) : 0;
    const exp = toNum(entry.expenditureCurrentLakh);
    const physicalFy = round3((row.physicalPrevious || 0) + phys);
    const expenditureFy = sumMoney([row.expenditurePreviousLakh, exp]);
    const balance = sumMoney([row.sarraShareLakh, -expenditureFy]);
    const errors = [];
    if (row.hasPhysical && phys > 0 && !(row.physicalTarget > 0)) errors.push('No physical target is allocated for this line.');
    else if (row.hasPhysical && row.physicalTarget > 0 && physicalFy > row.physicalTarget + 1e-9) errors.push(`Progress exceeds the target of ${qty(row.physicalTarget)} ${row.unit}.`);
    if (row.hasPhysical && !row.allowsDecimal && !Number.isInteger(phys)) errors.push('Enter a whole number.');
    if (balance < 0) errors.push(`Expenditure exceeds the approved budget by ${lakh(-balance)}.`);
    const hasDocument = documents.some((doc) => doc.code === row.code);
    const needsDocument = exp > 0 && !hasDocument && (entry.remarks || '').trim().length < 5;
    return { ...row, phys, exp, physicalFy, expenditureFy, balance, errors, hasDocument, needsDocument };
  }), [form, values, documents]);

  const totals = useMemo(() => ({
    budget: sumMoney(rows.map((r) => r.sarraShareLakh)),
    before: sumMoney(rows.map((r) => r.expenditurePreviousLakh)),
    month: sumMoney(rows.map((r) => r.exp)),
    fy: sumMoney(rows.map((r) => r.expenditureFy)),
  }), [rows]);
  const nil = rows.length > 0 && rows.every((r) => !r.phys && !r.exp);
  const hasErrors = rows.some((r) => r.errors.length);
  const missingDocs = rows.filter((r) => r.needsDocument);
  const nilNeedsRemark = nil && remarks.replace(/\s+/g, ' ').trim().length < 10;
  const blocker = form?.blocker || null;
  const locked = Boolean(blocker && (!reportId || blocker.code === 'MONTH_REVIEWED'));
  const canSubmit = !locked && !hasErrors && !missingDocs.length && !nilNeedsRemark && rows.length > 0;

  const set = (code, key, value) => setValues((current) => ({ ...current, [code]: { ...current[code], [key]: value } }));

  const payload = (asDraft) => ({
    financialYear: period.financialYear,
    reportingMonth: period.reportingMonth,
    remarks,
    asDraft,
    lines: rows.map((row) => ({
      code: row.code,
      physicalCurrent: row.hasPhysical ? values[row.code]?.physicalCurrent || 0 : 0,
      expenditureCurrentLakh: values[row.code]?.expenditureCurrentLakh || 0,
      remarks: values[row.code]?.remarks || '',
    })),
  });

  const save = async (asDraft) => {
    setBusy(asDraft ? 'draft' : 'submit');
    setError('');
    setSaved('');
    try {
      const result = reportId ? await saveH56Report(reportId, payload(asDraft)) : await createH56Report(payload(asDraft));
      if (!asDraft) { router.push(`${base}/report/${result.id}`); return; }
      if (!reportId) { router.replace(`${base}/new?id=${result.id}`); return; }
      setSaved('Draft saved. Attach the supporting documents, then submit it for verification.');
    } catch (err) {
      setError(err?.message || 'The report could not be saved.');
    } finally {
      setBusy('');
    }
  };

  const refreshDocuments = async () => {
    const data = await fetchH56EditForm(reportId);
    setForm((current) => ({ ...current, documents: data.documents }));
  };

  if (load.loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6" role="status" aria-label="Loading">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (load.error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Notice tone="error" title="Unable to open the report." action={<RetryButton onClick={() => setLoad((current) => ({ ...current, attempt: current.attempt + 1 }))} />}>{load.error}</Notice>
        <Link href={`${base}?tab=reports`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Head 56</Link>
      </div>
    );
  }

  const unit = form?.unit || context?.unit;
  const fyEntry = context?.financialYears.find((fy) => fy.value === period.financialYear);
  const pia = unit?.level === 'PIA';

  return (
    <div className="mx-auto max-w-7xl p-4 pb-32 sm:p-6">
      <Link href={`${base}?tab=reports`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Head 56 reports</Link>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Budget Head 56 · Non-Salary Grant (गैर वेतन हेतु अनुदान)</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{reportId ? `${form?.mprNo} — ${form?.statusLabel}` : 'New monthly progress report'}</h1>
          {unit && <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600"><LevelPill level={unit.level} /> {unit.unitName}</p>}
        </div>
        {form?.allocation && <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">Allocation version <strong>{form.allocation.version}</strong> (published {new Date(form.allocation.publishedAt).toLocaleDateString('en-IN')})</p>}
      </header>

      {!reportId && context && !context.financialYears.length && (
        <Notice tone="warning" title="No published allocation yet.">HQ has not yet published the Head 56 allocation of {context.unit.unitName}. Reports can be filed once the HQ Approver publishes it.</Notice>
      )}

      {!reportId && context?.financialYears.length > 0 && (
        <section className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Financial year
            <select className={selectClass} value={period.financialYear} onChange={(event) => { const fy = context.financialYears.find((f) => f.value === event.target.value); setPeriod({ financialYear: event.target.value, reportingMonth: pickMonth(fy?.months) }); }}>
              {context.financialYears.map((fy) => <option key={fy.value} value={fy.value}>{fy.value}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Reporting month
            <select className={selectClass} value={period.reportingMonth} onChange={(event) => setPeriod((current) => ({ ...current, reportingMonth: event.target.value }))}>
              {(fyEntry?.months || []).map((month) => (
                <option key={month.value} value={month.value}>{month.label}{month.report ? ` — ${month.report.statusLabel}` : month.reviewed ? ' — reviewed' : ''}</option>
              ))}
            </select>
          </label>
          {fyEntry?.revisionPending && <p className="text-xs text-amber-700">A budget revision is with HQ; the published figures apply until it is approved.</p>}
          {context.open.length > 0 && (
            <p className="text-xs text-slate-600">Open: {context.open.map((item) => <Link key={item.id} href={`${base}/new?id=${item.id}`} className="ml-1 font-semibold text-navy hover:underline">{item.period} ({item.statusLabel})</Link>)}</p>
          )}
        </section>
      )}

      {form?.returnReason && (
        <div className="mb-4"><Notice tone="warning" title={`Returned by ${form.returnedByRole || 'the reviewer'}`}>{form.returnReason}</Notice></div>
      )}
      {blocker && (
        <div className="mb-4">
          <Notice tone="warning" title="This month cannot be reported here." action={blocker.mprId && BLOCKER_LINK[blocker.code] ? <Link href={BLOCKER_LINK[blocker.code] === 'edit' ? `${base}/new?id=${blocker.mprId}` : `${base}/report/${blocker.mprId}`} className="flex-shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100">Open it</Link> : null}>
            {blocker.message}
          </Notice>
        </div>
      )}

      {!form && !error && period.reportingMonth && <Skeleton className="h-96" />}

      {form && rows.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="h56-entry-title">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <div>
              <h2 id="h56-entry-title" className="text-sm font-semibold text-slate-900">{form.period.label}: progress and expenditure (₹ lakh)</h2>
              <p className="text-xs text-slate-500">Type only this month&apos;s figures. Earlier months and every total are filled in from the approved allocation and your previous reports.</p>
            </div>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th scope="col" rowSpan={2} className="border-b border-r border-slate-200 px-3 py-2 text-left">Line</th>
                  <th scope="colgroup" colSpan={4} className="border-b border-r border-slate-200 px-3 py-2 text-center">Physical progress</th>
                  <th scope="colgroup" colSpan={5} className="border-b border-r border-slate-200 px-3 py-2 text-center">Expenditure — SARRA share (₹ lakh)</th>
                  <th scope="col" rowSpan={2} className="border-b border-slate-200 px-3 py-2 text-left">Remarks</th>
                </tr>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                  {['Target', 'Before this month', 'This month', 'Cumulative', pia ? 'SARRA share' : 'Approved budget', 'Before this month', 'This month', 'Cumulative', 'Balance'].map((label, index) => (
                    <th key={label + index} scope="col" className={`border-b border-slate-200 px-3 py-2 text-right ${label === 'This month' ? 'text-navy' : ''}`}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupLines(rows, form.parents).map((group) => (
                  <React.Fragment key={group.key || group.lines[0].code}>
                    {group.heading && (
                      <tr className="bg-amber-50/70"><th scope="rowgroup" colSpan={11} className="px-3 py-2 text-left text-xs font-semibold text-slate-800">{group.heading.code} — {group.heading.name}{group.heading.nameHindi ? ` · ${group.heading.nameHindi}` : ''}</th></tr>
                    )}
                    {group.lines.map((row) => {
                      const entry = values[row.code] || {};
                      return (
                        <tr key={row.code} className={row.errors.length ? 'bg-red-50/40' : ''}>
                          <th scope="row" className={`min-w-[17rem] border-r border-slate-100 px-3 py-2.5 text-left font-normal ${group.heading ? 'pl-6' : ''}`}>
                            <span className="font-mono text-xs text-slate-500">{row.code}</span>
                            <span className="block font-medium text-slate-900">{row.name}</span>
                            {row.nameHindi && <span className="block text-xs text-slate-500">{row.nameHindi}</span>}
                            {pia && (row.deptShareLakh > 0 || row.rate > 0 || row.targetSize > 0) && (
                              <span className="mt-0.5 block text-[11px] text-slate-500">Dept. share {lakh(row.deptShareLakh)}{row.rate > 0 ? ` · Rate ${amount(row.rate)}` : ''}{row.targetSize > 0 ? ` · Size ${qty(row.targetSize)} cu.m` : ''}</span>
                            )}
                            {row.errors.map((message) => <span key={message} role="alert" className="mt-1 flex items-center gap-1 text-xs font-medium text-red-700"><AlertTriangle className="h-3 w-3" aria-hidden="true" />{message}</span>)}
                          </th>
                          {row.hasPhysical ? (
                            <>
                              <td className="px-3 py-2.5 text-right tabular-nums">{row.physicalTarget > 0 ? qty(row.physicalTarget) : '—'}<span className="block text-[10px] text-slate-400">{row.unit}</span></td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{qty(row.physicalPrevious)}</td>
                              <td className="w-28 bg-navy/[0.03] px-2 py-2">
                                <NumericInput value={entry.physicalCurrent || ''} onChange={(value) => set(row.code, 'physicalCurrent', value)} allowDecimal={row.allowsDecimal} maxDecimals={3} disabled={locked || !(row.physicalTarget > 0)} invalid={row.errors.length > 0} aria-label={`${row.code} physical progress this month`} />
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{qty(row.physicalFy)}</td>
                            </>
                          ) : (
                            <td colSpan={4} className="px-3 py-2.5 text-center text-xs text-slate-400">Financial line — no physical measure</td>
                          )}
                          <td className="px-3 py-2.5 text-right tabular-nums">{amount(row.sarraShareLakh)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{amount(row.expenditurePreviousLakh)}</td>
                          <td className="w-32 bg-navy/[0.03] px-2 py-2">
                            <NumericInput value={entry.expenditureCurrentLakh || ''} onChange={(value) => set(row.code, 'expenditureCurrentLakh', value)} maxDecimals={5} disabled={locked} invalid={row.balance < 0} aria-label={`${row.code} expenditure this month in lakh`} />
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{amount(row.expenditureFy)}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums ${row.balance < 0 ? 'font-semibold text-red-700' : 'text-slate-700'}`}>{amount(row.balance)}<span className="block text-[10px] text-slate-400">{pct(row.sarraShareLakh > 0 ? (row.expenditureFy / row.sarraShareLakh) * 100 : 0)} used</span></td>
                          <td className="min-w-[13rem] px-2 py-2">
                            <input value={entry.remarks || ''} onChange={(event) => set(row.code, 'remarks', event.target.value)} maxLength={500} disabled={locked} placeholder={row.needsDocument ? 'Attach a bill or explain' : 'Optional'} aria-label={`${row.code} remarks`} className={`${inputClass(row.needsDocument && reportId)} py-1.5 text-xs`} />
                            {row.exp > 0 && <span className={`mt-1 flex items-center gap-1 text-[11px] ${row.hasDocument ? 'text-emerald-700' : 'text-slate-500'}`}>{row.hasDocument ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}{row.hasDocument ? 'Document attached' : 'No document yet'}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-bold text-slate-900">
                  <th scope="row" className="px-3 py-2.5 text-left">Total — Head 56</th>
                  <td colSpan={4} />
                  <td className="px-3 py-2.5 text-right tabular-nums">{amount(totals.budget)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{amount(totals.before)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-navy">{amount(totals.month)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{amount(totals.fy)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{amount(sumMoney([totals.budget, -totals.fy]))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {form && rows.length > 0 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <section className="space-y-4 lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <label htmlFor="h56-remarks" className="text-sm font-semibold text-slate-900">Remarks for the month</label>
              <p className="text-xs text-slate-500">Required for a nil report (nothing to report this month).</p>
              <textarea id="h56-remarks" rows={3} maxLength={2000} value={remarks} disabled={locked} onChange={(event) => setRemarks(event.target.value)} className={`${inputClass(nilNeedsRemark && Boolean(reportId))} mt-2 resize-none`} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Supporting documents</h2>
              <p className="mb-3 text-xs text-slate-500">Bills, vouchers, work orders and honorarium sheets for this month&apos;s expenditure.</p>
              {reportId
                ? <Head56Documents reportId={reportId} documents={documents} lines={rows} docTypes={form.docTypes} editable={!locked} onChanged={refreshDocuments} />
                : <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">Save the draft first; documents can then be attached to each line.</p>}
            </div>
          </section>
          <aside className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Before you submit</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  [!hasErrors, 'Progress and expenditure are within the approved allocation and targets'],
                  [!missingDocs.length, missingDocs.length ? `A document or remark is needed for: ${missingDocs.map((r) => r.code).join(', ')}` : 'Every line with expenditure has a document or remark'],
                  [!nilNeedsRemark, nil ? 'Nil report: remarks of at least 10 characters' : 'Figures entered for the month'],
                ].map(([okay, text]) => (
                  <li key={text} className={`flex items-start gap-2 ${okay ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {okay ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" /> : <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />}{text}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">After you submit, the report goes to the {unit?.level === 'PIA' ? 'PIA Checker' : unit?.level === 'DISTRICT' ? 'District Checker' : 'HQ Checker'} and cannot be changed unless it is returned to you.</p>
            </div>
          </aside>
        </div>
      )}

      {form && rows.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur md:pl-[84px]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">This month <strong className="tabular-nums text-slate-900">{lakh(totals.month)}</strong> · Year to date <strong className="tabular-nums text-slate-900">{lakh(totals.fy)}</strong> of {lakh(totals.budget)}</p>
            <div className="flex flex-wrap items-center gap-2">
              {error && <span role="alert" className="max-w-md text-sm font-medium text-red-700">{error}</span>}
              {saved && <span role="status" className="text-sm font-medium text-emerald-700">{saved}</span>}
              <ActionButton variant="secondary" icon={Save} loading={busy === 'draft'} disabled={locked || hasErrors || Boolean(busy)} onClick={() => save(true)}>Save Draft</ActionButton>
              <ActionButton icon={Send} loading={busy === 'submit'} disabled={!canSubmit || Boolean(busy)} disabledReason="Complete the checklist first" onClick={() => save(false)}>{form.status === 'RETURNED_FOR_CORRECTION' ? 'Resubmit' : 'Submit for Verification'}</ActionButton>
            </div>
          </div>
        </div>
      )}
      {form && !rows.length && !blocker && <Notice tone="info">No line has an approved budget for this unit and year.</Notice>}
      {error && !form && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
