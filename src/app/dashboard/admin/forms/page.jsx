"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useMPRForms } from '@/hooks/useMPRForms';
import { FilterBar } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/formatters';
import { FileText, Trash2, Eye } from 'lucide-react';

export default function AdminFormsPage() {
  const router = useRouter();
  const { forms, loading, pagination, filters, applyFilters, changePage, deleteForm } = useMPRForms();

  return (
    <div className="p-6 max-w-[1700px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">MPR Forms Directory</h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Manage and review all submitted MPRs</p>
      </div>

      <FilterBar 
        filters={filters} 
        onChange={applyFilters} 
        onApply={() => {}} // Hook auto-fetches on filter change
        onClear={() => applyFilters({ search: '', status: '', district: '', formType: '', financialYear: '', reportingMonth: '' })}
        options={{
          formType: [
            { value: 'PRAROOP_1A', label: 'Praroop 1A' },
            { value: 'PRAROOP_1B', label: 'Praroop 1B' },
            { value: 'PRAROOP_1C', label: 'Praroop 1C' },
            { value: 'PRAROOP_1D', label: 'Praroop 1D' },
            { value: 'ABSTRACT_55', label: 'Abstract 55' },
          ],
          financialYear: [
            { value: '2023-2024', label: '2023-2024' },
            { value: '2024-2025', label: '2024-2025' }
          ],
          reportingMonth: [
            { value: 'April', label: 'April' },
            { value: 'May', label: 'May' },
            { value: 'June', label: 'June' },
            { value: 'July', label: 'July' },
            { value: 'August', label: 'August' },
            { value: 'September', label: 'September' },
            { value: 'October', label: 'October' },
            { value: 'November', label: 'November' },
            { value: 'December', label: 'December' },
            { value: 'January', label: 'January' },
            { value: 'February', label: 'February' },
            { value: 'March', label: 'March' }
          ],
          status: [
            { value: 'SUBMITTED', label: 'Pending Review' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' }
          ]
        }}
      />

      {loading ? (
        <FullPageSpinner />
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Application No</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Form Type</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">District</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenditure (₹L)</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {forms.map((form) => (
                  <tr key={form._id || form.mprId} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900">{form.applicationNo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200">
                        {form.reportType || form.formType || 'PRAROOP_1A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-800">{form.submittedByDistrict}</p>
                      <p className="text-xs text-slate-500">{form.submittedBy?.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-800">{form.reportingMonth}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{form.financialYear}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-black text-indigo-600">{(form.computed?.grandTotalSarraExpend || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={form.status} className="uppercase font-bold tracking-widest text-[10px]" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => router.push(`/dashboard/admin/forms/${form._id || form.mprId}`)} 
                          variant="secondary"
                          className="px-3 py-1.5 rounded-lg text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to delete this MPR?')) {
                              deleteForm(form._id || form.mprId, form.reportType || form.formType || 'PRAROOP_1A');
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {forms.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No MPR forms found</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Pagination 
          currentPage={pagination.page} 
          totalPages={pagination.totalPages} 
          totalItems={pagination.total} 
          limit={10}
          onPageChange={changePage} 
        />
      </div>
    </div>
  );
}
