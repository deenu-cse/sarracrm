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
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ROLE_LABELS } from '@/constants/roles';

export default function DDLevelDashboard() {
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
      { label: 'Accept Projects', value: s.awaitingDistrictAccept ?? 0, icon: DASHBOARD_ICONS.AlertCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', sub: 'Forwarded to district' },
      { label: 'Assign to PIA', value: s.readyToAssignPia ?? 0, icon: DASHBOARD_ICONS.FolderKanban, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
      { label: 'Active Projects', value: s.activeProjects ?? 0, icon: DASHBOARD_ICONS.CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
      { label: 'MPR Review', value: s.mprPendingReview ?? 0, icon: DASHBOARD_ICONS.Clock, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
      { label: 'MPRs Approved', value: s.mprApproved ?? 0, icon: DASHBOARD_ICONS.FileText, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
      { label: 'Total Projects', value: s.totalProjects ?? 0, icon: DASHBOARD_ICONS.Activity, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    ];
  }, [data]);

  if (loading) return <FullPageSpinner />;
  if (!data) return <div className="p-10 text-center text-slate-500">Failed to load dashboard.</div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <DashboardHero
        name={user?.name}
        roleLabel={`${ROLE_LABELS[user?.role] || 'District Officer'}${data.stats?.district ? ` · ${data.stats.district}` : ''}`}
        hint={data.welcomeHint}
      />
      <StatGrid items={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3">
          <ActionRequired
            items={data.actionRequired || []}
            emptyText="No district projects or MPRs waiting for you."
          />
        </div>
        <div className="lg:col-span-2">
          <RecentList title="Recent District MPRs" items={data.recentItems || []} />
        </div>
      </div>

      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Shortcuts</h2>
      <QuickLinkGrid links={data.quickLinks || []} />
      <div className="mt-6">
        <QuickActions role="DD_LEVEL" />
      </div>
    </div>
  );
}
