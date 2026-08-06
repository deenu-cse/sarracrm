"use client";
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFetch } from '@/hooks/useFetch';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

const ANALYTICS_ENDPOINTS = {
  overview: '/mpr/abstract55/summary?financialYear=2025-26',
  fullAnalytics: '/mpr/abstract55/analytics/full?financialYear=2025-26'
};

export default function MNDAdminDashboard() {
  const { user } = useAuth();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics(ANALYTICS_ENDPOINTS);

  const { data: pendingAbstract, loading: abstractLoading } = useFetch(
    '/mpr/abstract55/all-reports?status=SUBMITTED&limit=5',
    []
  );

  const { data: pendingPraroop, loading: praroopLoading } = useFetch(
    '/mpr/praroop1a/all-reports?status=SUBMITTED&limit=5',
    []
  );

  const { data: pendingPraroop1B, loading: praroop1BLoading } = useFetch(
    '/mpr/praroop1b/all-reports?status=SUBMITTED&limit=5',
    []
  );

  const { data: pendingPraroop1C, loading: praroop1CLoading } = useFetch(
    '/mpr/praroop1c/all-reports?status=SUBMITTED&limit=5',
    []
  );

  const { data: pendingPraroop1D, loading: praroop1DLoading } = useFetch(
    '/mpr/praroop1d/all-reports?status=SUBMITTED&limit=5',
    []
  );

  const pendingList = [
    ...(Array.isArray(pendingAbstract) ? pendingAbstract : []).map(r => ({ ...r, type: 'Abstract 55' })),
    ...(Array.isArray(pendingPraroop) ? pendingPraroop : []).map(r => ({ ...r, type: 'Praroop-1(A)' })),
    ...(Array.isArray(pendingPraroop1B) ? pendingPraroop1B : []).map(r => ({ ...r, type: 'Praroop-1(B)' })),
    ...(Array.isArray(pendingPraroop1C) ? pendingPraroop1C : []).map(r => ({ ...r, type: 'Praroop-1(C)' })),
    ...(Array.isArray(pendingPraroop1D) ? pendingPraroop1D : []).map(r => ({ ...r, type: 'Praroop-1(D)' }))
  ].sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)).slice(0, 5);

  const formsLoading = abstractLoading || praroopLoading || praroop1BLoading || praroop1CLoading || praroop1DLoading;

  const adapatedStats = {
    totalForms: analyticsData?.overview?.totalMPRs || 0,
    totalApproved: analyticsData?.fullAnalytics?.overview?.statusBreakdown?.find(s => s.status === 'APPROVED')?.count || 0,
    totalPending: analyticsData?.fullAnalytics?.overview?.statusBreakdown?.find(s => s.status === 'SUBMITTED')?.count || 0,
    totalRejected: analyticsData?.fullAnalytics?.overview?.statusBreakdown?.find(s => s.status === 'REJECTED')?.count || 0,
    totalBudgetLakh: analyticsData?.overview?.totalSarraShareLakh || 0
  };

  const statusBreakdown = analyticsData?.fullAnalytics?.overview?.statusBreakdown || [];

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MND Admin Console</h1>
            <p className="text-slate-500 font-medium mt-1">State-wide monitoring and MPR intelligence dashboard.</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active User</p>
            <p className="text-sm font-bold text-[#0a3d62]">{user?.name || 'Super Admin'}</p>
          </div>
        </div>

        <KPIStrip stats={adapatedStats} loading={analyticsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col border-none shadow-sm rounded-2xl overflow-hidden" noPadding>
              <CardHeader
                title="Recent Submissions"
                subtitle="Reports awaiting state-level review"
                action={
                  <Link href="/dashboard/mnd-admin/mpr" className="text-xs font-bold text-[#0a3d62] hover:underline bg-blue-50 px-3 py-1 rounded-full">
                    VIEW ALL
                  </Link>
                }
              />
              <div className="flex-1 overflow-auto">
                {formsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                    ))}
                  </div>
                ) : pendingList.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {pendingList.map(form => {
                      const isPraroop1A = form.type === 'Praroop-1(A)';
                      const isPraroop1B = form.type === 'Praroop-1(B)';
                      const isPraroop1C = form.type === 'Praroop-1(C)';
                      const isPraroop1D = form.type === 'Praroop-1(D)';
                      const detailUrl = isPraroop1A 
                        ? `/dashboard/mnd-admin/mpr/praroop1a/${form._id}` 
                        : isPraroop1B
                        ? `/dashboard/mnd-admin/mpr/praroop1b/${form._id}`
                        : isPraroop1C
                        ? `/dashboard/mnd-admin/mpr/praroop1c/${form._id}`
                        : isPraroop1D
                        ? `/dashboard/mnd-admin/mpr/praroop1d/${form._id}`
                        : `/dashboard/mnd-admin/mpr/${form._id}`;
                      const budget = isPraroop1A || isPraroop1B || isPraroop1C || isPraroop1D
                        ? (form.computed?.grandTotalSarraExpend || 0) 
                        : (form.computed?.totalSarraShareLakh || 0);

                      return (
                        <Link 
                          key={form._id} 
                          href={detailUrl}
                          className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-[#0a3d62] text-xs">
                              {form.submittedByDistrict?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-[#0a3d62] group-hover:underline">
                                  {form.applicationNo}
                                </span>
                                <Badge variant={isPraroop1A || isPraroop1B || isPraroop1C || isPraroop1D ? 'warning' : 'info'} className={`text-[9px] h-4 px-1.5 font-bold ${isPraroop1B ? 'bg-cyan-100 text-cyan-800' : isPraroop1C ? 'bg-indigo-100 text-indigo-800' : isPraroop1D ? 'bg-teal-100 text-teal-800' : ''}`}>
                                  {form.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">
                                {form.submittedByDistrict} &bull; {form.reportingMonth} {form.financialYear}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">₹{budget.toFixed(2)} L</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(form.submittedAt)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-800">All caught up!</p>
                    <p className="text-slate-500 text-sm mt-1">No pending MPRs to review.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col border-none shadow-sm rounded-2xl overflow-hidden" noPadding>
              <CardHeader title="Approval Velocity" subtitle="MPR status distribution" />
              <div className="p-6 flex-1 flex items-center justify-center min-h-[300px]">
                {analyticsLoading ? (
                  <div className="w-48 h-48 rounded-full border-8 border-slate-50 border-t-[#0a3d62] animate-spin"></div>
                ) : (
                  <StatusChart data={statusBreakdown} />
                )}
              </div>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Strategic Actions</h2>
          <QuickActions role={USER_ROLES.MND_SUPER_ADMIN} />
        </div>
      </div>
    </RoleGuard>
  );
}

