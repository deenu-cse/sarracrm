import { toNumber } from '@/lib/numeric';

/**
 * Form-side rules for a budget allocation. These mirror the backend so the
 * user sees problems immediately; the backend re-validates everything and is
 * the only authority.
 *
 * Amounts are in ₹ lakh; comparisons are done in whole rupees so that
 * 40 + 40 + 20 is exactly 100.
 */

const UNITS_PER_LAKH = 100000;
export const toUnits = (lakh) => Math.round(toNumber(lakh) * UNITS_PER_LAKH);
export const toLakh = (units) => units / UNITS_PER_LAKH;

export const emptyEntry = () => ({ percent: '', amount: '', document: null });

const trimNumber = (value, decimals) => {
  if (!Number.isFinite(value)) return '';
  return String(Number(value.toFixed(decimals)));
};

/** Amount (lakh) that a percentage of the department budget represents. */
export const amountFromPercent = (percent, budgetLakh) => {
  if (percent === '' || percent === null || percent === undefined) return '';
  return trimNumber(toLakh(Math.round((toNumber(percent) / 100) * toUnits(budgetLakh))), 5);
};

/** Percentage of the department budget that an amount represents (2 decimals). */
export const percentFromAmount = (amount, budgetLakh) => {
  const budgetUnits = toUnits(budgetLakh);
  if (amount === '' || amount === null || amount === undefined || budgetUnits <= 0) return '';
  return trimNumber((toUnits(amount) / budgetUnits) * 100, 2);
};

const money = (units) => `₹ ${toLakh(units).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 5 })} Lakh`;

/** Live figures and problems for one department's entry in this release. */
export function evaluateEntry(department, entry, rules) {
  const budgetUnits = toUnits(department.budgetLakh);
  const releasedUnits = toUnits(department.releasedLakh);
  const remainingUnits = toUnits(department.remainingLakh);
  const amountUnits = toUnits(entry?.amount);
  const active = department.canAllocate && amountUnits > 0;
  const isFinal = department.nextInstallmentNumber === rules.maxInstallments;

  let amountError = '';
  let documentError = '';
  if (department.canAllocate && entry) {
    if (amountUnits > remainingUnits) {
      const remains = `Only ${money(remainingUnits)} remains available for ${department.name}.`;
      amountError = toNumber(entry.percent) > 100 ? `Budget allotment percentage cannot be more than 100%. ${remains}` : remains;
    } else if (toNumber(entry.percent) > 100) {
      amountError = 'Budget allotment percentage cannot be more than 100%.';
    } else if (active && isFinal && rules.finalInstallmentMustComplete && amountUnits !== remainingUnits) {
      amountError = `The last installment must release the full remaining budget of ${money(remainingUnits)}.`;
    }
    if (active && rules.documentRequired && !entry.document) documentError = 'Upload the PDF document for this installment.';
  }

  const countedUnits = active && !amountError ? amountUnits : 0;
  const afterReleasedUnits = releasedUnits + countedUnits;
  return {
    active,
    isFinal,
    amountUnits,
    amountError,
    documentError,
    valid: active && !amountError && !documentError,
    thisReleaseLakh: toLakh(countedUnits),
    releasedAfterLakh: toLakh(afterReleasedUnits),
    remainingAfterLakh: toLakh(Math.max(0, budgetUnits - afterReleasedUnits)),
    pendingPercent: budgetUnits > 0 ? (countedUnits / budgetUnits) * 100 : 0,
    completesDepartment: countedUnits > 0 && afterReleasedUnits === budgetUnits,
  };
}

export const todayIso = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** "2026-06-01T00:00:00.000Z" → "2026-06-01" (dates are stored at UTC midnight). */
export const isoDay = (value) => (value ? String(value).slice(0, 10) : '');

export const formatDay = (value) => {
  const day = isoDay(value);
  if (!day) return '—';
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Whole-form check. Returns the problems that stop Preview, in display order. */
export function evaluateForm(state, entries, allocationDate) {
  const today = todayIso();
  const evaluations = state.departments.map((department) => evaluateEntry(department, entries[department.departmentId], state.rules));
  const active = state.departments.filter((_, index) => evaluations[index].active);

  let dateError = '';
  if (!allocationDate) dateError = 'Budget allocation date is required.';
  else if (allocationDate > today) dateError = 'Budget allocation date cannot be in the future.';
  else if (allocationDate < '2000-01-01') dateError = 'Budget allocation date is too far in the past.';
  else {
    const blocking = active
      .filter((department) => department.lastAllocationDate && allocationDate < isoDay(department.lastAllocationDate))
      .sort((a, b) => (isoDay(a.lastAllocationDate) < isoDay(b.lastAllocationDate) ? 1 : -1))[0];
    if (blocking) dateError = `Date cannot be earlier than ${blocking.name}'s previous installment (${formatDay(blocking.lastAllocationDate)}).`;
  }

  const hasEntryErrors = evaluations.some((item) => item.amountError || item.documentError);
  const thisReleaseUnits = evaluations.reduce((sum, item) => sum + toUnits(item.thisReleaseLakh), 0);
  const releasedUnits = toUnits(state.totals.releasedLakh);
  const budgetUnits = toUnits(state.totals.totalBudgetLakh);

  let blockReason = '';
  if (!active.length) blockReason = 'Enter an installment amount for at least one department.';
  else if (dateError) blockReason = dateError;
  else if (hasEntryErrors) blockReason = 'Fix the highlighted fields to continue.';

  return {
    evaluations,
    dateError,
    activeCount: active.length,
    blockReason,
    totals: {
      thisReleaseLakh: toLakh(thisReleaseUnits),
      releasedAfterLakh: toLakh(releasedUnits + thisReleaseUnits),
      remainingAfterLakh: toLakh(Math.max(0, budgetUnits - releasedUnits - thisReleaseUnits)),
      pendingPercent: budgetUnits > 0 ? (thisReleaseUnits / budgetUnits) * 100 : 0,
    },
  };
}

/** Request body for Preview and Proceed. */
export function buildPayload(state, entries, allocationDate, idempotencyKey) {
  return {
    idempotencyKey,
    allocationDate,
    entries: state.departments
      .filter((department) => department.canAllocate && toUnits(entries[department.departmentId]?.amount) > 0)
      .map((department) => {
        const entry = entries[department.departmentId];
        return {
          departmentId: department.departmentId,
          installmentNumber: department.nextInstallmentNumber,
          amountLakh: toLakh(toUnits(entry.amount)),
          percentage: toNumber(percentFromAmount(entry.amount, department.budgetLakh)),
          documentId: entry.document?.documentId,
        };
      }),
  };
}

export const newRequestKey = () => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`
);
