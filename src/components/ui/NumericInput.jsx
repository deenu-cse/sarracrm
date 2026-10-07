"use client";
import React, { useEffect, useRef, useState } from 'react';
import { sanitizeNumeric, formatIndian } from '@/lib/numeric';

/**
 * Non-negative numeric field for financial / data entry.
 *
 * It is a text input on purpose: a native number input changes its value on
 * mouse-wheel and arrow keys and accepts "e", "+" and "-". Here the value can
 * only ever be digits with an optional decimal point, so scrolling the page
 * over a focused field leaves the figure untouched.
 *
 * `value` / `onChange` use a plain numeric string ("1250.5", or "" when empty).
 */
export function NumericInput({
  id,
  value,
  onChange,
  onBlur,
  allowDecimal = true,
  maxDecimals = 2,
  formatOnBlur = false,
  minDecimalsOnBlur = 2,
  prefix,
  suffix,
  invalid = false,
  disabled = false,
  readOnly = false,
  placeholder = '0',
  align = 'right',
  className = '',
  'aria-describedby': describedBy,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [rejectedHint, setRejectedHint] = useState(false);
  const hintTimer = useRef(null);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const flagRejected = () => {
    setRejectedHint(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setRejectedHint(false), 2200);
  };

  const handleChange = (event) => {
    const { value: next, rejected } = sanitizeNumeric(event.target.value, { allowDecimal, maxDecimals });
    if (rejected) flagRejected();
    if (next !== value) onChange(next);
  };

  const handleBlur = (event) => {
    setFocused(false);
    // Tidy a dangling decimal point: "12." → "12"
    if (typeof value === 'string' && value.endsWith('.')) onChange(value.slice(0, -1));
    onBlur?.(event);
  };

  const shown = !focused && formatOnBlur && value !== '' && value !== null && value !== undefined
    ? formatIndian(value, { minDecimals: minDecimalsOnBlur, maxDecimals: Math.max(minDecimalsOnBlur, maxDecimals) })
    : (value ?? '');

  const hintId = id ? `${id}-hint` : undefined;

  return (
    <div className="relative">
      <div
        className={`flex items-center rounded-lg border bg-white transition-[border-color,box-shadow] duration-150
          ${invalid ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-200' : 'border-slate-300 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20'}
          ${disabled || readOnly ? 'bg-slate-50' : ''} ${className}`}
      >
        {prefix && <span className="pl-3 text-sm text-slate-400 select-none" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          autoComplete="off"
          spellCheck={false}
          value={shown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          {...rest}
          aria-invalid={invalid || undefined}
          aria-describedby={rejectedHint && hintId ? hintId : describedBy}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          className={`w-full min-w-0 bg-transparent px-3 py-2 text-sm tabular-nums text-slate-900 placeholder:text-slate-300 focus:outline-none
            ${align === 'right' ? 'text-right' : 'text-left'} ${disabled || readOnly ? 'cursor-not-allowed text-slate-500' : ''}`}
        />
        {suffix && <span className="pr-3 text-xs font-medium text-slate-400 select-none whitespace-nowrap" aria-hidden="true">{suffix}</span>}
      </div>
      {rejectedHint && (
        <p id={hintId} role="status" className="wz-fade-in absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
          {allowDecimal ? `Only non-negative numbers, up to ${maxDecimals} decimals` : 'Only non-negative whole numbers'}
        </p>
      )}
    </div>
  );
}
