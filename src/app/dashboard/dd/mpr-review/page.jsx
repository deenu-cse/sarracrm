"use client";
import React, { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatters';
import { patch } from '@/lib/api';
import { ClipboardCheck, CheckCircle, RotateCcw, FileText } from 'lucide-react';
import { MPR_STATUS } from '@/constants/status';
import Link from 'next/link';

const MPR_FORM_TYPES = [
  { key: 'praroop1a', label: 'Praroop-1(A) — Springs' },
  { key: 'praroop1b', label: 'Praroop-1(B) — Streams' },
  { key: 'praroop1c', label: 'Praroop-1(C) — Major Rivers' },
  { key: 'praroop1d', label: 'Praroop-1(D) — Groundwater' },
];

const FINANCIAL_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

function MPRRow({ mpr, formType, onApprove, onReturn, busy }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 flex items-start gap-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/dashboard/dd/mpr-review/${formType}/${mpr._id}`}
            className="font-mono text-sm font-bold text-navy hover:underline"
          >
            {mpr.applicationNo || `MPR-${mpr._id?.slice(-6)}`}
          </Link>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
            {formType.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-0.5">
          {mpr.reportingMonth} {mpr.financialYear}
          {mpr.projectSanctionId?.projectTitle && <> · <span className="font-medium text-slate-600">{mpr.projectSanctionId.projectTitle}</span></>}
        </p>
        <p className="text-xs text-slate-400">
          Submitted: {formatDate(mpr.submittedAt)}
          {mpr.submittedBy?.name && <> · By: {mpr.submittedBy.name}</>}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge status={mpr.status} />
        {mpr.status === MPR_STATUS.SUBMITTED && (
          <div className="flex gap-1.5">
            <Button
              size="xs"
              variant="primary"
              onClick={() => onApprove(mpr._id)}
              disabled={busy}
              className="group flex items-center gap-1 text-sm px-2 py-1"
            >
              <CheckCircle className="approve-icon w-3 h-3" />
              Approve
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => onReturn(mpr._id)}
              disabled={busy}
              className="group flex items-center gap-1 px-2 py-1"
            >
              <RotateCcw className="return-icon w-3 h-3" />
              Return
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MPRTypeSection({ formType, label, filters }) {
  const [busy, setBusy] = useState(false);
  const endpoint = `/mpr/${formType}/all-district?status=${MPR_STATUS.SUBMITTED}&page=${filters.page || 1}&limit=20`;
  const { data: rawData, loading, refetch } = useFetch(endpoint, []);
  const mprs = Array.isArray(rawData) ? rawData : (rawData?.data || []);

  const doAction = async (mprId, action, payload) => {
    setBusy(true);
    try {
      await patch(`/mpr/${formType}/${mprId}/${action}`, payload);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />)}
      </div>
    );
  }
  if (!mprs.length) return null;

  return (
    <div>
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{mprs.length} pending</span>
      </div>
      {mprs.map(mpr => (
        <MPRRow
          key={mpr._id}
          mpr={mpr}
          formType={formType}
          busy={busy}
          onApprove={(id) => doAction(id, 'district-approve', {})}
          onReturn={(id) => doAction(id, 'return', { reason: 'Returned for correction' })}
        />
      ))}
    </div>
  );
}

export default function DDMPRReviewPage() {
  const [filters, setFilters] = useState({
    financialYear: '2025-2026',
    page: 1,
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">MPR Review</h1>
          <p className="text-slate-500 text-sm">Review and approve Monthly Progress Reports from PIA Officers</p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={(f) => setFilters(prev => ({ ...prev, ...f }))}
        onApply={() => { }}
        onClear={() => setFilters({ financialYear: '2025-2026', page: 1 })}
        options={{
          financialYear: FINANCIAL_YEARS.map(y => ({ value: y, label: y })),
        }}
      />

      <Card noPadding className="mt-4">
        <CardHeader
          title="Submitted MPRs Awaiting Review"
          subtitle="Review each MPR and approve or return for correction"
        />
        <div>
          {MPR_FORM_TYPES.map(({ key, label }) => (
            <MPRTypeSection key={key} formType={key} label={label} filters={filters} />
          ))}
        </div>
        <div className="px-6 py-6 text-center text-slate-400 text-sm" id="dd-mpr-empty">
          {/* Will show if all sections are empty */}
        </div>
      </Card>
    </div>
  );
}
