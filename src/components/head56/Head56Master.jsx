"use client";
import React, { useEffect, useState } from 'react';
import { PencilLine, Plus } from 'lucide-react';
import { createH56Item, fetchH56Master, updateH56Item } from '@/lib/head56Api';
import { Dialog } from '@/components/ui/Dialog';
import { ActionButton, Field, Notice, RetryButton, Skeleton, inputClass } from '@/components/projects/create/parts';
import { LEVEL_LABELS, LevelPill } from './shared';

const EMPTY = { code: '', name: '', nameHindi: '', levels: ['HQ', 'DISTRICT', 'PIA'], hasPhysical: false, unit: '', allowsDecimal: false, isActive: true };

/**
 * Budget Head 56 master — sub-heads 56-01 … 56-09 and their items — kept
 * centrally by SARRA HQ (HQ Administrator or HQ Maker). Codes never change.
 */
export function Head56Master() {
  const [box, setBox] = useState({ data: null, loading: true, error: '', attempt: 0 });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetchH56Master(true)
      .then((data) => live && setBox((current) => ({ ...current, data, loading: false, error: '' })))
      .catch((err) => live && setBox((current) => ({ ...current, loading: false, error: err?.message })));
    return () => { live = false; };
  }, [box.attempt]);

  const open = (item) => { setEditing(item ? item.code : 'new'); setForm(item ? { ...EMPTY, ...item } : EMPTY); setError(''); };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleLevel = (level) => set('levels', form.levels.includes(level) ? form.levels.filter((l) => l !== level) : [...form.levels, level]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (editing === 'new') await createH56Item(form);
      else await updateH56Item(editing, form);
      setEditing(null);
      setBox((current) => ({ ...current, attempt: current.attempt + 1 }));
    } catch (err) {
      setError(err?.message || 'The line could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  if (box.loading) return <Skeleton className="h-96" />;
  if (box.error) return <Notice tone="error" title="Unable to load the master." action={<RetryButton onClick={() => setBox((current) => ({ ...current, attempt: current.attempt + 1, loading: true }))} />}>{box.error}</Notice>;
  const { items, canManage } = box.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sm text-slate-600">Sub-heads and items of Budget Head 56. A sub-head with items is a heading; its items are allocated and reported. <strong>Levels</strong> decide which units can be allocated a line; lines without a physical measure are never asked for physical targets.</p>
        {canManage && <ActionButton icon={Plus} onClick={() => open(null)}>Add Line</ActionButton>}
      </div>
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-2.5">Code</th>
              <th scope="col" className="px-3 py-2.5">Line</th>
              <th scope="col" className="px-3 py-2.5">Levels</th>
              <th scope="col" className="px-3 py-2.5">Physical measure</th>
              <th scope="col" className="px-3 py-2.5">Status</th>
              {canManage && <th scope="col" className="px-5 py-2.5 text-right"><span className="sr-only">Edit</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.code} className={`${!item.reportable ? 'bg-amber-50/60 font-semibold' : ''} ${!item.isActive ? 'text-slate-400' : ''}`}>
                <td className={`px-5 py-2.5 font-mono text-xs ${item.parentCode ? 'pl-9' : ''}`}>{item.code}</td>
                <td className="px-3 py-2.5">{item.name}{item.nameHindi && <span className="block text-xs font-normal text-slate-500">{item.nameHindi}</span>}</td>
                <td className="px-3 py-2.5"><span className="flex flex-wrap gap-1">{item.levels.map((level) => <LevelPill key={level} level={level} />)}</span></td>
                <td className="px-3 py-2.5 text-xs">{item.hasPhysical ? `${item.unit}${item.allowsDecimal ? ' (decimals allowed)' : ''}` : <span className="text-slate-400">Financial only</span>}</td>
                <td className="px-3 py-2.5 text-xs">{item.isActive ? (item.reportable ? 'Reportable' : 'Heading') : 'Retired'}</td>
                {canManage && <td className="px-5 py-2.5 text-right"><button type="button" onClick={() => open(item)} aria-label={`Edit ${item.code}`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"><PencilLine className="h-4 w-4" aria-hidden="true" /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Dialog
        open={Boolean(editing)}
        onClose={() => !busy && setEditing(null)}
        dismissible={!busy}
        title={editing === 'new' ? 'Add a Head 56 line' : `Edit ${editing}`}
        description={editing === 'new' ? 'Use 56-10 for a new sub-head, or 56-03(08) for an item under sub-head 56-03.' : 'The code cannot change. Existing reports keep the name they were filed with.'}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton loading={busy} onClick={save}>Save</ActionButton>
          </>
        )}
      >
        <div className="space-y-4">
          {editing === 'new' && (
            <Field id="m-code" label="Code" required><input id="m-code" value={form.code} onChange={(event) => set('code', event.target.value.trim())} placeholder="56-03(08)" className={inputClass(false)} /></Field>
          )}
          <Field id="m-name" label="Name (English)" required><input id="m-name" value={form.name} onChange={(event) => set('name', event.target.value)} maxLength={200} className={inputClass(false)} /></Field>
          <Field id="m-hindi" label="Name (Hindi)" optional><input id="m-hindi" value={form.nameHindi} onChange={(event) => set('nameHindi', event.target.value)} maxLength={200} className={inputClass(false)} /></Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Levels that can be allocated this line</legend>
            <div className="flex flex-wrap gap-4">
              {Object.entries(LEVEL_LABELS).map(([level, label]) => (
                <label key={level} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.levels.includes(level)} onChange={() => toggleLevel(level)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />{label}</label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.hasPhysical} onChange={(event) => set('hasPhysical', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />Has a physical target and progress</label>
          {form.hasPhysical && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="m-unit" label="Unit" required><input id="m-unit" value={form.unit} onChange={(event) => set('unit', event.target.value)} placeholder="Person-months, Programmes, Works…" maxLength={40} className={inputClass(false)} /></Field>
              <label className="flex items-center gap-2 pt-7 text-sm text-slate-700"><input type="checkbox" checked={form.allowsDecimal} onChange={(event) => set('allowsDecimal', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />Decimals allowed</label>
            </div>
          )}
          {editing !== 'new' && <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => set('isActive', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/40" />Active (untick to retire the line; reports that used it keep it)</label>}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Dialog>
    </div>
  );
}
