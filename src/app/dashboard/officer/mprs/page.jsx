"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatters';
import { ClipboardList, Plus, FileText, ArrowRight } from 'lucide-react';
import { MPR_STATUS } from '@/constants/status';

const FORM_TYPES = [
  { key: 'praroop1a', label: 'Praroop-1(A)', subtitle: 'Head 55-01 (Springs)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', href: '/dashboard/officer/mprs/praroop1a/new' },
  { key: 'praroop1b', label: 'Praroop-1(B)', subtitle: 'Head 55-02 (Streams/Rivers)', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', href: '/dashboard/officer/mprs/praroop1b/new' },
  { key: 'praroop1c', label: 'Praroop-1(C)', subtitle: 'Head 55-03 (Major Rivers)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', href: '/dashboard/officer/mprs/praroop1c/new' },
  { key: 'praroop1d', label: 'Praroop-1(D)', subtitle: 'Head 55-04 (Groundwater)', color: 'bg-teal-50 text-teal-700 border-teal-200', href: '/dashboard/officer/mprs/praroop1d/new' },
];

function MPRSection({ formType, label }) {
  const { data: rawData, loading } = useFetch(`/mpr/${formType}/my-reports?limit=5`, []);
  const mprs = Array.isArray(rawData) ? rawData : (rawData?.data || []);

  if (loading) return (
    <div className="p-4 space-y-2">
      {[1,2].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
    </div>
  );
  if (!mprs.length) return null;

  return (
    <div>
      <div className="px-6 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      {mprs.map(mpr => (
        <div key={mpr._id} className="px-6 py-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50">
          <div>
            <Link
              href={`/dashboard/officer/mprs/${formType}/${mpr._id}`}
              className="font-mono text-sm font-bold text-navy hover:underline"
            >
              {mpr.applicationNo || `Draft-${mpr._id?.slice(-6)}`}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">
              {mpr.reportingMonth} {mpr.financialYear} · {formatDate(mpr.updatedAt || mpr.createdAt)}
            </p>
          </div>
          <Badge status={mpr.status} />
        </div>
      ))}
    </div>
  );
}

export default function OfficerMPRsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">My MPRs</h1>
          <p className="text-slate-500 text-sm">Monthly Progress Reports — Fill and submit for your active projects</p>
        </div>
      </div>

      {/* New MPR Quick Start */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Submit New MPR</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FORM_TYPES.map(({ key, label, subtitle, color, href }) => (
            <Link
              key={key}
              href={href}
              className={`group border rounded-xl p-4 flex flex-col hover:shadow-md transition-all bg-white ${color.replace('bg-', 'hover:bg-')}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-800 text-sm">{label}</span>
              <span className="text-xs text-slate-500 mt-0.5 leading-snug">{subtitle}</span>
              <div className="mt-3 flex items-center text-xs font-semibold text-slate-600 group-hover:translate-x-0.5 transition-transform">
                Start <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent MPRs */}
      <Card noPadding>
        <CardHeader
          title="My Recent MPRs"
          action={
            <div className="flex gap-3 text-xs text-slate-400">
              <span>All form types</span>
            </div>
          }
        />
        <div>
          {FORM_TYPES.map(({ key, label }) => (
            <MPRSection key={key} formType={key} label={label} />
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Showing last 5 MPRs per form type. 
            <Link href="/dashboard/officer/mprs/all" className="text-navy font-semibold hover:underline ml-1">View all →</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
