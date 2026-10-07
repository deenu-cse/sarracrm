"use client";
import React, { useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Paperclip, Plus, Trash2, Upload, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { NumericInput } from '@/components/ui/NumericInput';
import { fetchProjectOutcomes, recordOutcome, voidOutcome } from '@/lib/lifecycleApi';
import { formatIndian } from '@/lib/numeric';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass, useMasterList } from '@/components/projects/create/parts';
import { EmptyNote, Panel, StatTile, formatDay } from './shared';

const SEASON = { PRE_MONSOON: 'Pre-monsoon', MONSOON: 'Monsoon', POST_MONSOON: 'Post-monsoon', WINTER: 'Winter' };
const TREND = {
  IMPROVED: { label: 'Improved', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  DECLINED: { label: 'Declined', cls: 'border-red-200 bg-red-50 text-red-800' },
  UNCHANGED: { label: 'No change', cls: 'border-slate-200 bg-slate-50 text-slate-600' },
};
const LINE = '#2a78d6';
const number = (value) => formatIndian(value, { maxDecimals: 3 });
const signed = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${number(Math.abs(value))}`;
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function TrendBadge({ comparison }) {
  if (!comparison) return null;
  const trend = TREND[comparison.trend] || TREND.UNCHANGED;
  const Icon = comparison.change > 0 ? ArrowUpRight : comparison.change < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${trend.cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {trend.label}{comparison.changePercent !== null ? ` ${signed(comparison.changePercent)}%` : ''}
    </span>
  );
}

/** Baseline and readings over time. The dashed line is the baseline; the table below carries the same figures. */
function ReadingsChart({ indicator }) {
  const [hover, setHover] = useState(null);
  const points = [indicator.baseline, ...indicator.readings].map((reading) => ({ ...reading, time: new Date(reading.measuredOn).getTime() }));
  if (points.length < 2) return null;
  const width = 520; const height = 150; const pad = { left: 44, right: 16, top: 14, bottom: 26 };
  const times = points.map((p) => p.time); const values = points.map((p) => p.value);
  const minT = Math.min(...times); const maxT = Math.max(...times);
  const top = Math.max(...values) * 1.1 || 1; const bottom = Math.min(0, Math.min(...values));
  const x = (time) => pad.left + (maxT === minT ? 0.5 : (time - minT) / (maxT - minT)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + (1 - (value - bottom) / (top - bottom)) * (height - pad.top - pad.bottom);
  const path = points.map((p, index) => `${index ? 'L' : 'M'}${x(p.time).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const baseY = y(indicator.baseline.value);
  const shown = hover !== null ? points[hover] : null;
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${indicator.name}: baseline ${number(indicator.baseline.value)} ${indicator.unit}, latest ${number(indicator.latest.value)} ${indicator.unit}`}>
        {[bottom, (top + bottom) / 2, top].map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={pad.left - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#64748b">{number(Math.round(tick * 100) / 100)}</text>
          </g>
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={baseY} y2={baseY} stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />
        <text x={width - pad.right} y={baseY - 4} textAnchor="end" fontSize="10" fill="#475569">Baseline</text>
        <path d={path} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, index) => (
          <g key={p.id}>
            <circle cx={x(p.time)} cy={y(p.value)} r={hover === index ? 6 : 4.5} fill={index === 0 ? '#ffffff' : LINE} stroke={index === 0 ? '#475569' : '#ffffff'} strokeWidth="2" />
            <circle cx={x(p.time)} cy={y(p.value)} r="14" fill="transparent" tabIndex={0} role="img" aria-label={`${formatDay(p.measuredOn)}: ${number(p.value)} ${indicator.unit}`}
              onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} style={{ outline: 'none' }} />
          </g>
        ))}
        <text x={x(minT)} y={height - 8} textAnchor="start" fontSize="10" fill="#64748b">{formatDay(points[0].measuredOn)}</text>
        <text x={x(maxT)} y={height - 8} textAnchor="end" fontSize="10" fill="#64748b">{formatDay(points[points.length - 1].measuredOn)}</text>
      </svg>
      {shown && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(x(shown.time) / width) * 100}%`, top: `${(y(shown.value) / height) * 100 - 6}%` }}>
          <span className="block font-semibold tabular-nums">{number(shown.value)} {indicator.unit}</span>
          <span className="block text-slate-300">{hover === 0 ? 'Baseline, ' : ''}{formatDay(shown.measuredOn)}</span>
        </div>
      )}
    </figure>
  );
}

const EVIDENCE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/**
 * Outcome tracking: what changed on the ground because of the project.
 * A baseline is recorded before the works; the same indicator is then measured
 * again, including after the project is closed.
 */
export function OutcomesTab({ project }) {
  const box = useMasterList(async () => [await fetchProjectOutcomes(project._id)], `outcomes:${project._id}`);
  const data = box.items[0];
  const [entry, setEntry] = useState(null); // { indicator, kind }
  const [form, setForm] = useState({ value: '', measuredOn: '', remarks: '', evidence: null });
  const [striking, setStriking] = useState(null); // { indicator, reading }
  const [reason, setReason] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const fileInput = useRef(null);
  const busyRef = useRef(false);

  if (!data && !box.error) return <div className="space-y-3" role="status" aria-label="Loading outcomes"><Skeleton className="h-20" /><Skeleton className="h-48" /></div>;
  if (box.error || !data) return <Notice tone="error" title="Unable to load outcomes." action={<RetryButton onClick={box.reload} />}>{box.error}</Notice>;

  const open = (indicator, kind) => {
    setEntry({ indicator, kind });
    setForm({ value: '', measuredOn: '', remarks: '', evidence: null });
    setAttempted(false); setError(''); setDone('');
  };

  const baselineDay = entry?.indicator.baseline ? String(entry.indicator.baseline.measuredOn).slice(0, 10) : '';
  const errors = entry ? {
    value: form.value === '' ? `Enter the reading in ${entry.indicator.unit}.` : '',
    measuredOn: !form.measuredOn ? 'Enter the date the reading was taken.'
      : form.measuredOn > today() ? 'The date cannot be in the future.'
        : entry.kind === 'MEASUREMENT' && baselineDay && form.measuredOn <= baselineDay ? `A reading must be dated after the baseline (${formatDay(baselineDay)}).` : '',
    evidence: form.evidence && !EVIDENCE_TYPES.includes(form.evidence.type) ? 'Upload a photograph (JPG, PNG, WEBP) or a PDF.'
      : form.evidence && form.evidence.size > 10 * 1024 * 1024 ? 'The file is too large. Maximum size is 10 MB.' : '',
  } : {};

  const run = async (work, message) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
      setEntry(null); setStriking(null);
      setDone(message);
      box.reload();
    } catch (err) {
      setError(err?.message || 'This action could not be completed. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const save = () => {
    setAttempted(true);
    if (errors.value || errors.measuredOn || errors.evidence) return;
    run(() => recordOutcome(project._id, { indicatorCode: entry.indicator.code, kind: entry.kind, value: form.value, measuredOn: form.measuredOn, remarks: form.remarks.trim() }, form.evidence),
      `${entry.kind === 'BASELINE' ? 'Baseline' : 'Reading'} of ${entry.indicator.name} recorded.`);
  };
  const reasonError = reason.replace(/\s+/g, ' ').trim().length < 5 ? 'Give the reason for striking out this reading.' : '';

  const { summary } = data;
  return (
    <div className="space-y-5">
      {done && <Notice tone="success">{done}</Notice>}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Indicators for this Head" value={String(summary.indicators)} />
        <StatTile label="Baseline recorded" value={`${summary.withBaseline} of ${summary.indicators}`} tone={summary.withBaseline === summary.indicators ? 'success' : 'default'} />
        <StatTile label="Improved" value={String(summary.improved)} sub={`of ${summary.measured} measured`} tone={summary.improved > 0 ? 'success' : 'default'} />
        <StatTile label="Declined" value={String(summary.declined)} tone={summary.declined > 0 ? 'warning' : 'default'} />
      </dl>

      {!data.canRecord && data.recordBlockedReason && <Notice tone="info">{data.recordBlockedReason}</Notice>}
      {data.canRecord && summary.withBaseline === 0 && (
        <Notice tone="info" title="Start with the baseline">Record each indicator once before the works begin. Later readings are compared with it.</Notice>
      )}

      {data.indicators.length === 0 && <EmptyNote>No outcome indicator is set up for this project's Head.</EmptyNote>}

      {data.indicators.map((indicator) => (
        <Panel
          key={indicator.code}
          title={`${indicator.name} (${indicator.unit})`}
          description={`${indicator.description} ${indicator.direction === 'DECREASE' ? 'A lower figure is an improvement.' : 'A higher figure is an improvement.'}`}
          aside={data.canRecord && (
            indicator.baseline
              ? <ActionButton size="sm" icon={Plus} onClick={() => open(indicator, 'MEASUREMENT')}>Add Reading</ActionButton>
              : <ActionButton size="sm" icon={Plus} onClick={() => open(indicator, 'BASELINE')}>Record Baseline</ActionButton>
          )}
        >
          {!indicator.baseline ? (
            <EmptyNote>No baseline recorded yet.</EmptyNote>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div>
                <dl className="grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-xs text-slate-500">Baseline</dt>
                    <dd className="text-lg font-bold tabular-nums text-slate-900">{number(indicator.baseline.value)}</dd>
                    <dd className="text-xs text-slate-500">{formatDay(indicator.baseline.measuredOn)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Latest</dt>
                    <dd className="text-lg font-bold tabular-nums text-slate-900">{indicator.latest ? number(indicator.latest.value) : '—'}</dd>
                    <dd className="text-xs text-slate-500">{indicator.latest ? formatDay(indicator.latest.measuredOn) : 'No reading yet'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Change</dt>
                    <dd className="text-lg font-bold tabular-nums text-slate-900">{indicator.comparison ? signed(indicator.comparison.change) : '—'}</dd>
                    <dd className="mt-0.5"><TrendBadge comparison={indicator.comparison} /></dd>
                  </div>
                </dl>
                <div className="mt-3"><ReadingsChart indicator={indicator} /></div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[460px] text-sm">
                  <caption className="sr-only">Readings of {indicator.name}</caption>
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th scope="col" className="px-3 py-2">Date</th>
                      <th scope="col" className="px-3 py-2 text-right">Reading</th>
                      <th scope="col" className="px-3 py-2 text-right">vs baseline</th>
                      <th scope="col" className="px-3 py-2">Recorded by</th>
                      <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[{ ...indicator.baseline, isBaseline: true }, ...indicator.readings].map((reading) => (
                      <tr key={reading.id} className="align-top">
                        <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-900">
                          {formatDay(reading.measuredOn)}
                          <span className="block text-xs font-normal text-slate-500">{reading.isBaseline ? 'Baseline' : SEASON[reading.season] || ''}</span>
                        </th>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{number(reading.value)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                          {reading.isBaseline ? '—' : (
                            <span className={reading.trend === 'IMPROVED' ? 'text-emerald-700' : reading.trend === 'DECLINED' ? 'text-red-700' : ''}>
                              {signed(reading.change)}{reading.changePercent !== null ? ` (${signed(reading.changePercent)}%)` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {reading.recordedBy || '—'}
                          {reading.remarks && <span className="block text-slate-500">{reading.remarks}</span>}
                          {reading.evidence && <a href={reading.evidence.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 font-semibold text-navy hover:underline"><Paperclip className="h-3 w-3" aria-hidden="true" /> Evidence</a>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {reading.canVoid && (
                            <button type="button" onClick={() => { setStriking({ indicator, reading }); setReason(''); setAttempted(false); setError(''); setDone(''); }}
                              aria-label={`Strike out the reading of ${formatDay(reading.measuredOn)}`} title="Strike out"
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Panel>
      ))}

      <Dialog
        open={Boolean(entry)}
        onClose={() => { if (!busy) setEntry(null); }}
        title={entry ? `${entry.kind === 'BASELINE' ? 'Record baseline' : 'Add reading'}: ${entry.indicator.name}` : ''}
        description={entry?.kind === 'BASELINE' ? 'The baseline is the reading before the works. It is recorded once.' : 'Measure in the same way and, where possible, the same season as the baseline.'}
        size="md"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setEntry(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton loading={busy} onClick={save}>{busy ? 'Saving…' : 'Save Reading'}</ActionButton>
          </>
        )}
      >
        {entry && (
          <div className="space-y-4">
            {entry.kind === 'MEASUREMENT' && entry.indicator.baseline && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Baseline: <strong className="tabular-nums">{number(entry.indicator.baseline.value)} {entry.indicator.unit}</strong> on {formatDay(entry.indicator.baseline.measuredOn)}</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="outcome-value" className="mb-1.5 block text-sm font-medium text-slate-700">Reading <span className="text-red-600" aria-hidden="true">*</span></label>
                <NumericInput id="outcome-value" value={form.value} onChange={(value) => setForm((current) => ({ ...current, value }))} maxDecimals={entry.indicator.allowsDecimal ? 3 : 0} allowDecimal={entry.indicator.allowsDecimal}
                  suffix={entry.indicator.unit} placeholder="0" invalid={Boolean(attempted && errors.value)} disabled={busy} />
                <FieldError message={attempted ? errors.value : ''} />
              </div>
              <div>
                <label htmlFor="outcome-date" className="mb-1.5 block text-sm font-medium text-slate-700">Date of reading <span className="text-red-600" aria-hidden="true">*</span></label>
                <input id="outcome-date" type="date" max={today()} value={form.measuredOn} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, measuredOn: event.target.value }))} className={inputClass(Boolean(attempted && errors.measuredOn))} />
                <FieldError message={attempted ? errors.measuredOn : ''} />
              </div>
            </div>
            <div>
              <label htmlFor="outcome-remarks" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">Remarks <span className="text-xs font-normal text-slate-400">(optional)</span></label>
              <input id="outcome-remarks" type="text" maxLength={500} value={form.remarks} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} placeholder="e.g. Measured by V-notch at the source" className={inputClass(false)} />
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">Evidence <span className="text-xs font-normal text-slate-400">(optional photograph or PDF)</span></p>
              <input ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only" aria-label="Evidence file" disabled={busy}
                onChange={(event) => { setForm((current) => ({ ...current, evidence: event.target.files?.[0] || null })); event.target.value = ''; }} />
              {form.evidence ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-slate-800">{form.evidence.name}</span>
                  <button type="button" onClick={() => setForm((current) => ({ ...current, evidence: null }))} aria-label="Remove evidence file" className="rounded p-1 text-slate-500 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"><X className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-navy/50 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                  <Upload className="h-4 w-4" aria-hidden="true" /> Choose file
                </button>
              )}
              <FieldError message={errors.evidence} />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>

      <Dialog
        open={Boolean(striking)}
        onClose={() => { if (!busy) setStriking(null); }}
        title="Strike out this reading?"
        description="Use this for a reading that was entered wrongly. It is kept on record with your reason but no longer counted."
        size="md"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setStriking(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton className="!bg-red-700 hover:!bg-red-800" loading={busy}
              onClick={() => { setAttempted(true); if (reasonError) return; run(() => voidOutcome(project._id, striking.reading.id, reason.replace(/\s+/g, ' ').trim()), 'Reading struck out.'); }}>
              {busy ? 'Saving…' : 'Strike Out'}
            </ActionButton>
          </>
        )}
      >
        {striking && (
          <div className="space-y-4">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {striking.indicator.name}: <strong className="tabular-nums">{number(striking.reading.value)} {striking.indicator.unit}</strong> on {formatDay(striking.reading.measuredOn)}
            </p>
            <div>
              <label htmlFor="outcome-void-reason" className="mb-1.5 block text-sm font-medium text-slate-700">Reason <span className="text-red-600" aria-hidden="true">*</span></label>
              <input id="outcome-void-reason" type="text" maxLength={500} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} className={inputClass(Boolean(attempted && reasonError))} />
              <FieldError message={attempted ? reasonError : ''} />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
