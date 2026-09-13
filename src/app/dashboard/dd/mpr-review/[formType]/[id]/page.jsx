"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { patch } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatters';
import { BarChart3, FileText, CheckCircle, XCircle, ArrowLeft, Download, MapPin, Calendar, Activity, TrendingUp, Building2, User, IndianRupee, RotateCcw, Clock, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

const FORM_LABELS = {
  praroop1a: { label: 'PRAROOP-1(A)', head: 'HEAD 55-01', color: 'bg-emerald-600', subject: 'Springs' },
  praroop1b: { label: 'PRAROOP-1(B)', head: 'HEAD 55-02', color: 'bg-[#0c5460]', subject: 'Streams/Rivers' },
  praroop1c: { label: 'PRAROOP-1(C)', head: 'HEAD 55-03', color: 'bg-indigo-600', subject: 'Major Rivers' },
  praroop1d: { label: 'PRAROOP-1(D)', head: 'HEAD 55-04', color: 'bg-purple-600', subject: 'Groundwater' },
};

const CHART_COLORS = ['#0a3d62', '#e67e22', '#1e8449', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

export default function DDMPRDetailPage() {
  const { formType, id } = useParams();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  const formInfo = FORM_LABELS[formType] || { label: formType?.toUpperCase(), head: '', color: 'bg-slate-600', subject: '' };
  const { data: mpr, loading, error, refetch } = useFetch(`/mpr/${formType}/${id}`);

  if (loading) return (
    <div className="p-12 space-y-4 max-w-7xl mx-auto">
      {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-2xl" />)}
    </div>
  );
  if (error || !mpr) return <div className="p-12 text-center text-red-500 font-medium">Report not found: {error}</div>;

  const canReview = mpr.status === 'SUBMITTED';

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this MPR and forward it to MND?')) return;
    setActionError('');
    setBusy(true);
    try {
      const res = await patch(`/mpr/${formType}/${id}/district-approve`, {});
      if (res?.success) {
        toast.success('MPR Approved & Forwarded to MND');
        router.push('/dashboard/dd/mpr-review');
      } else {
        setActionError(res?.message || 'Failed to approve');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReturn = async () => {
    if (!returnReason) return;
    setActionError('');
    setBusy(true);
    try {
      const res = await patch(`/mpr/${formType}/${id}/return`, { reason: returnReason });
      if (res?.success) {
        toast.success('MPR Returned to PIA Officer');
        setShowReturnModal(false);
        router.push('/dashboard/dd/mpr-review');
      } else {
        setActionError(res?.message || 'Failed to return');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ── Data prep for charts ──────────────────────────────────────────
  const activityData = mpr.activities?.filter(a => !a.isHeader).map(a => ({
    name: a.activityEnglishName,
    code: a.activityCode,
    physical: a.districtTotals?.totalPhysicalProgress || 0,
    sarraSpend: a.districtTotals?.totalSarraExpend || 0,
  })) || [];

  const districtData = mpr.computed?.districtWiseSummary?.map(d => ({
    name: d.district,
    physical: d.totalPhysical,
    sarraSpend: d.totalSarraExpend
  })) || [];

  // Computed totals
  const totalPhysTarget = mpr.activities?.reduce((sum, a) => sum + (a.districtTotals?.targetUnit || 0), 0) || 0;
  const totalPhysProgress = mpr.computed?.grandTotalPhysicalProgress || 0;
  const totalSarraBudget = mpr.computed?.grandTotalTargetSarraLakh || 0;
  const totalSarraSpent = mpr.computed?.grandTotalSarraExpend || 0;
  const overallUtilization = totalSarraBudget > 0 ? ((totalSarraSpent / totalSarraBudget) * 100).toFixed(1) : 0;
  const physicalAchievement = totalPhysTarget > 0 ? ((totalPhysProgress / totalPhysTarget) * 100).toFixed(1) : 0;

  return (
    <RoleGuard allowedRoles={[USER_ROLES.DD_LEVEL]}>
      <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 max-w-[1800px] mx-auto">

          {/* ═══════ LEFT COLUMN (7/10) ═══════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex justify-between items-start">
              <div>
                <button onClick={() => router.push("/dashboard/dd/mpr-review")} className="inline-flex items-center text-sm font-semibold text-[#0a3d62] mb-2 hover:translate-x-[-4px] transition-transform">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to MPR Reviews
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="font-mono text-2xl font-bold text-slate-900 tracking-tight">{mpr.applicationNo}</h1>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white ${formInfo.color}`}>
                    {formInfo.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Submitted by {mpr.submittedByDistrict} District &bull; {mpr.reportingMonth} {mpr.financialYear}
                  {mpr.submittedByDepartment && <> &bull; {mpr.submittedByDepartment}</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider ${
                  mpr.status === 'DISTRICT_APPROVED' ? 'bg-green-100 text-green-700' :
                  mpr.status === 'RETURNED_TO_PIA' ? 'bg-red-100 text-red-700' :
                  mpr.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {mpr.status?.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {/* Quick Stats - 4 boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox
                label="Physical Target"
                value={totalPhysTarget}
                sub="Annual Target (Units)"
                icon={<Activity className="w-4 h-4 text-blue-500" />}
              />
              <StatBox
                label="Physical Progress"
                value={totalPhysProgress}
                sub={`${physicalAchievement}% Achievement`}
                color="text-green-600"
                icon={<TrendingUp className="w-4 h-4 text-green-500" />}
              />
              <StatBox
                label="SARRA Budget"
                value={`₹${totalSarraBudget.toFixed(2)} L`}
                sub="Annual Allocation"
                icon={<IndianRupee className="w-4 h-4 text-indigo-500" />}
              />
              <StatBox
                label="SARRA Spent"
                value={`₹${totalSarraSpent.toFixed(2)} L`}
                sub={`${overallUtilization}% Utilized`}
                color="text-amber-600"
                icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
              />
            </div>

            {/* ── Analytics Section ── */}
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-600 w-5 h-5" /> Report Analytics & Insights
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity-wise Physical Progress Chart */}
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

              {/* SARRA Budget vs Expenditure Chart */}
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

              {/* District-wise Expenditure Pie Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">District-wise SARRA Expenditure Distribution</h3>
                </div>
                <div className="p-2 h-[320px] flex items-center">
                  <ResponsiveContainer width="50%" height="100%">
                    <PieChart>
                      <Pie data={districtData.filter(d => d.sarraSpend > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="sarraSpend" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {districtData.filter(d => d.sarraSpend > 0).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-1/2 px-4">
                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
                      {districtData.filter(d => d.sarraSpend > 0 || d.physical > 0).map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                            <span className="font-medium text-slate-700">{d.name}</span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-green-600 font-bold">{d.physical}</span>
                            <span className="text-amber-600 font-bold">₹{d.sarraSpend?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                      {districtData.filter(d => d.sarraSpend > 0 || d.physical > 0).length === 0 && (
                        <p className="text-sm text-slate-400 p-4 text-center">No district expenditure data</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Activity Performance Matrix Table ── */}
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
                      const utilization = act.districtTotals?.targetSarraShareLakh
                        ? (act.districtTotals.totalSarraExpend / act.districtTotals.targetSarraShareLakh * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-[#0a3d62]">{act.activityCode}</span>
                              <span className="text-sm font-medium text-slate-700">{act.activityEnglishName}</span>
                              <span className="text-xs text-slate-400">{act.activityName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-green-700">{act.districtTotals?.totalPhysicalProgress || 0}</td>
                          <td className="px-6 py-4 text-center font-bold text-blue-800">₹{(act.districtTotals?.totalSarraExpend || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, utilization)}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-500">{utilization}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Detailed Activity Reports (Expandable) ── */}
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
              <FileText className="text-blue-600 w-5 h-5" /> Detailed Activity Reports
            </h2>
            <div className="space-y-4">
              {mpr.activities?.map((act, i) => {
                if (act.isHeader) return null;
                const hasData = (act.districtTotals?.totalPhysicalProgress > 0) || (act.districtTotals?.totalSarraExpend > 0);
                return (
                  <details key={i} className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" open={hasData}>
                    <summary className="p-4 bg-slate-50 border-b border-slate-200 cursor-pointer font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`text-white text-xs px-2.5 py-1 rounded-md font-mono ${formInfo.color}`}>{act.activityCode}</span>
                        <span className="text-sm">{act.activityName} <span className="text-slate-400 font-normal ml-1">({act.activityEnglishName})</span></span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                        <span className="text-green-700 bg-green-100 px-3 py-1.5 rounded-full font-bold">Physical: {act.districtTotals?.totalPhysicalProgress || 0}</span>
                        <span className="text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full font-bold">SARRA: ₹{(act.districtTotals?.totalSarraExpend || 0).toFixed(2)} L</span>
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
                          {act.districts?.map((d, di) => {
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
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold text-[11px] uppercase tracking-wider text-slate-700">
                            <td className="px-5 py-3 text-right">TOTAL</td>
                            <td className="px-5 py-3 text-right">{act.districtTotals?.physicalProgressTillLastFY || 0}</td>
                            <td className="px-5 py-3 text-right text-green-600">{act.districtTotals?.thisMonthPhysicalProgress || 0}</td>
                            <td className="px-5 py-3 text-right text-slate-900">{act.districtTotals?.totalPhysicalProgress || 0}</td>
                            <td className="px-5 py-3 text-right">₹{(act.districtTotals?.sarraExpendTillLastFY || 0).toFixed(2)}</td>
                            <td className="px-5 py-3 text-right text-blue-600">₹{(act.districtTotals?.thisMonthSarraExpend || 0).toFixed(2)}</td>
                            <td className="px-5 py-3 text-right text-[#0a3d62]">₹{(act.districtTotals?.totalSarraExpend || 0).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </details>
                );
              })}
            </div>

            {/* ── Revision History ── */}
            {mpr.revisionHistory?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock size={18} /></div>
                  <span className="font-bold text-slate-800">Revision History</span>
                </div>
                <div className="p-5 space-y-3">
                  {mpr.revisionHistory.map((rev, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        rev.status === 'SUBMITTED' ? 'bg-blue-500' :
                        rev.status === 'DISTRICT_APPROVED' ? 'bg-green-500' :
                        rev.status === 'RETURNED_TO_PIA' ? 'bg-red-500' : 'bg-slate-400'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-slate-700">{rev.status?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-400">{formatDate(rev.changedAt)} {rev.note && `— ${rev.note}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══════ RIGHT COLUMN (3/10) ═══════ */}
          <div className="lg:col-span-3 space-y-6">

            {/* Review Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /> DD Review Panel</h3>

              {canReview ? (
                <div className="space-y-4">
                  {actionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-medium">
                      {actionError}
                    </div>
                  )}
                  <button
                    onClick={handleApprove}
                    disabled={busy}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm inline-flex justify-center items-center gap-2 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                  >
                    {busy ? 'Processing...' : <><CheckCircle className="w-4 h-4" /> Approve & Forward to MND</>}
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400"><span className="bg-white px-2">Or Request Changes</span></div>
                  </div>

                  <button
                    onClick={() => setShowReturnModal(true)}
                    disabled={busy}
                    className="group w-full py-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm inline-flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="return-icon w-4 h-4" /> Return to PIA Officer
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Review Completed</p>
                  <div className={`mt-2 inline-block px-6 py-2 rounded-xl font-bold text-sm ${
                    mpr.status === 'DISTRICT_APPROVED' ? 'bg-green-100 text-green-700' :
                    mpr.status === 'RETURNED_TO_PIA' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {mpr.status?.replace(/_/g, ' ')}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Metadata</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MetaBox label="SCHEMES" value={mpr.totalApprovedSchemes || 0} />
                  {mpr.totalSpringsUnderSchemes !== undefined && <MetaBox label="SPRINGS" value={mpr.totalSpringsUnderSchemes} />}
                  {mpr.totalRiversUnderSchemes !== undefined && <MetaBox label="RIVERS" value={mpr.totalRiversUnderSchemes} />}
                  {mpr.totalMajorRiversUnderSchemes !== undefined && <MetaBox label="MAJOR RIVERS" value={mpr.totalMajorRiversUnderSchemes} />}
                  {mpr.totalGroundwaterSitesUnderSchemes !== undefined && <MetaBox label="GW SITES" value={mpr.totalGroundwaterSitesUnderSchemes} />}
                  <MetaBox label="HEAD CODE" value={mpr.headCode || formInfo.head} />
                  <MetaBox label="ACTIVITIES" value={mpr.computed?.activitiesWithProgress || 0} />
                  <MetaBox label="DISTRICTS" value={districtData.filter(d => d.physical > 0 || d.sarraSpend > 0).length} />
                </div>

                {mpr.returnReason && (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-xs text-amber-800 mt-3">
                    <p className="font-bold">Previous Return Reason:</p>
                    <p className="mt-1">"{mpr.returnReason}"</p>
                  </div>
                )}

                {/* Submission info */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submission Info</h4>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p><span className="font-semibold text-slate-700">Submitted:</span> {formatDate(mpr.submittedAt)}</p>
                    <p><span className="font-semibold text-slate-700">District:</span> {mpr.submittedByDistrict}</p>
                    <p><span className="font-semibold text-slate-700">Department:</span> {mpr.submittedByDepartment || 'N/A'}</p>
                    {mpr.districtApprovedAt && <p><span className="font-semibold text-slate-700">DD Approved:</span> {formatDate(mpr.districtApprovedAt)}</p>}
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 transition-all mt-4">
                  <Download size={14} /> Export Report
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Return Report to PIA</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide detailed reasons or correction requests for the PIA Officer.</p>
            <textarea
              rows={4}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none bg-slate-50 outline-none transition-all"
              placeholder="Specify corrections needed..."
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowReturnModal(false); setReturnReason(''); }} disabled={busy}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReturn}
                disabled={busy || !returnReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {busy ? 'Returning...' : 'Return Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}

function StatBox({ label, value, sub, color = "text-slate-900", icon }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        {icon && icon}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value ?? "0"}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-1">{sub}</p>
    </div>
  );
}

function MetaBox({ label, value }) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl">
      <p className="text-[10px] text-slate-400 font-bold">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
