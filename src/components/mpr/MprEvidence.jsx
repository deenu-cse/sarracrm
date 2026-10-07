"use client";
import React, { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, ImagePlus, Trash2, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { addMprEvidence, downloadMprExcel, downloadMprPdf, removeMprEvidence } from '@/lib/lifecycleApi';
import { ActionButton, Notice, inputClass } from '@/components/projects/create/parts';

export const MAX_EVIDENCE = 6;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024;
const size = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`);

/**
 * Choose optional supporting files (photographs, measurement sheets) with a
 * caption each. `items` = [{ key, file, caption, preview }]. Nothing is
 * uploaded here; the caller sends them once the report itself is saved.
 */
export function EvidencePicker({ items, onChange, room = MAX_EVIDENCE, disabled = false }) {
  const input = useRef(null);
  const [problem, setProblem] = useState('');
  const itemsRef = useRef(items);
  itemsRef.current = items;
  // Release the preview URLs when the picker goes away.
  useEffect(() => () => { itemsRef.current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview)); }, []);

  const add = (fileList) => {
    const chosen = Array.from(fileList || []);
    const accepted = [];
    let message = '';
    chosen.forEach((file) => {
      if (!TYPES.includes(file.type)) message = `${file.name}: upload photographs (JPG, PNG, WEBP) or PDF files.`;
      else if (file.size > MAX_BYTES) message = `${file.name}: the file is too large. Maximum size is 10 MB.`;
      else if (items.length + accepted.length >= room) message = `Only ${room} file${room === 1 ? '' : 's'} can be attached.`;
      else accepted.push({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`, file, caption: '', preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '' });
    });
    setProblem(message);
    if (accepted.length) onChange([...items, ...accepted]);
  };
  const remove = (key) => {
    const item = items.find((entry) => entry.key === key);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    setProblem('');
    onChange(items.filter((entry) => entry.key !== key));
  };

  return (
    <div>
      <input ref={input} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only" aria-label="Evidence files" disabled={disabled}
        onChange={(event) => { add(event.target.files); event.target.value = ''; }} />
      {items.length > 0 && (
        <ul className="mb-3 space-y-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
              {item.preview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.preview} alt="" className="h-12 w-12 flex-shrink-0 rounded-md object-cover" />
                : <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500" aria-hidden="true"><FileText className="h-5 w-5" /></span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{item.file.name} <span className="font-normal text-slate-500">({size(item.file.size)})</span></p>
                <input type="text" maxLength={200} value={item.caption} disabled={disabled} placeholder="Caption (optional), e.g. Contour trenches on the upper slope" aria-label={`Caption for ${item.file.name}`}
                  onChange={(event) => onChange(items.map((entry) => (entry.key === item.key ? { ...entry, caption: event.target.value } : entry)))}
                  className={`${inputClass(false)} mt-1 !py-1.5 text-xs`} />
              </div>
              <button type="button" onClick={() => remove(item.key)} disabled={disabled} aria-label={`Remove ${item.file.name}`} className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length < room && (
        <button type="button" onClick={() => input.current?.click()} disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-navy/50 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-60">
          <ImagePlus className="h-4 w-4" aria-hidden="true" /> {items.length ? 'Add more files' : 'Add photographs or PDF'}
        </button>
      )}
      <p className="mt-1.5 text-xs text-slate-500">Optional. Up to {room} file{room === 1 ? '' : 's'}, 10 MB each (JPG, PNG, WEBP, PDF).</p>
      {problem && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{problem}</p>}
    </div>
  );
}

/** Evidence attached to a filed report; the reporting officer can add or remove files until the district approves it. */
export function MprEvidence({ report, onChanged }) {
  const [picking, setPicking] = useState(false);
  const [items, setItems] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const evidence = report.evidence || [];
  const canManage = Boolean(report.permissions?.canManageEvidence);
  const limit = report.evidenceLimit || MAX_EVIDENCE;
  const room = limit - evidence.length;

  if (!evidence.length && !canManage) return null;

  const run = async (work) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await work();
      setPicking(false); setItems([]); setRemoving(null);
      await onChanged?.();
    } catch (err) {
      setError(err?.message || 'This action could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm print:hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Evidence <span className="font-normal text-slate-500">({evidence.length})</span></h2>
          <p className="mt-0.5 text-xs text-slate-500">{canManage ? 'Optional photographs and measurement sheets. They can be changed until the district approves the report.' : 'Photographs and documents attached by the PIA officer.'}</p>
        </div>
        {canManage && room > 0 && <ActionButton size="sm" variant="secondary" icon={ImagePlus} onClick={() => { setItems([]); setError(''); setPicking(true); }}>Add Files</ActionButton>}
      </header>
      <div className="p-5">
        {evidence.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-sm text-slate-500">No evidence attached. This is optional.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {evidence.map((item) => (
              <li key={item.id} className="group relative">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 transition-[border-color,box-shadow] hover:border-navy/40 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                  {item.isImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.url} alt={item.caption || item.name} loading="lazy" className="h-28 w-full bg-slate-100 object-cover" />
                    : <span className="flex h-28 w-full items-center justify-center bg-slate-100 text-slate-500"><FileText className="h-8 w-8" aria-hidden="true" /></span>}
                  <span className="block px-2 py-1.5">
                    <span className="block truncate text-xs font-semibold text-slate-800">{item.caption || item.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">{item.isImage ? 'Photograph' : 'PDF'}{item.size ? ` · ${size(item.size)}` : ''}</span>
                  </span>
                </a>
                {canManage && (
                  <button type="button" onClick={() => { setError(''); setRemoving(item); }} aria-label={`Remove ${item.caption || item.name}`}
                    className="absolute right-1.5 top-1.5 rounded-md bg-white/95 p-1 text-slate-600 shadow transition-colors hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={picking} onClose={() => { if (!busy) setPicking(false); }} title="Add evidence" description={`${room} more file${room === 1 ? '' : 's'} can be attached to this report.`} size="lg" dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setPicking(false)} disabled={busy}>Cancel</ActionButton>
            <ActionButton loading={busy} disabled={!items.length} disabledReason="Choose at least one file" onClick={() => run(() => addMprEvidence(report.id, items))}>{busy ? 'Uploading…' : `Upload ${items.length || ''} File${items.length === 1 ? '' : 's'}`}</ActionButton>
          </>
        )}>
        <EvidencePicker items={items} onChange={setItems} room={room} disabled={busy} />
        {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
      </Dialog>

      <Dialog open={Boolean(removing)} onClose={() => { if (!busy) setRemoving(null); }} title="Remove this file?" size="sm" dismissible={!busy}
        footer={(
          <>
            <ActionButton variant="secondary" onClick={() => setRemoving(null)} disabled={busy}>Cancel</ActionButton>
            <ActionButton className="!bg-red-700 hover:!bg-red-800" loading={busy} onClick={() => run(() => removeMprEvidence(report.id, removing.id))}>{busy ? 'Removing…' : 'Remove'}</ActionButton>
          </>
        )}>
        <p className="text-sm text-slate-600">{removing?.caption || removing?.name} will be removed from the report.</p>
        {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
      </Dialog>
    </section>
  );
}

/** Official PDF and Excel of one report, made by the server from the stored figures. */
export function MprDownloads({ report }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const get = async (kind) => {
    if (busy) return;
    setBusy(kind);
    setError('');
    try {
      await (kind === 'pdf' ? downloadMprPdf(report.id, report.mprNo) : downloadMprExcel(report.id, report.mprNo));
    } catch (err) {
      setError(err?.message || 'The file could not be prepared. Please try again.');
    } finally {
      setBusy('');
    }
  };
  return (
    <span className="relative inline-flex items-center gap-2">
      <ActionButton variant="secondary" icon={FileText} loading={busy === 'pdf'} disabled={busy === 'excel'} onClick={() => get('pdf')} aria-label="Download official PDF">PDF</ActionButton>
      <ActionButton variant="secondary" icon={FileSpreadsheet} loading={busy === 'excel'} disabled={busy === 'pdf'} onClick={() => get('excel')} aria-label="Download Excel">Excel</ActionButton>
      {error && <span role="alert" className="absolute right-0 top-full z-10 mt-1 w-64 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 shadow">{error}</span>}
    </span>
  );
}

/** Excel register of the reports the user may see, for the filters in force. */
export function RegisterDownload({ download, label = 'Excel Register' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const get = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await download(); } catch (err) { setError(err?.message || 'The register could not be prepared. Please try again.'); } finally { setBusy(false); }
  };
  return (
    <span className="relative inline-flex">
      <ActionButton variant="secondary" size="sm" icon={FileSpreadsheet} loading={busy} onClick={get}>{label}</ActionButton>
      {error && <span role="alert" className="absolute right-0 top-full z-10 mt-1 w-64 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 shadow">{error}</span>}
    </span>
  );
}
