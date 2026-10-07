"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';

/** Case-insensitive, whitespace-tolerant comparison key. */
export const normalizeText = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Searchable single-select (combobox) with keyboard navigation, loading /
 * empty / error states, a clear button and an optional "+ Add" action.
 *
 * `options` and `value` are `{ id, name, hint? }`. Options are filtered locally,
 * so typing never triggers a request.
 */
export function SearchableSelect({
  id: idProp,
  value,
  options = [],
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  noun = 'option',
  loading = false,
  error = '',
  onRetry,
  disabled = false,
  disabledReason = '',
  invalid = false,
  clearable = true,
  onCreate,
  isOptionDisabled,
  optionDisabledLabel = 'Already selected',
  'aria-describedby': describedBy,
  'aria-labelledby': labelledBy,
}) {
  const autoId = useId();
  const id = idProp || autoId;
  const listId = `${id}-list`;
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const needle = normalizeText(queryText);
  const filtered = useMemo(() => {
    if (!needle) return options;
    const tokens = needle.split(' ');
    return options.filter((option) => {
      const haystack = normalizeText(`${option.name} ${option.hint || ''}`);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [options, needle]);

  const exactMatch = needle && options.some((option) => normalizeText(option.name) === needle);
  const canCreate = typeof onCreate === 'function' && !loading && !error;
  const showCreateForQuery = canCreate && needle && !exactMatch;

  // Rows the keyboard can move through: options first, then the Add action.
  const rowCount = filtered.length + (canCreate ? 1 : 0);
  const createIndex = canCreate ? filtered.length : -1;

  const close = (returnFocus = true) => {
    setOpen(false);
    setQueryText('');
    if (returnFocus) buttonRef.current?.focus();
  };

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    const selectedIndex = value ? options.findIndex((option) => option.id === value.id) : -1;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 0);
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) close(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => { clearTimeout(focusTimer); document.removeEventListener('mousedown', onPointerDown); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted row inside the scroll area
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  useEffect(() => { setActiveIndex(0); }, [needle]);

  const choose = (option) => {
    if (isOptionDisabled?.(option)) return;
    onChange(option);
    close();
  };

  const create = () => {
    const typed = queryText.replace(/\s+/g, ' ').trim();
    close(false);
    onCreate(exactMatch ? '' : typed);
  };

  const move = (delta) => {
    if (!rowCount) return;
    setActiveIndex((current) => {
      let next = current;
      for (let step = 0; step < rowCount; step += 1) {
        next = (next + delta + rowCount) % rowCount;
        if (next === createIndex || !isOptionDisabled?.(filtered[next])) return next;
      }
      return current;
    });
  };

  const onSearchKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); move(1); break;
      case 'ArrowUp': event.preventDefault(); move(-1); break;
      case 'Home': event.preventDefault(); setActiveIndex(0); break;
      case 'End': event.preventDefault(); setActiveIndex(Math.max(0, rowCount - 1)); break;
      case 'Enter':
        event.preventDefault();
        if (activeIndex === createIndex) create();
        else if (filtered[activeIndex]) choose(filtered[activeIndex]);
        break;
      case 'Escape': event.preventDefault(); event.stopPropagation(); close(); break;
      case 'Tab': close(false); break;
      default:
    }
  };

  const onButtonKeyDown = (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); openMenu(); }
  };

  const optionId = (index) => `${id}-option-${index}`;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <button
          ref={buttonRef}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined}
          disabled={disabled}
          title={disabled && disabledReason ? disabledReason : undefined}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={onButtonKeyDown}
          className={`flex w-full items-center gap-2 rounded-lg border bg-white py-2.5 pl-3 pr-16 text-left text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none
            ${invalid ? 'border-red-400 focus-visible:ring-2 focus-visible:ring-red-200' : 'border-slate-300 hover:border-slate-400 focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/20'}
            ${open ? 'border-navy ring-2 ring-navy/20' : ''}
            ${disabled ? 'cursor-not-allowed bg-slate-50 hover:border-slate-300' : ''}`}
        >
          <span className={`block truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
            {value ? value.name : (disabled && disabledReason) || placeholder}
          </span>
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden="true" />}
          {clearable && value && !disabled && (
            <button
              type="button"
              aria-label={`Clear ${noun}`}
              onClick={() => { onChange(null); buttonRef.current?.focus(); }}
              className="pointer-events-auto rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
      </div>

      {open && (
        <div className="wz-dropdown-in absolute left-0 right-0 z-40 mt-1.5 origin-top overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3">
            <Search className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={rowCount ? optionId(activeIndex) : undefined}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div ref={listRef} id={listId} role="listbox" aria-label={`${noun} options`} className="max-h-60 overflow-y-auto py-1">
            {loading && (
              <div className="space-y-2 px-3 py-2" aria-label={`Loading ${noun}s`} role="status">
                {[72, 56, 64].map((width) => (
                  <div key={width} className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${width}%` }} />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="px-3 py-3 text-sm" role="alert">
                <p className="flex items-start gap-2 text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {error}
                </p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" /> Retry
                  </button>
                )}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-slate-500">
                {needle ? `No ${noun} found for “${queryText.trim()}”` : `No ${noun}s available yet`}
              </p>
            )}

            {!loading && !error && filtered.map((option, index) => {
              const selected = value?.id === option.id;
              const optionDisabled = !!isOptionDisabled?.(option);
              const active = index === activeIndex;
              return (
                <div
                  key={option.id}
                  id={optionId(index)}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={optionDisabled || undefined}
                  onMouseEnter={() => { if (!optionDisabled) setActiveIndex(index); }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={`mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-100
                    ${optionDisabled ? 'cursor-not-allowed text-slate-400' : active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'}
                    ${selected ? 'font-semibold text-navy' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.name}</span>
                    {option.hint && <span className="block truncate text-xs font-normal text-slate-400">{option.hint}</span>}
                  </span>
                  {selected && <Check className="h-4 w-4 flex-shrink-0 text-navy" aria-hidden="true" />}
                  {optionDisabled && !selected && <span className="flex-shrink-0 text-[11px] text-slate-400">{optionDisabledLabel}</span>}
                </div>
              );
            })}
          </div>

          {canCreate && (
            <div className="border-t border-slate-100 p-1">
              <div
                id={optionId(createIndex)}
                data-index={createIndex}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActiveIndex(createIndex)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={create}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold text-navy transition-colors duration-100 ${activeIndex === createIndex ? 'bg-navy/10' : 'hover:bg-navy/5'}`}
              >
                <Plus className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {showCreateForQuery ? `Add “${queryText.replace(/\s+/g, ' ').trim()}”` : `Add new ${noun}`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
