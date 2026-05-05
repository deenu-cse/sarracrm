import React, { useEffect } from 'react';
import { FloatInput } from '../shared/FloatInput';
import { TableInput } from '../shared/TableInput';
import { formatCurrency } from '@/lib/formatters';

export default function Section10({ data, onChange, errors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleActivitiesChange = (activities) => {
    // Calculate total from activities automatically
    const total = activities.reduce((sum, act) => sum + (act.total || 0), 0);
    onChange({ activities, totalProposedBudget: total });
  };

  const activityColumns = [
    { key: 'name', label: 'Activity Name', type: 'text', required: true, width: 'w-1/3' },
    { key: 'unit', label: 'Unit', type: 'text', required: true },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true },
    { key: 'rate', label: 'Rate (₹L)', type: 'number', required: true },
    { key: 'total', label: 'Total (₹L)', type: 'readonly' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">10. Budget and Financials</h2>
        <p className="text-sm text-slate-500 mt-1">Proposed budget breakdown and funding sources.</p>
      </div>

      <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Activity Costing</h3>
        <TableInput
          columns={activityColumns}
          data={data?.activities || []}
          onChange={handleActivitiesChange}
          addLabel="Add Activity"
          minRows={1}
        />
        {errors?.activities && <p className="text-red-500 text-sm mt-2">{errors.activities}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Total Proposed Budget</label>
          <div className="text-2xl font-bold text-navy bg-blue-50 border border-blue-100 rounded-lg p-4">
            {formatCurrency(data?.totalProposedBudget)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Automatically calculated from activities above.</p>
        </div>

        <FloatInput
          id="convergenceBudget"
          label="Convergence Budget (₹L)"
          type="number"
          value={data?.convergenceBudget || ''}
          onChange={handleChange}
          error={errors?.convergenceBudget}
        />

        <FloatInput
          id="sarraShare"
          label="SARRA Share (₹L)"
          type="number"
          value={data?.sarraShare || ''}
          onChange={handleChange}
          error={errors?.sarraShare}
          required
        />

        <FloatInput
          id="expectedCompletionMonths"
          label="Expected Completion (Months)"
          type="number"
          value={data?.expectedCompletionMonths || ''}
          onChange={handleChange}
          error={errors?.expectedCompletionMonths}
          required
        />
      </div>
    </div>
  );
}
