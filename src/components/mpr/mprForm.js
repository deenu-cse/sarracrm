import { toNumber } from '@/lib/numeric';

/**
 * Form-side arithmetic for a Monthly Progress Report. It mirrors the backend so
 * the officer sees totals and problems while typing; the backend recalculates
 * and re-validates everything and is the only authority.
 *
 * Integer arithmetic: quantities in thousandths, money (₹ lakh) in rupees.
 */

const PHYSICAL = 1000;
const MONEY = 100000;
const toPhysical = (value) => Math.round(toNumber(value) * PHYSICAL);
const toMoney = (value) => Math.round(toNumber(value) * MONEY);

export const formatQuantity = (value) => toNumber(value).toLocaleString('en-IN', { maximumFractionDigits: 3 });
const lakh = (units) => `₹ ${(units / MONEY).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 5 })} Lakh`;
const percentOf = (part, whole) => (whole > 0 ? Math.min(100, Math.floor((part * 10000) / whole) / 100) : 0);

export const emptyEntry = () => ({ physical: '', financial: '' });

/** One activity with this month's entry applied: totals, progress and any limit that is broken. */
export function evaluateActivity(activity, entry) {
  const physicalTarget = toPhysical(activity.physicalTarget);
  const physicalPrevious = toPhysical(activity.physicalPrevious);
  const physicalCurrent = activity.hasPhysical ? toPhysical(entry?.physical) : 0;
  const financialTarget = toMoney(activity.financialTargetLakh);
  const financialPrevious = toMoney(activity.financialPreviousLakh);
  const financialCurrent = toMoney(entry?.financial);

  const physicalRemaining = Math.max(0, physicalTarget - physicalPrevious);
  const financialRemaining = Math.max(0, financialTarget - financialPrevious);
  const physicalError = physicalPrevious + physicalCurrent > physicalTarget
    ? `Progress cannot exceed the total target. Remaining target: ${formatQuantity(physicalRemaining / PHYSICAL)}${activity.unit ? ` ${activity.unit.replace(/\.$/, '')}` : ''}.`
    : '';
  const financialError = financialPrevious + financialCurrent > financialTarget
    ? `Financial progress cannot exceed the financial target. Remaining: ${lakh(financialRemaining)}.`
    : '';

  const physicalTotal = physicalPrevious + physicalCurrent;
  const financialTotal = financialPrevious + financialCurrent;
  const measuredPhysically = activity.hasPhysical && physicalTarget > 0;
  const goal = measuredPhysically ? physicalTarget : financialTarget;
  // A figure that breaks its limit is not counted as progress until it is corrected.
  const countedPhysical = physicalError ? physicalPrevious : physicalTotal;
  const countedFinancial = financialError ? financialPrevious : financialTotal;
  const done = measuredPhysically ? countedPhysical : countedFinancial;

  return {
    physicalCurrent: physicalCurrent / PHYSICAL,
    physicalTotal: physicalTotal / PHYSICAL,
    physicalRemaining: physicalRemaining / PHYSICAL,
    physicalPercent: percentOf(countedPhysical, physicalTarget),
    physicalPreviousPercent: percentOf(physicalPrevious, physicalTarget),
    physicalError,
    financialCurrentLakh: financialCurrent / MONEY,
    financialTotalLakh: financialTotal / MONEY,
    financialRemainingLakh: financialRemaining / MONEY,
    financialPercent: percentOf(countedFinancial, financialTarget),
    financialPreviousPercent: percentOf(financialPrevious, financialTarget),
    financialError,
    state: goal > 0 && done >= goal ? 'completed' : done > 0 ? 'inProgress' : 'notStarted',
    measuredPhysically,
    entered: physicalCurrent > 0 || financialCurrent > 0,
    _units: { physicalTarget, physicalTotal: countedPhysical, financialTarget, financialPrevious, financialCurrent: financialError ? 0 : financialCurrent },
  };
}

/** Whole-report figures for the summary panel. */
export function summarize(activities, evaluations) {
  let completed = 0; let inProgress = 0; let notStarted = 0; let share = 0; let counted = 0;
  let target = 0; let previous = 0; let current = 0; let errors = 0; let entered = 0;
  activities.forEach((activity, index) => {
    const item = evaluations[index];
    if (item.state === 'completed') completed += 1; else if (item.state === 'inProgress') inProgress += 1; else notStarted += 1;
    if (item.measuredPhysically) { share += Math.min(1, item._units.physicalTotal / item._units.physicalTarget); counted += 1; }
    target += item._units.financialTarget;
    previous += item._units.financialPrevious;
    current += item._units.financialCurrent;
    if (item.physicalError || item.financialError) errors += 1;
    if (item.entered) entered += 1;
  });
  return {
    activities: activities.length,
    activitiesCompleted: completed,
    activitiesInProgress: inProgress,
    activitiesNotStarted: notStarted,
    physicalPercent: counted ? Math.floor((share / counted) * 10000) / 100 : 0,
    financialTargetLakh: target / MONEY,
    financialPreviousLakh: previous / MONEY,
    financialCurrentLakh: current / MONEY,
    financialTotalLakh: (previous + current) / MONEY,
    financialRemainingLakh: Math.max(0, target - previous - current) / MONEY,
    financialPercent: percentOf(Math.min(previous + current, target), target),
    errors,
    entered,
  };
}

/** Only this month's figures are sent; targets, previous progress and totals are the server's. */
export function buildEntries(activities, entries) {
  return activities.map((activity) => ({
    activityCode: activity.activityCode,
    physicalCurrent: activity.hasPhysical ? toNumber(entries[activity.activityCode]?.physical) : 0,
    financialCurrentLakh: toNumber(entries[activity.activityCode]?.financial),
  }));
}

export const FORM_TYPE_TITLES = {
  '55-(1-3)': 'Monthly Progress Report — Heads 55-1, 55-2 and 55-3',
  '55(4)': 'Monthly Progress Report — Head 55-4',
};
