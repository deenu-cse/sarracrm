"use client";
import React from 'react';

export const ORDINALS = ['', '1st', '2nd', '3rd', '4th'];
export const ordinal = (n) => ORDINALS[n] || `${n}th`;

/** Small animated tick used wherever something becomes complete. */
export function DoneTick({ className = 'h-4 w-4' }) {
  return (
    <span className={`wz-pop-in inline-flex flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path className="wz-check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

export function ProgressBar({ percent, complete = false, pendingPercent = 0, label }) {
  const done = Math.max(0, Math.min(100, percent || 0));
  const pending = Math.max(0, Math.min(100 - done, pendingPercent || 0));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(done)}
      className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div className={`h-full transition-[width] duration-500 ease-out ${complete ? 'bg-emerald-600' : 'bg-navy'}`} style={{ width: `${done}%` }} />
      {pending > 0 && <div className="h-full bg-navy/35 transition-[width] duration-300 ease-out" style={{ width: `${pending}%` }} />}
    </div>
  );
}
