import React from 'react';
import { StatCard } from '../ui/StatCard';
import { FileText, CheckCircle, Clock, AlertTriangle, Droplets, DollarSign } from 'lucide-react';

export function KPIStrip({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 h-28 animate-pulse p-5 flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // The overview API returns: totalForms, totalApproved, totalPending, totalRejected,
  // totalBudgetLakh, totalSprings, etc.
  // Guard against null stats gracefully.
  const s = stats || {};

  const kpis = [
    {
      title: 'Total Forms',
      value: s.totalForms ?? s.total ?? 0,
      icon: FileText,
      color: 'navy'
    },
    {
      title: 'Approved',
      value: s.totalApproved ?? s.approved ?? 0,
      icon: CheckCircle,
      color: 'success'
    },
    {
      title: 'Pending Review',
      value: s.totalPending ?? ((s.submitted || 0) + (s.resubmitted || 0) + (s.underReview || 0)),
      icon: Clock,
      color: 'warning'
    },
    {
      title: 'Rejected',
      value: s.totalRejected ?? s.rejected ?? 0,
      icon: AlertTriangle,
      color: 'danger'
    },
  ];

  // Add bonus KPIs when data is available
  if ((s.totalSprings ?? 0) > 0 || (s.totalBudgetLakh ?? 0) > 0 || (s.totalARS ?? 0) > 0) {
    if ((s.totalSprings ?? 0) > 0) {
      kpis.push({
        title: 'Total Springs',
        value: s.totalSprings ?? 0,
        icon: Droplets,
        color: 'navy'
      });
    }
    if ((s.totalARS ?? 0) > 0) {
      kpis.push({
        title: 'Total ARS Sites',
        value: s.totalARS ?? 0,
        icon: Droplets,
        color: 'navy'
      });
    }
    if ((s.totalBudgetLakh ?? 0) > 0) {
      kpis.push({
        title: 'Budget (₹L)',
        value: `₹${s.totalBudgetLakh ?? 0}L`,
        icon: DollarSign,
        color: 'success'
      });
    }
  }

  const gridCols = kpis.length > 4
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-6 mb-8`}>
      {kpis.map((kpi, idx) => (
        <StatCard key={idx} {...kpi} />
      ))}
    </div>
  );
}
