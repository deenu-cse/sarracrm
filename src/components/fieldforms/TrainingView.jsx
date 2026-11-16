"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GraduationCap, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { ActionButton, Field, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { createTraining, deleteTraining, fetchTraining, removeTrainingFile, updateTraining, uploadTrainingFiles } from '@/lib/formsApi';
import { TRAINING_LEVELS } from './TrainingHub';
import {
  CountInput, FileGroup, LocationPicker, PageHeader, card, day, emptyPlace, inputDate, moment, num, placeBody, placeErrors, today, useRoleBase,
} from './shared';

const CATEGORIES = [['officer', 'Officer / Staff'], ['representative', 'Public Representative'], ['community', 'Community']];
const emptyParticipants = () => Object.fromEntries(CATEGORIES.map(([key]) => [key, { male: '', female: '' }]));

/** Departments typed one at a time (Enter or comma adds one). */
function DepartmentsInput({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const name = draft.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    if (name && !value.some((v) => v.toLowerCase() === name.toLowerCase())) onChange([...value, name]);
    setDraft('');
  };
  return (
    <div className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20">
      <ul className="flex flex-wrap gap-1.5">
        {value.map((dept) => (
          <li key={dept} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {dept}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== dept))} className="rounded text-slate-400 hover:text-red-700" aria-label={`Remove ${dept}`}><X className="h-3 w-3" aria-hidden="true" /></button>
          </li>
        ))}
        <li className="min-w-[12rem] flex-1">
          <input
            id="tr-depts"
            value={draft}
            onChange={(e) => (e.target.value.endsWith(',') ? (setDraft(e.target.value.slice(0, -1)), setTimeout(add)) : setDraft(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1)); }}
            onBlur={add}
            placeholder={value.length ? 'Add another…' : 'Type a department and press Enter'}
            className="w-full border-0 bg-transparent px-1 py-1 text-sm focus:outline-none focus:ring-0"
          />
        </li>
      </ul>
    </div>
  );
}

/** One training / capacity development programme. `id` "new" opens an empty entry. */
export function TrainingView({ id }) {
  const router = useRouter();
  const base = useRoleBase();
  const { user } = useAuth();
  const isNew = id === 'new';
  const lockedDistrict = [USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER].includes(user?.role) ? user?.district || null : null;
  const [box, setBox] = useState({ data: null, loading: !isNew, error: '' });
  const [level, setLevel] = useState('DISTRICT');
  const [place, setPlace] = useState(emptyPlace());
  const [form, setForm] = useState({ date: '', place: '', subject: '', departments: [], remarks: '' });
  const [participants, setParticipants] = useState(emptyParticipants());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ tone: '', text: '' });

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const t = await fetchTraining(id);
      setBox({ data: t, loading: false, error: '' });
      setLevel(t.level);
      setPlace({ district: { id: t.districtId || '', name: t.district }, block: t.block, gramPanchayat: t.gramPanchayat, village: null });
      setForm({ date: inputDate(t.date), place: t.place, subject: t.subject, departments: t.departments || [], remarks: t.remarks || '' });
      setParticipants(Object.fromEntries(CATEGORIES.map(([key]) => [key, { male: String(t.participantsInput?.[key]?.male ?? ''), female: String(t.participantsInput?.[key]?.female ?? '') }])));
    } catch (err) {
      setBox({ data: null, loading: false, error: err?.message || 'Unable to load the programme.' });
    }
  }, [id, isNew]);
  useEffect(() => { load(); }, [load]);

  const t = box.data;
  const editable = isNew || t?.permissions?.canEdit;
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const setCount = (category, gender) => (value) => { setParticipants((p) => ({ ...p, [category]: { ...p[category], [gender]: value } })); setErrors((e) => ({ ...e, participants: undefined })); };
  const totals = CATEGORIES.reduce((acc, [key]) => {
    const male = Number(participants[key].male) || 0;
    const female = Number(participants[key].female) || 0;
    return { male: acc.male + male, female: acc.female + female, [key]: male + female };
  }, { male: 0, female: 0 });

  const save = async () => {
    const found = { ...placeErrors(place, level) };
    if (!form.date) found.date = 'Enter the date of the programme.';
    else if (form.date > today()) found.date = 'The date cannot be in the future.';
    if (form.place.trim().length < 2) found.place = 'Enter the place of the programme.';
    if (form.subject.trim().length < 3) found.subject = 'Enter the activity / subject.';
    if (!(totals.male + totals.female)) found.participants = 'Enter the number of participants.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setMessage({ tone: '', text: '' });
    const body = {
      level, ...placeBody(place), ...form,
      participants: Object.fromEntries(CATEGORIES.map(([key]) => [key, { male: Number(participants[key].male) || 0, female: Number(participants[key].female) || 0 }])),
    };
    try {
      if (isNew) {
        const created = await createTraining(body);
        router.replace(`${base}/training/${created.id}`);
        return;
      }
      await updateTraining(id, body);
      await load();
      setMessage({ tone: 'success', text: 'Saved.' });
    } catch (err) {
      setMessage({ tone: 'error', text: err?.message || 'The programme could not be saved.' });
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!window.confirm('Delete this training programme and its files?')) return;
    setSaving(true);
    try { await deleteTraining(id); router.replace(`${base}/training`); } catch (err) { setMessage({ tone: 'error', text: err?.message }); setSaving(false); }
  };

  if (box.loading) return <div className="mx-auto max-w-5xl space-y-4 p-6"><Skeleton className="h-12" /><Skeleton className="h-72" /></div>;
  if (box.error) return <div className="mx-auto max-w-5xl p-6"><Notice tone="error" title="Unable to open the programme." action={<RetryButton onClick={load} />}>{box.error}</Notice></div>;

  const fileProps = (kind) => ({
    editable: Boolean(t?.permissions?.canEdit),
    onUpload: async (files) => { await uploadTrainingFiles(id, kind, files); await load(); },
    onRemove: async (file) => { await removeTrainingFile(id, kind, file.id); await load(); },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href={`${base}/training`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Training programmes</Link>
      <PageHeader icon={GraduationCap} title={isNew ? 'New training programme' : t.subject} subtitle={isNew ? 'Training and capacity development programme' : `${t.refNo} · ${t.levelLabel} level · organised by ${t.organiser.unitName} · ${day(t.date)}`} />
      {message.text && <Notice tone={message.tone || 'info'}>{message.text}</Notice>}

      {editable ? (
        <>
          <section className={card}>
            <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-sm font-semibold text-slate-900">Level and place</h2></header>
            <div className="space-y-4 px-5 py-5">
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-slate-700">Level <span className="text-red-600" aria-hidden="true">*</span></legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TRAINING_LEVELS).map(([key, label]) => (
                    <label key={key} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium ${level === key ? 'border-navy bg-navy/5 text-navy' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                      <input type="radio" name="tr-level" value={key} checked={level === key} onChange={() => { setLevel(key); setErrors({}); }} className="sr-only" />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <LocationPicker depth={level} value={place} onChange={(next) => { setPlace(next); setErrors((e) => ({ ...e, district: undefined, block: undefined, gramPanchayat: undefined })); }} lockedDistrict={lockedDistrict} errors={errors} idPrefix="tr" />
            </div>
          </section>

          <section className={card}>
            <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-sm font-semibold text-slate-900">Programme</h2></header>
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-5 py-5 md:grid-cols-2">
              <Field id="tr-date" label="Date" required error={errors.date}><input id="tr-date" type="date" max={today()} value={form.date} onChange={(e) => set('date')(e.target.value)} className={inputClass(Boolean(errors.date))} /></Field>
              <Field id="tr-place" label="Place of programme" required error={errors.place}><input id="tr-place" value={form.place} maxLength={300} onChange={(e) => set('place')(e.target.value)} className={inputClass(Boolean(errors.place))} placeholder="e.g. Vikas Bhawan" /></Field>
              <Field id="tr-subject" label="Activity / subject" required error={errors.subject} className="md:col-span-2"><input id="tr-subject" value={form.subject} maxLength={300} onChange={(e) => set('subject')(e.target.value)} className={inputClass(Boolean(errors.subject))} placeholder="e.g. Springshed management and water budgeting" /></Field>
              <Field id="tr-depts" label="Participating departments" optional className="md:col-span-2"><DepartmentsInput value={form.departments} onChange={set('departments')} /></Field>
            </div>
          </section>

          <section className={card}>
            <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-sm font-semibold text-slate-900">No. of participants</h2>{errors.participants && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{errors.participants}</p>}</header>
            <div className="overflow-x-auto px-5 py-4">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th scope="col" className="py-2">Category</th><th scope="col" className="w-32 py-2 text-right">Male</th><th scope="col" className="w-32 py-2 text-right">Female</th><th scope="col" className="w-24 py-2 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {CATEGORIES.map(([key, label]) => (
                    <tr key={key}>
                      <th scope="row" className="py-2 text-left font-medium text-slate-800">{label}</th>
                      <td className="py-2 pl-3"><CountInput id={`tr-${key}-m`} value={participants[key].male} onChange={setCount(key, 'male')} invalid={Boolean(errors.participants)} /></td>
                      <td className="py-2 pl-3"><CountInput id={`tr-${key}-f`} value={participants[key].female} onChange={setCount(key, 'female')} invalid={Boolean(errors.participants)} /></td>
                      <td className="py-2 text-right font-semibold tabular-nums">{num(totals[key])}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold"><th scope="row" className="py-2 pl-2 text-left">Total</th><td className="py-2 text-right tabular-nums">{num(totals.male)}</td><td className="py-2 text-right tabular-nums">{num(totals.female)}</td><td className="py-2 pr-1 text-right tabular-nums">{num(totals.male + totals.female)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <Field id="tr-remarks" label="Remarks" optional><textarea id="tr-remarks" rows={3} maxLength={2000} value={form.remarks} onChange={(e) => set('remarks')(e.target.value)} className={inputClass(false)} /></Field>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton icon={Save} loading={saving} onClick={save}>{isNew ? 'Save and attach files' : 'Save'}</ActionButton>
                {!isNew && t?.permissions?.canDelete && <ActionButton variant="ghost" icon={Trash2} disabled={saving} onClick={remove}>Delete</ActionButton>}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className={card}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-5 text-sm md:grid-cols-3">
            {[['Level', t.levelLabel], ['District', t.district], ['Block', t.block?.name || '—'], ['Gram Panchayat', t.gramPanchayat?.name || '—'], ['Date', day(t.date)], ['Place', t.place], ['Organised by', t.organiser.unitName], ['Departments', t.departments.join(', ') || '—']].map(([label, value]) => (
              <div key={label}><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-0.5 font-semibold text-slate-900">{value}</dd></div>
            ))}
          </dl>
          <div className="overflow-x-auto border-t border-slate-100 px-5 py-4">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th scope="col" className="py-1.5">Participants</th><th scope="col" className="py-1.5 text-right">Male</th><th scope="col" className="py-1.5 text-right">Female</th><th scope="col" className="py-1.5 text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIES.map(([key, label]) => <tr key={key}><th scope="row" className="py-1.5 text-left font-medium">{label}</th><td className="py-1.5 text-right tabular-nums">{num(t.participants[key].male)}</td><td className="py-1.5 text-right tabular-nums">{num(t.participants[key].female)}</td><td className="py-1.5 text-right font-semibold tabular-nums">{num(t.participants[key].total)}</td></tr>)}
                <tr className="font-bold"><th scope="row" className="py-1.5 text-left">Total</th><td className="py-1.5 text-right tabular-nums">{num(t.participants.male)}</td><td className="py-1.5 text-right tabular-nums">{num(t.participants.female)}</td><td className="py-1.5 text-right tabular-nums">{num(t.participants.total)}</td></tr>
              </tbody>
            </table>
            {t.remarks && <p className="mt-3 whitespace-pre-line text-sm text-slate-700"><strong>Remarks:</strong> {t.remarks}</p>}
          </div>
        </section>
      )}

      {isNew ? <Notice tone="info">Save the programme first, then attach the photographs, documents (attendance sheet, agenda …) and the minutes.</Notice> : (
        <section className={`${card} space-y-4 p-5`}>
          <h2 className="text-sm font-semibold text-slate-900">Photographs and documents</h2>
          <FileGroup title="Photographs" imagesOnly files={t.photographs} max={12} {...fileProps('photographs')} />
          <FileGroup title="Documents" hint="Attendance sheet, agenda, presentation …" files={t.documents} max={10} {...fileProps('documents')} />
          <FileGroup title="Minutes of meeting" files={t.minutes} max={5} {...fileProps('minutes')} />
          <p className="text-xs text-slate-500">Recorded by {t.createdBy || '—'} on {moment(t.createdAt)}.</p>
        </section>
      )}
    </div>
  );
}
