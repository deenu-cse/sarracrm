"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Droplets, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ActionButton, Field, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { FilterSelect } from '@/components/head56/shared';
import { addJsaProgress, createJsaReport, deleteJsaReport, fetchJsaReport, updateJsaReport } from '@/lib/formsApi';
import { JSA_ACTIVITIES, JSA_LEVELS, LevelTag, campaignYears } from './JsaHub';
import { CountInput, LocationPicker, PageHeader, card, day, emptyPlace, inputDate, moment, num, placeBody, placeErrors, today, useRoleBase } from './shared';

const emptyStatement = () => ({ asOnDate: today(), streams: '', otherDescription: '', remarks: '', activities: Object.fromEntries(JSA_ACTIVITIES.map((a) => [a.key, { target: '', progress: '' }])) });
const statementFrom = (s) => ({
  asOnDate: today(),
  streams: String(s.streams ?? ''),
  otherDescription: s.otherDescription || '',
  remarks: '',
  activities: Object.fromEntries(JSA_ACTIVITIES.map((a) => [a.key, { target: String(s.activities?.[a.key]?.target ?? ''), progress: String(s.activities?.[a.key]?.progress ?? '') }])),
});
const statementBody = (s) => ({
  asOnDate: s.asOnDate,
  streams: Number(s.streams) || 0,
  otherDescription: s.otherDescription,
  remarks: s.remarks,
  activities: Object.fromEntries(JSA_ACTIVITIES.map((a) => [a.key, { target: Number(s.activities[a.key].target) || 0, progress: Number(s.activities[a.key].progress) || 0 }])),
});
const dateError = (s) => {
  if (!s.asOnDate) return { asOnDate: 'Enter the date the progress is as on.' };
  if (s.asOnDate > today()) return { asOnDate: 'The date cannot be in the future.' };
  return {};
};
/** Activities whose progress is above the target: a warning, saved anyway on the second click. */
const overTarget = (s) => Object.fromEntries(JSA_ACTIVITIES
  .filter((a) => Number(s.activities[a.key].target) > 0 && Number(s.activities[a.key].progress) > Number(s.activities[a.key].target))
  .map((a) => [a.key, 'Progress is more than the target. Check the figures.']));

/** Targets and progress of every activity, as on one date. */
function StatementForm({ value, onChange, errors, previous }) {
  const setActivity = (key, field) => (v) => onChange({ ...value, activities: { ...value.activities, [key]: { ...value.activities[key], [field]: v } } });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3">
        <Field id="st-date" label="Progress as on (दिनांक)" required error={errors.asOnDate} hint={previous ? `Last statement: as on ${day(previous.asOnDate)}` : undefined}><input id="st-date" type="date" max={today()} min={previous ? inputDate(previous.asOnDate) : undefined} value={value.asOnDate} onChange={(e) => onChange({ ...value, asOnDate: e.target.value })} className={inputClass(Boolean(errors.asOnDate))} /></Field>
        <Field id="st-streams" label="Tributaries / streams identified for treatment" className="md:col-span-2"><CountInput id="st-streams" value={value.streams} onChange={(v) => onChange({ ...value, streams: v })} /></Field>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
            <tr><th scope="col" className="px-4 py-2">उपचार गतिविधि / Activity</th><th scope="col" className="w-40 px-3 py-2 text-right">लक्ष्य / Target</th><th scope="col" className="w-40 px-3 py-2 text-right">प्रगति / Progress</th>{previous && <th scope="col" className="w-36 px-4 py-2 text-right font-normal text-slate-500">Last week (T / P)</th>}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {JSA_ACTIVITIES.map((a) => (
              <tr key={a.key} className={errors[a.key] ? 'bg-amber-50/60' : ''}>
                <th scope="row" className="px-4 py-2 text-left font-medium text-slate-800">{a.nameHindi}<span className="block text-xs font-normal text-slate-500">{a.name} ({a.unit}){errors[a.key] && <span className="block text-amber-800">{errors[a.key]}</span>}</span></th>
                <td className="px-3 py-2"><CountInput id={`st-${a.key}-t`} decimals={a.decimals || 0} value={value.activities[a.key].target} onChange={setActivity(a.key, 'target')} /></td>
                <td className="px-3 py-2"><CountInput id={`st-${a.key}-p`} decimals={a.decimals || 0} value={value.activities[a.key].progress} onChange={setActivity(a.key, 'progress')} /></td>
                {previous && <td className="px-4 py-2 text-right text-xs tabular-nums text-slate-500">{num(previous.activities?.[a.key]?.target)} / {num(previous.activities?.[a.key]?.progress)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
        <Field id="st-other" label="“Other” activities — what they are" optional><input id="st-other" maxLength={500} value={value.otherDescription} onChange={(e) => onChange({ ...value, otherDescription: e.target.value })} className={inputClass(false)} placeholder="e.g. Gabion structures, chal-khal" /></Field>
        <Field id="st-remarks" label="Remarks" optional><input id="st-remarks" maxLength={1000} value={value.remarks} onChange={(e) => onChange({ ...value, remarks: e.target.value })} className={inputClass(false)} /></Field>
      </div>
      <p className="text-xs text-slate-500">Enter the total progress up to the date (cumulative), not only this week’s work. Saving again for the same date replaces that statement.</p>
    </div>
  );
}

/** One JSA report (a village, a block or a district) and its weekly statements. `id` "new" starts one. */
export function JsaReportView({ id }) {
  const router = useRouter();
  const params = useSearchParams();
  const base = useRoleBase();
  const { user } = useAuth();
  const isNew = id === 'new';
  const [box, setBox] = useState({ data: null, loading: !isNew, error: '' });
  const [level, setLevel] = useState('VILLAGE');
  const [campaign, setCampaign] = useState(params.get('campaign') || String(new Date().getFullYear()));
  const [place, setPlace] = useState(emptyPlace());
  const [streamNames, setStreamNames] = useState('');
  const [statement, setStatement] = useState(emptyStatement());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ tone: '', text: '', id: null });
  const [warned, setWarned] = useState(false);

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const data = await fetchJsaReport(id);
      setBox({ data, loading: false, error: '' });
      setStreamNames(data.streamNames || '');
      setStatement(data.latest ? statementFrom(data.latest) : emptyStatement());
    } catch (err) {
      setBox({ data: null, loading: false, error: err?.message || 'Unable to load the report.' });
    }
  }, [id, isNew]);
  useEffect(() => { load(); }, [load]);

  const rep = box.data;
  const canEdit = rep?.permissions?.canEdit;

  /** Hard errors stop; figures above target are shown once and saved on the next click. */
  const ready = (hard) => {
    if (Object.keys(hard).length) { setErrors(hard); return false; }
    const soft = overTarget(statement);
    if (Object.keys(soft).length && !warned) { setErrors(soft); setWarned(true); return false; }
    setErrors({});
    setWarned(false);
    return true;
  };
  const create = async () => {
    if (!ready({ ...placeErrors(place, level), ...dateError(statement) })) return;
    setSaving(true);
    setMessage({ tone: '', text: '', id: null });
    try {
      const created = await createJsaReport({ level, campaign: Number(campaign), ...placeBody(place), streamNames, ...statementBody(statement) });
      router.replace(`${base}/jsa/report/${created.id}`);
    } catch (err) {
      setMessage({ tone: 'error', text: err?.message || 'The report could not be created.', id: err?.data?.id || null });
      setSaving(false);
    }
  };
  const addProgress = async () => {
    if (!ready(dateError(statement))) return;
    setSaving(true);
    setMessage({ tone: '', text: '', id: null });
    try {
      await addJsaProgress(id, { ...statementBody(statement), streamNames });
      await load();
      setMessage({ tone: 'success', text: `Progress as on ${day(statement.asOnDate)} saved.` });
    } catch (err) {
      setMessage({ tone: 'error', text: err?.message || 'The progress could not be saved.' });
    } finally {
      setSaving(false);
    }
  };
  const saveNames = async () => {
    setSaving(true);
    try { await updateJsaReport(id, { streamNames }); await load(); setMessage({ tone: 'success', text: 'Saved.' }); } catch (err) { setMessage({ tone: 'error', text: err?.message }); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this report and all its weekly statements?')) return;
    setSaving(true);
    try { await deleteJsaReport(id); router.replace(`${base}/jsa?tab=reports`); } catch (err) { setMessage({ tone: 'error', text: err?.message }); setSaving(false); }
  };

  if (box.loading) return <div className="mx-auto max-w-5xl space-y-4 p-6"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>;
  if (box.error) return <div className="mx-auto max-w-5xl p-6"><Notice tone="error" title="Unable to open the report." action={<RetryButton onClick={load} />}>{box.error}</Notice></div>;

  const warnings = Object.keys(errors).filter((k) => k !== 'asOnDate' && !['district', 'block', 'gramPanchayat', 'village'].includes(k));
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href={`${base}/jsa?tab=reports`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy"><ArrowLeft className="h-4 w-4" aria-hidden="true" />JSA reports</Link>
      <PageHeader
        icon={Droplets}
        title={isNew ? 'New JSA progress report' : rep.placeName}
        subtitle={isNew ? 'Jal Sanrakshan Abhiyan — one report per village, block or district for the campaign; progress is added every week.' : `JSA ${rep.campaign} · ${rep.district} · ${rep.statements} weekly statement${rep.statements === 1 ? '' : 's'}`}
        actions={!isNew && <LevelTag level={rep.level} />}
      />
      {message.text && <Notice tone={message.tone || 'info'} action={message.id ? <Link href={`${base}/jsa/report/${message.id}`} className="text-sm font-semibold text-navy underline">Open it</Link> : null}>{message.text}</Notice>}

      {isNew && (
        <section className={card}>
          <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-base font-bold text-slate-900">Report of</h2></header>
          <div className="space-y-4 px-5 py-5">
            <div className="flex flex-wrap items-end gap-4">
              <FilterSelect id="jn-campaign" label="Campaign year" value={campaign} onChange={setCampaign} options={campaignYears()} />
              <fieldset>
                <legend className="mb-1 text-xs font-medium text-slate-500">Type of report</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JSA_LEVELS).map(([key, label]) => (
                    <label key={key} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium ${level === key ? 'border-navy bg-navy/5 text-navy' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                      <input type="radio" name="jn-level" value={key} checked={level === key} onChange={() => { setLevel(key); setErrors({}); }} className="sr-only" />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <LocationPicker depth={level} value={place} onChange={setPlace} lockedDistrict={user?.district || null} errors={errors} idPrefix="jn" />
            <Field id="jn-streams" label="Names of the tributaries / streams" optional><textarea id="jn-streams" rows={2} maxLength={1000} value={streamNames} onChange={(e) => setStreamNames(e.target.value)} className={inputClass(false)} placeholder="e.g. Kosi gadhera, Suyal" /></Field>
          </div>
        </section>
      )}

      {!isNew && (
        <section className={card}>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
            <h2 className="text-base font-bold text-slate-900">Tributaries / streams</h2>
            {canEdit && <ActionButton size="sm" variant="ghost" icon={Trash2} disabled={saving} onClick={remove}>Delete report</ActionButton>}
          </header>
          <div className="px-5 py-4">
            {canEdit ? (
              <div className="flex flex-wrap items-end gap-3">
                <textarea aria-label="Names of the tributaries / streams" rows={2} maxLength={1000} value={streamNames} onChange={(e) => setStreamNames(e.target.value)} className={`${inputClass(false)} min-w-[16rem] flex-1`} placeholder="Names of the tributaries / streams" />
                <ActionButton size="sm" variant="secondary" loading={saving} onClick={saveNames}>Save names</ActionButton>
              </div>
            ) : <p className="text-sm text-slate-800">{rep.streamNames || '—'}</p>}
          </div>
        </section>
      )}

      {(isNew || canEdit) && (
        <section className={card}>
          <header className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-base font-bold text-slate-900">{isNew ? 'First progress statement' : 'This week’s progress'}</h2>
            <p className="text-xs text-slate-500">{isNew ? 'Targets and progress so far. You can add the progress later as well.' : 'The figures of the last statement are filled in; change what has moved and save.'}</p>
          </header>
          <div className="px-5 py-5">
            <StatementForm value={statement} onChange={(v) => { setStatement(v); setErrors({}); setWarned(false); }} errors={errors} previous={isNew ? null : rep.latest} />
            {warned && warnings.length > 0 && <div className="mt-3"><Notice tone="warning">Progress is more than the target for {warnings.length} activit{warnings.length === 1 ? 'y' : 'ies'}. Check the highlighted rows, or save again to keep the figures.</Notice></div>}
            <div className="mt-4">
              <ActionButton icon={Save} loading={saving} onClick={isNew ? create : addProgress}>{isNew ? 'Create report' : 'Save progress'}</ActionButton>
            </div>
          </div>
        </section>
      )}

      {!isNew && (
        <section className={card}>
          <header className="border-b border-slate-100 px-5 py-3"><h2 className="text-base font-bold text-slate-900">Weekly statements</h2></header>
          {rep.history.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" rowSpan={2} className="border border-slate-200 px-2 py-2 text-left">As on</th>
                    <th scope="col" rowSpan={2} className="border border-slate-200 px-2 py-2">Streams</th>
                    {JSA_ACTIVITIES.map((a) => <th key={a.key} scope="colgroup" colSpan={2} className="border border-slate-200 px-2 py-1.5">{a.name}</th>)}
                    <th scope="col" rowSpan={2} className="border border-slate-200 px-2 py-2 text-left">Entered by</th>
                  </tr>
                  <tr>{JSA_ACTIVITIES.map((a) => <React.Fragment key={a.key}><th scope="col" className="border border-slate-200 px-1 py-1 font-medium">T</th><th scope="col" className="border border-slate-200 px-1 py-1 font-medium">P</th></React.Fragment>)}</tr>
                </thead>
                <tbody>
                  {rep.history.map((s, i) => (
                    <tr key={`${s.asOnDate}-${i}`} className={i === 0 ? 'bg-emerald-50/50 font-semibold' : ''}>
                      <th scope="row" className="border border-slate-200 px-2 py-1.5 text-left">{day(s.asOnDate)}</th>
                      <td className="border border-slate-200 px-2 py-1.5 text-right tabular-nums">{num(s.streams)}</td>
                      {JSA_ACTIVITIES.map((a) => <React.Fragment key={a.key}><td className="border border-slate-200 px-1 py-1.5 text-right tabular-nums">{num(s.activities?.[a.key]?.target)}</td><td className="border border-slate-200 px-1 py-1.5 text-right tabular-nums">{num(s.activities?.[a.key]?.progress)}</td></React.Fragment>)}
                      <td className="border border-slate-200 px-2 py-1.5 font-normal text-slate-600">{s.by || '—'}<span className="block text-[11px] text-slate-500">{moment(s.at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="px-5 py-8 text-center text-sm text-slate-500">No progress has been entered yet.</p>}
        </section>
      )}
    </div>
  );
}
