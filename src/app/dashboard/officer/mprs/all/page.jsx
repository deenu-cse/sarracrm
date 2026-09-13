"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatters';
import { ClipboardList, ArrowLeft, Search } from 'lucide-react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

const FORM_TYPES = [
  { key: 'praroop1a', label: 'Praroop-1(A)' },
  { key: 'praroop1b', label: 'Praroop-1(B)' },
  { key: 'praroop1c', label: 'Praroop-1(C)' },
  { key: 'praroop1d', label: 'Praroop-1(D)' },
];

function MPRTable({ formType, label, searchTerm }) {
  const { data: rawData, loading } = useFetch(`/mpr/${formType}/my-reports`, []);
  const mprs = Array.isArray(rawData) ? rawData : (rawData?.data || []);

  const filteredMprs = mprs.filter(mpr => 
    (mpr.applicationNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mpr.reportingMonth || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mpr.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="p-4 space-y-2">
      {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
    </div>
  );
  if (!filteredMprs.length) return null;

  return (
    <div className="mb-6">
      <div className="px-6 py-3 bg-slate-50 border-y border-slate-200">
        <span className="text-sm font-bold text-slate-700">{label} Reports</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-white border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">Application / Ref</th>
              <th className="px-6 py-3">Period</th>
              <th className="px-6 py-3">Last Updated</th>
              <th className="px-6 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredMprs.map(mpr => (
              <tr key={mpr._id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/officer/mprs/${formType}/${mpr._id}`}
                    className="font-mono font-bold text-navy group-hover:text-blue-600 transition-colors"
                  >
                    {mpr.applicationNo || `Draft-${mpr._id?.slice(-6)}`}
                  </Link>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">
                  {mpr.reportingMonth} {mpr.financialYear}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {formatDate(mpr.updatedAt || mpr.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Badge status={mpr.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AllOfficerMPRsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <RoleGuard allowedRoles={[USER_ROLES.PIA_OFFICER]}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/officer/mprs" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">All Submitted MPRs</h1>
              <p className="text-slate-500 text-sm">View and track all your historical monthly progress reports</p>
            </div>
          </div>
          
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <Card noPadding className="overflow-hidden">
          {FORM_TYPES.map(({ key, label }) => (
            <MPRTable key={key} formType={key} label={label} searchTerm={searchTerm} />
          ))}
          
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-center">
            <p className="text-xs text-slate-400">Showing all records matching your search criteria.</p>
          </div>
        </Card>

      </div>
    </RoleGuard>
  );
}
