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

export default function OfficerDashboard() {
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
      { label: 'Accept Pending', value: s.pendingAccept ?? 0, icon: DASHBOARD_ICONS.AlertCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
      { label: 'Active Projects', value: s.activeProjects ?? 0, icon: DASHBOARD_ICONS.FolderKanban, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
      { label: 'MPR Drafts', value: s.mprDrafts ?? 0, icon: DASHBOARD_ICONS.FileText, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
      { label: 'Submitted', value: s.mprSubmitted ?? 0, icon: DASHBOARD_ICONS.Clock, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
      { label: 'Returned', value: s.mprReturned ?? 0, icon: DASHBOARD_ICONS.Ban, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
      { label: 'Approved', value: s.mprApproved ?? 0, icon: DASHBOARD_ICONS.CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    ];
  }, [data]);

  if (loading) return <FullPageSpinner />;
  if (!data) return <div className="p-10 text-center text-slate-500">Failed to load dashboard.</div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <DashboardHero
        name={user?.name}
        roleLabel={ROLE_LABELS[user?.role] || 'PIA Officer'}
        hint={data.welcomeHint}
      />
      <StatGrid items={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3">
          <ActionRequired
            items={data.actionRequired || []}
            emptyText="No pending project acceptances or MPR follow-ups."
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <RecentList title="Recent MPRs" items={data.recentItems || []} />
        </div>
      </div>

      {(data.activeProjects || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Active Projects</h2>
          <RecentList title="Your Active Projects" items={data.activeProjects} />
        </div>
      )}

      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Shortcuts</h2>
      <QuickLinkGrid links={data.quickLinks || []} />
      <div className="mt-6">
        <QuickActions role="PIA_OFFICER" />
      </div>
    </div>
  );
}
