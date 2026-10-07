"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, FileText } from 'lucide-react';

/** Shared building blocks for the project detail page. */

const isoDay = (value) => (value ? String(value).slice(0, 10) : '');

/** Calendar dates (approval / allocation dates) are stored at UTC midnight: show the stored day. */
export const formatDay = (value) => {
  const day = isoDay(value);
  if (!day) return '—';
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Moments in time (when something was done): show in the viewer's local time. */
export const formatMoment = (value, withTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
};

export function Panel({ title, description, aside, children, padded = true, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || aside) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {aside}
        </header>
      )}
      <div className={padded ? 'px-5 py-4' : ''}>{children}</div>
    </section>
  );
}

export function DataItem({ label, value, mono = false, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

export function StatTile({ label, value, sub, tone = 'default', icon: Icon }) {
  const tones = { default: 'text-slate-900', success: 'text-emerald-700', warning: 'text-amber-700', accent: 'text-navy' };
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
        {label}
      </dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${tones[tone] || tones.default}`}>{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-xs tabular-nums text-slate-400">{sub}</dd>}
    </div>
  );
}

export function EmptyNote({ children }) {
  return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">{children}</p>;
}

export function DocumentLink({ url, name, meta }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-[border-color,box-shadow] duration-150 hover:border-navy/40 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-navy/10 group-hover:text-navy" aria-hidden="true">
        <FileText className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900">{name}</span>
        {meta && <span className="block truncate text-xs text-slate-500">{meta}</span>}
      </span>
      <span className="text-xs font-semibold text-navy opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Open</span>
    </a>
  );
}

export function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ }
      document.body.removeChild(area);
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className="rounded-md p-1 text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <span role="status" className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2">
        {copied && <span className="wz-fade-in block whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white shadow-lg">Copied!</span>}
      </span>
    </span>
  );
}

// ─── CSV export ──────────────────────────────────────────────────────────────

const csvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  // Stop spreadsheet apps treating a text cell as a formula.
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function downloadCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
  // BOM so Excel reads UTF-8 (₹, Hindi names) correctly.
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[^\w.-]+/g, '_');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportButton({ onClick, children = 'Export CSV', disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-[background-color,border-color,transform] duration-150 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" /> {children}
    </button>
  );
}
