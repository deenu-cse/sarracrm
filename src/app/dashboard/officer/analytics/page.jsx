"use client";
import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { Card, CardHeader } from '@/components/ui/Card';
import { ExportButton } from '@/components/ui/ExportButton';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { post } from '@/lib/api';

// Stable endpoint object defined outside component to prevent re-fetch loops
const ENDPOINTS = {
  overview: '/reports/overview',
  monthlyTrend: '/reports/monthly-trend',
};

export default function OfficerAnalyticsPage() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useAnalytics(ENDPOINTS);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await post('/reports/sync-summaries', {});
      if (res?.success) {
        setSyncMsg(`✅ ${res.data?.processed || 0} forms synced. Refreshing...`);
        setTimeout(() => {
          refresh();
          setSyncMsg('');
        }, 1500);
      } else {
        setSyncMsg('❌ Sync failed: ' + (res?.message || 'Unknown error'));
      }
    } catch {
      setSyncMsg('❌ Sync request failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Failed to load analytics: {error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-navy text-white rounded-lg text-sm hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  const overview = data.overview;
  const monthlyTrend = data.monthlyTrend;
  const hasData = overview?.totalForms > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Analytics</h1>
          <p className="text-slate-500">Performance overview for {user?.district} district</p>
        </div>
        <div className="flex items-center gap-3">
          {!hasData && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60"
            >
              {syncing ? '⏳ Syncing…' : '🔄 Sync Data'}
            </button>
          )}
          <ExportButton availableTypes={['pdf-summary']} />
        </div>
      </div>

      {syncMsg && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
          {syncMsg}
        </div>
      )}

      {!hasData && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          ⚠️ Analytics are computed from a summary index. If you recently submitted forms, click <strong>Sync Data</strong> to rebuild the index.
        </div>
      )}

      <KPIStrip stats={overview} loading={false} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card noPadding>
          <CardHeader title="Submission Trend" subtitle="Monthly forms submitted vs approved" />
          <div className="p-6 h-96">
            <TrendChart data={monthlyTrend} />
          </div>
        </Card>

        <Card noPadding>
          <CardHeader title="Overall Status" subtitle="Distribution of all your forms" />
          <div className="p-6 h-96 flex items-center justify-center">
            {/* Pass statusBreakdown array directly — StatusChart handles both formats */}
            <StatusChart data={overview?.statusBreakdown || []} />
          </div>
        </Card>
      </div>
    </div>
  );
}
