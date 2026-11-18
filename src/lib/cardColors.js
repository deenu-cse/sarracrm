/** Colours of statistic cards (SARRA dashboard design). */

/** Colours of the statistic cards: tinted card, solid icon disc, coloured label. */
export const CARD_COLORS = {
  blue: { card: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white', disc: 'bg-blue-600', label: 'text-blue-800', bar: 'bg-blue-600' },
  green: { card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white', disc: 'bg-emerald-600', label: 'text-emerald-800', bar: 'bg-emerald-600' },
  orange: { card: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white', disc: 'bg-orange-500', label: 'text-orange-800', bar: 'bg-orange-500' },
  violet: { card: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white', disc: 'bg-violet-600', label: 'text-violet-800', bar: 'bg-violet-600' },
  teal: { card: 'border-teal-200 bg-gradient-to-br from-teal-50 to-white', disc: 'bg-teal-600', label: 'text-teal-800', bar: 'bg-teal-600' },
  rose: { card: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white', disc: 'bg-rose-500', label: 'text-rose-800', bar: 'bg-rose-500' },
  amber: { card: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white', disc: 'bg-amber-500', label: 'text-amber-800', bar: 'bg-amber-500' },
  indigo: { card: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white', disc: 'bg-indigo-600', label: 'text-indigo-800', bar: 'bg-indigo-600' },
};
const ORDER = ['blue', 'green', 'orange', 'violet', 'teal', 'rose', 'amber', 'indigo'];
/** A stable colour for a card without one, so neighbouring cards differ. */
export const colorFor = (text) => ORDER[[...String(text || '')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % ORDER.length];
