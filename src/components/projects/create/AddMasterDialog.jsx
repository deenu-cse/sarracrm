"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { normalizeText } from '@/components/ui/SearchableSelect';
import { ActionButton, FieldError, inputClass, SuccessTick } from './parts';

// Mirrors the backend rule; the backend remains the authority.
const NAME_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'()/-]*$/u;

const cleanName = (raw) => String(raw ?? '').replace(/\s+/g, ' ').trim();

function validateName(raw, noun, existing) {
  const name = cleanName(raw);
  if (!name) return `${noun} name is required.`;
  if (name.length < 2) return `${noun} name must be at least 2 characters.`;
  if (name.length > 80) return `${noun} name cannot be longer than 80 characters.`;
  if (!NAME_PATTERN.test(name)) return `${noun} name can only contain letters, numbers, spaces and . , ' ( ) / -`;
  const key = normalizeText(name);
  const duplicate = existing.find((item) => normalizeText(item.name) === key);
  if (duplicate) return `“${duplicate.name}” already exists. Select it from the list instead.`;
  return '';
}

/**
 * Small dialog for adding a master record (Block, Gram Panchayat, Village,
 * Department). The record is saved to the backend; `onCreated` receives the
 * saved record so the caller can select it straight away.
 *
 * `config` (null = closed): { noun, initialName, context: [{label, value}], existing, create(name) }
 */
export function AddMasterDialog({ config, onClose, onCreated }) {
  const inputRef = useRef(null);
  const closeTimer = useRef(null);
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(null);

  const open = Boolean(config);
  const noun = config?.noun || '';

  useEffect(() => {
    if (!open) return undefined;
    setName(config.initialName || '');
    setTouched(false);
    setSaving(false);
    setServerError('');
    setSaved(null);
    return () => clearTimeout(closeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const clientError = validateName(name, noun, config.existing || []);
  const shownError = serverError || (touched ? clientError : '');

  const finish = (record) => {
    setSaved(record);
    closeTimer.current = setTimeout(() => { onCreated(record); onClose(); }, 850);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving || saved) return;
    setTouched(true);
    setServerError('');
    if (clientError) { inputRef.current?.focus(); return; }

    setSaving(true);
    try {
      finish(await config.create(cleanName(name)));
    } catch (err) {
      // Someone else added the same name meanwhile: use the existing record.
      if (err?.data?.existing?.id) {
        finish(err.data.existing);
      } else {
        setServerError(err?.message || `Unable to add the ${noun.toLowerCase()}. Please try again.`);
        setSaving(false);
        inputRef.current?.focus();
      }
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Add New ${noun}`}
      size="sm"
      dismissible={!saving && !saved}
      initialFocusRef={inputRef}
    >
      {saved ? (
        <div className="flex flex-col items-center py-4 text-center" role="status">
          <SuccessTick size={48} />
          <p className="mt-3 text-sm font-semibold text-slate-900">{noun} added successfully</p>
          <p className="mt-0.5 text-sm text-slate-500">“{saved.name}” is now selected.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          {config.context?.length > 0 && (
            <dl className="mb-4 flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              {config.context.map((item) => (
                <div key={item.label} className="flex gap-1.5">
                  <dt className="text-slate-500">{item.label}:</dt>
                  <dd className="font-semibold text-slate-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <label htmlFor="add-master-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            {noun} Name <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <input
            ref={inputRef}
            id="add-master-name"
            type="text"
            value={name}
            maxLength={100}
            autoComplete="off"
            disabled={saving}
            aria-invalid={Boolean(shownError) || undefined}
            aria-describedby={shownError ? 'add-master-name-error' : undefined}
            onChange={(event) => { setName(event.target.value); setServerError(''); }}
            onBlur={() => setTouched(true)}
            placeholder={`Enter ${noun.toLowerCase()} name`}
            className={inputClass(Boolean(shownError))}
          />
          <FieldError id="add-master-name-error" message={shownError} />

          <div className="mt-6 flex justify-end gap-3">
            <ActionButton variant="secondary" onClick={onClose} disabled={saving}>Cancel</ActionButton>
            <ActionButton type="submit" loading={saving}>{saving ? 'Adding…' : `Add ${noun}`}</ActionButton>
          </div>
        </form>
      )}
    </Dialog>
  );
}
