import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Eye, Edit, Trash2 } from 'lucide-react';

export function FormsTable({ forms, columns, actions, loading, emptyMessage = "No forms found matching your criteria." }) {
  const getFormId = (form) => form?.dprId || form?._id;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {(columns || []).map((col, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                  {(columns || []).map((col, j) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-slate-200 rounded w-full max-w-[100px]"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Safety: ensure forms is always an array ────────────────────────────────
  const safeforms = Array.isArray(forms) ? forms : [];

  if (safeforms.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const renderCell = (form, col) => {
    switch (col.key) {
      case 'applicationNo':
        return (
          <span
            className="font-mono text-sm text-navy font-medium cursor-pointer hover:underline"
            onClick={() => actions?.view && actions.view(getFormId(form), form)}
          >
            {form.applicationNo || 'DRAFT'}
          </span>
        );

      case 'formType':
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${form.formType === 'STREAMSHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
            {form.formType || 'SPRINGSHED'}
          </span>
        );

      case 'status':
        return <Badge status={form.status} />;

      case 'budget':
      case 'section10_budgetAndPlan.table101.totalBudgetLakh':
        // Handle the nested budget path directly
        return formatCurrency(
          form?.section10_budgetAndPlan?.table101?.totalBudgetLakh ??
          form?.totalBudgetLakh ??
          form?.financials?.totalProposedBudget
        );

      case 'date':
      case 'submittedAt':
        return formatDate(form.submittedAt || form.createdAt);

      case 'daysWaiting': {
        const days = form.daysWaiting || 0;
        let badgeColor = 'bg-green-100 text-green-800';
        if (days >= 7 && days < 14) badgeColor = 'bg-yellow-100 text-yellow-800';
        if (days >= 14) badgeColor = 'bg-red-100 text-red-800 font-bold';
        return <span className={`px-2 py-1 rounded text-xs ${badgeColor}`}>{days} days</span>;
      }

      case 'springCount':
        return form.formType === 'STREAMSHED' ? (form.streamCount || '-') : (form.springCount || '-');

      default: {
        // Generic dot-path accessor (handles up to 3 levels)
        const value = col.key.split('.').reduce((obj, k) => (obj != null ? obj[k] : null), form);
        return value ?? '-';
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {(columns || []).map((col, i) => (
                <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {safeforms.map((form) => (
              <tr key={getFormId(form) || form.applicationNo} className="hover:bg-slate-50 transition-colors">
                {(columns || []).map((col, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {renderCell(form, col)}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {actions.view && (
                        <button onClick={() => actions.view(getFormId(form), form)} className="text-slate-400 hover:text-navy p-1" title="View">
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      {actions.edit && (form.status === 'DRAFT' || form.status === 'REJECTED') && (
                        <button onClick={() => actions.edit(getFormId(form), form)} className="text-slate-400 hover:text-blue-600 p-1" title="Edit">
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {actions.delete && (form.status === 'DRAFT' || form.status === 'REJECTED' || form.status === 'RETURNED') && (
                        <button onClick={() => actions.delete(form)} className="text-slate-400 hover:text-red-600 p-1" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
