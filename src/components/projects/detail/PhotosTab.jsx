"use client";
import React, { useMemo, useRef, useState } from 'react';
import { BadgeCheck, Camera, ImagePlus, LocateFixed, MapPin, Trash2, X, XCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { deleteProjectPhoto, fetchProjectPhotos, uploadProjectPhotos, verifyProjectPhoto } from '@/lib/lifecycleApi';
import { ActionButton, Field, FieldError, Notice, RetryButton, Skeleton, inputClass, useMasterList } from '@/components/projects/create/parts';
import { EmptyNote, Panel, StatTile, formatMoment } from './shared';

const STAGES = [
  { value: 'PRE', label: 'Pre-intervention', short: 'Pre', cls: 'bg-sky-100 text-sky-800' },
  { value: 'MID', label: 'Mid-intervention', short: 'Mid', cls: 'bg-amber-100 text-amber-800' },
  { value: 'POST', label: 'Post-intervention', short: 'Post', cls: 'bg-emerald-100 text-emerald-800' },
];
const STAGE = Object.fromEntries(STAGES.map((stage) => [stage.value, stage]));
const VERIFY = {
  PENDING: { label: 'Awaiting verification', cls: 'border-slate-200 bg-slate-50 text-slate-600' },
  VERIFIED: { label: 'Verified', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  REJECTED: { label: 'Rejected', cls: 'border-red-200 bg-red-50 text-red-800' },
};
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

const localNow = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const mapLink = (gps) => `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`;

/** Upload photographs of one activity, with stage, capture time and GPS. */
function UploadDialog({ open, project, departments, maxPerUpload, onClose, onDone }) {
  const uploadable = departments.filter((d) => d.canUpload);
  const [form, setForm] = useState({ departmentId: '', activityCode: '', stage: 'PRE', capturedAt: localNow(), latitude: '', longitude: '', accuracy: '', physicalProgress: '' });
  const [items, setItems] = useState([]);
  const [attempted, setAttempted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);

  React.useEffect(() => {
    if (!open) return;
    setForm({ departmentId: uploadable.length === 1 ? uploadable[0].departmentId : '', activityCode: '', stage: 'PRE', capturedAt: localNow(), latitude: '', longitude: '', accuracy: '', physicalProgress: '' });
    setItems([]); setAttempted(false); setError('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const department = uploadable.find((d) => d.departmentId === form.departmentId);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const errors = {
    departmentId: !form.departmentId ? 'Select the department.' : '',
    activityCode: !form.activityCode ? 'Select the activity.' : '',
    capturedAt: !form.capturedAt ? 'Enter when the photograph was taken.' : new Date(form.capturedAt) > new Date() ? 'The capture time cannot be in the future.' : '',
    gps: (form.latitude === '') !== (form.longitude === '') ? 'Give both latitude and longitude, or neither.' : '',
    files: !items.length ? 'Choose at least one photograph.' : '',
  };
  const invalid = Object.values(errors).some(Boolean);

  const pick = (event) => {
    const chosen = [...(event.target.files || [])];
    event.target.value = '';
    const bad = chosen.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_BYTES);
    if (bad) { setError(`${bad.name}: upload a JPG, PNG or WEBP photograph of at most 10 MB.`); return; }
    setError('');
    setItems((current) => [...current, ...chosen.map((file) => ({ file, caption: '' }))].slice(0, maxPerUpload));
  };

  const locate = () => {
    if (!navigator.geolocation) { setError('This browser cannot read the location. Enter the coordinates.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({ ...current, latitude: position.coords.latitude.toFixed(6), longitude: position.coords.longitude.toFixed(6), accuracy: String(Math.round(position.coords.accuracy || 0)) }));
        setLocating(false);
      },
      () => { setError('The location could not be read. Allow location access or enter the coordinates.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const submit = async () => {
    setAttempted(true);
    if (invalid || busy) return;
    setBusy(true);
    setError('');
    try {
      await uploadProjectPhotos(project._id, { ...form, capturedAt: new Date(form.capturedAt).toISOString(), source: 'PORTAL' }, items);
      onClose();
      await onDone(`${items.length} photograph${items.length === 1 ? '' : 's'} uploaded for verification.`);
    } catch (err) {
      setError(err?.message || 'The photographs could not be uploaded. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      title="Upload field photographs"
      description="Photographs are linked to the Project ID and the activity's approved target, with the capture time and GPS location."
      size="lg"
      dismissible={!busy}
      footer={(
        <>
          <ActionButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton icon={ImagePlus} loading={busy} onClick={submit}>{busy ? 'Uploading…' : `Upload ${items.length || ''} Photograph${items.length === 1 ? '' : 's'}`.replace('  ', ' ')}</ActionButton>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="photo-department" label="Department" required error={attempted ? errors.departmentId : ''}>
            <select id="photo-department" value={form.departmentId} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, departmentId: event.target.value, activityCode: '' }))} className={inputClass(Boolean(attempted && errors.departmentId))}>
              <option value="">Select department</option>
              {uploadable.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
            </select>
          </Field>
          <Field id="photo-activity" label="Activity" required error={attempted ? errors.activityCode : ''}>
            <select id="photo-activity" value={form.activityCode} disabled={busy || !department} onChange={(event) => set('activityCode', event.target.value)} className={inputClass(Boolean(attempted && errors.activityCode))}>
              <option value="">{department ? 'Select activity' : 'Select the department first'}</option>
              {(department?.activities || []).map((a) => <option key={a.activityCode} value={a.activityCode}>{a.activityName}{a.physicalTarget ? ` (target ${a.physicalTarget} ${a.unit})` : ''}</option>)}
            </select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Stage <span className="text-red-600" aria-hidden="true">*</span></legend>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <label key={stage.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${form.stage === stage.value ? 'border-navy bg-navy/5 text-navy' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <input type="radio" name="photo-stage" value={stage.value} checked={form.stage === stage.value} disabled={busy} onChange={() => set('stage', stage.value)} className="sr-only" />
                {stage.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="photo-captured" label="Captured on" required error={attempted ? errors.capturedAt : ''}>
            <input id="photo-captured" type="datetime-local" max={localNow()} value={form.capturedAt} disabled={busy} onChange={(event) => set('capturedAt', event.target.value)} className={inputClass(Boolean(attempted && errors.capturedAt))} />
          </Field>
          <Field id="photo-lat" label="Latitude" optional error={attempted ? errors.gps : ''}>
            <input id="photo-lat" inputMode="decimal" value={form.latitude} disabled={busy} onChange={(event) => set('latitude', event.target.value.replace(/[^0-9.-]/g, ''))} placeholder="e.g. 29.597000" className={inputClass(Boolean(attempted && errors.gps))} />
          </Field>
          <Field id="photo-lng" label="Longitude" optional>
            <input id="photo-lng" inputMode="decimal" value={form.longitude} disabled={busy} onChange={(event) => set('longitude', event.target.value.replace(/[^0-9.-]/g, ''))} placeholder="e.g. 79.659000" className={inputClass(false)} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton variant="secondary" size="sm" icon={LocateFixed} loading={locating} onClick={locate} disabled={busy}>Use my current location</ActionButton>
          {form.accuracy && <span className="text-xs text-slate-500">Accuracy about {form.accuracy} m</span>}
        </div>
        <Field id="photo-progress" label="Physical progress at the time (optional)" hint={department && form.activityCode ? `Unit: ${department.activities.find((a) => a.activityCode === form.activityCode)?.unit || '—'}` : undefined}>
          <input id="photo-progress" inputMode="decimal" value={form.physicalProgress} disabled={busy} onChange={(event) => set('physicalProgress', event.target.value.replace(/[^0-9.]/g, ''))} className={`${inputClass(false)} sm:max-w-xs`} />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Photographs <span className="text-red-600" aria-hidden="true">*</span> <span className="text-xs font-normal text-slate-400">(up to {maxPerUpload}, JPG / PNG / WEBP, 10 MB each)</span></p>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={pick} disabled={busy} tabIndex={-1} aria-label="Choose photographs" />
          {items.length < maxPerUpload && (
            <button type="button" onClick={() => input.current?.click()} disabled={busy}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 ${attempted && errors.files ? 'border-red-400 text-red-700' : 'border-slate-300 text-slate-700 hover:border-navy hover:bg-navy/[0.03]'}`}>
              <Camera className="h-4 w-4" aria-hidden="true" /> Choose photographs
            </button>
          )}
          <FieldError message={attempted ? errors.files : ''} />
          {items.length > 0 && (
            <ul className="mt-2 space-y-2">
              {items.map((item, index) => (
                <li key={`${item.file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{item.file.name}</span>
                  <input aria-label={`Caption for ${item.file.name}`} value={item.caption} maxLength={300} disabled={busy} placeholder="Caption (optional)"
                    onChange={(event) => setItems((current) => current.map((entry, i) => (i === index ? { ...entry, caption: event.target.value } : entry)))}
                    className="w-48 rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40" />
                  <button type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} disabled={busy} aria-label={`Remove ${item.file.name}`} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"><X className="h-4 w-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}

function PhotoCard({ photo, onVerify, onDelete }) {
  const stage = STAGE[photo.stage];
  const status = VERIFY[photo.verification.status] || VERIFY.PENDING;
  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption || `${stage?.label || ''} photograph of ${photo.activityName}`} loading="lazy" className="h-40 w-full object-cover" />
      </a>
      <div className="space-y-1.5 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 font-semibold ${stage?.cls || 'bg-slate-100 text-slate-700'}`}>{stage?.short || photo.stage}</span>
          <span className={`rounded border px-1.5 py-0.5 font-semibold ${status.cls}`}>{status.label}</span>
          {photo.source === 'MOBILE' && <span className="rounded bg-violet-50 px-1.5 py-0.5 font-semibold text-violet-800">M&amp;E app</span>}
        </div>
        {photo.caption && <p className="text-sm text-slate-800">{photo.caption}</p>}
        <p className="text-slate-600">Captured {formatMoment(photo.capturedAt, true)}</p>
        {photo.gps ? (
          <a href={mapLink(photo.gps)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-navy hover:underline">
            <MapPin className="h-3 w-3" aria-hidden="true" /> {photo.gps.latitude}, {photo.gps.longitude}{photo.gps.accuracy ? ` (±${photo.gps.accuracy} m)` : ''}
          </a>
        ) : <p className="text-amber-700">No GPS coordinates</p>}
        {photo.physicalProgress !== null && <p className="text-slate-600">Progress recorded: {photo.physicalProgress} {photo.unit}</p>}
        <p className="text-slate-400">By {photo.uploadedBy || '—'}{photo.uploadedByRole ? ` (${photo.uploadedByRole})` : ''}</p>
        {photo.verification.by && <p className="text-slate-500">{status.label} by {photo.verification.by}{photo.verification.role ? ` (${photo.verification.role})` : ''}{photo.verification.remarks ? `: “${photo.verification.remarks}”` : ''}</p>}
        {(photo.canVerify || photo.canDelete) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {photo.canVerify && photo.verification.status !== 'VERIFIED' && <ActionButton variant="success" size="sm" icon={BadgeCheck} onClick={() => onVerify(photo, 'VERIFIED')}>Verify</ActionButton>}
            {photo.canVerify && photo.verification.status !== 'REJECTED' && <ActionButton variant="secondary" size="sm" icon={XCircle} onClick={() => onVerify(photo, 'REJECTED')}>Reject</ActionButton>}
            {photo.canDelete && <ActionButton variant="secondary" size="sm" icon={Trash2} onClick={() => onDelete(photo)}>Remove</ActionButton>}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Field photographs of the project, chronologically for each activity:
 * pre-, mid- and post-intervention, from the portal or the M&E mobile app.
 */
export function PhotosTab({ project }) {
  const box = useMasterList(async () => [await fetchProjectPhotos(project._id)], `photos:${project._id}`);
  const state = box.items[0];
  const [filters, setFilters] = useState({ departmentId: '', activityCode: '', stage: '' });
  const [uploading, setUploading] = useState(false);
  const [review, setReview] = useState(null); // { photo, status }
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const groups = useMemo(() => {
    const list = (state?.photos || []).filter((p) => (!filters.departmentId || p.departmentId === filters.departmentId)
      && (!filters.activityCode || p.activityCode === filters.activityCode) && (!filters.stage || p.stage === filters.stage));
    const byActivity = new Map();
    list.forEach((photo) => {
      const key = `${photo.departmentId}|${photo.activityCode}`;
      if (!byActivity.has(key)) byActivity.set(key, { key, departmentName: photo.departmentName, activityName: photo.activityName, physicalTarget: photo.physicalTarget, unit: photo.unit, photos: [] });
      byActivity.get(key).photos.push(photo);
    });
    return [...byActivity.values()];
  }, [state, filters]);

  if (!(project.departmentAllocations || []).length) return <EmptyNote>Photographs are taken per department activity. This project has no departments.</EmptyNote>;
  if (!state && !box.error) return <div className="space-y-3" role="status" aria-label="Loading photographs"><Skeleton className="h-24" /><Skeleton className="h-56" /></div>;
  if (box.error || !state) return <Notice tone="error" title="Unable to load the photographs." action={<RetryButton onClick={box.reload} />}>{box.error}</Notice>;

  const canUpload = state.departments.some((d) => d.canUpload);
  const department = state.departments.find((d) => d.departmentId === filters.departmentId);
  const activities = department ? department.activities : state.departments.flatMap((d) => d.activities);

  const finish = async (message) => { setDone(message); box.reload(); };
  const confirmReview = async () => {
    if (busy) return;
    if (review.status === 'REJECTED' && remarks.replace(/\s+/g, ' ').trim().length < 5) { setError('Write why the photograph is rejected.'); return; }
    setBusy(true); setError('');
    try {
      await verifyProjectPhoto(project._id, review.photo.id, review.status, remarks.replace(/\s+/g, ' ').trim());
      setReview(null);
      await finish(review.status === 'VERIFIED' ? 'Photograph verified.' : 'Photograph rejected.');
    } catch (err) {
      setError(err?.message || 'The photograph could not be updated. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (photo) => {
    try { await deleteProjectPhoto(project._id, photo.id); await finish('Photograph removed.'); } catch (err) { setDone(''); setError(err?.message || 'The photograph could not be removed.'); }
  };

  return (
    <div className="space-y-5">
      {done && <Notice tone="success">{done}</Notice>}
      {!review && error && <Notice tone="error">{error}</Notice>}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Photographs" value={String(state.summary.total)} />
        {STAGES.map((stage) => <StatTile key={stage.value} label={stage.label} value={String(state.summary.byStage[stage.value] || 0)} />)}
        <StatTile label="Awaiting verification" value={String(state.summary.pendingVerification)} tone={state.summary.pendingVerification ? 'warning' : 'default'} sub={`${state.summary.verified} verified`} />
      </dl>

      <Panel
        title="Field Photographs"
        description="Pre-, mid- and post-intervention photographs of each activity, oldest first, with GPS and capture time."
        aside={canUpload && <ActionButton size="sm" icon={ImagePlus} onClick={() => { setDone(''); setUploading(true); }}>Upload Photographs</ActionButton>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select aria-label="Filter by department" value={filters.departmentId} onChange={(event) => setFilters({ ...filters, departmentId: event.target.value, activityCode: '' })} className={inputClass(false)}>
            <option value="">All departments</option>
            {state.departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
          </select>
          <select aria-label="Filter by activity" value={filters.activityCode} onChange={(event) => setFilters({ ...filters, activityCode: event.target.value })} className={inputClass(false)}>
            <option value="">All activities</option>
            {[...new Map(activities.map((a) => [a.activityCode, a])).values()].map((a) => <option key={a.activityCode} value={a.activityCode}>{a.activityName}</option>)}
          </select>
          <select aria-label="Filter by stage" value={filters.stage} onChange={(event) => setFilters({ ...filters, stage: event.target.value })} className={inputClass(false)}>
            <option value="">All stages</option>
            {STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
          </select>
        </div>

        {groups.length === 0 ? (
          <EmptyNote>{state.summary.total ? 'No photograph matches these filters.' : 'No photograph has been uploaded for this project yet.'}</EmptyNote>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.key} aria-label={`${group.activityName} — ${group.departmentName}`}>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  {group.activityName}
                  <span className="ml-2 text-xs font-normal text-slate-500">{group.departmentName}{group.physicalTarget ? ` · approved target ${group.physicalTarget} ${group.unit}` : ''}</span>
                </h3>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {group.photos.map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} onVerify={(p, status) => { setError(''); setRemarks(''); setReview({ photo: p, status }); }} onDelete={remove} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Panel>

      <UploadDialog open={uploading} project={project} departments={state.departments} maxPerUpload={state.maxPerUpload || 6} onClose={() => setUploading(false)} onDone={finish} />

      <Dialog
        open={Boolean(review)}
        onClose={() => { if (!busy) setReview(null); }}
        title={review?.status === 'VERIFIED' ? 'Verify this photograph?' : 'Reject this photograph?'}
        description={review?.status === 'VERIFIED' ? 'Confirms the photograph shows the reported work at this site.' : 'The uploader sees your reason.'}
        size="md"
        dismissible={!busy}
        footer={review && (
          <>
            <ActionButton variant="secondary" onClick={() => setReview(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton variant={review.status === 'VERIFIED' ? 'success' : 'primary'} loading={busy} onClick={confirmReview}>{busy ? 'Saving…' : review.status === 'VERIFIED' ? 'Verify' : 'Reject'}</ActionButton>
          </>
        )}
      >
        {review && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">{review.photo.activityName} · {STAGE[review.photo.stage]?.label} · {formatMoment(review.photo.capturedAt, true)}</p>
            <label htmlFor="photo-remarks" className="block text-sm font-medium text-slate-700">Remarks {review.status === 'REJECTED' ? <span className="text-red-600" aria-hidden="true">*</span> : <span className="text-xs font-normal text-slate-400">(optional)</span>}</label>
            <textarea id="photo-remarks" rows={3} maxLength={500} value={remarks} disabled={busy} onChange={(event) => setRemarks(event.target.value)} className={`${inputClass(false)} resize-none`} />
            {error && <Notice tone="error">{error}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
