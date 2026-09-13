"use client";
import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/formatters';
import {
  AlertCircle, ArrowRight, CheckCircle2, Clock, FileText,
  FolderKanban, Users, Ban, Activity
} from 'lucide-react';

const STATUS_COLORS = {
  PENDING_CHECKER: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING_APPROVER: 'bg-orange-50 text-orange-700 border-orange-200',
  FORWARDED_TO_DISTRICT: 'bg-blue-50 text-blue-700 border-blue-200',
  DISTRICT_ACCEPTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  FORWARDED_TO_PIA: 'bg-violet-50 text-violet-700 border-violet-200',
  PIA_ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SANCTIONED: 'bg-teal-50 text-teal-700 border-teal-200',
  SUBMITTED: 'bg-sky-50 text-sky-700 border-sky-200',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  RETURNED_TO_PIA: 'bg-rose-50 text-rose-700 border-rose-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  STATE_VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function DashboardHero({ name, roleLabel, hint, workflowRole }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#123a66] to-[#0b1f3a] text-white p-6 md:p-8 mb-8 shadow-lg">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 85% 75%, rgba(194,65,12,0.35), transparent 45%)',
        }}
      />
      <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mb-2">
            {roleLabel}
            {workflowRole ? ` · ${workflowRole}` : ''}
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Welcome{name ? `, ${name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 text-blue-100/90 text-sm md:text-base max-w-xl">{hint}</p>
        </div>
        <div className="text-xs text-blue-200/80 font-medium">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
}

export function StatGrid({ items = [] }) {
  if (!items.length) return null;
  const cols =
    items.length <= 3
      ? 'lg:grid-cols-3'
      : items.length === 4
        ? 'lg:grid-cols-4'
        : items.length === 5
          ? 'lg:grid-cols-5'
          : 'lg:grid-cols-6';
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 ${cols} gap-4 mb-8`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
            {item.icon && (
              <div className={`p-2 rounded-xl ${item.iconBg || 'bg-slate-100'}`}>
                <item.icon className={`w-4 h-4 ${item.iconColor || 'text-slate-600'}`} />
              </div>
            )}
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums">{item.value}</p>
          {item.sub && <p className="text-xs text-slate-500 mt-1">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function ActionRequired({ items = [], emptyText = 'No actions required right now.' }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Action Required</h3>
          <p className="text-xs text-slate-500">Items waiting for your decision</p>
        </div>
        {items.length > 0 && (
          <span className="ml-auto px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            {items.length}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">{emptyText}</p>
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={item.href || '#'}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.kind === 'sanction' ? 'bg-navy/10 text-navy' : 'bg-indigo-50 text-indigo-600'}`}>
                {item.kind === 'sanction' ? <FolderKanban className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-navy">{item.title}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {(item.status || '').replace(/_/g, ' ')}
                </span>
                {item.updatedAt && (
                  <p className="text-[10px] text-slate-400 mt-1">{formatDate(item.updatedAt, 'dd MMM')}</p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function RecentList({ title = 'Recent Activity', items = [], emptyText = 'Nothing yet.' }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">{emptyText}</div>
        ) : (
          items.map((item) => (
            <Link
              key={`${item.kind || 'item'}-${item.id}`}
              href={item.href || '#'}
              className="block p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.title || item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {item.subtitle || item.action || item.resource || ''}
                  </p>
                </div>
                {item.status && (
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {(item.status || '').replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              {(item.updatedAt || item.timestamp) && (
                <p className="text-[10px] text-slate-400 mt-2">
                  {formatDate(item.updatedAt || item.timestamp, 'dd MMM yyyy, HH:mm')}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function QuickLinkGrid({ links = [] }) {
  if (!links.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:border-navy hover:text-navy shadow-sm transition-colors flex items-center justify-between group"
        >
          {link.label}
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-navy" />
        </Link>
      ))}
    </div>
  );
}

export const DASHBOARD_ICONS = {
  Users,
  FolderKanban,
  FileText,
  Clock,
  CheckCircle2,
  Ban,
  Activity,
  AlertCircle,
};
