"use client";
import { useSyncExternalStore } from 'react';
import { formatIndian, toNumber } from '@/lib/numeric';

/**
 * The unit amounts are shown in on reports and dashboards: Rupees, Thousand,
 * Lakh or Crore. Amounts are stored in lakh everywhere; only the display
 * changes. The choice is remembered on this device and shared by every report.
 */

export const MONEY_UNITS = {
  RUPEES: { key: 'RUPEES', label: 'Rupees', hindi: 'रुपये', short: '', long: '', perLakh: 100000, decimals: 0 },
  THOUSAND: { key: 'THOUSAND', label: 'Thousand', hindi: 'हज़ार', short: 'K', long: 'Thousand', perLakh: 100, decimals: 2 },
  LAKH: { key: 'LAKH', label: 'Lakh', hindi: 'लाख', short: 'L', long: 'Lakh', perLakh: 1, decimals: 2 },
  CRORE: { key: 'CRORE', label: 'Crore', hindi: 'करोड़', short: 'Cr', long: 'Crore', perLakh: 0.01, decimals: 2 },
};
const STORAGE_KEY = 'sarra.moneyUnit';
const DEFAULT_UNIT = 'LAKH';

let current = DEFAULT_UNIT;
let loaded = false;
const listeners = new Set();

const load = () => {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (MONEY_UNITS[saved]) current = saved;
  } catch { /* storage unavailable */ }
};

export const getMoneyUnit = () => { load(); return current; };

export const setMoneyUnit = (unit) => {
  if (!MONEY_UNITS[unit] || unit === current) return;
  current = unit;
  try { window.localStorage.setItem(STORAGE_KEY, unit); } catch { /* storage unavailable */ }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The unit chosen for reports; components using it re-render when it changes. */
export const useMoneyUnit = () => useSyncExternalStore(subscribe, getMoneyUnit, () => DEFAULT_UNIT);

/** An amount held in lakh, as a number in `unit`. */
export const inUnit = (lakhValue, unit = getMoneyUnit()) => toNumber(lakhValue) * MONEY_UNITS[unit].perLakh;

/** An amount held in lakh, e.g. "₹ 75.70 Lakh", "₹ 75,70,000", "₹ 7,570.00 Thousand", "₹ 0.76 Crore". */
export const formatMoney = (lakhValue, unit = getMoneyUnit(), { short = false, decimals } = {}) => {
  const u = MONEY_UNITS[unit];
  const number = formatIndian(inUnit(lakhValue, unit), { minDecimals: decimals ?? u.decimals, maxDecimals: decimals ?? u.decimals });
  const suffix = short ? u.short : u.long;
  return `₹ ${number}${suffix ? ` ${suffix}` : ''}`;
};

/** Just the figure in the unit, for table cells whose header names the unit. */
export const formatFigure = (lakhValue, unit = getMoneyUnit(), decimals) => {
  const u = MONEY_UNITS[unit];
  return formatIndian(inUnit(lakhValue, unit), { minDecimals: decimals ?? u.decimals, maxDecimals: decimals ?? u.decimals });
};

/** Column header text, e.g. "₹ in Lakh", "₹" (rupees). */
export const unitCaption = (unit = getMoneyUnit()) => (unit === 'RUPEES' ? '₹' : `₹ in ${MONEY_UNITS[unit].label}`);

/** Formatters bound to the chosen unit; the component re-renders when the unit changes. */
export function useMoney() {
  const unit = useMoneyUnit();
  return {
    unit,
    caption: unitCaption(unit),
    money: (lakhValue, options) => formatMoney(lakhValue, unit, options),
    short: (lakhValue) => formatMoney(lakhValue, unit, { short: true }),
    figure: (lakhValue, decimals) => formatFigure(lakhValue, unit, decimals),
  };
}
