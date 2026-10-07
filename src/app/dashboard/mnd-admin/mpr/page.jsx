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
import { fetchStateMprs } from '@/lib/mprApi';
import { RegisterDownload } from '@/components/mpr/MprEvidence';
import { downloadMprRegister } from '@/lib/lifecycleApi';

// Statuses that exist for project MPRs. Any other status filter can only match the older report types.
const PROJECT_MPR_STATUSES = ['SUBMITTED', 'DISTRICT_APPROVED', 'RETURNED_TO_PIA', 'STATE_VERIFIED'];

export default function MNDAdminMPRList() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    financialYear: "",
    reportType: "ALL"
  });
  const [projectSummary, setProjectSummary] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

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
      if (filters.reportType === "ALL" || filters.reportType === "PRAROOP_1C") {
        requests.push(get(`/mpr/praroop1c/all-reports?${queryString}`).then(r => ({ type: 'PRAROOP_1C', res: r })));
      }
      if (filters.reportType === "ALL" || filters.reportType === "PRAROOP_1D") {
        requests.push(get(`/mpr/praroop1d/all-reports?${queryString}`).then(r => ({ type: 'PRAROOP_1D', res: r })));
      }

      // Project MPRs (department-wise, forms 55-(1-3) and 55(4)) live in their own collection.
      const wantsProjectMprs = (filters.reportType === "ALL" || filters.reportType === "PROJECT_MPR")
        && (!filters.status || PROJECT_MPR_STATUSES.includes(filters.status));
      setLoadError("");
      if (wantsProjectMprs) {
        requests.push(
          fetchStateMprs({ page: pagination.page, limit: pagination.limit, search: filters.search, status: filters.status, financialYear: filters.financialYear })
            .then((result) => {
              setProjectSummary(result.summary);
              return {
                type: 'PROJECT_MPR',
                res: {
                  success: true,
                  data: result.items.map((mpr) => ({
                    _id: mpr.id,
                    reportType: 'PROJECT_MPR',
                    applicationNo: mpr.mprNo,
                    submittedByDistrict: mpr.district,
                    reportingMonth: mpr.reportingMonth,
                    financialYear: mpr.financialYear,
                    status: mpr.status,
                    submittedAt: mpr.submittedAt,
                    projectMpr: mpr,
                  })),
                },
              };
            })
            .catch((err) => { setProjectSummary(null); setLoadError(err.message); return { type: 'PROJECT_MPR', res: { success: false } }; })
        );
      } else {
        setProjectSummary(null);
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
    if (item.reportType === 'PROJECT_MPR') {
      router.push(`/dashboard/mnd-admin/mpr/project/${item._id}`);
      return;
    }
    const baseUrl = item.reportType === 'PRAROOP_1A' ? '/dashboard/mnd-admin/mpr/praroop1a' : 
                    item.reportType === 'PRAROOP_1B' ? '/dashboard/mnd-admin/mpr/praroop1b' : 
                    item.reportType === 'PRAROOP_1C' ? '/dashboard/mnd-admin/mpr/praroop1c' : 
                    item.reportType === 'PRAROOP_1D' ? '/dashboard/mnd-admin/mpr/praroop1d' : 
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
             <RegisterDownload label="Project MPR Register (Excel)" download={() => downloadMprRegister({ search: filters.search, status: PROJECT_MPR_STATUSES.includes(filters.status) ? filters.status : '', financialYear: /^\d{4}-\d{2}$/.test(filters.financialYear || '') ? filters.financialYear : '' })} />
             <ExportButton filters={filters} availableTypes={['csv', 'excel']} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="w-full border border-slate-200 bg-slate-50 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
              placeholder="Report no., project ID or name..." 
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
            <option value="PROJECT_MPR">Project MPR (55-(1-3) / 55(4))</option>
            <option value="ABSTRACT_55">Abstract-55 (Budget)</option>
            <option value="PRAROOP_1A">Praroop-1(A) (Springs)</option>
            <option value="PRAROOP_1B">Praroop-1(B) (Rivers)</option>
            <option value="PRAROOP_1C">Praroop-1(C) (Major Rivers)</option>
            <option value="PRAROOP_1D">Praroop-1(D) (Ground Water)</option>
          </select>

          <select 
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10" 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Pending Review</option>
            <option value="DISTRICT_APPROVED">Approved by District</option>
            <option value="STATE_VERIFIED">Verified by State</option>
            <option value="RETURNED_TO_PIA">Returned to PIA</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select 
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10" 
            value={filters.financialYear} 
            onChange={(e) => setFilters(prev => ({ ...prev, financialYear: e.target.value }))}
          >
            <option value="">All Years</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
            <option value="2027-28">2027-28</option>
          </select>

          <button 
            className="bg-slate-900 text-white rounded-xl px-3 py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200" 
            onClick={() => setFilters({ search: "", status: "", financialYear: "", reportType: "ALL" })}
          >
            <X className="w-4 h-4" /> Reset Filters
          </button>
        </div>

        {loadError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button type="button" onClick={fetchReports} className="px-3 py-1 rounded-lg border border-red-300 bg-white text-xs font-bold hover:bg-red-100">Retry</button>
          </div>
        )}

        {projectSummary && projectSummary.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ['Project MPRs', projectSummary.total, ''],
              ['Awaiting District', projectSummary.counts.SUBMITTED, 'SUBMITTED'],
              ['Awaiting State Verification', projectSummary.counts.DISTRICT_APPROVED, 'DISTRICT_APPROVED'],
              ['Verified by State', projectSummary.counts.STATE_VERIFIED, 'STATE_VERIFIED'],
              ['Returned to PIA', projectSummary.counts.RETURNED_TO_PIA, 'RETURNED_TO_PIA'],
            ].map(([label, count, status]) => (
              <button
                key={label}
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, reportType: 'PROJECT_MPR', status }))}
                className={`text-left bg-white rounded-2xl border px-4 py-3 shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${filters.reportType === 'PROJECT_MPR' && filters.status === status ? 'border-[#0a3d62]' : 'border-slate-200'}`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                <span className="block text-2xl font-bold text-slate-900 tabular-nums mt-1">{count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left min-w-[980px]">
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
                  if (item.reportType === 'PROJECT_MPR') {
                    const mpr = item.projectMpr;
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                        onClick={() => handleRowClick(item)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRowClick(item); }}
                        tabIndex={0}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-bold text-[#0a3d62] group-hover:underline">{mpr.mprNo}</span>
                            <span className="mt-1 w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Project MPR · {mpr.formType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-700 font-bold">{mpr.district}</span>
                          </div>
                          <span className="block text-xs text-slate-500 mt-0.5">{mpr.departmentName}</span>
                          <span className="block font-mono text-[11px] text-slate-400">{mpr.project?.code}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600 font-medium">{mpr.period}</span>
                          </div>
                          <span className="block text-[11px] text-slate-400 mt-0.5">FY {mpr.financialYear} · Head {mpr.head?.code}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{mpr.totals?.physicalPercent ?? 0}% achieved</span>
                            <span className="text-[10px] text-slate-400">Physical · {mpr.totals?.activitiesCompleted ?? 0}/{mpr.totals?.activities ?? 0} activities done</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">₹{(mpr.totals?.financialCurrentLakh || 0).toFixed(2)} L</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">This month · ₹{(mpr.totals?.financialTotalLakh || 0).toFixed(2)} L total</span>
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
                    );
                  }
                  const typeLabel = item.reportType === 'PRAROOP_1A' ? 'Praroop-1(A)' : 
                                    item.reportType === 'PRAROOP_1B' ? 'Praroop-1(B)' : 
                                    item.reportType === 'PRAROOP_1C' ? 'Praroop-1(C)' : 
                                    item.reportType === 'PRAROOP_1D' ? 'Praroop-1(D)' : 
                                    'Abstract-55';
                  const isPraroop = item.reportType !== 'ABSTRACT_55';
                  const badgeClass = item.reportType === 'PRAROOP_1B' ? 'bg-cyan-100 text-cyan-800' : 
                                     item.reportType === 'PRAROOP_1C' ? 'bg-indigo-100 text-indigo-800' :
                                     item.reportType === 'PRAROOP_1D' ? 'bg-teal-100 text-teal-800' :
                                     'bg-blue-50 text-blue-600';
                  return (
                    <tr 
                      key={item._id} 
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold text-[#0a3d62] group-hover:underline">{item.applicationNo}</span>
                          <Badge className={`mt-1 w-fit text-[10px] ${badgeClass}`}>
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

