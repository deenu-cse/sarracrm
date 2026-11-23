"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ActionButton, Field, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { createDnss, deleteDnss, fetchDnss, removeDnssFile, updateDnss, uploadDnssFiles } from '@/lib/formsApi';
import {
  CountInput, FileGroup, LocationPicker, PageHeader, card, day, emptyPlace, inputDate, moment, num, placeBody, placeErrors, today, useRoleBase,
} from './shared';

const blank = { groups: '', male: '', female: '', chairperson: '', contactNumber: '', formationDate: '', remarks: '' };
const share = (part, whole) => (whole > 0 ? Math.round((part / whole) * 10000) / 100 : 0);

/** One Dhara Naula Sanrakshan Samiti, entered by the District Maker. `id` "new" opens an empty entry. */
export function DnssView({ id }) {
  const router = useRouter();
  const base = useRoleBase();
  const { user } = useAuth();
  const isNew = id === 'new';
  const [box, setBox] = useState({ data: null, loading: !isNew, error: '' });
  const [place, setPlace] = useState(emptyPlace());
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ tone: '', text: '' });

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const d = await fetchDnss(id);
      setBox({ data: d, loading: false, error: '' });
      setPlace({ district: { id: d.districtId || '', name: d.district }, block: d.block, gramPanchayat: d.gramPanchayat, village: null });
      setForm({ groups: String(d.groups ?? ''), male: String(d.members.male), female: String(d.members.female), chairperson: d.chairperson, contactNumber: d.contactNumber, formationDate: inputDate(d.formationDate), remarks: d.remarks || '' });
    } catch (err) {
      setBox({ data: null, loading: false, error: err?.message || 'Unable to load the DNSS record.' });
    }
  }, [id, isNew]);
  useEffect(() => { load(); }, [load]);

  const d = box.data;
  const editable = isNew || d?.permissions?.canEdit;
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined, members: undefined })); };
  const male = Number(form.male) || 0;
  const female = Number(form.female) || 0;
  const total = male + female;

  const save = async () => {
    const found = { ...placeErrors(place, 'GRAM_PANCHAYAT') };
    if (form.chairperson.trim().length < 2) found.chairperson = 'Enter the name of the Gram Pradhan / Chairperson.';
    if (!/^(\+?91)?\d{10}$/.test(form.contactNumber.replace(/[\s-]/g, ''))) found.contactNumber = 'Enter a 10-digit mobile number.';
    if (!total) found.members = 'Enter the number of male and female members.';
    if (!form.formationDate) found.formationDate = 'Enter the date of DNSS formation.';
    else if (form.formationDate > today()) found.formationDate = 'The date cannot be in the future.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setMessage({ tone: '', text: '' });
    const body = { ...placeBody(place), ...form, groups: Number(form.groups) || 0, male, female };
    try {
      if (isNew) {
        const created = await createDnss(body);
        router.replace(`${base}/committees/dnss/${created.id}`);
        return;
      }
      await updateDnss(id, body);
      await load();
      setMessage({ tone: 'success', text: 'Saved.' });
    } catch (err) {
      setMessage({ tone: 'error', text: err?.message || 'The DNSS record could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this DNSS record and its files?')) return;
    setSaving(true);
    try { await deleteDnss(id); router.replace(`${base}/committees?tab=DNSS`); } catch (err) { setMessage({ tone: 'error', text: err?.message }); setSaving(false); }
  };

  if (box.loading) return <div className="mx-auto max-w-5xl space-y-4 p-6"><Skeleton className="h-12" /><Skeleton className="h-72" /></div>;
  if (box.error) return <div className="mx-auto max-w-5xl p-6"><Notice tone="error" title="Unable to open the DNSS record." action={<RetryButton onClick={load} />}>{box.error}</Notice></div>;

  const fileProps = (kind) => ({
    editable: Boolean(d?.permissions?.canEdit),
    onUpload: async (files) => { await uploadDnssFiles(id, kind, files); await load(); },
    onRemove: async (file) => { await removeDnssFile(id, kind, file.id); await load(); },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href={`${base}/committees?tab=DNSS`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ArrowLeft className="h-4 w-4" aria-hidden="true" />DNSS register</Link>
      <PageHeader icon={Users} title={isNew ? 'New Dhara Naula Sanrakshan Samiti' : `DNSS — ${d.gramPanchayat?.name}`} subtitle={isNew ? 'One DNSS per Gram Panchayat. Entered by the District Maker.' : `${d.block?.name} block · ${d.district} · last changed ${moment(d.updatedAt)}${d.updatedBy ? ` by ${d.updatedBy}` : ''}`} />
      {message.text && <Notice tone={message.tone || 'info'}>{message.text}</Notice>}

      <section className={card}>
        <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-base font-bold text-slate-900">Gram Panchayat</h2></header>
        <div className="px-5 py-5">
          {editable
            ? <LocationPicker depth="GRAM_PANCHAYAT" value={place} onChange={(next) => { setPlace(next); setErrors((e) => ({ ...e, district: undefined, block: undefined, gramPanchayat: undefined })); }} lockedDistrict={user?.district || null} errors={errors} idPrefix="dnss" />
            : <p className="text-sm text-slate-800">{d.gramPanchayat?.name}, {d.block?.name} block, {d.district} district</p>}
        </div>
      </section>

      <section className={card}>
        <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-base font-bold text-slate-900">Committee details</h2></header>
        {editable ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-5 py-5 md:grid-cols-3">
            <Field id="dn-groups" label="No. of groups"><CountInput id="dn-groups" value={form.groups} onChange={set('groups')} /></Field>
            <Field id="dn-male" label="Male members" required error={errors.members}><CountInput id="dn-male" value={form.male} onChange={set('male')} invalid={Boolean(errors.members)} /></Field>
            <Field id="dn-female" label="Female members" required><CountInput id="dn-female" value={form.female} onChange={set('female')} invalid={Boolean(errors.members)} /></Field>
            <div className="grid grid-cols-3 gap-3 md:col-span-3">
              {[['Total members', num(total)], ['% female', `${share(female, total)}%`], ['% male', `${share(male, total)}%`]].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-bold tabular-nums">{value}</p></div>
              ))}
            </div>
            <Field id="dn-chair" label="Gram Pradhan / Chairperson" required error={errors.chairperson}><input id="dn-chair" value={form.chairperson} maxLength={150} onChange={(e) => set('chairperson')(e.target.value)} className={inputClass(Boolean(errors.chairperson))} /></Field>
            <Field id="dn-phone" label="Contact number" required error={errors.contactNumber}><input id="dn-phone" inputMode="tel" value={form.contactNumber} maxLength={16} onChange={(e) => set('contactNumber')(e.target.value)} className={inputClass(Boolean(errors.contactNumber))} placeholder="10-digit mobile" /></Field>
            <Field id="dn-date" label="Date of DNSS formation" required error={errors.formationDate}><input id="dn-date" type="date" max={today()} value={form.formationDate} onChange={(e) => set('formationDate')(e.target.value)} className={inputClass(Boolean(errors.formationDate))} /></Field>
            <Field id="dn-remarks" label="Remarks" optional className="md:col-span-3"><textarea id="dn-remarks" rows={3} maxLength={2000} value={form.remarks} onChange={(e) => set('remarks')(e.target.value)} className={inputClass(false)} /></Field>
            <div className="flex flex-wrap gap-2 md:col-span-3">
              <ActionButton icon={Save} loading={saving} onClick={save}>{isNew ? 'Save and attach files' : 'Save'}</ActionButton>
              {!isNew && d?.permissions?.canDelete && <ActionButton variant="ghost" icon={Trash2} disabled={saving} onClick={remove}>Delete</ActionButton>}
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-5 text-sm md:grid-cols-4">
            {[['No. of groups', num(d.groups)], ['Total members', num(d.members.total)], ['Male', `${num(d.members.male)} (${d.members.malePercent}%)`], ['Female', `${num(d.members.female)} (${d.members.femalePercent}%)`], ['Gram Pradhan / Chairperson', d.chairperson], ['Contact number', d.contactNumber], ['Formed on', day(d.formationDate)]].map(([label, value]) => (
              <div key={label}><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-0.5 font-semibold text-slate-900">{value}</dd></div>
            ))}
            <div className="col-span-2 md:col-span-4"><dt className="text-xs font-medium text-slate-500">Remarks</dt><dd className="mt-0.5 whitespace-pre-line">{d.remarks || '—'}</dd></div>
          </dl>
        )}
      </section>

      {isNew ? <Notice tone="info">Save the details first, then attach the DNSS formation letter, photographs and minutes.</Notice> : (
        <section className={`${card} space-y-4 p-5`}>
          <h2 className="text-base font-bold text-slate-900">Documents</h2>
          <FileGroup title="DNSS formation letter" files={d.formationLetter} max={3} {...fileProps('formationLetter')} />
          <FileGroup title="Photographs of meeting" imagesOnly files={d.photographs} max={12} {...fileProps('photographs')} />
          <FileGroup title="Minutes of meeting" files={d.minutes} max={5} {...fileProps('minutes')} />
        </section>
      )}
    </div>
  );
}
