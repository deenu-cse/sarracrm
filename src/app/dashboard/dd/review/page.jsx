"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { useForms } from "@/hooks/useForms";
import { Pagination } from "@/components/ui/Pagination";
import { ExportButton } from "@/components/ui/ExportButton";
import { Badge } from "@/components/ui/Badge";

export default function DDReviewFormsPage() {
  const router = useRouter();
  const { forms, loading, pagination, filters, applyFilters, changePage } = useForms("/reports/forms-list");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filtered = useMemo(() => {
    const safe = Array.isArray(forms) ? forms : [];
    if (typeFilter === "ALL") return safe;
    return safe.filter((f) => f?.formType === typeFilter);
  }, [forms, typeFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Forms for Review</h1>
          <p className="text-slate-500">Review and approve district DPR forms</p>
        </div>
        <ExportButton filters={filters} availableTypes={['csv', 'excel']} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Search application no" value={filters.search || ""} onChange={(e) => applyFilters({ search: e.target.value })} />
        <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm" value={filters.status || ""} onChange={(e) => applyFilters({ status: e.target.value })}>
          <option value="">All Statuses</option><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under Review</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
        </select>
        <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="ALL">All Forms</option><option value="SPRINGSHED">Springshed</option><option value="STREAMSHED">Streamshed</option>
        </select>
        <button className="border border-slate-300 rounded-lg px-3 py-2 text-sm" onClick={() => { applyFilters({ search: "", status: "", department: "" }); setTypeFilter("ALL"); }}>Clear</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">App No</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Form Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Officer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Dept</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Springs/Streams</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Budget</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-200">
            {loading && [1, 2, 3].map((r) => <tr key={r}>{[1, 2, 3, 4, 5, 6, 7, 8].map((c) => <td key={c} className="px-4 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse" /></td>)}</tr>)}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No forms found in your district matching these filters.</td></tr>}
            {!loading && filtered.map((item) => (
              <tr key={item?.dprId || item?._id || item?.applicationNo} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-mono text-[#0a3d62]">{item?.applicationNo || "—"}</td>
                <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${item?.formType === "STREAMSHED" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>{item?.formType || "SPRINGSHED"}</span></td>
                <td className="px-4 py-3 text-sm text-slate-700">{item?.submittedBy?.name || item?.submittedByName || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{item?.department || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{item?.formType === "STREAMSHED" ? item?.streamCount || 0 : item?.springCount || 0}</td>
                <td className="px-4 py-3 text-sm text-slate-700">₹{Number(item?.totalBudgetLakh || 0).toFixed(2)} Lakh</td>
                <td className="px-4 py-3"><Badge status={item?.status} /></td>
                <td className="px-4 py-3 text-right"><button className="text-slate-500 hover:text-[#0a3d62]" onClick={() => router.push(`/dashboard/dd/review/${item?.dprId || item?._id}?type=${item?.formType || "SPRINGSHED"}`)}><Eye className="w-5 h-5 inline" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={pagination.page} 
        totalPages={pagination.totalPages} 
        totalItems={pagination.total} 
        limit={pagination.limit || 10}
        onPageChange={changePage} 
      />
    </div>
  );
}
