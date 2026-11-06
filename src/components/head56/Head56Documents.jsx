"use client";
import React, { useRef, useState } from 'react';
import { ExternalLink, FileText, Image as ImageIcon, Paperclip, Trash2, Upload } from 'lucide-react';
import { removeH56Document, uploadH56Documents } from '@/lib/head56Api';
import { ActionButton, Notice } from '@/components/projects/create/parts';
import { moment, selectClass } from './shared';

const DEFAULT_TYPES = { BILL: 'Bill', VOUCHER: 'Voucher', WORK_ORDER: 'Work order', SANCTION_ORDER: 'Sanction / payment order', ATTENDANCE: 'Attendance / honorarium sheet', OTHER: 'Other' };
const size = (bytes) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`);

/**
 * Supporting documents of a Head 56 report (bills, vouchers, work orders …),
 * each tagged to a line or to the whole report. Editable by the Maker while
 * the report is a draft or returned; read-only for everyone else.
 */
export function Head56Documents({ reportId, documents = [], lines = [], docTypes = DEFAULT_TYPES, editable = false, onChanged }) {
  const fileRef = useRef(null);
  const [code, setCode] = useState('');
  const [docType, setDocType] = useState('BILL');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameOf = new Map(lines.map((line) => [line.code, line.name]));

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      await uploadH56Documents(reportId, files, { code, docType });
      await onChanged?.();
    } catch (err) {
      setError(err?.message || 'The documents could not be uploaded.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Remove ${doc.name}?`)) return;
    setBusy(true);
    setError('');
    try {
      await removeH56Document(reportId, doc.id);
      await onChanged?.();
    } catch (err) {
      setError(err?.message || 'The document could not be removed.');
    } finally {
      setBusy(false);
    }
  };

  const grouped = [...new Set(documents.map((doc) => doc.code || ''))].sort().map((key) => ({ key, items: documents.filter((doc) => (doc.code || '') === key) }));

  return (
    <div className="space-y-4">
      {editable && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
              Line
              <select value={code} onChange={(event) => setCode(event.target.value)} className={selectClass}>
                <option value="">Whole report</option>
                {lines.map((line) => <option key={line.code} value={line.code}>{line.code} — {line.name}</option>)}
              </select>
            </label>
            <label className="flex min-w-[12rem] flex-col gap-1 text-xs font-medium text-slate-600">
              Document type
              <select value={docType} onChange={(event) => setDocType(event.target.value)} className={selectClass}>
                {Object.entries(docTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <input ref={fileRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={upload} aria-label="Choose documents to upload" />
            <ActionButton icon={Upload} loading={busy} onClick={() => fileRef.current?.click()}>Upload</ActionButton>
          </div>
          <p className="mt-2 text-xs text-slate-500">PDF or photographs, up to 10 MB each and 30 per report. Every line with expenditure this month needs a document, or a remark explaining why there is none.</p>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No supporting document attached{editable ? ' yet' : ''}.</p>
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => (
            <section key={group.key || 'report'}>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500"><Paperclip className="h-3.5 w-3.5" aria-hidden="true" />{group.key ? `${group.key} — ${nameOf.get(group.key) || ''}` : 'Whole report'}</h4>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {group.items.map((doc) => {
                  const Icon = doc.mimeType?.startsWith('image/') ? ImageIcon : FileText;
                  return (
                    <li key={doc.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                      <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 truncate text-sm font-medium text-navy hover:underline">
                          {doc.name} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                        <p className="text-xs text-slate-500">{doc.docTypeLabel} · {size(doc.size)}{doc.uploadedBy ? ` · ${doc.uploadedBy}` : ''} · {moment(doc.uploadedAt)}</p>
                      </div>
                      {editable && (
                        <button type="button" onClick={() => remove(doc)} disabled={busy} aria-label={`Remove ${doc.name}`} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
