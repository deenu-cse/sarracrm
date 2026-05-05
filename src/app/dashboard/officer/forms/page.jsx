"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye } from "lucide-react";
import { useForms } from "@/hooks/useForms";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";

export default function OfficerFormsPage() {
  const router = useRouter();
  const { forms, loading, pagination, filters, applyFilters, changePage, deleteForm } = useForms("/reports/forms-list");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredForms = useMemo(() => {
    const safeForms = Array.isArray(forms) ? forms : [];
    if (typeFilter === "ALL") return safeForms;
    return safeForms.filter((item) => item?.formType === typeFilter);
  }, [forms, typeFilter]);

  const getTypeChip = (type) => {
    if (type === "SPRINGSHED") {
      return "bg-teal-100 text-teal-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  const viewForm = (item) => {
    const id = item?.dprId || item?._id;
    if (!id) return;
    router.push(`/dashboard/officer/forms/${id}?type=${item?.formType || "SPRINGSHED"}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My DPR Forms</h1>
          <p className="text-slate-500">Manage and track your submissions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/dashboard/officer/forms/new")} variant="primary">
            <Plus className="w-4 h-4 mr-2" /> Springshed DPR
          </Button>
          <Button
            onClick={() => router.push("/dashboard/officer/forms/streamshed/new")}
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Streamshed DPR
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Search by application number"
            value={filters.search || ""}
            onChange={(e) => applyFilters({ search: e.target.value })}
          />
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={filters.status || ""}
            onChange={(e) => applyFilters({ status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Forms</option>
            <option value="SPRINGSHED">Springshed</option>
            <option value="STREAMSHED">Streamshed</option>
          </select>
          <Button
            variant="ghost"
            className="border border-slate-200"
            onClick={() => {
              applyFilters({ search: "", status: "", dateFrom: "", dateTo: "" });
              setTypeFilter("ALL");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">App No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Form Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">District</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Block</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Springs/Streams</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading &&
              [1, 2, 3, 4, 5].map((row) => (
                <tr key={row}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
                    <td key={col} className="px-4 py-4">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && filteredForms.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  No forms found matching these filters.
                </td>
              </tr>
            )}
            {!loading &&
              filteredForms.map((item) => (
                <tr key={item?.dprId || item?._id || item?.applicationNo} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm text-[#0a3d62]">{item?.applicationNo || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeChip(item?.formType)}`}>
                      {item?.formType || "SPRINGSHED"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item?.district || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item?.block || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {item?.formType === "STREAMSHED" ? item?.streamCount || 0 : item?.springCount || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    ₹{Number(item?.totalBudgetLakh || 0).toFixed(2)} Lakh
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={item?.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="p-1 text-slate-500 hover:text-[#0a3d62]"
                        onClick={() => viewForm(item)}
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {(item?.status === "DRAFT" || item?.status === "REJECTED") && (
                        <>
                          <button
                            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                            onClick={() => router.push(`/dashboard/officer/forms/${item?.dprId || item?._id}/edit`)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => {
                              if (window.confirm("Delete this draft form?")) {
                                deleteForm(item?.dprId || item?._id, item?.formType);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
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
