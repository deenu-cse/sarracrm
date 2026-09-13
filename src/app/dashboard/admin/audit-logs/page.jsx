"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { apiCall } from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/formatters';
import {
  Shield, Activity, Clock, Search, Filter, X,
  LogIn, LogOut, UserPlus, UserX, Ban, RotateCcw,
  FileText, KeyRound, RefreshCw, ScrollText, Globe
} from 'lucide-react';

const ACTION_META = {
  LOGIN: { label: 'Login', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: LogIn },
  LOGOUT: { label: 'Logout', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: LogOut },
  USER_CREATE: { label: 'User Created', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: UserPlus },
  USER_SUSPEND: { label: 'User Suspended', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Ban },
  USER_DEACTIVATE: { label: 'User Deactivated', color: 'bg-red-50 text-red-700 border-red-200', icon: UserX },
  USER_RESTORE: { label: 'User Restored', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: RotateCcw },
  PASSWORD_CHANGE: { label: 'Password Change', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: KeyRound },
  FORM_SUBMIT: { label: 'Form Submit', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FileText },
  FORM_APPROVE: { label: 'Form Approved', color: 'bg-green-50 text-green-700 border-green-200', icon: FileText },
  FORM_REJECT: { label: 'Form Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: FileText },
  FORM_DRAFT_SAVE: { label: 'Draft Saved', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: FileText },
  TOKEN_REFRESH: { label: 'Token Refresh', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: RefreshCw },
  BOOTSTRAP: { label: 'Bootstrap', color: 'bg-navy/5 text-navy border-navy/20', icon: Shield },
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  PIA_OFFICER: 'PIA Officer',
  DD_LEVEL: 'DD Level',
  MND_OFFICER: 'MND Officer',
  MND_SUPER_ADMIN: 'MND Admin',
};

function ActionBadge({ action }) {
  const meta = ACTION_META[action] || {
    label: action?.replace(/_/g, ' ') || 'Unknown',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Activity
  };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

function StatCard({ title, value, sub, icon: Icon, iconBg, iconColor, glow }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 ${glow}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
          <p className="text-3xl font-black text-slate-900 mt-2 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, byAction: [] });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ action: '', role: '', search: '', from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 20,
        ...(filters.action && { action: filters.action }),
        ...(filters.role && { role: filters.role }),
        ...(filters.search && { search: filters.search }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
      };
      const query = new URLSearchParams(params).toString();
      const res = await apiCall(`/admin/audit-logs?${query}`);

      if (res?.success) {
        setLogs(res.data?.logs || []);
        setStats(res.data?.stats || { total: 0, today: 0, byAction: [] });
        if (res.pagination) {
          setPagination((prev) => ({
            ...prev,
            totalPages: res.pagination.totalPages || 1,
            total: res.pagination.total || 0,
            page: res.pagination.page || prev.page
          }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters.action]); // refetch when page or quick-filter action changes

  const topActions = useMemo(() => stats.byAction?.slice(0, 5) || [], [stats.byAction]);

  const clearFilters = () => {
    setFilters({ action: '', role: '', search: '', from: '', to: '' });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const applyFilters = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchLogs();
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-navy text-white">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Audit Logs</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete activity trail — logins, user management, forms & security events
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Events" value={stats.total?.toLocaleString() || '0'} sub="All recorded actions" icon={Activity} iconBg="bg-indigo-100" iconColor="text-indigo-600" glow="bg-indigo-400" />
        <StatCard title="Today" value={stats.today?.toLocaleString() || '0'} sub="Events since midnight" icon={Clock} iconBg="bg-emerald-100" iconColor="text-emerald-600" glow="bg-emerald-400" />
        <StatCard title="Action Types" value={stats.byAction?.length || '0'} sub="Distinct event categories" icon={Shield} iconBg="bg-amber-100" iconColor="text-amber-600" glow="bg-amber-400" />
      </div>

      {/* Top actions chips */}
      {topActions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {topActions.map((a) => (
            <button
              key={a.action}
              type="button"
              onClick={() => {
                setFilters((f) => ({ ...f, action: a.action }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-navy hover:text-navy transition-colors"
            >
              <span>{ACTION_META[a.action]?.label || a.action}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 tabular-nums">{a.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user, email, action, IP..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-light"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setTimeout(() => fetchLogs(), 0);
            }}
            className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value="">All Roles</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-navy"
              placeholder="From"
            />
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-navy"
              placeholder="To"
            />
          </div>
        )}
      </div>

      {/* Logs */}
      {loading ? (
        <FullPageSpinner />
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center">
          <ScrollText className="w-16 h-16 mx-auto text-slate-200 mb-4" />
          <p className="text-lg font-bold text-slate-700">No audit logs found</p>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Activity will appear here when users log in, manage accounts, submit forms, or perform other tracked actions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log._id}
              className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Left: user + action */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-navy to-blue-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(log.performerName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <ActionBadge action={log.action} />
                      {log.performedByRole && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                          {ROLE_LABELS[log.performedByRole] || log.performedByRole}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {log.performerName || 'System'}
                      {log.performerEmail && (
                        <span className="font-normal text-slate-400 ml-2">{log.performerEmail}</span>
                      )}
                    </p>
                    {log.metadata && (log.metadata.reason || log.metadata.accountStatus) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {log.metadata.accountStatus && (
                          <span className="font-semibold text-slate-600">{log.metadata.accountStatus}</span>
                        )}
                        {log.metadata.reason && <> · {log.metadata.reason}</>}
                        {log.metadata.suspendedUntil && (
                          <> · until {formatDate(log.metadata.suspendedUntil, 'dd MMM yyyy')}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Middle: resource */}
                <div className="lg:w-48 flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Resource</p>
                  <p className="text-xs font-mono text-slate-600 truncate">
                    {log.targetResource || '—'}
                  </p>
                  {log.targetId && (
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      ID: {String(log.targetId).slice(-8)}
                    </p>
                  )}
                </div>

                {/* Right: meta */}
                <div className="lg:w-52 flex-shrink-0 lg:text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(log.timestamp, 'dd MMM yyyy')}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {formatDate(log.timestamp, 'HH:mm:ss')}
                  </p>
                  {log.ipAddress && (
                    <p className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-1">
                      <Globe className="w-3 h-3" /> {log.ipAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={20}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          />
        </div>
      )}
    </div>
  );
}
