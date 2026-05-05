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
import Link from 'next/link';

// Stable endpoints outside component
const ANALYTICS_ENDPOINTS = { overview: '/reports/overview' };

export default function DDLevelDashboard() {
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics(ANALYTICS_ENDPOINTS);

  // This returns an array after the useFetch fix (unwraps data.data automatically)
  const { data: pendingForms, loading: formsLoading } = useFetch(
    '/reports/forms-list?status=SUBMITTED,RESUBMITTED,UNDER_REVIEW&limit=5',
    []
  );

  // Safe array guard
  const pendingList = Array.isArray(pendingForms) ? pendingForms : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">DD Dashboard</h1>
        <p className="text-slate-500">District overview and pending approvals.</p>
      </div>

      <KPIStrip stats={analyticsData?.overview} loading={analyticsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Pending reviews */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col" noPadding>
            <CardHeader
              title="Pending Reviews"
              subtitle="Forms requiring your attention"
              action={
                <Link href="/dashboard/dd/review" className="text-sm text-navy hover:underline font-medium">
                  Review All &rarr;
                </Link>
              }
            />
            <div className="flex-1 overflow-auto">
              {formsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : pendingList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {pendingList.map(form => {
                    // Data comes from either DPRFlatSummary (submittedByName) or
                    // direct SpringshedDPR query (no joined name)
                    const officerName =
                      form.submittedByName ||
                      form.officerInfo?.name ||
                      form.submittedBy?.name ||
                      'Officer';
                    const springCount =
                      form.arsCount ||
                      form.streamCount ||
                      form.springCount ||
                      form.section2_aquiferIdentification?.arsDetails?.length ||
                      form.section5_hydroGeological?.table51?.length ||
                      form.section2_springIdentification?.springs?.length ||
                      0;

                    const formLabel = form.arsCount || form.section2_aquiferIdentification ? "Recharge Sites" : form.streamCount ? "Streams" : "Springs";

                    const district =
                      form.district ||
                      form.springDistrict ||
                      form.submittedByDistrict ||
                      form.section2_springIdentification?.springDistrict ||
                      '';

                    return (
                      <div key={form._id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                        <div>
                          <Link
                            href={`/dashboard/dd/review/${form._id}`}
                            className="font-mono text-sm font-medium text-navy hover:underline block mb-1"
                          >
                            {form.applicationNo || `Form #${form._id?.slice(-6)}`}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {officerName}
                            {district && <> &bull; {district}</>}
                            {springCount > 0 && <> &bull; {springCount} {formLabel}</>}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Submitted: {formatDate(form.submittedAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                          <Badge status={form.status} />
                          {form.daysWaiting != null && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${form.daysWaiting >= 14
                                  ? 'bg-red-100 text-red-800 font-bold'
                                  : form.daysWaiting >= 7
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-700'
                                }`}
                            >
                              {Math.floor(form.daysWaiting)} days waiting
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-slate-500 text-sm">No pending forms to review.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* District overview pie */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col" noPadding>
            <CardHeader title="District Overview" />
            <div className="p-6 flex-1 flex items-center justify-center">
              {analyticsLoading ? (
                <div className="w-48 h-48 rounded-full bg-slate-100 animate-pulse"></div>
              ) : (
                <StatusChart data={analyticsData?.overview?.statusBreakdown || []} />
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <QuickActions role="DD_LEVEL" />
      </div>
    </div>
  );
}
