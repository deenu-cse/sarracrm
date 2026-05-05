"use client";
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { DistrictMap } from '@/components/dashboard/DistrictMap';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { BudgetChart } from '@/components/dashboard/BudgetChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Card, CardHeader } from '@/components/ui/Card';
import { FullPageSpinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { ExportButton } from '@/components/ui/ExportButton';

export default function AdminDashboard() {
  const { data, loading, error } = useAnalytics({
    overview: '/reports/overview',
    monthlyTrend: '/reports/monthly-trend',
    districtStats: '/reports/district-stats',
    budgetAllocation: '/reports/budget-allocation'
  });

  if (loading) return <FullPageSpinner />;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load analytics: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">State Dashboard</h1>
          <p className="text-slate-500">Overview of all 13 districts.</p>
        </div>
        <ExportButton availableTypes={['pdf-summary']} />
      </div>

      <KPIStrip stats={data.overview} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="h-full" noPadding>
            <CardHeader title="Statewide Trends" subtitle="Submitted vs Approved DPRs" />
            <div className="p-6 h-80">
              <TrendChart data={data.monthlyTrend} />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="h-full" noPadding>
            <CardHeader title="Budget Allocation" subtitle="Top districts by approved budget" />
            <div className="p-6 h-80">
              <BudgetChart data={data.budgetAllocation} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card noPadding>
            <CardHeader 
              title="District Performance" 
              action={<Link href="/dashboard/admin/analytics" className="text-sm text-navy hover:underline">Full Analytics &rarr;</Link>} 
            />
            <div className="max-h-96 overflow-y-auto">
              <DistrictMap data={data.districtStats} />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="h-full" noPadding>
            <CardHeader title="Recent Activity" />
            <div className="max-h-96 overflow-y-auto bg-slate-50">
              {/* Note: In a real app, this would be fetched from /audit/logs */}
              <RecentActivity logs={[]} /> 
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
