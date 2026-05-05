"use client";
import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import Link from 'next/link';
import { formatDate } from '@/lib/formatters';

export default function MPRpraroop1bListPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  const query = new URLSearchParams();
  if (statusFilter) query.append('status', statusFilter);
  if (yearFilter) query.append('financialYear', yearFilter);
  
  const { data: mprsList, loading } = useFetch(`/mpr/praroop1b/my-reports?${query.toString()}`);
  const mprs = Array.isArray(mprsList) ? mprsList : (mprsList?.data || mprsList?.mprs || []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">MPR Reports</h1>
          <p className="text-slate-500">View and manage submitted Monthly Progress Reports</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <Link href="/dashboard/mnd/mpr" className="px-4 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium">
          Abstract 55
        </Link>
        <Link href="/dashboard/mnd/mpr/praroop1b" className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-bold">
          Praroop-1(B)
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 bg-slate-50">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400">
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400">
            <option value="">All Financial Years</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">MPR Ref No</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Schemes</th>
                <th className="px-6 py-4">Physical Progress</th>
                <th className="px-6 py-4">SARRA Spend (â‚¹L)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : mprs.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">No Praroop-1(B) reports found.</td></tr>
              ) : (
                mprs.map(mpr => (
                  <tr key={mpr._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{mpr.applicationNo}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{mpr.reportingMonth} {mpr.financialYear}</td>
                    <td className="px-6 py-4 text-slate-600">{mpr.totalApprovedSchemes || 0}</td>
                    <td className="px-6 py-4 text-slate-600">{mpr.computed?.grandTotalPhysicalProgress || 0}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">â‚¹{mpr.computed?.grandTotalSarraExpend?.toFixed(2) || '0.00'} L</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        mpr.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        mpr.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {mpr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(mpr.submittedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/mnd/mpr/praroop1b/${mpr._id}`} className="text-blue-600 hover:underline font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

