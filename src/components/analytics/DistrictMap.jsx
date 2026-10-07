"use client";
import React, { useState } from 'react';
import { formatIndian, formatLakh } from '@/lib/numeric';
import { EmptyState } from './AnalyticsParts';
import { DISTRICT_SHAPES, MAP_HEIGHT, MAP_WIDTH } from './uttarakhandDistricts';

/**
 * Map of Uttarakhand with the real district boundaries (from the official
 * district boundary file). Each district is coloured by the figure chosen,
 * for the filters in force on the page.
 */
const METRICS = [
  { key: 'projects', label: 'Projects', format: (v) => formatIndian(v, { maxDecimals: 0 }) },
  { key: 'budgetLakh', label: 'Sanctioned budget', format: formatLakh },
  { key: 'releasedLakh', label: 'Funds released', format: formatLakh },
  { key: 'spentLakh', label: 'Expenditure reported', format: formatLakh },
  { key: 'utilisationPercent', label: 'Utilisation of releases', format: (v) => `${v}%`, max: 100 },
  { key: 'physicalPercent', label: 'Physical progress', format: (v) => `${v}%`, max: 100 },
  { key: 'awaitingDistrict', label: 'Reports awaiting district', format: (v) => formatIndian(v, { maxDecimals: 0 }) },
];

// One hue, light to dark: more is darker.
const RAMP = ['#e3eefb', '#b9d5f4', '#86b6ea', '#4f93df', '#2a78d6', '#1c5aa8'];
const NONE = '#e2e8f0';
const short = (text) => text.replace(' Lakh', ' L');

export function DistrictMap({ rows, onSelect, selected }) {
  const [metricKey, setMetricKey] = useState('budgetLakh');
  const [hover, setHover] = useState(null);
  const metric = METRICS.find((item) => item.key === metricKey);
  const byName = new Map(rows.map((row) => [row.name, row]));
  const values = DISTRICT_SHAPES.map((shape) => byName.get(shape.name)?.[metricKey] || 0);
  const top = metric.max || Math.max(...values, 0);
  const step = (value) => (top > 0 && value > 0 ? Math.min(RAMP.length - 1, Math.floor((value / top) * RAMP.length - 1e-9)) : -1);
  const unknown = rows.filter((row) => !DISTRICT_SHAPES.some((shape) => shape.name === row.name));
  const focus = hover || selected || null;
  const shown = focus ? byName.get(focus) : null;
  const outlined = DISTRICT_SHAPES.filter((shape) => shape.name === hover || shape.name === selected);

  const choose = (name) => { if (byName.has(name)) onSelect?.(name); };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor="map-metric" className="mb-1 block text-xs font-medium text-slate-600">Colour the map by</label>
          <select id="map-metric" value={metricKey} onChange={(event) => setMetricKey(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20">
            {METRICS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600" aria-hidden="true">
          <span>Low</span>
          <span className="flex overflow-hidden rounded">{RAMP.map((color) => <span key={color} className="h-3 w-6" style={{ backgroundColor: color }} />)}</span>
          <span>High{top > 0 ? ` (${metric.format(metric.max || top)})` : ''}</span>
          <span className="ml-3 inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded border border-slate-300" style={{ backgroundColor: NONE }} /> No projects</span>
        </div>
      </div>

      {rows.length === 0 && <div className="mb-4"><EmptyState>No project matches these filters, so no district is coloured.</EmptyState></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <svg viewBox={`-6 -6 ${MAP_WIDTH + 12} ${MAP_HEIGHT + 12}`} className="mx-auto h-auto w-full max-w-3xl" role="group" aria-label={`Map of Uttarakhand, districts coloured by ${metric.label}`}>
          {DISTRICT_SHAPES.map((shape) => {
            const row = byName.get(shape.name);
            const value = row?.[metricKey] || 0;
            const level = step(value);
            return (
              <path
                key={shape.name}
                d={shape.d}
                fillRule="evenodd"
                fill={level >= 0 ? RAMP[level] : NONE}
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
                tabIndex={0}
                role="button"
                aria-pressed={selected === shape.name}
                aria-label={`${shape.name}: ${row ? `${metric.label} ${metric.format(value)}, ${row.projects} project${row.projects === 1 ? '' : 's'}` : 'no projects'}`}
                onClick={() => choose(shape.name)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(shape.name); } }}
                onMouseEnter={() => setHover(shape.name)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(shape.name)}
                onBlur={() => setHover(null)}
                style={{ cursor: row ? 'pointer' : 'default', outline: 'none', transition: 'fill 200ms ease' }}
              />
            );
          })}

          {/* Outline of the district under the pointer and of the selected one, drawn above every fill */}
          {outlined.map((shape) => (
            <path key={`outline-${shape.name}`} d={shape.d} fill="none" stroke="#0f172a" strokeWidth={shape.name === selected ? 4 : 3} strokeLinejoin="round" pointerEvents="none" />
          ))}

          {/* Names and figures. The white halo keeps them readable on any shade. */}
          {DISTRICT_SHAPES.map((shape) => {
            const row = byName.get(shape.name);
            const halo = { paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 5, strokeLinejoin: 'round' };
            return (
              <g key={`label-${shape.name}`} pointerEvents="none" textAnchor="middle">
                <text x={shape.x} y={shape.y - (row ? 3 : -6)} fontSize="19" fontWeight="600" fill="#0f172a" style={halo}>{shape.short}</text>
                {row && <text x={shape.x} y={shape.y + 18} fontSize="16" fill="#334155" style={{ ...halo, fontVariantNumeric: 'tabular-nums' }}>{short(metric.format(row[metricKey] || 0))}</text>}
              </g>
            );
          })}
        </svg>

        <aside className="self-start rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm" aria-live="polite">
          {shown ? (
            <>
              <p className="font-semibold text-slate-900">{shown.name}{selected === shown.name && <span className="ml-2 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Filtered</span>}</p>
              <dl className="mt-2 space-y-1.5">
                {[['Projects', shown.projects], ['Sanctioned', formatLakh(shown.budgetLakh)], ['Released', formatLakh(shown.releasedLakh)], ['Spent', formatLakh(shown.spentLakh)],
                  ['Utilisation', `${shown.utilisationPercent}%`], ['Physical progress', `${shown.physicalPercent}%`], ['Reports', shown.reports], ['Awaiting district', shown.awaitingDistrict]].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-slate-500">{selected === shown.name ? 'Select the district again to remove the filter.' : 'Select the district to filter the whole page to it.'}</p>
            </>
          ) : focus ? (
            <><p className="font-semibold text-slate-900">{focus}</p><p className="mt-1 text-slate-500">No projects for these filters.</p></>
          ) : (
            <p className="text-slate-500">Point at a district to see its figures. Select it to filter the whole page to that district.</p>
          )}
        </aside>
      </div>
      {unknown.length > 0 && <p className="mt-3 text-xs text-slate-500">Not on the map: {unknown.map((row) => row.name).join(', ')}.</p>}
      <p className="mt-3 text-xs text-slate-500">District boundaries from the official Uttarakhand district boundary file. The same figures are in the table under Districts.</p>
    </div>
  );
}
