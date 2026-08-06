"use client";
import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { patch } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';
import { BarChart3, FileText, CheckCircle, XCircle, Info, Edit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MPRPraroop1CDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: mpr, loading, refetch } = useFetch(`/mpr/praroop1c/${id}`);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Report Details...</div>;
  if (!mpr) return <div className="p-8 text-center text-red-500">Report not found</div>;

  const canReview = (user?.role === 'MND_SUPER_ADMIN' || user?.role === 'MND_ADMIN') && mpr.status === 'SUBMITTED';

  const handleApprove = async () => {
    if (!window.confirm('Approve this MPR?')) return;
    setIsApproving(true);
    try {
      const res = await patch(`/mpr/praroop1c/${id}/approve`, { note: 'Approved by Admin' });
      if (res.success) {
        toast.success('MPR Approved');
        refetch();
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
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    setIsRejecting(true);
    try {
      const res = await patch(`/mpr/praroop1c/${id}/reject`, { note: reason });
      if (res.success) {
        toast.success('MPR Rejected');
        refetch();
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
    targetSarra: a.districtTotals.targetSarraShareLakh || 0,
    utilization: a.districtTotals.targetSarraShareLakh ? Math.min(100, Math.round((a.districtTotals.totalSarraExpend / a.districtTotals.targetSarraShareLakh) * 100)) : 0
  })) || [];

  const districtData = mpr.computed?.districtWiseSummary?.map(d => ({
    name: d.district,
    physical: d.totalPhysical,
    sarraSpend: d.totalSarraExpend
  })) || [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20">

      <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-mono text-blue-800">{mpr.applicationNo}</h1>
            <span className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 ${
              mpr.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              mpr.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              mpr.status === 'RESUBMITTED' ? 'bg-purple-100 text-purple-700' :
              'bg-amber-100 text-amber-700'
              }`}>
              {mpr.status}
              {mpr.status === 'REJECTED' && mpr.rejectionReason && (
                <span title={mpr.rejectionReason} className="cursor-help text-red-700 hover:text-red-900">
                  <Info size={14} />
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-1">📅 <span className="font-semibold text-slate-800">{mpr.reportingMonth} {mpr.financialYear}</span></div>
            <div className="flex items-center gap-1">📍 District: <span className="font-semibold text-slate-800">{mpr.submittedByDistrict}</span></div>
            <div className="flex items-center gap-1">👤 Submitted By: <span className="font-semibold text-slate-800">{mpr.submittedBy?.name}</span> <span className="text-xs text-slate-400">({formatDate(mpr.submittedAt)})</span></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
          {mpr.status === 'REJECTED' && user?.role === 'MND_OFFICER' && (
            <button
              onClick={() => {
                const transformedActivities = {};
                if (mpr.activities) {
                  mpr.activities.forEach(act => {
                    transformedActivities[act.activityCode] = { districts: {} };
                    if (act.districts) {
                      act.districts.forEach(d => {
                        transformedActivities[act.activityCode].districts[d.districtName] = d;
                      });
                    }
                  });
                }
                
                localStorage.setItem(`sarra_mpr_55_02_${user._id}`, JSON.stringify({
                  formData: transformedActivities,
                  totalApprovedSchemes: mpr.totalApprovedSchemes,
                  totalRiversUnderSchemes: mpr.totalRiversUnderSchemes,
                  riversCurrentlyBeingTreated: mpr.riversCurrentlyBeingTreated,
                  mprId: mpr._id,
                  savedAt: new Date().toISOString()
                }));
                router.push('/dashboard/mnd/head55-03');
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 shadow-md font-bold rounded-xl transition-all"
            >
              <Edit size={18} />
              Edit & Resubmit
            </button>
          )}

          <Link
            href={`/dashboard/mnd/mpr/praroop1c/${id}/analytics`}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold rounded-xl transition-all"
          >
            <BarChart3 size={18} />
            Analytics
          </Link>
          
          {canReview && (
            <>
              <button onClick={handleReject} disabled={isRejecting} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold rounded-xl transition-all">
                <XCircle size={18} />
                {isRejecting ? '...' : 'Reject'}
              </button>
              <button onClick={handleApprove} disabled={isApproving} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold rounded-xl transition-all">
                <CheckCircle size={18} />
                {isApproving ? '...' : 'Approve'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">📋</div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase">Total Approved Schemes</p>
            <p className="text-2xl font-bold text-slate-800">{mpr.totalApprovedSchemes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">🌊</div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase">Rivers Covered</p>
            <p className="text-2xl font-bold text-slate-800">{mpr.totalRiversUnderSchemes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl">✓</div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase">Rivers Treated</p>
            <p className="text-2xl font-bold text-slate-800">{mpr.riversCurrentlyBeingTreated}</p>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Activity-wise Physical Progress</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={activityData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" />
                <YAxis dataKey="code" type="category" width={80} tick={{ fontSize: 11 }} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="physical" fill="#1a6fc4" radius={[0, 4, 4, 0]} name="Total Physical" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Activity-wise SARRA Expenditure (₹ Lakh)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={activityData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" />
                <YAxis dataKey="code" type="category" width={80} tick={{ fontSize: 11 }} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="sarraSpend" fill="#0a3d62" radius={[0, 4, 4, 0]} name="Total SARRA Spend" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4">District-wise Progress Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                <YAxis yAxisId="left" orientation="left" stroke="#1a6fc4" />
                <YAxis yAxisId="right" orientation="right" stroke="#0a3d62" />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Legend verticalAlign="top" height={36} />
                <Bar yAxisId="left" dataKey="physical" fill="#1a6fc4" name="Physical Progress" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="right" dataKey="sarraSpend" fill="#0a3d62" name="SARRA Spend (₹L)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ACTIVITY TABLES */}
      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">Detailed Activity Reports</h2>
      <div className="space-y-4">
        {mpr.activities?.map((act, i) => {
          if (act.isHeader) return null;
          const hasData = act.districtTotals.totalPhysicalProgress > 0 || act.districtTotals.totalSarraExpend > 0;
          return (
            <details key={i} className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" open={hasData}>
              <summary className="p-4 bg-slate-50 border-b border-slate-200 cursor-pointer font-bold text-slate-700 flex justify-between items-center hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="bg-[#0a3d62] text-white text-xs px-2 py-1 rounded font-mono">{act.activityCode}</span>
                  <span>{act.activityName} <span className="text-slate-400 font-normal ml-2">({act.activityEnglishName})</span></span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">Physical: {act.districtTotals.totalPhysicalProgress}</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">SARRA: ₹{act.districtTotals.totalSarraExpend?.toFixed(2)} L</span>
                </div>
              </summary>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">जनपद (District)</th>
                      <th className="px-4 py-3 text-right">24-25 तक Phys</th>
                      <th className="px-4 py-3 text-right bg-blue-50 text-blue-700">इस माह Phys</th>
                      <th className="px-4 py-3 text-right font-bold text-[#0a3d62]">कुल योग Phys</th>
                      <th className="px-4 py-3 text-right">24-25 तक SARRA</th>
                      <th className="px-4 py-3 text-right bg-blue-50 text-blue-700">इस माह SARRA</th>
                      <th className="px-4 py-3 text-right font-bold text-[#0a3d62]">कुल योग SARRA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {act.districts.map((d, di) => {
                      const physActive = d.thisMonthPhysicalProgress > 0;
                      const sarraActive = d.thisMonthSarraExpend > 0;
                      const overBudget = d.totalSarraExpend > d.targetSarraShareLakh && d.targetSarraShareLakh > 0;

                      return (
                        <tr key={di} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium">{d.districtName}</td>
                          <td className="px-4 py-2 text-right text-slate-500">{d.physicalProgressTillLastFY || '-'}</td>
                          <td className={`px-4 py-2 text-right ${physActive ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-400'}`}>{d.thisMonthPhysicalProgress || '-'}</td>
                          <td className="px-4 py-2 text-right font-bold text-[#0a3d62]">{d.totalPhysicalProgress || '-'}</td>
                          <td className="px-4 py-2 text-right text-slate-500">{d.sarraExpendTillLastFY || '-'}</td>
                          <td className={`px-4 py-2 text-right ${sarraActive ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-400'}`}>{d.thisMonthSarraExpend || '-'}</td>
                          <td className={`px-4 py-2 text-right font-bold ${overBudget ? 'text-red-600 bg-red-50' : 'text-[#0a3d62]'}`}>{d.totalSarraExpend ? d.totalSarraExpend.toFixed(2) : '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0a3d62] text-white font-bold">
                      <td className="px-4 py-3 text-right">योग (TOTAL)</td>
                      <td className="px-4 py-3 text-right text-blue-200">{act.districtTotals.physicalProgressTillLastFY}</td>
                      <td className="px-4 py-3 text-right text-blue-300">{act.districtTotals.thisMonthPhysicalProgress}</td>
                      <td className="px-4 py-3 text-right">{act.districtTotals.totalPhysicalProgress}</td>
                      <td className="px-4 py-3 text-right text-blue-200">{act.districtTotals.sarraExpendTillLastFY?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-blue-300">{act.districtTotals.thisMonthSarraExpend?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{act.districtTotals.totalSarraExpend?.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </details>
          )
        })}
      </div>

      {/* GRAND TOTAL SECTION */}
      <div className="bg-[#0a3d62] text-white rounded-2xl p-6 shadow-lg mt-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="bg-[#e67e22] w-2 h-8 rounded-full"></span>
          55-03 कुल योग (Grand Total)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          <div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Total Physical Target</p>
            <p className="text-3xl font-bold">{mpr.activities?.reduce((sum, a) => sum + (a.districtTotals?.targetUnit || 0), 0)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Total Physical Progress</p>
            <p className="text-3xl font-bold text-blue-400">{mpr.computed?.grandTotalPhysicalProgress}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Total SARRA Budget</p>
            <p className="text-3xl font-bold">₹{mpr.computed?.grandTotalTargetSarraLakh?.toFixed(2)} L</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Total SARRA Spent</p>
            <p className="text-3xl font-bold text-[#e67e22]">₹{mpr.computed?.grandTotalSarraExpend?.toFixed(2)} L</p>
          </div>
        </div>
      </div>

      {/* REVISION HISTORY */}
      {mpr.revisionHistory?.length > 0 && (
        <div className="mt-8 bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Revision History</h3>
          <div className="space-y-4">
            {mpr.revisionHistory.map((rev, i) => (
              <div key={i} className="flex gap-4 text-sm border-l-2 border-slate-200 pl-4 py-1">
                <div className="w-32 text-slate-500 font-medium">{formatDate(rev.changedAt)}</div>
                <div className="w-24">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${rev.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                    rev.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {rev.status}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-slate-700">{rev.changedBy?.name}</span>
                  {rev.note && <span className="ml-2 text-slate-500 italic">"{rev.note}"</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
