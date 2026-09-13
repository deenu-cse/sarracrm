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
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES, ROLE_LABELS } from '@/constants/roles';

export default function MNDOfficerDashboard() {
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
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const s = data?.stats || {};
    return [
      { label: 'Total Reports', value: s.totalMprs ?? 0, icon: DASHBOARD_ICONS.FileText, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
      { label: 'Drafts', value: s.drafts ?? 0, icon: DASHBOARD_ICONS.Clock, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
      { label: 'Submitted', value: s.submitted ?? 0, icon: DASHBOARD_ICONS.Activity, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
      { label: 'Approved', value: s.approved ?? 0, icon: DASHBOARD_ICONS.CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
      { label: 'Rejected', value: s.rejected ?? 0, icon: DASHBOARD_ICONS.Ban, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    ];
  }, [data]);

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_OFFICER]}>
      {loading ? (
        <FullPageSpinner />
      ) : !data ? (
        <div className="p-10 text-center text-slate-500">Failed to load dashboard.</div>
      ) : (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
          <DashboardHero
            name={user?.name}
            roleLabel={ROLE_LABELS[user?.role] || 'MND Officer'}
            hint={data.welcomeHint}
          />
          <StatGrid items={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3">
              <ActionRequired
                items={data.actionRequired || []}
                emptyText="No drafts or returned reports. You're all clear."
              />
            </div>
            <div className="lg:col-span-2">
              <RecentList title="Recent Reports" items={data.recentItems || []} />
            </div>
          </div>

          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Create & Navigate</h2>
          <QuickLinkGrid links={data.quickLinks || []} />
        </div>
      )}
    </RoleGuard>
  );
}
