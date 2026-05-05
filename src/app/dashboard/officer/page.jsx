"use client";
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFetch } from '@/hooks/useFetch';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatters';
import Link from 'next/link';

export default function OfficerDashboard() {
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics({
    overview: '/reports/overview'
  });

  const { data: recentForms, loading: formsLoading } = useFetch('/reports/forms-list?page=1&limit=5&sort=-submittedAt');
  const recentFormsData = recentForms || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Officer Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's an overview of your projects.</p>
      </div>

      <KPIStrip stats={analyticsData?.overview} loading={analyticsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col" noPadding>
            <CardHeader
              title="Recent Submissions"
              action={<Link href="/dashboard/officer/forms" className="text-sm text-navy hover:underline font-medium">View All &rarr;</Link>}
            />
            <div className="flex-1 overflow-auto">
              {formsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>)}
                </div>
              ) : recentFormsData?.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentFormsData.map(form => {
                    const formId = form.dprId || form._id;
                    return (
                    <div key={formId || form.applicationNo} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                      <div>
                        <Link href={`/dashboard/officer/forms/${formId}?type=${form?.formType || 'SPRINGSHED'}`} className="font-mono text-sm font-medium text-navy hover:underline">
                          {form.applicationNo || 'Draft Form'}
                        </Link>
                        <p className="text-xs text-slate-500 mt-1">
                          {form.formType === 'STREAMSHED' ? (form.streamCount || 0) : form.formType === 'GROUNDWATER' ? (form.arsCount || 0) : (form.springCount || 0)} {form.formType === 'STREAMSHED' ? 'Streams' : form.formType === 'GROUNDWATER' ? 'Recharge Sites' : 'Springs'} &bull; {formatDate(form.submittedAt || form.createdAt)}
                        </p>
                      </div>
                      <Badge status={form.status} />
                    </div>
                  )})}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No recent forms found.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col" noPadding>
            <CardHeader title="Status Distribution" />
            <div className="p-6 flex-1 flex items-center justify-center">
              {analyticsLoading ? (
                <div className="w-48 h-48 rounded-full bg-slate-100 animate-pulse"></div>
              ) : (
                <StatusChart data={analyticsData?.overview?.statusBreakdown?.reduce((acc, curr) => ({ ...acc, [curr.status]: curr.count }), {}) || {}} />
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <QuickActions role="PIA_OFFICER" />
      </div>
    </div>
  );
}
