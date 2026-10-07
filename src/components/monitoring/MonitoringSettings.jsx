"use client";
import React, { useEffect, useRef, useState } from 'react';
import { BellRing, Mail, Save, Send } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { fetchDispatches, fetchMonitoringSettings, fetchSummaryPreview, runRemindersNow, saveMonitoringSettings, sendMonthlySummary } from '@/lib/lifecycleApi';
import { formatLakh } from '@/lib/numeric';
import { ActionButton, FieldError, Notice, RetryButton, Skeleton, inputClass, useMasterList } from '@/components/projects/create/parts';
import { EmptyNote, Panel, formatMoment } from '@/components/projects/detail/shared';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function NumberField({ id, label, hint, value, onChange, min, max, error, disabled }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input id={id} type="text" inputMode="numeric" value={value} disabled={disabled} maxLength={2}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))} aria-invalid={Boolean(error) || undefined} className={`${inputClass(Boolean(error))} max-w-[7rem] tabular-nums`} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint} ({min} to {max})</p>}
      <FieldError message={error} />
    </div>
  );
}

function Toggle({ id, label, description, checked, onChange, disabled }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

const DISPATCH_STATUS = {
  SENT: { label: 'Sent', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  DRY_RUN: { label: 'Not sent (e-mail is in test mode)', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  FAILED: { label: 'Failed', cls: 'border-red-200 bg-red-50 text-red-800' },
};

/** Due dates, automatic reminders and the monthly e-mail summary (State and M&E administrators). */
export function MonitoringSettings() {
  const [box, setBox] = useState({ settings: null, loading: true, error: '' });
  const [form, setForm] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState(null); // { tone, text }
  const [attempted, setAttempted] = useState(false);
  const [confirming, setConfirming] = useState(null); // 'reminders' | 'summary' | 'test'
  const [testEmail, setTestEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const busyRef = useRef(false);
  const dispatches = useMasterList(fetchDispatches, 'dispatches');
  const preview = useMasterList(async () => [await fetchSummaryPreview()], 'summary-preview');

  const apply = (settings) => {
    setBox({ settings, loading: false, error: '' });
    setForm({
      mprDueDay: String(settings.deadlines.mprDueDay),
      remindDaysBefore: String(settings.deadlines.remindDaysBefore),
      escalateToDistrictAfterDays: String(settings.deadlines.escalateToDistrictAfterDays),
      escalateToStateAfterDays: String(settings.deadlines.escalateToStateAfterDays),
      districtReviewDays: String(settings.deadlines.districtReviewDays),
      remindersEnabled: settings.deadlines.remindersEnabled,
      emailEnabled: settings.emailReports.enabled,
      dayOfMonth: String(settings.emailReports.dayOfMonth),
      sendToStateAdmins: settings.emailReports.sendToStateAdmins,
      sendToMneAdmins: settings.emailReports.sendToMneAdmins,
      sendToDistricts: settings.emailReports.sendToDistricts,
      extraRecipients: settings.emailReports.extraRecipients || [],
    });
  };
  const load = () => {
    setBox((current) => ({ ...current, loading: true, error: '' }));
    fetchMonitoringSettings().then(apply).catch((err) => setBox({ settings: null, loading: false, error: err?.message || 'Unable to load settings.' }));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (box.loading && !form) return <div className="space-y-3" role="status" aria-label="Loading settings"><Skeleton className="h-64" /><Skeleton className="h-48" /></div>;
  if (box.error || !form) return <Notice tone="error" title="Unable to load settings." action={<RetryButton onClick={load} />}>{box.error}</Notice>;

  const set = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setMessage(null); };
  const range = (key, min, max) => {
    const number = Number(form[key]);
    return form[key] === '' || !Number.isInteger(number) || number < min || number > max ? `Enter a whole number from ${min} to ${max}.` : '';
  };
  const errors = {
    mprDueDay: range('mprDueDay', 1, 28),
    remindDaysBefore: range('remindDaysBefore', 0, 15),
    escalateToDistrictAfterDays: range('escalateToDistrictAfterDays', 1, 30),
    escalateToStateAfterDays: range('escalateToStateAfterDays', 1, 60) || (Number(form.escalateToStateAfterDays) <= Number(form.escalateToDistrictAfterDays) ? 'Must be more than the district days.' : ''),
    districtReviewDays: range('districtReviewDays', 1, 30),
    dayOfMonth: range('dayOfMonth', 1, 28),
  };
  const invalid = Object.values(errors).some(Boolean);
  const shown = (key) => (attempted ? errors[key] : '');

  const addRecipient = () => {
    const address = recipient.trim().toLowerCase();
    if (!address) return;
    if (!EMAIL.test(address)) { setMessage({ tone: 'error', text: `"${address}" is not a valid e-mail address.` }); return; }
    if (form.extraRecipients.includes(address)) { setRecipient(''); return; }
    if (form.extraRecipients.length >= 10) { setMessage({ tone: 'error', text: 'At most 10 additional addresses can be added.' }); return; }
    set('extraRecipients', [...form.extraRecipients, address]);
    setRecipient('');
  };

  const save = async () => {
    setAttempted(true);
    if (invalid || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      apply(await saveMonitoringSettings({
        deadlines: {
          mprDueDay: Number(form.mprDueDay), remindDaysBefore: Number(form.remindDaysBefore), escalateToDistrictAfterDays: Number(form.escalateToDistrictAfterDays),
          escalateToStateAfterDays: Number(form.escalateToStateAfterDays), districtReviewDays: Number(form.districtReviewDays), remindersEnabled: form.remindersEnabled,
        },
        emailReports: {
          enabled: form.emailEnabled, dayOfMonth: Number(form.dayOfMonth), sendToStateAdmins: form.sendToStateAdmins, sendToMneAdmins: form.sendToMneAdmins,
          sendToDistricts: form.sendToDistricts, extraRecipients: form.extraRecipients,
        },
      }));
      setMessage({ tone: 'success', text: 'Settings saved.' });
      preview.reload();
    } catch (err) {
      setSaveError(err?.message || 'The settings could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testError = confirming === 'test' && !EMAIL.test(testEmail.trim()) ? 'Enter a valid e-mail address.' : '';
  const act = async () => {
    if (busyRef.current) return;
    if (testError) { setActionError(testError); return; }
    busyRef.current = true;
    setBusy(true);
    setActionError('');
    try {
      if (confirming === 'reminders') {
        const sent = await runRemindersNow();
        const total = sent.dueSoon + sent.overdue + sent.escalatedToDistrict + (sent.escalatedToState ? 1 : 0) + sent.reviewReminders;
        setMessage({ tone: 'success', text: sent.skipped ? 'Reminders are switched off, so nothing was sent.' : total === 0 ? 'Nothing new to send. Every reminder that is due has already gone out.'
          : `${total} reminder${total === 1 ? '' : 's'} sent: ${sent.dueSoon} due soon, ${sent.overdue} overdue, ${sent.escalatedToDistrict} to districts, ${sent.escalatedToState} reported to the State, ${sent.reviewReminders} review reminder${sent.reviewReminders === 1 ? '' : 's'}.` });
      } else {
        const sent = await sendMonthlySummary(confirming === 'test' ? { testEmail: testEmail.trim() } : {});
        const emails = sent.emails + sent.dryRun;
        setMessage(sent.failed
          ? { tone: 'error', text: `${sent.failed} e-mail${sent.failed === 1 ? '' : 's'} could not be sent for ${sent.period}. See the log below.` }
          : sent.dryRun
            ? { tone: 'warning', text: `The ${sent.period} summary was prepared for ${emails} recipient${emails === 1 ? '' : 's'}, but e-mail is in test mode on this server, so nothing left the system.` }
            : { tone: 'success', text: `The ${sent.period} summary was sent to ${emails} recipient${emails === 1 ? '' : 's'}.` });
        dispatches.reload();
      }
      setConfirming(null);
    } catch (err) {
      setActionError(err?.message || 'This could not be completed. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const summary = preview.items[0];
  const openConfirm = (name) => { setConfirming(name); setActionError(''); setTestEmail(''); setMessage(null); };

  return (
    <div className="space-y-5">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Panel title="Due dates and reminders" description="When a monthly report is due, and who is told when it is late." aside={<ActionButton size="sm" variant="secondary" icon={BellRing} onClick={() => openConfirm('reminders')}>Send Reminders Now</ActionButton>}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField id="set-due-day" label="Report due on day of next month" hint="Day of the month" min={1} max={28} value={form.mprDueDay} onChange={(v) => set('mprDueDay', v)} error={shown('mprDueDay')} disabled={saving} />
          <NumberField id="set-remind" label="Remind PIA officer, days before" hint="Days" min={0} max={15} value={form.remindDaysBefore} onChange={(v) => set('remindDaysBefore', v)} error={shown('remindDaysBefore')} disabled={saving} />
          <NumberField id="set-review" label="District review time, days" hint="Days" min={1} max={30} value={form.districtReviewDays} onChange={(v) => set('districtReviewDays', v)} error={shown('districtReviewDays')} disabled={saving} />
          <NumberField id="set-esc-dd" label="Tell District Director after, days overdue" hint="Days" min={1} max={30} value={form.escalateToDistrictAfterDays} onChange={(v) => set('escalateToDistrictAfterDays', v)} error={shown('escalateToDistrictAfterDays')} disabled={saving} />
          <NumberField id="set-esc-state" label="Tell State (M&E) after, days overdue" hint="Days" min={1} max={60} value={form.escalateToStateAfterDays} onChange={(v) => set('escalateToStateAfterDays', v)} error={shown('escalateToStateAfterDays')} disabled={saving} />
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <Toggle id="set-reminders-on" label="Send reminders automatically" description="Once a day after 9 AM. Each reminder is sent only once." checked={form.remindersEnabled} onChange={(v) => set('remindersEnabled', v)} disabled={saving} />
        </div>
      </Panel>

      <Panel title="Monthly e-mail summary" description="A summary of the previous month with the Excel register attached."
        aside={(
          <div className="flex flex-wrap gap-2">
            <ActionButton size="sm" variant="secondary" icon={Mail} onClick={() => openConfirm('test')}>Send Test</ActionButton>
            <ActionButton size="sm" variant="secondary" icon={Send} onClick={() => openConfirm('summary')}>Send Now</ActionButton>
          </div>
        )}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Toggle id="set-email-on" label="Send the summary every month" checked={form.emailEnabled} onChange={(v) => set('emailEnabled', v)} disabled={saving} />
            <NumberField id="set-email-day" label="Send on day of the month" hint="Day of the month" min={1} max={28} value={form.dayOfMonth} onChange={(v) => set('dayOfMonth', v)} error={shown('dayOfMonth')} disabled={saving} />
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-slate-700">Recipients</legend>
              <Toggle id="set-to-state" label="State administrators" description="State-wide summary" checked={form.sendToStateAdmins} onChange={(v) => set('sendToStateAdmins', v)} disabled={saving} />
              <Toggle id="set-to-mne" label="M&E administrators" description="State-wide summary" checked={form.sendToMneAdmins} onChange={(v) => set('sendToMneAdmins', v)} disabled={saving} />
              <Toggle id="set-to-dd" label="District Directors" description="Each gets the summary of their own district" checked={form.sendToDistricts} onChange={(v) => set('sendToDistricts', v)} disabled={saving} />
            </fieldset>
            <div>
              <label htmlFor="set-extra" className="mb-1.5 block text-sm font-medium text-slate-700">Additional addresses for the State summary</label>
              <div className="flex gap-2">
                <input id="set-extra" type="email" value={recipient} disabled={saving} onChange={(event) => setRecipient(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addRecipient(); } }} placeholder="name@uk.gov.in" className={inputClass(false)} />
                <ActionButton variant="secondary" onClick={addRecipient} disabled={saving}>Add</ActionButton>
              </div>
              {form.extraRecipients.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {form.extraRecipients.map((address) => (
                    <li key={address} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-1 text-xs text-slate-700">
                      {address}
                      <button type="button" onClick={() => set('extraRecipients', form.extraRecipients.filter((item) => item !== address))} aria-label={`Remove ${address}`} className="rounded px-1 text-slate-500 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">What the next summary will say</p>
            {!summary && !preview.error && <Skeleton className="mt-3 h-32" />}
            {preview.error && <p className="mt-3 text-sm text-red-700">{preview.error}</p>}
            {summary && (
              <>
                <p className="mt-1 text-sm font-semibold text-slate-900">{summary.periodLabel}, whole State</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {[['Projects', summary.totals.projects], ['Sanctioned', formatLakh(summary.totals.sanctionedLakh)], ['Released', formatLakh(summary.totals.releasedLakh)], ['Spent', formatLakh(summary.totals.spentLakh)],
                    ['Spent in the month', formatLakh(summary.totals.spentInMonthLakh)], ['Reports filed', `${summary.totals.reportsFiled} of ${summary.totals.reportsExpected}`]].map(([label, value]) => (
                    <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="font-semibold tabular-nums text-slate-900">{value}</dd></div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-slate-500">{summary.rows.length} district{summary.rows.length === 1 ? '' : 's'} listed. {summary.pending.length} report{summary.pending.length === 1 ? '' : 's'} not filed.</p>
              </>
            )}
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saveError && <p role="alert" className="text-sm font-medium text-red-700">{saveError}</p>}
        {attempted && invalid && <p role="alert" className="text-sm font-medium text-red-700">Correct the highlighted fields.</p>}
        <ActionButton icon={Save} loading={saving} onClick={save}>{saving ? 'Saving…' : 'Save Settings'}</ActionButton>
      </div>

      <Panel title="Summary e-mails sent" description="The last 30, newest first." padded={false}>
        {dispatches.loading && <div className="p-5"><Skeleton className="h-16" /></div>}
        {!dispatches.loading && dispatches.error && <div className="p-5"><Notice tone="error" action={<RetryButton onClick={dispatches.reload} />}>{dispatches.error}</Notice></div>}
        {!dispatches.loading && !dispatches.error && dispatches.items.length === 0 && <div className="p-5"><EmptyNote>No summary has been sent yet.</EmptyNote></div>}
        {!dispatches.loading && !dispatches.error && dispatches.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-2.5">Sent</th>
                  <th scope="col" className="px-3 py-2.5">Month</th>
                  <th scope="col" className="px-3 py-2.5">For</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Recipients</th>
                  <th scope="col" className="px-3 py-2.5">How</th>
                  <th scope="col" className="px-5 py-2.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispatches.items.map((row) => {
                  const status = DISPATCH_STATUS[row.status] || DISPATCH_STATUS.SENT;
                  return (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap px-5 py-2.5 text-slate-700">{formatMoment(row.sentAt, true)}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.period}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">{row.district ? `${row.district} district` : 'Whole State'}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row.recipients}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.trigger === 'MANUAL' ? `By ${row.sentBy || 'an administrator'}` : 'Automatic'}</td>
                      <td className="px-5 py-2.5"><span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>{row.error && <span className="ml-2 text-xs text-red-700">{row.error}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog
        open={Boolean(confirming)}
        onClose={() => { if (!busy) setConfirming(null); }}
        title={{ reminders: 'Send reminders now?', summary: 'Send the monthly summary now?', test: 'Send a test summary' }[confirming] || ''}
        description={{
          reminders: 'Every reminder that is due and has not gone out yet is sent. Nobody is reminded twice for the same report.',
          summary: `The summary of ${summary?.periodLabel || 'last month'} goes to every recipient selected in the saved settings, with the Excel register attached.`,
          test: 'Only this address receives the State summary. Use it to see what the e-mail looks like.',
        }[confirming]}
        size="md"
        dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setConfirming(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton icon={Send} loading={busy} onClick={act}>{busy ? 'Sending…' : 'Send'}</ActionButton>
          </>
        )}
      >
        {confirming === 'test' && (
          <div>
            <label htmlFor="test-email" className="mb-1.5 block text-sm font-medium text-slate-700">E-mail address</label>
            <input id="test-email" type="email" value={testEmail} disabled={busy} onChange={(event) => { setTestEmail(event.target.value); setActionError(''); }} className={inputClass(Boolean(actionError))} />
          </div>
        )}
        {actionError && <div className="mt-3"><Notice tone="error">{actionError}</Notice></div>}
      </Dialog>
    </div>
  );
}
