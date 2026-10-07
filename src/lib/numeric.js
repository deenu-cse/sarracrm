/**
 * Helpers for professional numeric entry.
 * Values are kept as plain digit strings ("1250.5") while editing, so nothing
 * the browser does (mouse wheel, arrow keys, exponent notation) can alter them.
 */

/**
 * Reduce raw typed / pasted text to a valid non-negative number string.
 * Returns the cleaned value and whether anything had to be rejected.
 */
export function sanitizeNumeric(raw, { allowDecimal = true, maxDecimals = 2, maxIntegerDigits = 12 } = {}) {
  const text = String(raw ?? '').replace(/[,\s₹]/g, '');
  let integer = '';
  let fraction = '';
  let seenDot = false;
  let rejected = false;

  for (const char of text) {
    if (char >= '0' && char <= '9') {
      if (seenDot) {
        if (fraction.length < maxDecimals) fraction += char; else rejected = true;
      } else if (integer.length < maxIntegerDigits) {
        integer += char;
      } else {
        rejected = true;
      }
    } else if (char === '.' && allowDecimal && !seenDot) {
      seenDot = true;
    } else {
      rejected = true; // minus, plus, e / E, letters, a second dot …
    }
  }

  // Drop leading zeros ("007" → "7") but keep a single zero before a dot
  integer = integer.replace(/^0+(?=\d)/, '');
  if (seenDot && integer === '') integer = '0';

  return { value: seenDot ? `${integer}.${fraction}` : integer, rejected };
}

/** "12." → 12, "" → 0. Never NaN. */
export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number : 0;
}

/** Add two money figures without binary floating-point drift. */
export function sumMoney(values, decimals = 5) {
  const factor = 10 ** decimals;
  const total = values.reduce((sum, value) => sum + Math.round(toNumber(value) * factor), 0);
  return total / factor;
}

/** Indian digit grouping: 1250000.5 → "12,50,000.50" */
export function formatIndian(value, { minDecimals = 0, maxDecimals = 5 } = {}) {
  return toNumber(value).toLocaleString('en-IN', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: Math.max(minDecimals, maxDecimals),
  });
}

/** Amount held in lakh → "₹ 12.50 Lakh" */
export function formatLakh(value) {
  return `₹ ${formatIndian(value, { minDecimals: 2 })} Lakh`;
}

/** Amount held in lakh → full rupee figure, e.g. 0.7 → "₹ 70,000" */
export function lakhToRupees(value) {
  return `₹ ${formatIndian(Math.round(toNumber(value) * 100000), { maxDecimals: 0 })}`;
}
