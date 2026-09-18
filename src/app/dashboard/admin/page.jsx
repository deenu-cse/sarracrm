"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { get } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import {
  DashboardHero,
  StatGrid,
  ActionRequired,
  RecentList,
  QuickLinkGrid,
  DASHBOARD_ICONS
} from '@/components/dashboard/HomeDashboard';
import { ROLE_LABELS } from '@/constants/roles';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await get('/reports/home');
      if (mounted && res?.success) setData(res.data);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data?.stats) return [];
    const s = data.stats;
    const workflow = data.workflowRole;

    if (workflow === 'CHECKER') {
      return [
        { label: 'Awaiting You', value: s.pendingChecker, icon: DASHBOARD_ICONS.Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        { label: 'Total Projects', value: s.totalProjects, icon: DASHBOARD_ICONS.FolderKanban, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
        { label: 'Active Projects', value: s.activeProjects, icon: DASHBOARD_ICONS.CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
        { label: 'MPRs Submitted', value: s.mprSubmitted, icon: DASHBOARD_ICONS.FileText, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
      ];
    }
    if (workflow === 'APPROVER') {
      return [
        { label: 'Awaiting Approval', value: s.pendingApprover, icon: DASHBOARD_ICONS.AlertCircle, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
        { label: 'Pending Checker', value: s.pendingChecker, icon: DASHBOARD_ICONS.Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        { label: 'Total Projects', value: s.totalProjects, icon: DASHBOARD_ICONS.FolderKanban, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
        { label: 'Active Projects', value: s.activeProjects, icon: DASHBOARD_ICONS.CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
      ];
    }
    if (workflow === 'MAKER') {
      return [
        { label: 'Total Projects', value: s.totalProjects, icon: DASHBOARD_ICONS.FolderKanban, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
        { label: 'With Checker', value: s.pendingChecker, icon: DASHBOARD_ICONS.Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        { label: 'With Approver', value: s.pendingApprover, icon: DASHBOARD_ICONS.AlertCircle, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
        { label: 'Sanctioned', value: s.readyToForwardDistrict ?? 0, icon: DASHBOARD_ICONS.Activity, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', sub: 'Ready to forward' },
        { label: 'Active (PIA)', value: s.activeProjects, icon: DASHBOARD_ICONS.CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
      ];
    }

    return [
      { label: 'Users', value: s.totalUsers, icon: DASHBOARD_ICONS.Users, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', sub: `${s.invitePending || 0} invites pending` },
      { label: 'Active Users', value: s.activeUsers, icon: DASHBOARD_ICONS.CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
      { label: 'Projects', value: s.totalProjects, icon: DASHBOARD_ICONS.FolderKanban, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
      { label: 'Need Checker', value: s.pendingChecker, icon: DASHBOARD_ICONS.Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
      { label: 'Need Approver', value: s.pendingApprover, icon: DASHBOARD_ICONS.AlertCircle, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
      { label: 'Total MPRs', value: s.totalMprs, icon: DASHBOARD_ICONS.FileText, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    ];
  }, [data]);

  if (loading) return <FullPageSpinner />;
  if (!data) {
    return (
      <div className="p-10 text-center text-slate-500">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <DashboardHero
        name={user?.name}
        roleLabel={ROLE_LABELS[user?.role] || 'Super Admin'}
        workflowRole={data.workflowRole}
        hint={data.welcomeHint}
      />

      <StatGrid items={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3">
          <ActionRequired items={data.actionRequired || []} />
        </div>
        <div className="lg:col-span-2">
          <RecentList
            title={data.recentActivity?.length ? 'Audit Trail' : 'Recent Projects'}
            items={
              data.recentActivity?.length
                ? data.recentActivity.map((a) => ({
                    id: a.id,
                    title: a.eventName || a.action?.replace(/_/g, ' ') || 'Workflow activity',
                    subtitle: [a.referenceNo, a.performedBy, a.performedByRole]
                      .filter(Boolean)
                      .join(' · '),
                    timestamp: a.timestamp,
                    href: a.href || '/dashboard/admin/audit-logs',
                  }))
                : data.recentItems || []
            }
          />
        </div>
      </div>

      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Shortcuts</h2>
      <QuickLinkGrid links={data.quickLinks || []} />
    </div>
  );
}
