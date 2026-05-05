"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { Eye, Search, Filter, Calendar, X, FileText, BarChart3, ChevronRight, MapPin } from 'lucide-react';
import { get } from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
import { ExportButton } from "@/components/ui/ExportButton";
import { Badge } from '@/components/ui/Badge';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

export default function MNDAdminMPRList() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    financialYear: "2025-26",
    reportType: "ALL"
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.financialYear) queryParams.append('financialYear', filters.financialYear);

      const queryString = queryParams.toString();
      const requests = [];

      if (filters.reportType === "ALL" || filters.reportType === "ABSTRACT_55") {
        requests.push(get(`/mpr/abstract55/all-reports?${queryString}`).then(r => ({ type: 'ABSTRACT_55', res: r })));
      }
      if (filters.reportType === "ALL" || filters.reportType === "PRAROOP_1A") {
        requests.push(get(`/mpr/praroop1a/all-reports?${queryString}`).then(r => ({ type: 'PRAROOP_1A', res: r })));
      }
      if (filters.reportType === "ALL" || filters.reportType === "PRAROOP_1B") {
        requests.push(get(`/mpr/praroop1b/all-reports?${queryString}`).then(r => ({ type: 'PRAROOP_1B', res: r })));
      }

      const results = await Promise.all(requests);
      
      let merged = [];
      results.forEach(item => {
        if (item.res?.success) {
          const list = Array.isArray(item.res.data) ? item.res.data : (item.res.data?.data || []);
          merged = [...merged, ...list.map(r => ({ 
            ...r, 
            reportType: r.reportType || item.type
          }))];
        }
      });

      merged.sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
      
      setReports(merged);
      setPagination(prev => ({ ...prev, total: merged.length }));
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRowClick = (item) => {
    const baseUrl = item.reportType === 'PRAROOP_1A' ? '/dashboard/mnd-admin/mpr/praroop1a' : 
                    item.reportType === 'PRAROOP_1B' ? '/dashboard/mnd-admin/mpr/praroop1b' : 
                    '/dashboard/mnd-admin/mpr';
    router.push(`${baseUrl}/${item._id}`);
  };

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MPR Intelligence Hub</h1>
            <p className="text-slate-500 font-medium mt-1">Centralized review and analytics for all state-level reports.</p>
          </div>
          <div className="flex gap-3">
             <ExportButton filters={filters} availableTypes={['csv', 'excel']} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="w-full border border-slate-200 bg-slate-50 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
              placeholder="Application ID..." 
              value={filters.search} 
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} 
            />
          </div>
          
          <select 
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10" 
            value={filters.reportType} 
            onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
          >
            <option value="ALL">All Report Types</option>
            <option value="ABSTRACT_55">Abstract-55 (Budget)</option>
            <option value="PRAROOP_1A">Praroop-1(A) (Springs)</option>
            <option value="PRAROOP_1B">Praroop-1(B) (Rivers)</option>
          </select>

          <select 
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10" 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select 
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10" 
            value={filters.financialYear} 
            onChange={(e) => setFilters(prev => ({ ...prev, financialYear: e.target.value }))}
          >
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </select>

          <button 
            className="bg-slate-900 text-white rounded-xl px-3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200" 
            onClick={() => setFilters({ search: "", status: "", financialYear: "2025-26", reportType: "ALL" })}
          >
            <X className="w-4 h-4" /> Reset Filters
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference & Type</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">District Info</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reporting Period</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Volume/Metric</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">SARRA Share</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Review Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((r) => (
                  <tr key={r}>
                    {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                      <td key={c} className="px-6 py-5">
                        <div className="h-4 bg-slate-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <FileText className="w-12 h-12 text-slate-200" />
                       <p className="font-bold text-slate-400">No reports found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((item) => {
                  const typeLabel = item.reportType === 'PRAROOP_1A' ? 'Praroop-1(A)' : item.reportType === 'PRAROOP_1B' ? 'Praroop-1(B)' : 'Abstract-55';
                  const isPraroop = item.reportType !== 'ABSTRACT_55';
                  return (
                    <tr 
                      key={item._id} 
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold text-[#0a3d62] group-hover:underline">{item.applicationNo}</span>
                          <Badge className={`mt-1 w-fit text-[10px] ${item.reportType === 'PRAROOP_1B' ? 'bg-cyan-100 text-cyan-800' : 'bg-blue-50 text-blue-600'}`}>
                            {typeLabel}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <MapPin size={14} className="text-slate-400" />
                           <span className="text-sm text-slate-700 font-bold">{item.submittedByDistrict}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-slate-400" />
                           <span className="text-sm text-slate-600 font-medium">{item.reportingMonth}, {item.financialYear}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPraroop ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{item.computed?.grandTotalPhysicalProgress || 0} Units</span>
                            <span className="text-[10px] text-slate-400">Physical Progress</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{item.computed?.totalProposalsAllDepts || 0} Projects</span>
                            <span className="text-[10px] text-slate-400">Total Proposals</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-900">
                             ₹{(isPraroop ? item.computed?.grandTotalSarraExpend : item.computed?.totalSarraShareLakh)?.toFixed(2)} L
                           </span>
                           <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Expenditure</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={item.status} className="px-3 py-1 font-bold text-[10px] rounded-lg shadow-sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0a3d62] group-hover:text-white transition-all">
                              <ChevronRight className="w-4 h-4" />
                           </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={pagination.page} 
          totalPages={pagination.totalPages} 
          totalItems={pagination.total} 
          limit={pagination.limit}
          onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} 
        />
      </div>
    </RoleGuard>
  );
}

