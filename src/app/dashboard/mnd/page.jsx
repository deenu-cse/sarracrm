"use client";
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFetch } from '@/hooks/useFetch';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatters';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';
import { FileText, BarChart2, PlusCircle } from 'lucide-react';

export default function MNDOfficerDashboard() {
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics({
    overview: '/mpr/abstract55/summary?financialYear=2025-26',
    mndAnalytics: '/mpr/abstract55/analytics/full?financialYear=2025-26'
  });

  const { data: abstractReports, loading: abstractLoading } = useFetch('/mpr/abstract55/my-reports?page=1&limit=5&sort=-submittedAt');
  const { data: praroopReports, loading: praroopLoading } = useFetch('/mpr/praroop1a/my-reports?page=1&limit=5&sort=-submittedAt');
  const { data: praroop1BReports, loading: praroop1BLoading } = useFetch('/mpr/praroop1b/my-reports?page=1&limit=5&sort=-submittedAt');
  const { data: praroop1CReports, loading: praroop1CLoading } = useFetch('/mpr/praroop1c/my-reports?page=1&limit=5&sort=-submittedAt');
  const { data: praroop1DReports, loading: praroop1DLoading } = useFetch('/mpr/praroop1d/my-reports?page=1&limit=5&sort=-submittedAt');

  // Combine and sort recent reports
  const allRecentReports = [
    ...(Array.isArray(abstractReports) ? abstractReports : []).map(r => ({ ...r, type: 'Abstract 55' })),
    ...(Array.isArray(praroopReports) ? praroopReports : []).map(r => ({ ...r, type: 'Praroop-1(A)' })),
    ...(Array.isArray(praroop1BReports) ? praroop1BReports : []).map(r => ({ ...r, type: 'Praroop-1(B)' })),
    ...(Array.isArray(praroop1CReports) ? praroop1CReports : []).map(r => ({ ...r, type: 'Praroop-1(C)' })),
    ...(Array.isArray(praroop1DReports) ? praroop1DReports : []).map(r => ({ ...r, type: 'Praroop-1(D)' }))
  ].sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)).slice(0, 5);

  const reportsLoading = abstractLoading || praroopLoading || praroop1BLoading || praroop1CLoading || praroop1DLoading;

  const adaptedStats = {
    totalForms: analyticsData?.overview?.totalMPRs || 0,
    totalApproved: analyticsData?.mndAnalytics?.overview?.statusBreakdown?.find(s => s.status === 'APPROVED')?.count || 0,
    totalPending: analyticsData?.mndAnalytics?.overview?.statusBreakdown?.find(s => s.status === 'SUBMITTED')?.count || 0,
    totalRejected: analyticsData?.mndAnalytics?.overview?.statusBreakdown?.find(s => s.status === 'REJECTED')?.count || 0,
    totalBudgetLakh: analyticsData?.overview?.totalSarraShareLakh || 0
  };

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_OFFICER]}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">MND Officer Dashboard</h1>
          <p className="text-slate-500">Welcome back! Manage your Monthly Progress Reports here.</p>
        </div>

        <KPIStrip stats={adaptedStats} loading={analyticsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col" noPadding>
              <CardHeader
                title="Recent MPR Submissions"
                action={<Link href="/dashboard/mnd/mpr" className="text-sm text-navy hover:underline font-medium">View All &rarr;</Link>}
              />
              <div className="flex-1 overflow-auto">
                {reportsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>)}
                  </div>
                ) : allRecentReports.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {allRecentReports.map(mpr => (
                      <div key={mpr._id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              href={mpr.type === 'Praroop-1(A)' ? `/dashboard/mnd/mpr/praroop1a/${mpr._id}` : mpr.type === 'Praroop-1(B)' ? `/dashboard/mnd/mpr/praroop1b/${mpr._id}` : mpr.type === 'Praroop-1(C)' ? `/dashboard/mnd/mpr/praroop1c/${mpr._id}` : mpr.type === 'Praroop-1(D)' ? `/dashboard/mnd/mpr/praroop1d/${mpr._id}` : `/dashboard/mnd/mpr/${mpr._id}`} 
                              className="font-mono text-sm font-medium text-navy hover:underline"
                            >
                              {mpr.applicationNo}
                            </Link>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              {mpr.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {mpr.reportingMonth} {mpr.financialYear} &bull; {mpr.type.includes('Praroop') ? `${mpr.totalApprovedSchemes || 0} Schemes` : `${mpr.computed?.totalProposalsAllDepts || 0} Proposals`} &bull; {formatDate(mpr.submittedAt || mpr.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge status={mpr.status} />
                          <span className="text-[10px] font-bold text-slate-400">
                            ₹{(mpr.type.includes('Praroop') ? mpr.computed?.grandTotalSarraExpend : mpr.computed?.totalSarraShareLakh)?.toFixed(2)} L
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">No recent MPRs found.</div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col" noPadding>
              <CardHeader title="Status Distribution" />
              <div className="p-6 flex-1 flex items-center justify-center">
                {analyticsLoading ? (
                  <div className="w-48 h-48 rounded-full border-8 border-slate-50 border-t-[#0a3d62] animate-spin"></div>
                ) : (
                  <StatusChart data={analyticsData?.mndAnalytics?.overview?.statusBreakdown} />
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Link href="/dashboard/mnd/abstract55" className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <span className="font-bold text-slate-700">Abstract 55</span>
              <span className="text-xs text-slate-500 mt-1">New Entry</span>
            </Link>
            <Link href="/dashboard/mnd/head55-01" className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <span className="font-bold text-slate-700">Head 55-01</span>
              <span className="text-xs text-slate-500 mt-1">Praroop-1(A)</span>
            </Link>
            <Link href="/dashboard/mnd/head55-02" className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <span className="font-bold text-slate-700">Head 55-02</span>
              <span className="text-xs text-slate-500 mt-1">Praroop-1(B)</span>
            </Link>
            <Link href="/dashboard/mnd/head55-03" className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <span className="font-bold text-slate-700">Head 55-03</span>
              <span className="text-xs text-slate-500 mt-1">Praroop-1(C)</span>
            </Link>
            <Link href="/dashboard/mnd/head55-04" className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <span className="font-bold text-slate-700">Head 55-04</span>
              <span className="text-xs text-slate-500 mt-1">Praroop-1(D)</span>
            </Link>
            <Link href="/dashboard/mnd/mpr" className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-navy text-white rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <span className="font-bold text-slate-700">My Reports</span>
              <span className="text-xs text-slate-500 mt-1">View All</span>
            </Link>
            <Link href="/dashboard/mnd/analytics" className="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BarChart2 size={20} />
              </div>
              <span className="font-bold text-slate-700">Analytics</span>
              <span className="text-xs text-slate-500 mt-1">Insights</span>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

