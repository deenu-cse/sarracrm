"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, Loader2, RefreshCw } from 'lucide-react';

/** Shared building blocks for the Create Project wizard. */

// ─── Data loading ────────────────────────────────────────────────────────────

/**
 * Load a master-data list. `key` identifies what is being loaded (null = nothing
 * to load yet). Responses for an outdated key are ignored, so quickly changing a
 * parent can never show another parent's children.
 */
export function useMasterList(fetcher, key) {
  const [state, setState] = useState({ items: [], loading: false, error: '' });
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (key === null || key === undefined) {
      setState({ items: [], loading: false, error: '' });
      return undefined;
    }
    let current = true;
    setState({ items: [], loading: true, error: '' });
    fetcherRef.current()
      .then((items) => { if (current) setState({ items, loading: false, error: '' }); })
      .catch((err) => { if (current) setState({ items: [], loading: false, error: err?.message || 'Unable to load data. Please try again.' }); });
    return () => { current = false; };
  }, [key, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export function StepCard({ step, title, description, aside, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby={`step-title-${step}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Step {String(step).padStart(2, '0')}</p>
          <h2 id={`step-title-${step}`} className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

export function Field({ id, label, required = false, optional = false, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} id={`${id}-label`} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600" aria-hidden="true">*</span>}
        {optional && <span className="text-xs font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
      {!error && hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="wz-fade-in mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-700">
      <AlertCircle className="mt-px h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export function Notice({ tone = 'info', title, children, action }) {
  const tones = {
    info: { box: 'border-sky-200 bg-sky-50 text-sky-900', Icon: AlertCircle, icon: 'text-sky-600' },
    warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle, icon: 'text-amber-600' },
    error: { box: 'border-red-200 bg-red-50 text-red-900', Icon: AlertCircle, icon: 'text-red-600' },
    success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', Icon: Check, icon: 'text-emerald-600' },
  };
  const { box, Icon, icon } = tones[tone] || tones.info;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`wz-fade-in flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${box}`}>
      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function RetryButton({ onClick, label = 'Retry' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
    >
      <RefreshCw className="h-3 w-3" aria-hidden="true" /> {label}
    </button>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className}`} aria-hidden="true" />;
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = {
  primary: 'bg-navy text-white shadow-sm hover:bg-navy-light hover:shadow-md focus-visible:ring-navy/50',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-400/50',
  success: 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 hover:shadow-md focus-visible:ring-emerald-600/50',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400/50',
};

const BUTTON_SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' };

/**
 * Wizard button with hover / press feedback, a loading spinner, an optional
 * success tick, and a stated reason when it is disabled.
 */
export function ActionButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  succeeded = false,
  disabled = false,
  disabledReason = '',
  icon: Icon,
  iconRight: IconRight,
  className = '',
  type = 'button',
  ...props
}) {
  const inactive = disabled || loading;
  return (
    <button
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      title={disabled && disabledReason ? disabledReason : props.title}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold transition-[background-color,border-color,box-shadow,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary} ${BUTTON_SIZES[size] || BUTTON_SIZES.md}
        ${inactive ? 'cursor-not-allowed opacity-55 hover:shadow-sm' : 'active:scale-[0.97]'} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {!loading && succeeded && <Check className="wz-pop-in h-4 w-4" aria-hidden="true" />}
      {!loading && !succeeded && Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      <span>{children}</span>
      {!loading && IconRight && <IconRight className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

export const inputClass = (invalid) => `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150 focus:outline-none
  ${invalid ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 hover:border-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/20'}`;

/** Animated tick used for success moments. */
export function SuccessTick({ size = 56 }) {
  return (
    <span
      className="wz-pop-in inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path className="wz-check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
