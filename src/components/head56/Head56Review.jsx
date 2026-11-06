"use client";
import React, { useEffect, useState } from 'react';
import { BadgeCheck, LockOpen, ScrollText } from 'lucide-react';
import { fetchH56Reviews, recordH56Review, withdrawH56Review } from '@/lib/head56Api';
import { Dialog } from '@/components/ui/Dialog';
import { Panel } from '@/components/analytics/AnalyticsParts';
import { ActionButton, FieldError, Notice, inputClass } from '@/components/projects/create/parts';
import { lakh, moment, pct, selectClass } from './shared';

const AUTHORITIES = [['CEO', 'Chief Executive Officer (CEO)'], ['ACEO', 'Additional CEO (ACEO)'], ['CFO', 'Chief Finance Officer (CFO)']];

/**
 * The monthly review of the consolidated Head 56 report by the CEO, ACEO or CFO,
 * recorded by the HQ Approver. A reviewed month is closed until the review is withdrawn.
 */
export function Head56ReviewPanel({ dashboard, financialYear, onChanged }) {
  const { review, reviewReadiness: ready, permissions, focus } = dashboard;
  const [dialog, setDialog] = useState(null);
  const [authority, setAuthority] = useState('CEO');
  const [remarks, setRemarks] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!showHistory) return;
    fetchH56Reviews({ financialYear }).then(setHistory).catch(() => setHistory([]));
  }, [showHistory, financialYear, review?.id]);

  const text = remarks.replace(/\s+/g, ' ').trim();
  const remarkError = text.length < 10 ? 'Write at least 10 characters.' : '';
  const blocked = ready.inChain > 0 ? `${ready.inChain} report(s) of ${focus.label} are still in the approval chain.` : ready.verified === 0 ? `No report of ${focus.label} has been verified by the State yet.` : '';

  const open = (name) => { setDialog(name); setRemarks(''); setTouched(false); setError(''); };
  const confirm = async () => {
    setTouched(true);
    if (remarkError) return;
    setBusy(true);
    setError('');
    try {
      if (dialog === 'record') await recordH56Review({ financialYear, reportingMonth: focus.reportingMonth, authority, remarks: text });
      else await withdrawH56Review(review.id, text);
      setDialog(null);
      await onChanged?.();
    } catch (err) {
      setError(err?.message || 'This action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title={`Monthly review — ${focus.label}`} description="CEO / ACEO / CFO review of the consolidated report, recorded by the HQ Approver" aside={<button type="button" onClick={() => setShowHistory((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"><ScrollText className="h-3.5 w-3.5" aria-hidden="true" />{showHistory ? 'Hide' : 'All reviews'}</button>}>
      {review ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-900">Reviewed for the {review.designation} · month closed</p>
              <p className="text-xs text-emerald-800">{review.reviewedBy} ({review.role}) · {moment(review.reviewedAt)}</p>
              <p className="mt-1 text-slate-700">{review.remarks}</p>
              {review.snapshot && <p className="mt-1 text-xs text-slate-500">At review: budget {lakh(review.snapshot.budgetLakh)}, expenditure to date {lakh(review.snapshot.expenditureFyLakh)} ({pct(review.snapshot.utilisationPercent)}), {review.snapshot.verified} verified, {review.snapshot.missing} not filed.</p>}
            </div>
          </div>
          {permissions.canWithdrawReview && <ActionButton variant="secondary" size="sm" icon={LockOpen} onClick={() => open('withdraw')}>Withdraw review</ActionButton>}
        </div>
      ) : (
        <div className="space-y-3">
          <dl className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-emerald-50 px-2 py-2"><dt className="text-xs text-emerald-800">Verified</dt><dd className="text-lg font-bold tabular-nums text-emerald-900">{ready.verified}</dd></div>
            <div className="rounded-lg bg-amber-50 px-2 py-2"><dt className="text-xs text-amber-800">In the chain</dt><dd className="text-lg font-bold tabular-nums text-amber-900">{ready.inChain}</dd></div>
            <div className="rounded-lg bg-red-50 px-2 py-2"><dt className="text-xs text-red-800">Not filed</dt><dd className="text-lg font-bold tabular-nums text-red-900">{ready.missing}</dd></div>
          </dl>
          {permissions.canReview ? (
            <>
              {blocked && <p className="text-xs text-amber-700">{blocked}</p>}
              <ActionButton icon={BadgeCheck} disabled={Boolean(blocked)} disabledReason={blocked} onClick={() => open('record')}>Record CEO / ACEO / CFO review</ActionButton>
            </>
          ) : <p className="text-sm text-slate-500">Not yet reviewed.</p>}
        </div>
      )}

      {showHistory && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          {!history && <p className="text-xs text-slate-500">Loading…</p>}
          {history?.length === 0 && <p className="text-xs text-slate-500">No review recorded for {financialYear}.</p>}
          <ul className="space-y-2">
            {(history || []).map((item) => (
              <li key={item.id} className="text-xs">
                <span className={`font-semibold ${item.status === 'REVIEWED' ? 'text-emerald-800' : 'text-slate-500 line-through'}`}>{item.period} — {item.authority}</span>
                <span className="text-slate-500"> · {item.reviewedBy} · {moment(item.reviewedAt)}</span>
                {item.status === 'WITHDRAWN' && <span className="block text-slate-500">Withdrawn by {item.withdrawnBy}: {item.withdrawReason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={Boolean(dialog)}
        onClose={() => !busy && setDialog(null)}
        dismissible={!busy}
        title={dialog === 'record' ? `Record the review of ${focus.label}` : `Withdraw the review of ${focus.label}?`}
        description={dialog === 'record' ? 'The month is closed once reviewed: its reports can no longer be filed, corrected or reopened unless the review is withdrawn.' : 'The month opens again so that a report can be filed or reopened. The withdrawal and its reason are kept on record.'}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={dialog === 'record' ? 'success' : 'primary'} loading={busy} onClick={confirm}>{dialog === 'record' ? 'Record Review' : 'Withdraw Review'}</ActionButton>
          </>
        )}
      >
        <div className="space-y-4">
          {dialog === 'record' && (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Reviewed by
              <select value={authority} onChange={(event) => setAuthority(event.target.value)} className={selectClass}>
                {AUTHORITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          )}
          <div>
            <label htmlFor="review-remarks" className="mb-1.5 block text-sm font-medium text-slate-700">{dialog === 'record' ? 'Review remarks' : 'Reason for withdrawing'} <span className="text-red-600">*</span></label>
            <textarea id="review-remarks" rows={3} maxLength={2000} value={remarks} disabled={busy} onChange={(event) => setRemarks(event.target.value)} className={`${inputClass(Boolean(touched && remarkError))} resize-none`} />
            {touched && <FieldError id="review-remarks-error" message={remarkError} />}
          </div>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Dialog>
    </Panel>
  );
}
