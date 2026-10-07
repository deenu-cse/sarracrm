"use client";
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';
import { formatLakh } from '@/lib/numeric';
import { FieldError } from '@/components/projects/create/parts';
import { formatQuantity } from './mprForm';

/** True from the `lg` breakpoint up: the wide table is used there, cards below it. */
/** Activity name in the interface language (the master holds a Hindi name for most activities). */
const nameOf = (activity, language) => (language === 'hi' && activity.activityNameHindi ? activity.activityNameHindi : activity.activityName);

function useWideLayout() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setWide(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return wide;
}

function Meter({ previousPercent, percent, complete, label }) {
  const previous = Math.max(0, Math.min(100, previousPercent || 0));
  const added = Math.max(0, Math.min(100 - previous, (percent || 0) - previous));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent || 0)} className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full transition-[width] duration-500 ease-out ${complete ? 'bg-emerald-600' : 'bg-slate-400'}`} style={{ width: `${previous}%` }} />
      <div className={`h-full transition-[width] duration-300 ease-out ${complete ? 'bg-emerald-600' : 'bg-navy'}`} style={{ width: `${added}%` }} />
    </div>
  );
}

/** A server-supplied figure: visibly read-only. */
function Auto({ children, strong = false }) {
  return <span className={`tabular-nums ${strong ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{children}</span>;
}

/** A calculated total: fades briefly whenever its value changes. */
function Total({ value, invalid }) {
  return <span key={value} className={`wz-fade-in inline-block font-bold tabular-nums ${invalid ? 'text-red-700' : 'text-slate-900'}`}>{value}</span>;
}

const physicalInput = (activity, entry, evaluation, onChange, id) => (activity.hasPhysical ? (
  <NumericInput
    id={id}
    aria-label={`${activity.activityName}: physical progress during the month in ${activity.unit || 'units'}`}
    value={entry.physical}
    onChange={(value) => onChange(activity.activityCode, 'physical', value)}
    allowDecimal={activity.allowsDecimal}
    maxDecimals={activity.allowsDecimal ? 3 : 0}
    formatOnBlur
    minDecimalsOnBlur={0}
    invalid={Boolean(evaluation.physicalError)}
    aria-describedby={evaluation.physicalError ? `${id}-error` : undefined}
    className={evaluation.physicalError ? '' : '!border-navy/40'}
  />
) : null);

const financialInput = (activity, entry, evaluation, onChange, id) => (
  <NumericInput
    id={id}
    aria-label={`${activity.activityName}: financial progress during the month in lakh rupees`}
    value={entry.financial}
    onChange={(value) => onChange(activity.activityCode, 'financial', value)}
    maxDecimals={5}
    formatOnBlur
    prefix="₹"
    placeholder="0.00"
    invalid={Boolean(evaluation.financialError)}
    aria-describedby={evaluation.financialError ? `${id}-error` : undefined}
    className={evaluation.financialError ? '' : '!border-navy/40'}
  />
);

function WideTable({ activities, entries, evaluations, onChange, monthLabel }) {
  const { language, t } = useLanguage();
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[1040px] text-sm">
        <caption className="sr-only">Physical and financial progress by activity for {monthLabel}</caption>
        <thead>
          <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th scope="col" rowSpan={2} className="w-10 border-b border-slate-200 px-3 py-2 text-left">#</th>
            <th scope="col" rowSpan={2} className="border-b border-slate-200 px-3 py-2 text-left">{t('Activity')}</th>
            <th scope="colgroup" colSpan={4} className="border-b border-l border-slate-200 px-3 py-2 text-center text-slate-700">{t('Physical Progress')}</th>
            <th scope="colgroup" colSpan={4} className="border-b border-l border-slate-200 px-3 py-2 text-center text-slate-700">{t('Financial Progress (₹ Lakh)')}</th>
          </tr>
          <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {['Physical', 'Financial'].map((group) => (
              <React.Fragment key={group}>
                <th scope="col" className="border-b border-l border-slate-200 px-3 py-2 text-right">{t('Total Target')}</th>
                <th scope="col" className="border-b border-slate-200 px-3 py-2 text-right">{t('Up to Previous Month')}</th>
                <th scope="col" className="w-36 border-b border-slate-200 bg-navy/[0.06] px-3 py-2 text-right text-navy">{t('During Month')}</th>
                <th scope="col" className="w-36 border-b border-slate-200 px-3 py-2 text-right">{t('Total')}</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {activities.map((activity, index) => {
            const entry = entries[activity.activityCode] || { physical: '', financial: '' };
            const evaluation = evaluations[index];
            const physicalId = `physical-${index}`;
            const financialId = `financial-${index}`;
            return (
              <tr key={activity.activityCode} className={`align-top transition-colors duration-150 ${evaluation.entered ? 'bg-emerald-50/30' : ''}`}>
                <td className="px-3 py-3 tabular-nums text-slate-400">{index + 1}</td>
                <th scope="row" className="px-3 py-3 text-left font-medium text-slate-900" lang={language}>
                  {nameOf(activity, language)}
                  <span className="block text-xs font-normal text-slate-500">Unit: {activity.unit || '—'}</span>
                </th>

                {activity.hasPhysical ? (
                  <>
                    <td className="border-l border-slate-100 px-3 py-3 text-right"><Auto strong>{formatQuantity(activity.physicalTarget)}</Auto></td>
                    <td className="px-3 py-3 text-right"><Auto>{formatQuantity(activity.physicalPrevious)}</Auto></td>
                    <td className="bg-navy/[0.03] px-3 py-2">
                      {physicalInput(activity, entry, evaluation, onChange, physicalId)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Total value={formatQuantity(evaluation.physicalTotal)} invalid={Boolean(evaluation.physicalError)} />
                      <span className="block text-[11px] tabular-nums text-slate-400">{evaluation.physicalPercent}% of target</span>
                      <div className="mt-1"><Meter previousPercent={evaluation.physicalPreviousPercent} percent={evaluation.physicalPercent} complete={evaluation.physicalPercent >= 100} label={`${activity.activityName}: physical progress`} /></div>
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="border-l border-slate-100 px-3 py-3 text-center text-xs text-slate-400">Financial activity — no physical target</td>
                )}

                <td className="border-l border-slate-100 px-3 py-3 text-right"><Auto strong>{formatLakh(activity.financialTargetLakh).replace(' Lakh', '')}</Auto></td>
                <td className="px-3 py-3 text-right"><Auto>{formatLakh(activity.financialPreviousLakh).replace(' Lakh', '')}</Auto></td>
                <td className="bg-navy/[0.03] px-3 py-2">{financialInput(activity, entry, evaluation, onChange, financialId)}</td>
                <td className="px-3 py-3 text-right">
                  <Total value={formatLakh(evaluation.financialTotalLakh).replace(' Lakh', '')} invalid={Boolean(evaluation.financialError)} />
                  <span className="block text-[11px] tabular-nums text-slate-400">{evaluation.financialPercent}% of target</span>
                  <div className="mt-1"><Meter previousPercent={evaluation.financialPreviousPercent} percent={evaluation.financialPercent} complete={evaluation.financialPercent >= 100} label={`${activity.activityName}: financial progress`} /></div>
                </td>
              </tr>
            );
          }).flatMap((row, index) => {
            const evaluation = evaluations[index];
            if (!evaluation.physicalError && !evaluation.financialError) return [row];
            return [row, (
              <tr key={`${activities[index].activityCode}-error`} className="bg-red-50/60">
                <td />
                <td colSpan={9} className="px-3 pb-2">
                  <FieldError id={`physical-${index}-error`} message={evaluation.physicalError} />
                  <FieldError id={`financial-${index}-error`} message={evaluation.financialError} />
                </td>
              </tr>
            )];
          })}
        </tbody>
      </table>
    </div>
  );
}

function Line({ label, children, auto = false }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <dt className="flex items-center gap-1.5 text-slate-500">
        {label}
        {auto && <Lock className="h-3 w-3 text-slate-300" aria-label="Filled automatically" />}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

function Cards({ activities, entries, evaluations, onChange }) {
  const { language, t } = useLanguage();
  return (
    <ul className="space-y-3">
      {activities.map((activity, index) => {
        const entry = entries[activity.activityCode] || { physical: '', financial: '' };
        const evaluation = evaluations[index];
        const physicalId = `physical-${index}`;
        const financialId = `financial-${index}`;
        return (
          <li key={activity.activityCode} className={`rounded-xl border bg-white p-4 transition-colors duration-150 ${evaluation.entered ? 'border-emerald-200' : 'border-slate-200'}`}>
            <h4 className="text-sm font-semibold text-slate-900" lang={language}>{index + 1}. {nameOf(activity, language)}</h4>
            <p className="text-xs text-slate-500">Unit: {activity.unit || '—'}</p>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activity.hasPhysical && (
                <section aria-label={`${activity.activityName}: physical progress`}>
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('Physical')}</h5>
                  <dl className="mt-1 divide-y divide-slate-100">
                    <Line label={t('Target')} auto><Auto strong>{formatQuantity(activity.physicalTarget)}</Auto></Line>
                    <Line label={t('Up to previous month')} auto><Auto>{formatQuantity(activity.physicalPrevious)}</Auto></Line>
                    <div className="py-2">
                      <label htmlFor={physicalId} className="mb-1 block text-sm font-medium text-navy">{t('Progress during month')}</label>
                      {physicalInput(activity, entry, evaluation, onChange, physicalId)}
                      <FieldError id={`${physicalId}-error`} message={evaluation.physicalError} />
                    </div>
                    <Line label={t('Total progress')}><Total value={`${formatQuantity(evaluation.physicalTotal)} / ${formatQuantity(activity.physicalTarget)}`} invalid={Boolean(evaluation.physicalError)} /></Line>
                  </dl>
                  <div className="mt-1 flex items-center gap-2">
                    <Meter previousPercent={evaluation.physicalPreviousPercent} percent={evaluation.physicalPercent} complete={evaluation.physicalPercent >= 100} label={`${activity.activityName}: physical progress`} />
                    <span className="text-xs font-semibold tabular-nums text-slate-600">{evaluation.physicalPercent}%</span>
                  </div>
                </section>
              )}

              <section aria-label={`${activity.activityName}: financial progress`}>
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('Financial')}</h5>
                <dl className="mt-1 divide-y divide-slate-100">
                  <Line label={t('Target')} auto><Auto strong>{formatLakh(activity.financialTargetLakh)}</Auto></Line>
                  <Line label={t('Up to previous month')} auto><Auto>{formatLakh(activity.financialPreviousLakh)}</Auto></Line>
                  <div className="py-2">
                    <label htmlFor={financialId} className="mb-1 block text-sm font-medium text-navy">Progress during month (₹ Lakh)</label>
                    {financialInput(activity, entry, evaluation, onChange, financialId)}
                    <FieldError id={`${financialId}-error`} message={evaluation.financialError} />
                  </div>
                  <Line label={t('Total')}><Total value={formatLakh(evaluation.financialTotalLakh)} invalid={Boolean(evaluation.financialError)} /></Line>
                </dl>
                <div className="mt-1 flex items-center gap-2">
                  <Meter previousPercent={evaluation.financialPreviousPercent} percent={evaluation.financialPercent} complete={evaluation.financialPercent >= 100} label={`${activity.activityName}: financial progress`} />
                  <span className="text-xs font-semibold tabular-nums text-slate-600">{evaluation.financialPercent}%</span>
                </div>
              </section>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Activity-wise entry: a wide table on desktop, one card per activity on
 * smaller screens. Only "During Month" is typed; target and previous progress
 * come from the server and totals are calculated.
 */
export function MprActivityEntry(props) {
  const wide = useWideLayout();
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3 text-slate-400" aria-hidden="true" /> Target and previous-month progress are filled automatically</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-navy/40 bg-navy/[0.06]" aria-hidden="true" /> Enter this month&apos;s progress</span>
      </div>
      {wide ? <WideTable {...props} /> : <Cards {...props} />}
    </div>
  );
}
