"use client";
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileText, Image as ImageIcon, Lock, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/constants/roles';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { AddMasterDialog } from '@/components/projects/create/AddMasterDialog';
import { ActionButton, Field, Notice, useMasterList } from '@/components/projects/create/parts';
import { createGramPanchayat, createVillage, fetchBlocks, fetchDistricts, fetchGramPanchayats, fetchVillages } from '@/lib/projectApi';
import { formatIndian } from '@/lib/numeric';

/** Shared pieces of the field forms (committees, DNSS, JSA, training). */

const BASES = {
  [USER_ROLES.SUPER_ADMIN]: '/dashboard/admin',
  [USER_ROLES.DD_LEVEL]: '/dashboard/dd',
  [USER_ROLES.PIA_OFFICER]: '/dashboard/officer',
  [USER_ROLES.MND_OFFICER]: '/dashboard/mnd',
  [USER_ROLES.MND_SUPER_ADMIN]: '/dashboard/mnd-admin',
};
/** Dashboard root of the signed-in role, e.g. "/dashboard/dd". */
export const useRoleBase = () => {
  const { user } = useAuth();
  return BASES[user?.role] || '/dashboard/admin';
};

export const num = (value, maxDecimals = 3) => formatIndian(Number(value) || 0, { maxDecimals });
export const day = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
export const moment = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
/** "yyyy-mm-dd" for a date input. */
export const inputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const STATUS_TONE = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'border-amber-200 bg-amber-100 text-amber-800',
  APPROVED: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  RETURNED: 'border-red-200 bg-red-50 text-red-700',
};
export function StatusPill({ status, label }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status] || STATUS_TONE.DRAFT}`}>{label || status}</span>;
}

export function PageHeader({ icon: Icon, title, subtitle, actions }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy" aria-hidden="true"><Icon className="h-5 w-5" /></span>}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export const linkButton = 'inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-navy-light hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:ring-offset-2';
export const card = 'rounded-xl border border-slate-200 bg-white shadow-sm';

/** Whole-number entry (people, structures, meetings). */
export function CountInput({ id, value, onChange, invalid, disabled, decimals = 0, placeholder = '0' }) {
  return (
    <input
      id={id}
      inputMode={decimals ? 'decimal' : 'numeric'}
      value={value ?? ''}
      disabled={disabled}
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      onChange={(event) => {
        const raw = event.target.value.replace(decimals ? /[^\d.]/g : /\D/g, '');
        if (!decimals) { onChange(raw.slice(0, 9)); return; }
        const [whole, ...rest] = raw.split('.');
        onChange(rest.length ? `${whole.slice(0, 9)}.${rest.join('').slice(0, decimals)}` : whole.slice(0, 9));
      }}
      className={`w-full rounded-lg border bg-white px-3 py-2 text-right text-sm tabular-nums text-slate-900 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${invalid ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-navy focus:ring-2 focus:ring-navy/20'}`}
    />
  );
}

// ─── Files ───────────────────────────────────────────────────────────────────

const size = (bytes) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`);

/**
 * One group of attachments (minutes, photographs, letters …). `onUpload(files)`
 * and `onRemove(file)` return promises; the group is read-only without them.
 */
export function FileGroup({ title, hint, files = [], imagesOnly = false, max, editable = false, onUpload, onRemove, required = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (work) => {
    setBusy(true);
    setError('');
    try { await work(); } catch (err) { setError(err?.message || 'Something went wrong. Please try again.'); } finally { setBusy(false); }
  };
  const choose = (event) => {
    const chosen = Array.from(event.target.files || []);
    event.target.value = '';
    if (chosen.length) run(() => onUpload(chosen));
  };
  const full = max && files.length >= max;
  return (
    <section className="rounded-lg border border-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>} <span className="font-normal text-slate-500">({files.length}{max ? ` of ${max}` : ''})</span></h3>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        {editable && (
          <>
            <input ref={inputRef} type="file" multiple className="sr-only" accept={imagesOnly ? 'image/jpeg,image/png,image/webp' : 'application/pdf,image/jpeg,image/png,image/webp'} onChange={choose} aria-label={`Choose ${title}`} />
            <ActionButton size="sm" variant="secondary" icon={Upload} loading={busy} disabled={full} disabledReason={`At most ${max} files`} onClick={() => inputRef.current?.click()}>Upload</ActionButton>
          </>
        )}
      </header>
      {error && <div className="px-4 pt-3"><Notice tone="error">{error}</Notice></div>}
      {files.length === 0
        ? <p className="px-4 py-4 text-sm text-slate-500">{editable ? (imagesOnly ? 'No photograph yet. JPG, PNG or WEBP, up to 10 MB each.' : 'Nothing attached yet. PDF or photographs, up to 10 MB each.') : 'Not attached.'}</p>
        : imagesOnly
          ? (
            <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {files.map((file) => (
                <li key={file.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3]" title={file.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.url} alt={file.name} loading="lazy" className="h-full w-full object-cover" />
                  </a>
                  <div className="flex items-center justify-between gap-1 px-2 py-1">
                    <span className="truncate text-[11px] text-slate-600">{file.name}</span>
                    {editable && <button type="button" onClick={() => window.confirm(`Remove ${file.name}?`) && run(() => onRemove(file))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300" aria-label={`Remove ${file.name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>}
                  </div>
                </li>
              ))}
            </ul>
          )
          : (
            <ul className="divide-y divide-slate-100">
              {files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 px-4 py-2.5">
                  {/pdf/.test(file.mimeType || '') ? <FileText className="h-4 w-4 flex-shrink-0 text-red-700" aria-hidden="true" /> : <ImageIcon className="h-4 w-4 flex-shrink-0 text-sky-700" aria-hidden="true" />}
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-navy hover:underline">{file.name}<ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" /></a>
                  <span className="hidden text-xs text-slate-500 sm:inline">{size(file.size)} · {file.uploadedBy || '—'} · {moment(file.uploadedAt)}</span>
                  {editable && <button type="button" onClick={() => window.confirm(`Remove ${file.name}?`) && run(() => onRemove(file))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300" aria-label={`Remove ${file.name}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>}
                </li>
              ))}
            </ul>
          )}
    </section>
  );
}

// ─── Location ────────────────────────────────────────────────────────────────

const DEPTHS = ['DISTRICT', 'BLOCK', 'GRAM_PANCHAYAT', 'VILLAGE'];

/**
 * District → Block → Gram Panchayat → Village, down to `depth`. With
 * `lockedDistrict` (a district name) the district is fixed to the user's own.
 * A missing Gram Panchayat or village can be added on the spot.
 * `value` = { district, block, gramPanchayat, village } of { id, name }.
 */
export function LocationPicker({ depth = 'VILLAGE', value, onChange, lockedDistrict = null, disabled = false, errors = {}, idPrefix = 'loc' }) {
  const level = DEPTHS.indexOf(depth);
  const { district, block, gramPanchayat, village } = value;
  const districts = useMasterList(fetchDistricts, 'districts');
  const blocks = useMasterList(() => fetchBlocks(district.id), level >= 1 && district ? district.id : null);
  const gps = useMasterList(() => fetchGramPanchayats(block.id), level >= 2 && block ? block.id : null);
  const villages = useMasterList(() => fetchVillages(gramPanchayat.id), level >= 3 && gramPanchayat ? gramPanchayat.id : null);
  const [addConfig, setAddConfig] = useState(null);

  // The district of a District / PIA user is their own.
  useEffect(() => {
    if (!lockedDistrict || district?.name === lockedDistrict) return;
    const own = districts.items.find((d) => d.name === lockedDistrict);
    if (own) onChange({ district: { id: own.id, name: own.name }, block: null, gramPanchayat: null, village: null });
  }, [lockedDistrict, districts.items]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, picked) => {
    const next = { ...value, [key]: picked ? { id: picked.id, name: picked.name } : null };
    const order = ['district', 'block', 'gramPanchayat', 'village'];
    order.slice(order.indexOf(key) + 1).forEach((k) => { next[k] = null; });
    onChange(next);
  };
  const openAdd = (kind, initialName) => {
    setAddConfig(kind === 'gramPanchayat'
      ? { noun: 'Gram Panchayat', level: 'gramPanchayat', initialName, context: [{ label: 'District', value: district?.name }, { label: 'Block', value: block?.name }], existing: gps.items, create: (name) => createGramPanchayat(block.id, name), reload: gps.reload }
      : { noun: 'Village', level: 'village', initialName, context: [{ label: 'District', value: district?.name }, { label: 'Block', value: block?.name }, { label: 'Gram Panchayat', value: gramPanchayat?.name }], existing: villages.items, create: (name) => createVillage(gramPanchayat.id, name), reload: villages.reload });
  };

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
      <Field id={`${idPrefix}-district`} label="District" required error={errors.district || (!districts.loading && districts.error) || ''}>
        <div className="relative">
          <SearchableSelect id={`${idPrefix}-district`} noun="district" value={district} options={districts.items} onChange={(v) => set('district', v)} placeholder="Select district" loading={districts.loading} error={districts.error} onRetry={districts.reload} disabled={disabled || Boolean(lockedDistrict)} clearable={!lockedDistrict} invalid={Boolean(errors.district)} />
          {lockedDistrict && <Lock className="pointer-events-none absolute right-9 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
        </div>
      </Field>
      {level >= 1 && (
        <Field id={`${idPrefix}-block`} label="Block" required error={errors.block}>
          <SearchableSelect id={`${idPrefix}-block`} noun="block" value={block} options={blocks.items} onChange={(v) => set('block', v)} placeholder="Select block" loading={blocks.loading} error={blocks.error} onRetry={blocks.reload} disabled={disabled || !district} disabledReason="Select a district first" invalid={Boolean(errors.block)} />
        </Field>
      )}
      {level >= 2 && (
        <Field id={`${idPrefix}-gp`} label="Gram Panchayat" required error={errors.gramPanchayat} hint="Not in the list? Type its name and choose “Add”.">
          <SearchableSelect id={`${idPrefix}-gp`} noun="Gram Panchayat" value={gramPanchayat} options={gps.items} onChange={(v) => set('gramPanchayat', v)} placeholder="Select Gram Panchayat" loading={gps.loading} error={gps.error} onRetry={gps.reload} disabled={disabled || !block} disabledReason="Select a block first" invalid={Boolean(errors.gramPanchayat)} onCreate={disabled ? undefined : (name) => openAdd('gramPanchayat', name)} />
        </Field>
      )}
      {level >= 3 && (
        <Field id={`${idPrefix}-village`} label="Village" required error={errors.village}>
          <SearchableSelect id={`${idPrefix}-village`} noun="village" value={village} options={villages.items} onChange={(v) => set('village', v)} placeholder="Select village" loading={villages.loading} error={villages.error} onRetry={villages.reload} disabled={disabled || !gramPanchayat} disabledReason="Select a Gram Panchayat first" invalid={Boolean(errors.village)} onCreate={disabled ? undefined : (name) => openAdd('village', name)} />
        </Field>
      )}
      <AddMasterDialog config={addConfig} onClose={() => setAddConfig(null)} onCreated={(record) => { addConfig.reload(); set(addConfig.level, record); }} />
    </div>
  );
}

/** Body fields of a place for the API. */
export const placeBody = (place) => ({
  districtId: place.district?.id || '',
  blockId: place.block?.id || '',
  gramPanchayatId: place.gramPanchayat?.id || '',
  villageId: place.village?.id || '',
});
export const emptyPlace = () => ({ district: null, block: null, gramPanchayat: null, village: null });
/** Missing parts of a place for the chosen depth, as field errors. */
export const placeErrors = (place, depth) => {
  const level = DEPTHS.indexOf(depth);
  const errors = {};
  if (!place.district) errors.district = 'Select the district.';
  if (level >= 1 && !place.block) errors.block = 'Select the block.';
  if (level >= 2 && !place.gramPanchayat) errors.gramPanchayat = 'Select the Gram Panchayat.';
  if (level >= 3 && !place.village) errors.village = 'Select the village.';
  return errors;
};
