"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, FileDown, Landmark, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { ActionButton, Field, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import {
  approveMeeting, createMeeting, deleteMeeting, downloadMeetingPdf, fetchMeeting, removeMeetingFile, returnMeeting, submitMeeting, updateMeeting, uploadMeetingFiles,
} from '@/lib/formsApi';
import { COMMITTEES } from './CommitteesHub';
import { CountInput, FileGroup, PageHeader, StatusPill, card, day, inputDate, moment, num, today, useRoleBase } from './shared';

const blank = { meetingNo: '', meetingDate: '', place: '', male: '', female: '', remarks: '' };
const formOf = (m) => ({ meetingNo: String(m.meetingNo ?? ''), meetingDate: inputDate(m.meetingDate), place: m.place || '', male: String(m.participants?.male ?? ''), female: String(m.participants?.female ?? ''), remarks: m.remarks || '' });

const validate = (form) => {
  const errors = {};
  if (!Number(form.meetingNo)) errors.meetingNo = 'Enter the meeting number.';
  if (!form.meetingDate) errors.meetingDate = 'Enter the date of the meeting.';
  else if (form.meetingDate > today()) errors.meetingDate = 'The date cannot be in the future.';
  if (form.place.trim().length < 2) errors.place = 'Enter the place of the meeting.';
  if (!(Number(form.male) + Number(form.female))) errors.participants = 'Enter the number of male and female participants.';
  return errors;
};

/**
 * One committee meeting (HPC, SLEC or DLEC). `id` "new" opens an empty entry
 * (committee from ?type=). The Maker fills the details, attaches the minutes and
 * photographs and submits; the HQ Approver approves or returns it.
 */
export function MeetingView({ id }) {
  const router = useRouter();
  const params = useSearchParams();
  const base = useRoleBase();
  const isNew = id === 'new';
  const type = isNew ? (COMMITTEES[params.get('type')] ? params.get('type') : 'HPC') : null;
  const [box, setBox] = useState({ data: null, loading: !isNew, error: '' });
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [decision, setDecision] = useState(null); // 'approve' | 'return'

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const data = await fetchMeeting(id);
      setBox({ data, loading: false, error: '' });
      setForm(formOf(data));
    } catch (err) {
      setBox({ data: null, loading: false, error: err?.message || 'Unable to load the meeting.' });
    }
  }, [id, isNew]);
  useEffect(() => { load(); }, [load]);

  const meeting = box.data;
  const committee = COMMITTEES[meeting?.type || type];
  const permissions = meeting?.permissions || {};
  const editable = isNew || permissions.canEdit;
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, participants: undefined })); };

  const save = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return null;
    setSaving(true);
    setMessage({ tone: '', text: '' });
    const body = { ...form, meetingNo: Number(form.meetingNo), male: Number(form.male) || 0, female: Number(form.female) || 0 };
    try {
      if (isNew) {
        const created = await createMeeting({ ...body, type });
        router.replace(`${base}/committees/meeting/${created.id}`);
        return created;
      }
      await updateMeeting(id, body);
      await load();
      setMessage({ tone: 'success', text: 'Details saved.' });
      return true;
    } catch (err) {
      setMessage({ tone: 'error', text: err?.message || 'The meeting could not be saved.' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const act = async (work, success) => {
    setSaving(true);
    setMessage({ tone: '', text: '' });
    try {
      await work();
      await load();
      setMessage(success ? { tone: 'success', text: success } : { tone: '', text: '' });
      return true;
    } catch (err) {
      setMessage({ tone: 'error', text: err?.message || 'Something went wrong. Please try again.' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    const saved = await save();
    if (!saved) return;
    await act(() => submitMeeting(id), 'Sent to the HQ Approver.');
  };
  const remove = async () => {
    if (!window.confirm('Delete this draft meeting and its files?')) return;
    setSaving(true);
    try { await deleteMeeting(id); router.replace(`${base}/committees?tab=${meeting.type}`); } catch (err) { setMessage({ tone: 'error', text: err?.message }); setSaving(false); }
  };

  if (box.loading) return <div className="mx-auto max-w-5xl space-y-4 p-6"><Skeleton className="h-12" /><Skeleton className="h-72" /></div>;
  if (box.error) return <div className="mx-auto max-w-5xl p-6"><Notice tone="error" title="Unable to open the meeting." action={<RetryButton onClick={load} />}>{box.error}</Notice></div>;

  const total = (Number(form.male) || 0) + (Number(form.female) || 0);
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href={`${base}/committees?tab=${committee.code}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{committee.code} meetings</Link>
      <PageHeader
        icon={Landmark}
        title={isNew ? `New ${committee.code} meeting` : `${committee.code} meeting no. ${meeting.meetingNo}`}
        subtitle={isNew ? `${committee.name} — details are sent to the HQ Approver after you attach the minutes.` : `${committee.name}${meeting.district ? ` · ${meeting.district}` : ''} · ${meeting.refNo}`}
        actions={!isNew && (
          <>
            <StatusPill status={meeting.status} label={meeting.statusLabel} />
            <ActionButton variant="secondary" size="sm" icon={FileDown} onClick={() => downloadMeetingPdf(id, meeting.refNo).catch((err) => setMessage({ tone: 'error', text: err?.message }))}>Download PDF</ActionButton>
          </>
        )}
      />

      {meeting?.status === 'RETURNED' && meeting.returnReason && <Notice tone="warning" title="Returned by the HQ Approver">{meeting.returnReason}</Notice>}
      {meeting?.status === 'PENDING_APPROVAL' && !permissions.canApprove && <Notice tone="info">Sent to the HQ Approver on {moment(meeting.submittedAt)}. It cannot be changed while it is being reviewed.</Notice>}
      {meeting?.status === 'APPROVED' && <Notice tone="success" title={`Approved by ${meeting.approvedBy || 'the HQ Approver'} on ${moment(meeting.approvedAt)}`}>{meeting.approvalNote || 'The meeting is locked.'}</Notice>}
      {message.text && <Notice tone={message.tone || 'info'}>{message.text}</Notice>}

      <section className={card}>
        <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-base font-bold text-slate-900">Meeting details</h2></header>
        {editable ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-5 py-5 md:grid-cols-3">
            <Field id="m-no" label={`No. of ${committee.code} meeting`} required error={errors.meetingNo}><CountInput id="m-no" value={form.meetingNo} onChange={set('meetingNo')} invalid={Boolean(errors.meetingNo)} placeholder="e.g. 3" /></Field>
            <Field id="m-date" label={`Date of ${committee.code}`} required error={errors.meetingDate}><input id="m-date" type="date" max={today()} value={form.meetingDate} onChange={(e) => set('meetingDate')(e.target.value)} className={inputClass(Boolean(errors.meetingDate))} /></Field>
            <Field id="m-place" label="Place of meeting" required error={errors.place}><input id="m-place" value={form.place} maxLength={300} onChange={(e) => set('place')(e.target.value)} className={inputClass(Boolean(errors.place))} placeholder="e.g. Secretariat, Dehradun" /></Field>
            <Field id="m-male" label="Male persons" required error={errors.participants}><CountInput id="m-male" value={form.male} onChange={set('male')} invalid={Boolean(errors.participants)} /></Field>
            <Field id="m-female" label="Female persons" required><CountInput id="m-female" value={form.female} onChange={set('female')} invalid={Boolean(errors.participants)} /></Field>
            <div><p className="mb-1.5 text-sm font-medium text-slate-700">Total members / participants</p><p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-bold tabular-nums">{num(total)}</p></div>
            <Field id="m-remarks" label="Remarks" optional className="md:col-span-3"><textarea id="m-remarks" rows={3} maxLength={2000} value={form.remarks} onChange={(e) => set('remarks')(e.target.value)} className={inputClass(false)} placeholder="Decisions taken, follow-up …" /></Field>
            <div className="flex flex-wrap gap-2 md:col-span-3">
              <ActionButton icon={Save} loading={saving} onClick={save} variant={isNew ? 'primary' : 'secondary'}>{isNew ? 'Save and attach files' : 'Save details'}</ActionButton>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-5 text-sm md:grid-cols-3">
            {[['Meeting no.', meeting.meetingNo], ['Date', day(meeting.meetingDate)], ['Place', meeting.place], ['Male persons', num(meeting.participants.male)], ['Female persons', num(meeting.participants.female)], ['Total participants', num(meeting.participants.total)]].map(([label, value]) => (
              <div key={label}><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-0.5 font-semibold text-slate-900">{value}</dd></div>
            ))}
            <div className="col-span-2 md:col-span-3"><dt className="text-xs font-medium text-slate-500">Remarks</dt><dd className="mt-0.5 whitespace-pre-line text-slate-800">{meeting.remarks || '—'}</dd></div>
          </dl>
        )}
      </section>

      {isNew ? (
        <Notice tone="info">Save the details first. Then attach the minutes of the meeting (required) and the photographs, and submit to the HQ Approver.</Notice>
      ) : (
        <section className={`${card} space-y-4 p-5`}>
          <h2 className="text-base font-bold text-slate-900">Minutes and photographs</h2>
          <FileGroup title="Minutes of meeting" hint="Signed minutes (PDF or scanned image). Required before submitting." required files={meeting.minutes} max={5} editable={permissions.canEdit} onUpload={async (files) => { await uploadMeetingFiles(id, 'minutes', files); await load(); }} onRemove={async (file) => { await removeMeetingFile(id, 'minutes', file.id); await load(); }} />
          <FileGroup title="Photographs of meeting" imagesOnly files={meeting.photographs} max={12} editable={permissions.canEdit} onUpload={async (files) => { await uploadMeetingFiles(id, 'photographs', files); await load(); }} onRemove={async (file) => { await removeMeetingFile(id, 'photographs', file.id); await load(); }} />
        </section>
      )}

      {!isNew && (permissions.canSubmit || permissions.canDelete || permissions.canApprove) && (
        <section className={`${card} flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
          <p className="text-sm text-slate-600">{permissions.canApprove ? 'Check the details, minutes and photographs, then approve the meeting or return it to the Maker with remarks.' : 'When the details and minutes are complete, send the meeting to the HQ Approver.'}</p>
          <div className="flex flex-wrap gap-2">
            {permissions.canDelete && <ActionButton variant="ghost" icon={Trash2} disabled={saving} onClick={remove}>Delete draft</ActionButton>}
            {permissions.canSubmit && <ActionButton icon={Send} loading={saving} disabled={!meeting.minutes.length} disabledReason="Upload the minutes first" onClick={submit}>{meeting.status === 'RETURNED' ? 'Resubmit to HQ Approver' : 'Submit to HQ Approver'}</ActionButton>}
            {permissions.canReturn && <ActionButton variant="secondary" icon={RotateCcw} disabled={saving} onClick={() => setDecision('return')}>Return to Maker</ActionButton>}
            {permissions.canApprove && <ActionButton variant="success" icon={Check} disabled={saving} onClick={() => setDecision('approve')}>Approve</ActionButton>}
          </div>
        </section>
      )}

      {!isNew && meeting.history?.length > 0 && (
        <section className={card}>
          <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-base font-bold text-slate-900">History</h2></header>
          <ol className="divide-y divide-slate-100">
            {meeting.history.map((h, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-2.5 text-sm">
                <span><strong className="text-slate-900">{h.action.charAt(0) + h.action.slice(1).toLowerCase()}</strong> by {h.by || '—'} <span className="text-slate-500">({h.designation || h.role})</span>{h.note && <span className="block text-slate-600">“{h.note}”</span>}</span>
                <span className="text-xs text-slate-500">{moment(h.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <DecisionDialog
        mode={decision}
        onClose={() => setDecision(null)}
        onConfirm={async (text) => {
          const ok = await act(() => (decision === 'approve' ? approveMeeting(id, text) : returnMeeting(id, text)), decision === 'approve' ? '' : 'Returned to the Maker.');
          if (ok) setDecision(null);
        }}
        busy={saving}
      />
    </div>
  );
}

function DecisionDialog({ mode, onClose, onConfirm, busy }) {
  const [text, setText] = useState('');
  useEffect(() => { setText(''); }, [mode]);
  const approving = mode === 'approve';
  const invalid = !approving && text.trim().length < 5;
  return (
    <Dialog
      open={Boolean(mode)}
      onClose={onClose}
      title={approving ? 'Approve meeting' : 'Return to Maker'}
      description={approving ? 'The meeting will be locked and its PDF marked as approved by HQ.' : 'Tell the Maker what to correct. The meeting goes back to them.'}
      footer={(
        <div className="flex justify-end gap-2">
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton variant={approving ? 'success' : 'primary'} icon={approving ? Check : RotateCcw} loading={busy} disabled={invalid} disabledReason="Write at least 5 characters" onClick={() => onConfirm(text.trim())}>{approving ? 'Approve' : 'Return'}</ActionButton>
        </div>
      )}
    >
      <Field id="decision-text" label={approving ? 'Note' : 'Remarks for the Maker'} optional={approving} required={!approving}>
        <textarea id="decision-text" rows={4} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} className={inputClass(false)} />
      </Field>
    </Dialog>
  );
}
