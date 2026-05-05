"use client";
import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { patch } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';
import { BarChart3, FileText, CheckCircle, XCircle, ArrowLeft, Download, MapPin, Calendar, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

export default function MNDAdminPraroop1AReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: mpr, loading, refetch } = useFetch(`/mpr/praroop1a/${id}`);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (loading) return <div className="p-12 space-y-4 max-w-7xl mx-auto">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-2xl" />)}</div>;
  if (!mpr) return <div className="p-12 text-center text-red-500">Report not found</div>;

  const canReview = mpr.status === 'SUBMITTED' || mpr.status === 'UNDER_REVIEW';

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this Praroop-1(A) MPR?')) return;
    setIsApproving(true);
    try {
      const res = await patch(`/mpr/praroop1a/${id}/approve`, { note: 'Approved by State Admin' });
      if (res.success) {
        toast.success('MPR Approved Successfully');
        router.push("/dashboard/mnd-admin/mpr");
      } else {
        toast.error(res.message || 'Failed to approve');
      }
    } catch (err) {
      toast.error('An error occurred during approval');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reason for rejection');
      return;
    }
    setIsRejecting(true);
    try {
      const res = await patch(`/mpr/praroop1a/${id}/reject`, { note: rejectReason.trim() });
      if (res.success) {
        toast.success('MPR Sent Back to District');
        router.push("/dashboard/mnd-admin/mpr");
      } else {
        toast.error(res.message || 'Failed to reject');
      }
    } catch (err) {
      toast.error('An error occurred during rejection');
    } finally {
      setIsRejecting(false);
    }
  };

  // Data prep for charts
  const activityData = mpr.activities?.filter(a => !a.isHeader).map(a => ({
    name: a.activityEnglishName,
    code: a.activityCode,
    physical: a.districtTotals.totalPhysicalProgress || 0,
    sarraSpend: a.districtTotals.totalSarraExpend || 0,
  })) || [];

  const districtData = mpr.computed?.districtWiseSummary?.map(d => ({
    name: d.district,
    physical: d.totalPhysical,
    sarraSpend: d.totalSarraExpend
  })) || [];

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 max-w-[1800px] mx-auto">

          <div className="lg:col-span-7 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex justify-between items-start">
              <div>
                <button onClick={() => router.push("/dashboard/mnd-admin/mpr")} className="inline-flex items-center text-sm font-semibold text-[#0a3d62] mb-2 hover:translate-x-[-4px] transition-transform">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to MPR list
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="font-mono text-2xl font-bold text-slate-900 tracking-tight">{mpr.applicationNo}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100`}>PRAROOP-1(A)</span>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Submitted by {mpr.submittedByDistrict} District &bull; {mpr.reportingMonth} {mpr.financialYear}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider ${mpr.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  mpr.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                  {mpr.status}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Phys Target" value={mpr.activities?.reduce((sum, a) => sum + (a.districtTotals?.targetUnit || 0), 0)} sub="Annual Target" />
              <StatBox label="Phys Progress" value={mpr.computed?.grandTotalPhysicalProgress} sub="Cumulative Units" color="text-green-600" />
              <StatBox label="SARRA Budget" value={`₹${mpr.computed?.grandTotalTargetSarraLakh?.toFixed(2)} L`} sub="Annual Allocation" />
              <StatBox label="SARRA Spent" value={`₹${mpr.computed?.grandTotalSarraExpend?.toFixed(2)} L`} sub="Cumulative Exp." color="text-amber-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-600 w-5 h-5" /> Report Analytics & Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">Activity-wise Physical Progress</h3>
                </div>
                <div className="p-2 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="code" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} width={70} />
                      <RechartsTooltip />
                      <Bar dataKey="physical" name="Physical Progress" fill="#1e8449" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">SARRA Budget vs Expenditure</h3>
                </div>
                <div className="p-2 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData.map(a => {
                      const act = mpr.activities?.find(x => x.activityCode === a.code);
                      return { ...a, budget: act?.districtTotals?.targetSarraShareLakh || 0 };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="budget" name="Budget (₹L)" fill="#0a3d62" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sarraSpend" name="Spent (₹L)" fill="#e67e22" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">District-wise SARRA Expenditure Distribution</h3>
                </div>
                <div className="p-2 h-[320px] flex items-center">
                  <ResponsiveContainer width="50%" height="100%">
                    <PieChart>
                      <Pie data={districtData.filter(d => d.sarraSpend > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="sarraSpend" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {districtData.filter(d => d.sarraSpend > 0).map((_, i) => (
                          <Cell key={i} fill={['#0a3d62', '#e67e22', '#1e8449', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b'][i % 8]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-1/2 px-4">
                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
                      {districtData.filter(d => d.sarraSpend > 0 || d.physical > 0).map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm">
                          <span className="font-medium text-slate-700">{d.name}</span>
                          <div className="flex gap-4">
                            <span className="text-green-600 font-bold">{d.physical}</span>
                            <span className="text-amber-600 font-bold">₹{d.sarraSpend?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={18} /></div>
                <span className="font-bold text-slate-800">Activity-wise Performance Matrix</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Activity Code & Name</th>
                      <th className="px-6 py-4 text-center">Phys Progress</th>
                      <th className="px-6 py-4 text-center">SARRA Expend (₹L)</th>
                      <th className="px-6 py-4 text-center">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mpr.activities?.filter(a => !a.isHeader).map((act, idx) => {
                      const utilization = act.districtTotals.targetSarraShareLakh
                        ? (act.districtTotals.totalSarraExpend / act.districtTotals.targetSarraShareLakh * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-[#0a3d62]">{act.activityCode}</span>
                              <span className="text-sm font-medium text-slate-700">{act.activityEnglishName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-green-700">{act.districtTotals.totalPhysicalProgress}</td>
                          <td className="px-6 py-4 text-center font-bold text-blue-800">₹{act.districtTotals.totalSarraExpend?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, utilization)}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-500">{utilization}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
              <FileText className="text-blue-600 w-5 h-5" /> Detailed Activity Reports
            </h2>
            <div className="space-y-4">
              {mpr.activities?.map((act, i) => {
                if (act.isHeader) return null;
                const hasData = act.districtTotals.totalPhysicalProgress > 0 || act.districtTotals.totalSarraExpend > 0;
                return (
                  <details key={i} className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" open={hasData}>
                    <summary className="p-4 bg-slate-50 border-b border-slate-200 cursor-pointer font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#0a3d62] text-white text-xs px-2.5 py-1 rounded-md font-mono">{act.activityCode}</span>
                        <span className="text-sm">{act.activityName} <span className="text-slate-400 font-normal ml-1">({act.activityEnglishName})</span></span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                        <span className="text-green-700 bg-green-100 px-3 py-1.5 rounded-full font-bold">Physical: {act.districtTotals.totalPhysicalProgress}</span>
                        <span className="text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full font-bold">SARRA: ₹{act.districtTotals.totalSarraExpend?.toFixed(2)} L</span>
                      </div>
                    </summary>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="px-5 py-3">District</th>
                            <th className="px-5 py-3 text-right">Till Last FY (Phys)</th>
                            <th className="px-5 py-3 text-right bg-green-50/50">This Month (Phys)</th>
                            <th className="px-5 py-3 text-right text-slate-800">Total (Phys)</th>
                            <th className="px-5 py-3 text-right">Till Last FY (SARRA)</th>
                            <th className="px-5 py-3 text-right bg-blue-50/50">This Month (SARRA)</th>
                            <th className="px-5 py-3 text-right text-[#0a3d62]">Total (SARRA)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {act.districts.map((d, di) => {
                            const physActive = d.thisMonthPhysicalProgress > 0;
                            const sarraActive = d.thisMonthSarraExpend > 0;
                            const overBudget = d.totalSarraExpend > d.targetSarraShareLakh && d.targetSarraShareLakh > 0;

                            return (
                              <tr key={di} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-2.5 font-medium text-slate-700">{d.districtName}</td>
                                <td className="px-5 py-2.5 text-right text-slate-400">{d.physicalProgressTillLastFY || '-'}</td>
                                <td className={`px-5 py-2.5 text-right ${physActive ? 'bg-green-50/50 font-bold text-green-600' : 'text-slate-400'}`}>{d.thisMonthPhysicalProgress || '-'}</td>
                                <td className="px-5 py-2.5 text-right font-bold text-slate-800">{d.totalPhysicalProgress || '-'}</td>
                                <td className="px-5 py-2.5 text-right text-slate-400">₹{d.sarraExpendTillLastFY || '-'}</td>
                                <td className={`px-5 py-2.5 text-right ${sarraActive ? 'bg-blue-50/50 font-bold text-blue-600' : 'text-slate-400'}`}>₹{d.thisMonthSarraExpend || '-'}</td>
                                <td className={`px-5 py-2.5 text-right font-bold ${overBudget ? 'text-red-600' : 'text-[#0a3d62]'}`}>₹{d.totalSarraExpend ? d.totalSarraExpend.toFixed(2) : '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold text-[11px] uppercase tracking-wider text-slate-700">
                            <td className="px-5 py-3 text-right">TOTAL</td>
                            <td className="px-5 py-3 text-right">{act.districtTotals.physicalProgressTillLastFY}</td>
                            <td className="px-5 py-3 text-right text-green-600">{act.districtTotals.thisMonthPhysicalProgress}</td>
                            <td className="px-5 py-3 text-right text-slate-900">{act.districtTotals.totalPhysicalProgress}</td>
                            <td className="px-5 py-3 text-right">₹{act.districtTotals.sarraExpendTillLastFY?.toFixed(2)}</td>
                            <td className="px-5 py-3 text-right text-blue-600">₹{act.districtTotals.thisMonthSarraExpend?.toFixed(2)}</td>
                            <td className="px-5 py-3 text-right text-[#0a3d62]">₹{act.districtTotals.totalSarraExpend?.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </details>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* Review Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-8">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /> Review Panel</h3>

              {canReview ? (
                <div className="space-y-4">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm inline-flex justify-center items-center gap-2 transition-all shadow-lg shadow-green-100"
                  >
                    {isApproving ? 'Processing...' : <><CheckCircle className="w-4 h-4" /> Approve Report</>}
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400"><span className="bg-white px-2">Or Request Changes</span></div>
                  </div>

                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500/10 outline-none transition-all resize-none bg-slate-50"
                    placeholder="Specify corrections needed..."
                  />

                  <button
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="w-full py-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm inline-flex justify-center items-center gap-2 transition-all"
                  >
                    {isRejecting ? 'Processing...' : <><XCircle className="w-4 h-4" /> Send Back to District</>}
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Review Completed</p>
                  <div className={`mt-2 inline-block px-6 py-2 rounded-xl font-bold text-sm ${mpr.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {mpr.status}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold">SCHEMES</p>
                    <p className="text-sm font-bold text-slate-800">{mpr.totalApprovedSchemes}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold">SPRINGS</p>
                    <p className="text-sm font-bold text-slate-800">{mpr.totalSpringsUnderSchemes}</p>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 transition-all">
                  <Download size={14} /> Export Intelligence
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}

function StatBox({ label, value, sub, color = "text-slate-900" }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? "0"}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-1">{sub}</p>
    </div>
  );
}
