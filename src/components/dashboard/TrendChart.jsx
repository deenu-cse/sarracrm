import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function TrendChart({ data }) {
  // null/undefined = not loaded yet or API failed
  if (!data) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-slate-400 gap-2">
        <span className="text-3xl">📈</span>
        <span className="text-sm">No trend data available</span>
      </div>
    );
  }

  // Empty array (0 months returned)
  if (data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-slate-400 gap-2">
        <span className="text-3xl">📈</span>
        <span className="text-sm">Submit your first DPR form to see trends</span>
      </div>
    );
  }

  // All values zero — show chart but add an info note
  const hasNonZero = data.some(d => d.submitted > 0 || d.approved > 0 || d.rejected > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-100">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center justify-between gap-4">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium text-slate-700">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col">
      {!hasNonZero && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-2 text-center">
          ⚠️ No submissions recorded for this year yet.
        </p>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
