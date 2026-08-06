"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { get, patch } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, Download, PieChart as PieIcon, Table as TableIcon, Activity } from "lucide-react";
import { useUI } from "@/contexts/UIContext";
import { Badge } from "@/components/ui/Badge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { USER_ROLES } from "@/constants/roles";

const formatDateTime = (val) => {
  try { return val ? format(new Date(val), "dd MMM yyyy, hh:mm a") : "—"; } catch { return "—"; }
};

const DISTRICTS = [
  'Almora', 'Nainital', 'Champawat', 'U S Nagar', 'Pithoragarh',
  'Bageshwar', 'Dehradun', 'Haridwar', 'Tehri', 'Chamoli',
  'Uttarkashi', 'Rudraprayag', 'Pauri'
];

export default function MNDAdminReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useUI();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSections, setOpenSections] = useState([1, 2]);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchForm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await get(`/mpr/abstract55/${id}`);
      if (res?.success) setForm(res.data);
      else throw new Error(res?.message || "Failed to load");
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForm(); }, [id]);

  useEffect(() => {
    const markUnderReview = async () => {
      if (!form || form?.status !== "SUBMITTED") return;
      await patch(`/mpr/abstract55/${id}/status`, { status: "UNDER_REVIEW" });
    };
    markUnderReview();
  }, [form, id]);

  const approve = async () => {
    if (!form) return;
    if (!window.confirm('Are you sure you want to approve this MPR?')) return;
    setSubmitting(true);
    const res = await patch(`/mpr/abstract55/${id}/approve`);
    if (res?.success) {
      addToast("MPR approved successfully", "success");
      router.push("/dashboard/mnd-admin/mpr");
    } else {
      addToast(res?.message || "Approve failed", "error");
    }
    setSubmitting(false);
  };

  const reject = async () => {
    if (!form) return;
    if (!rejectReason.trim()) {
      addToast("Please enter rejection reason", "error");
      return;
    }
    setSubmitting(true);
    const res = await patch(`/mpr/abstract55/${id}/reject`, { rejectionReason: rejectReason.trim() });
    if (res?.success) {
      addToast("MPR rejected", "success");
      router.push("/dashboard/mnd-admin/mpr");
    } else {
      addToast(res?.message || "Reject failed", "error");
    }
    setSubmitting(false);
  };

  const chartData = useMemo(() => {
    if (!form) return null;
    const deptData = form.computed.departmentTotals.map(d => ({
      name: d.department,
      deptShare: d.totalDeptShare,
      sarraShare: d.totalSarraShare,
    }));
    const donutData = [
      { name: 'Dept Share', value: form.computed.totalDeptShareLakh, color: '#0a3d62' },
      { name: 'SARRA Share', value: form.computed.totalSarraShareLakh, color: '#3b82f6' }
    ];
    return { deptData, donutData };
  }, [form]);

  const toggle = (n) => setOpenSections((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  if (loading) return <div className="p-12 space-y-4 max-w-7xl mx-auto">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-xl" />)}</div>;
  if (error || !form) return <div className="p-12 max-w-7xl mx-auto"><div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-6 shadow-sm">{error || "Unable to load form"} <button onClick={fetchForm} className="underline ml-2 font-bold">Retry</button></div></div>;

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 max-w-[1800px] mx-auto">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex justify-between items-start">
              <div>
                <button onClick={() => router.push("/dashboard/mnd-admin/mpr")} className="inline-flex items-center text-sm font-semibold text-[#0a3d62] mb-2 hover:translate-x-[-4px] transition-transform"><ArrowLeft className="w-4 h-4 mr-1" /> Back to MPR list</button>
                <h1 className="font-mono text-2xl font-bold text-slate-900 tracking-tight">{form?.applicationNo}</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Submitted by {form?.submittedByDistrict} District • {form?.reportingMonth} {form?.financialYear}</p>
              </div>
              <Badge status={form?.status} className="px-4 py-1.5 rounded-full font-bold text-xs" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Total Proposals" value={form?.computed?.totalProposalsAllDepts} sub="Across all depts" />
              <StatBox label="SARRA Share" value={`₹${form?.computed?.totalSarraShareLakh?.toFixed(2)} L`} sub="Convergence part" />
              <StatBox label="Dept Share" value={`₹${form?.computed?.totalDeptShareLakh?.toFixed(2)} L`} sub="Institutional part" />
              <StatBox label="Grand Total" value={`₹${(form?.computed?.totalSarraShareLakh + form?.computed?.totalDeptShareLakh)?.toFixed(2)} L`} sub="Overall budget" />
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 p-5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><PieIcon size={18} /></div>
                  <span className="font-bold text-slate-800">1. Funding Distribution Analytics</span>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ${openSections.includes(1) ? "max-h-[1000px] p-6 border-t border-slate-100" : "max-h-0"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-[300px]">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Institutional vs Convergence</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData.donutData} innerRadius={60} outerRadius={90} paddingAngle={10} dataKey="value">
                            {chartData.donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[300px]">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Departmental Share (₹L)</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.deptData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                          <Tooltip />
                          <Bar dataKey="sarraShare" name="SARRA" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="deptShare" name="Dept" stackId="a" fill="#0a3d62" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              {/* Approval Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> Review Panel</h3>

                {form?.status === 'SUBMITTED' || form?.status === 'UNDER_REVIEW' ? (
                  <div className="space-y-3">
                    <button
                      onClick={approve}
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm inline-flex justify-center items-center gap-2 transition-all shadow-md shadow-green-100 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve MPR
                    </button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or Reject</span></div>
                    </div>

                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/10 outline-none transition-all resize-none bg-slate-50"
                      placeholder="Reason for rejection..."
                    />
                    <button
                      onClick={reject}
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm inline-flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Send Back to District
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-sm font-bold text-slate-500">This MPR is already</p>
                    <Badge status={form?.status} className="mt-2 px-6 py-1" />
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-2">Export Data</h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">Download this report as a PDF or Excel sheet for offline records.</p>
                <button className="w-full py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  <Download size={16} /> Download Intelligence
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-10">
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TableIcon size={18} /></div>
            <span className="font-bold text-slate-800">2. Comprehensive MPR Matrix</span>
          </div>
          <div className={`overflow-hidden transition-all duration-500 ${openSections.includes(2) ? "max-h-[2000px] border-t border-slate-100" : "max-h-0"}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th rowSpan={2} className="p-3 border-r border-slate-800 font-bold uppercase sticky left-0 z-10 bg-slate-900">District</th>
                    {form.departments.map(d => (
                      <th key={d.departmentName} colSpan={3} className="p-2 border-b border-slate-800 text-center font-bold uppercase border-r border-slate-800">
                        {d.departmentName}
                      </th>
                    ))}
                    <th colSpan={3} className="p-2 border-b border-slate-800 bg-[#0a3d62] text-center font-bold uppercase">District Total</th>
                  </tr>
                  <tr className="bg-slate-800 text-slate-300">
                    {form.departments.map(d => (
                      <React.Fragment key={d.departmentName}>
                        <th className="p-1 font-semibold border-r border-slate-700">NO.</th>
                        <th className="p-1 font-semibold border-r border-slate-700">DEPT</th>
                        <th className="p-1 font-semibold border-r border-slate-700">SARRA</th>
                      </React.Fragment>
                    ))}
                    <th className="p-1 font-semibold bg-slate-700 border-r border-slate-600">NO.</th>
                    <th className="p-1 font-semibold bg-slate-700 border-r border-slate-600">DEPT</th>
                    <th className="p-1 font-semibold bg-slate-700">SARRA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DISTRICTS.map((dist) => {
                    const distTotal = form.computed.districtTotals.find(t => t.district === dist) || { totalProposals: 0, totalDeptShare: 0, totalSarraShare: 0 };
                    return (
                      <tr key={dist} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 border-r border-slate-100 font-bold text-slate-800 bg-slate-50/50 sticky left-0 z-10">{dist}</td>
                        {form.departments.map(d => {
                          const dt = d.districts[dist] || { noOfProposals: 0, deptShareLakh: 0, sarraShareLakh: 0 };
                          return (
                            <React.Fragment key={d.departmentName}>
                              <td className="p-1 text-center text-slate-500 border-r border-slate-50">{dt.noOfProposals || '—'}</td>
                              <td className="p-1 text-right text-slate-500 border-r border-slate-50">{dt.deptShareLakh ? dt.deptShareLakh.toFixed(2) : '—'}</td>
                              <td className="p-1 text-right text-slate-500 border-r border-slate-50">{dt.sarraShareLakh ? dt.sarraShareLakh.toFixed(2) : '—'}</td>
                            </React.Fragment>
                          )
                        })}
                        <td className="p-1 text-center font-bold text-[#0a3d62] bg-blue-50/50 border-r border-blue-100">{distTotal.totalProposals || '—'}</td>
                        <td className="p-1 text-right font-bold text-[#0a3d62] bg-blue-50/50 border-r border-blue-100">{distTotal.totalDeptShare ? distTotal.totalDeptShare.toFixed(2) : '—'}</td>
                        <td className="p-1 text-right font-bold text-[#0a3d62] bg-blue-50/50">{distTotal.totalSarraShare ? distTotal.totalSarraShare.toFixed(2) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0a3d62] text-white font-bold uppercase">
                    <td className="p-3 sticky left-0 z-10 bg-[#0a3d62]">Grand Total</td>
                    {form.departments.map(d => {
                      const deptTotal = form.computed.departmentTotals.find(t => t.department === d.departmentName) || { totalProposals: 0, totalDeptShare: 0, totalSarraShare: 0 };
                      return (
                        <React.Fragment key={d.departmentName}>
                          <td className="p-1 text-center border-r border-[#1a5276]">{deptTotal.totalProposals || '—'}</td>
                          <td className="p-1 text-right border-r border-[#1a5276]">{deptTotal.totalDeptShare ? deptTotal.totalDeptShare.toFixed(2) : '—'}</td>
                          <td className="p-1 text-right border-r border-[#1a5276]">{deptTotal.totalSarraShare ? deptTotal.totalSarraShare.toFixed(2) : '—'}</td>
                        </React.Fragment>
                      )
                    })}
                    <td className="p-1 text-center bg-blue-900 border-r border-blue-800">{form.computed.totalProposalsAllDepts}</td>
                    <td className="p-1 text-right bg-blue-900 border-r border-blue-800">{form.computed.totalDeptShareLakh.toFixed(2)}</td>
                    <td className="p-1 text-right bg-blue-900">{form.computed.totalSarraShareLakh.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value || "0"}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-1">{sub}</p>
    </div>
  );
}
