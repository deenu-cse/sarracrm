"use client";
import React, { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { discardAllocationDocument, uploadAllocationDocument } from '@/lib/budgetApi';
import { FieldError } from '@/components/projects/create/parts';

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * PDF upload for one installment. The file is sent to the backend as soon as
 * it is chosen; the backend re-checks type, extension, size and content, so
 * the checks here only save the user a round trip.
 *
 * `value` is the uploaded document `{ documentId, name, sizeBytes, url }` or null.
 */
export function PdfUpload({ id, projectId, value, onChange, onBusyChange, maxBytes, invalid = false, disabled = false, label, shared = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const setBusy = (busy) => { setUploading(busy); onBusyChange?.(busy); };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow choosing the same file again
    if (!file) return;
    setError('');

    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) {
      setError('Only PDF files can be uploaded.');
      return;
    }
    if (file.size === 0) { setError('The selected file is empty.'); return; }
    if (maxBytes && file.size > maxBytes) {
      setError(`The PDF is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      return;
    }

    setBusy(true);
    try {
      onChange(await uploadAllocationDocument(projectId, file));
    } catch (err) {
      setError(err?.message || 'The PDF could not be uploaded. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    // A document shared with other departments stays on the server for them.
    if (value && !shared) discardAllocationDocument(projectId, value.documentId);
    onChange(null);
    setError('');
  };

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={handleFile}
        disabled={disabled || uploading}
        aria-label={label}
        aria-invalid={invalid || Boolean(error) || undefined}
        tabIndex={-1}
      />

      {value ? (
        <div className="wz-fade-in flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <FileText className="h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <a href={value.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-semibold text-slate-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40">
              {value.name}
            </a>
            <p className="text-xs text-emerald-800">Uploaded · {formatSize(value.sizeBytes)}</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={remove}
              aria-label={`Remove ${value.name}`}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm font-semibold transition-[background-color,border-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
            ${invalid || error ? 'border-red-400 text-red-700' : 'border-slate-300 text-slate-700 hover:border-navy hover:bg-navy/[0.03]'}
            ${disabled || uploading ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Uploading PDF…</>
            : <><Upload className="h-4 w-4" aria-hidden="true" /> Upload PDF</>}
        </button>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
