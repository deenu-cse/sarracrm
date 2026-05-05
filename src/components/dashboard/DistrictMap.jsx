import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export function DistrictMap({ data }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400">No district data available</div>;
  }

  const getApprovalRateColor = (rate) => {
    if (rate >= 70) return 'text-green-600 bg-green-50';
    if (rate >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">District</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Approved</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Pending</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Budget (₹L)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Rate %</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((row, index) => {
            const approvalRate = row.total > 0 ? Math.round((row.approved / row.total) * 100) : 0;
            return (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.district}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{row.total}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-right">{row.approved}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium text-right">{row.pending}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">{formatCurrency(row.budget).replace('₹', '').replace(' Lakh', '')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalRateColor(approvalRate)}`}>
                    {approvalRate}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
