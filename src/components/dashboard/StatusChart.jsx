import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  APPROVED: '#1e8449',
  REJECTED: '#c0392b',
  UNDER_REVIEW: '#f39c12',
  SUBMITTED: '#2980b9',
  RESUBMITTED: '#8e44ad',
  DRAFT: '#95a5a6',
};

const LABELS = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  UNDER_REVIEW: 'Under Review',
  SUBMITTED: 'Submitted',
  RESUBMITTED: 'Resubmitted',
  DRAFT: 'Draft',
};

/**
 * Accepts `data` in multiple formats:
 *  - Array:  [{ status: 'SUBMITTED', count: 2 }, ...]   (from API statusBreakdown)
 *  - Object: { SUBMITTED: 2, APPROVED: 1, ... }          (legacy key-value map)
 */
function normalise(data) {
  if (!data) return [];

  // Array format → [{status, count}]
  if (Array.isArray(data)) {
    return data
      .filter(d => d && d.count > 0)
      .map(d => ({
        name: LABELS[d.status] || d.status,
        value: d.count,
        color: COLORS[d.status] || '#bdc3c7',
      }));
  }

  // Object format → { STATUS: count }
  return Object.keys(data)
    .map(key => ({
      name: LABELS[key] || key,
      value: data[key],
      color: COLORS[key] || '#bdc3c7',
    }))
    .filter(item => item.value > 0);
}

export function StatusChart({ data }) {
  const chartData = normalise(data);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <span className="text-4xl">📊</span>
        <span className="text-sm">No status data yet</span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
          <p className="font-semibold text-slate-800">{payload[0].name}</p>
          <p className="text-slate-600">{payload[0].value} forms</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
