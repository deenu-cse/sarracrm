"use client";
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { DistrictMap } from '@/components/dashboard/DistrictMap';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { BudgetChart } from '@/components/dashboard/BudgetChart';
import { Card, CardHeader } from '@/components/ui/Card';
import { ExportButton } from '@/components/ui/ExportButton';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function AdminAnalyticsPage() {
  const { data, loading, error } = useAnalytics({
    overview: '/reports/overview',
    monthlyTrend: '/reports/monthly-trend',
    districtStats: '/reports/district-stats',
    budgetAllocation: '/reports/budget-allocation'
  });

  if (loading) return <FullPageSpinner />;

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load analytics: {error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Statewide Analytics</h1>
          <p className="text-slate-500">Comprehensive overview of all districts</p>
        </div>
        <ExportButton availableTypes={['pdf-summary', 'excel', 'csv']} />
      </div>

      <KPIStrip stats={data.overview} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card noPadding>
          <CardHeader title="Submission Trend" subtitle="Monthly forms submitted vs approved" />
          <div className="p-6 h-80">
            <TrendChart data={data.monthlyTrend} />
          </div>
        </Card>
        
        <Card noPadding>
          <CardHeader title="Overall Status" subtitle="Distribution of all forms" />
          <div className="p-6 h-80 flex items-center justify-center">
            <StatusChart data={data.overview?.statusCounts || {}} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card noPadding className="h-full">
            <CardHeader title="District Performance Breakdown" />
            <div className="overflow-auto max-h-[500px]">
              <DistrictMap data={data.districtStats} />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card noPadding className="h-full">
            <CardHeader title="Budget Allocation (₹ Lakhs)" subtitle="By District" />
            <div className="p-6 h-[450px]">
              <BudgetChart data={data.budgetAllocation} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
