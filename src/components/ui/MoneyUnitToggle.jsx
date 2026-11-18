"use client";
import React from 'react';
import { IndianRupee } from 'lucide-react';
import { MONEY_UNITS, setMoneyUnit, useMoneyUnit } from '@/lib/moneyUnit';

/**
 * Choose the unit amounts are shown in — Rupees, Thousand, Lakh or Crore.
 * The choice applies to every report and dashboard on this device.
 */
export function MoneyUnitToggle({ className = '', compact = false }) {
  const unit = useMoneyUnit();
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {!compact && (
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
          <IndianRupee className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" /> Amounts in
        </span>
      )}
      <div role="radiogroup" aria-label="Show amounts in" className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm">
        {Object.values(MONEY_UNITS).map((option) => {
          const active = option.key === unit;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMoneyUnit(option.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
                ${active ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
