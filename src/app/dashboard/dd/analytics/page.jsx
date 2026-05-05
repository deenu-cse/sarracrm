"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { get, post } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfYear } from 'date-fns';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Scatter, ScatterChart, ZAxis,
  Treemap, RadialBarChart, RadialBar, FunnelChart, Funnel,
  LabelList
} from 'recharts';
import {
  BarChart2, TrendingUp, TrendingDown, Droplets,
  Users, DollarSign, MapPin, Activity, Filter,
  RefreshCw, Download, Calendar, ChevronDown,
  AlertTriangle, CheckCircle, Clock, FileText,
  Layers, Target, ArrowUpRight, ArrowDownRight,
  Eye, Search, Info, ExternalLink, MoreVertical
} from 'lucide-react';
import Link from 'next/link';

// ── Constants & Helpers ──────────────────────────────────────────────────────

const CHART_COLORS = [
  "#0a3d62", "#e67e22", "#1e8449", "#3b82f6",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f59e0b"
];

const STATUS_COLORS = {
  SUBMITTED: "#3b82f6",
  APPROVED: "#1e8449",
  REJECTED: "#c0392b",
  UNDER_REVIEW: "#f39c12",
  DRAFT: "#64748b",
  RESUBMITTED: "#8b5cf6"
};

const formatBudget = (val) => val ? `₹${Number(val).toFixed(2)} L` : '₹0.00 L';
const formatNumber = (val) => val ? Number(val).toLocaleString('en-IN') : '0';

const getStatusBadgeClass = (status) => {
  const map = {
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    RESUBMITTED: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`;
};

const DISTRICTS = [
  "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
  "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh",
  "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
];

const getFormTypeBadgeClass = (type) => {
  if (type === 'SPRINGSHED') return 'bg-teal-100 text-teal-800 border-teal-200';
  if (type === 'STREAMSHED') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-purple-100 text-purple-800 border-purple-200'; // GROUNDWATER
};

// ── Shared UI Components ─────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm min-w-[160px] z-50">
      <p className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: entry.color || entry.fill }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800 ml-auto">
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString('en-IN')
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <button className="text-slate-400 hover:text-slate-600 transition-colors">
        <Info className="w-4 h-4" />
      </button>
    </div>
    <div className="p-5 flex-1">{children}</div>
  </div>
);

const KPICard = ({ title, value, icon: Icon, sub, trend, trendValue, colorClass, pulse = false }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 ${colorClass}`}>
    <div className="flex justify-between items-start mb-2">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className={`p-2 rounded-lg bg-slate-50 ${pulse ? 'animate-pulse' : ''}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    <div className="mt-2 flex items-center gap-1.5">
      {trend && (
        <span className={`text-xs font-medium flex items-center ${trendValue > 0 ? 'text-green-600' : 'text-slate-400'}`}>
          {trendValue > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : null}
          {trendValue} {sub}
        </span>
      )}
      {!trend && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  </div>
);

const InsightCard = ({ type, message }) => {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  const icons = {
    warning: <AlertTriangle className="w-4 h-4" />,
    danger: <AlertTriangle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />
  };
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${styles[type]} mb-3`}>
      <span className="mt-0.5">{icons[type]}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

const EmptySection = ({ message = "No data available" }) => (
  <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
    <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
    <p className="font-medium">{message}</p>
    <p className="text-xs mt-1">Apply different filters or sync data to see results</p>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
    <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3 mb-4" />
    <div className="h-8 bg-slate-100 rounded animate-pulse w-1/2 mb-3" />
    <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
  </div>
);

// ── Main Page Component ──────────────────────────────────────────────────────

export default function DDAnalyticsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [formsData, setFormsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [formsPage, setFormsPage] = useState(1);

  const [filters, setFilters] = useState({
    formType: 'all',
    status: '',
    dateFrom: '',
    dateTo: '',
    year: new Date().getFullYear(),
    department: '',
    minBudget: '',
    maxBudget: '',
    block: '',
    district: user?.role === 'DD_LEVEL' ? user?.district : ''
  });

  const [activeFilters, setActiveFilters] = useState({});

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchDashboard = async (params = {}) => {
    setLoading(true);
    try {
      const query = buildQueryString(params);
      const res = await get(`/reports/full-dashboard?${query}`);
      if (res?.success) {
        setDashboardData(res.data);
        console.log('[DD Analytics] dashboardData:', res.data);
      } else {
        setError(res?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Network error while fetching dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async (page = 1) => {
    setFormsLoading(true);
    try {
      const query = buildQueryString({ ...activeFilters, page, limit: 20 });
      const res = await get(`/reports/forms-list?${query}`);
      if (res?.success) {
        setFormsData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch forms:', err);
    } finally {
      setFormsLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await post('/reports/sync-summaries', {});
      if (res?.success) {
        setSyncMsg(`✅ Sync complete. ${res.data?.processed} forms processed.`);
        fetchDashboard(activeFilters);
        setTimeout(() => setSyncMsg(''), 5000);
      }
    } catch (err) {
      setSyncMsg('❌ Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'forms') {
      fetchForms(formsPage);
    }
  }, [activeTab, formsPage, activeFilters]);

  const buildQueryString = (obj) => {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v && v !== 'all') params.append(k, v);
    });
    return params.toString();
  };

  const handleApplyFilters = async () => {
    setActiveFilters({ ...filters });
    const query = buildQueryString(filters);
    setLoading(true);
    try {
      const res = await get(`/reports/filtered-analytics?${query}`);
      if (res?.success) {
        setDashboardData(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived Data ──────────────────────────────────────────────────────────

  const stats = dashboardData?.overview || {};
  const monthlyTrend = dashboardData?.monthlyTrend || [];
  const springStats = dashboardData?.springTypeStats || {};
  const budgetStats = dashboardData?.budgetStats || {};
  const timeline = dashboardData?.approvalTimeline || {};
  const deptStats = dashboardData?.departmentStats || [];
  const resourceAnalytics = dashboardData?.resourceAnalytics || {};

  const approvalRate = useMemo(() => {
    if (!stats.totalForms) return 0;
    return (stats.totalApproved / stats.totalForms * 100).toFixed(1);
  }, [stats]);

  // ── Render Helpers ────────────────────────────────────────────────────────

  const renderTabHeader = () => {
    const TABS = [
      { id: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
      { id: 'water-resources', label: 'Water Resources', icon: <Droplets className="w-4 h-4" /> },
      { id: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" /> },
      { id: 'land', label: 'Land & Recharge', icon: <Layers className="w-4 h-4" /> },
      { id: 'forms', label: 'Forms Table', icon: <FileText className="w-4 h-4" /> },
    ];

    return (
      <div className="sticky -top-2 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">District Analytics Dashboard</h1>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {user?.district} District · {user?.department} ·
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Updated: {format(new Date(), "dd MMM, hh:mm a")}</span>
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={handleSync} disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-all text-slate-700 bg-white">
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-blue-500' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>
              <ExportDropdown filters={activeFilters} />
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-[#0a3d62] text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
        {syncMsg && (
          <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium animate-in slide-in-from-top duration-300">
            {syncMsg}
          </div>
        )}
      </div>
    );
  };

  const renderFilterBar = () => (
    <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-wrap gap-5 items-end">

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Form Type</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['all', 'SPRINGSHED', 'STREAMSHED', 'GROUNDWATER'].map(t => (
                <button key={t} onClick={() => setFilters(f => ({ ...f, formType: t }))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                             ${filters.formType === t
                      ? 'bg-white text-[#0a3d62] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'}`}>
                  {t === 'all' ? 'All' : t === 'SPRINGSHED' ? 'Spring' : t === 'STREAMSHED' ? 'Stream' : 'GW'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">District</label>
            <select value={filters.district}
              disabled={user?.role === 'DD_LEVEL'}
              onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none min-w-[140px] disabled:opacity-50">
              <option value="">All Districts</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Status</label>
            <select value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none min-w-[140px]">
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESUBMITTED">Resubmitted</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Date Range</label>
            <div className="flex gap-2 items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
              <input type="date" value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="text-xs bg-transparent border-none focus:ring-0 px-2 py-1" />
              <span className="text-slate-300 text-[10px] font-bold">TO</span>
              <input type="date" value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="text-xs bg-transparent border-none focus:ring-0 px-2 py-1" />
            </div>
            <div className="flex gap-2 mt-2">
              {[
                {
                  l: 'This Month', fn: () => ({
                    dateFrom: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
                    dateTo: format(new Date(), 'yyyy-MM-dd')
                  })
                },
                {
                  l: 'This Year', fn: () => ({
                    dateFrom: format(startOfYear(new Date()), 'yyyy-MM-dd'),
                    dateTo: format(new Date(), 'yyyy-MM-dd')
                  })
                },
                {
                  l: 'Last 30d', fn: () => ({
                    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                    dateTo: format(new Date(), 'yyyy-MM-dd')
                  })
                },
              ].map(p => (
                <button key={p.l}
                  onClick={() => setFilters(f => ({ ...f, ...p.fn() }))}
                  className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold uppercase transition-colors">
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Trend Year</label>
            <input type="number" value={filters.year} min={2020} max={2030}
              onChange={e => setFilters(f => ({ ...f, year: parseInt(e.target.value) || 2026 }))}
              className="text-sm border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 w-24 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="flex gap-3 items-center ml-auto">
            <button onClick={() => {
              const fresh = {
                formType: 'all', status: '', dateFrom: '', dateTo: '',
                year: new Date().getFullYear(), department: '',
                minBudget: '', maxBudget: '', block: '',
                district: user?.role === 'DD_LEVEL' ? user?.district : ''
              };
              setFilters(fresh);
              setActiveFilters({});
              fetchDashboard(fresh);
            }}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
              Reset
            </button>
            <button onClick={handleApplyFilters}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0a3d62] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#1a5276] transition-all shadow-lg shadow-blue-900/20 active:scale-95">
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </div>

        {Object.keys(activeFilters).some(k => activeFilters[k] && activeFilters[k] !== 'all' && activeFilters[k] !== '') && (
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
            {Object.entries(activeFilters)
              .filter(([k, v]) => v && v !== 'all' && v !== '')
              .filter(([k]) => !(k === 'district' && user?.role === 'DD_LEVEL')) // Hide district chip for DD officers
              .map(([key, val]) => (
                <div key={key}
                  className="flex items-center gap-2 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1.5 uppercase tracking-wider">
                  <span className="opacity-50">{key}:</span> {val}
                  <button onClick={() => {
                    const next = { ...filters, [key]: '' };
                    setFilters(next);
                    setActiveFilters(next);
                    fetchDashboard(next);
                  }} className="ml-1 hover:text-blue-900 bg-blue-200/50 rounded-full w-4 h-4 flex items-center justify-center">×</button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Tab Renderers ─────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total DPRs" value={formatNumber(stats.totalForms)} icon={FileText} sub="Forms Submitted" colorClass="border-l-[#0a3d62]" trend trendValue={stats.formsSubmittedThisMonth} />
        <KPICard title="Approved" value={formatNumber(stats.totalApproved)} icon={CheckCircle} sub={`Rate: ${approvalRate}%`} colorClass="border-l-[#1e8449]" />
        <KPICard title="Pending Review" value={formatNumber(stats.totalPending)} icon={Clock} sub="Needs action" colorClass="border-l-[#f39c12]" pulse={stats.totalPending > 0} />
        <KPICard title="Rejected" value={formatNumber(stats.totalRejected)} icon={AlertTriangle} sub="Need resubmission" colorClass="border-l-[#c0392b]" />
        
        <KPICard 
          title="Budget Breakdown" 
          value={formatBudget(stats.totalProposedBudgetLakh)} 
          icon={DollarSign} 
          sub={`Approved: ${formatBudget(stats.totalApprovedBudgetLakh)}`} 
          colorClass="border-l-[#e67e22]" 
        />
        
        <KPICard title="Beneficiaries" value={formatNumber(stats.totalPopulationBenefited)} icon={Users} sub={filters.formType === 'GROUNDWATER' ? 'Settlements' : 'People benefited'} colorClass="border-l-[#3b82f6]" />
        
        <KPICard 
          title={filters.formType === 'GROUNDWATER' ? 'ARS Count' : filters.formType === 'STREAMSHED' ? 'Stream Count' : 'Water Sources'} 
          value={formatNumber(filters.formType === 'GROUNDWATER' ? stats.totalARS : filters.formType === 'STREAMSHED' ? stats.totalStreamCount : stats.totalSprings)} 
          icon={Droplets} 
          sub={filters.formType === 'all' ? 'Springs & Streams' : 'Selected Resource'} 
          colorClass="border-l-[#14b8a6]" 
        />
        
        <KPICard title="Recharge Area" value={`${formatNumber(stats.totalRechargeAreaHa)} Ha`} icon={MapPin} sub="Total demarcated" colorClass="border-l-[#8b5cf6]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ChartCard title="Submission & Approval Trend" subtitle={`Monthly data for ${filters.year}`} className="lg:col-span-8">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar name="Submitted" dataKey="submitted" fill="#0a3d62" radius={[4, 4, 0, 0]} barSize={40} fillOpacity={0.8} />
                <Line name="Approved" type="monotone" dataKey="approved" stroke="#1e8449" strokeWidth={3} dot={{ r: 4, fill: '#1e8449', strokeWidth: 2, stroke: '#fff' }} />
                <Line name="Rejected" type="monotone" dataKey="rejected" stroke="#c0392b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="DPR Status Breakdown" subtitle="Distribution of all forms" className="lg:col-span-4">
          <div className="h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusBreakdown || []} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="status">
                  {(stats.statusBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{stats.totalForms}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total DPRs</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(stats.statusBreakdown || []).map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{s.status.replace('_', ' ')}</p>
                  <p className="text-sm font-bold text-slate-800">{s.count}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Approval Performance" subtitle="Processing time analytics">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">Avg Review Days</p>
              <h4 className="text-2xl font-black text-blue-900">{timeline.avgDaysToFirstReview?.toFixed(1) || '0.0'}</h4>
            </div>
            <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
              <p className="text-xs font-bold text-green-600 uppercase mb-1">Avg Approval Days</p>
              <h4 className="text-2xl font-black text-green-900">{timeline.avgDaysSubmitToApprove?.toFixed(1) || '0.0'}</h4>
            </div>
          </div>

          <div className="space-y-3">
            {timeline.formsWaitingOver14Days > 0 && (
              <InsightCard type="danger" message={`${timeline.formsWaitingOver14Days} forms are waiting for review over 14 days! Priority action required.`} />
            )}
            {timeline.formsWaitingOver7Days > 0 && (
              <InsightCard type="warning" message={`${timeline.formsWaitingOver7Days} forms pending over 7 days.`} />
            )}
            {timeline.formsWaitingOver7Days === 0 && (
              <InsightCard type="success" message="All pending forms are within the 7-day review SLA." />
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Processing Speed (Days)</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={80} data={[
                  { subject: 'Review', A: timeline.avgDaysToFirstReview || 0, fullMark: 30 },
                  { subject: 'Drafting', A: timeline.avgDaysDraftToSubmit || 0, fullMark: 30 },
                  { subject: 'Total', A: timeline.avgDaysSubmitToApprove || 0, fullMark: 30 },
                ]}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                  <Radar name="Days" dataKey="A" stroke="#0a3d62" fill="#0a3d62" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Department Statistics" subtitle="Distribution across departments">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 font-bold text-slate-400 uppercase text-[10px]">Department</th>
                  <th className="pb-3 font-bold text-slate-400 uppercase text-[10px] text-center">Forms</th>
                  <th className="pb-3 font-bold text-slate-400 uppercase text-[10px] text-center">Budget (₹L)</th>
                  <th className="pb-3 font-bold text-slate-400 uppercase text-[10px] text-right">Appr. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {deptStats.slice(0, 6).map((dept, i) => {
                  const rate = (dept.approved / (dept.totalForms || 1) * 100);
                  const rateColor = rate > 80 ? 'bg-green-500' : rate > 50 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 truncate max-w-[150px]">{dept.department}</td>
                      <td className="py-3 text-center text-slate-600">{dept.totalForms}</td>
                      <td className="py-3 text-center font-medium text-[#e67e22]">{dept.totalBudgetLakh?.toFixed(1)}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${rateColor}`} style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 w-8 text-right">{rate.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptStats.slice(0, 5)} layout="vertical" margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="department" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="totalBudgetLakh" name="Budget (Lakh)" fill="#0a3d62" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Project Submissions" subtitle="Latest 5 DPRs from your district">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 font-bold text-slate-400 uppercase text-[10px]">App No</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-[10px]">Type</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-[10px]">Block</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-[10px]">Budget</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-[10px]">Status</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(dashboardData?.recentForms?.data || []).slice(0, 5).map((form, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-all group">
                  <td className="py-4 font-mono font-bold text-slate-800">{form.applicationNo}</td>
                  <td className="py-4">
                    <span className={getFormTypeBadgeClass(form.formType) + ' px-2 py-0.5 rounded-full text-[10px] font-bold'}>
                      {form.formType === 'SPRINGSHED' ? 'SPRING' : form.formType === 'STREAMSHED' ? 'STREAM' : 'GW'}
                    </span>
                  </td>
                  <td className="py-4 text-slate-600">{form.block}</td>
                  <td className="py-4 font-bold text-slate-700">{formatBudget(form.totalBudgetLakh)}</td>
                  <td className="py-4">
                    <span className={getStatusBadgeClass(form.status)}>{form.status}</span>
                  </td>
                  <td className="py-4 text-right">
                    <Link href={`/dashboard/dd/review/${form.dprId}?type=${form.formType}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#0a3d62] hover:text-white transition-all shadow-sm">
                      Review <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-center">
          <button onClick={() => setActiveTab('forms')} className="text-xs font-bold text-[#0a3d62] hover:underline flex items-center gap-1 uppercase tracking-widest">
            View All Reports <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </ChartCard>
    </div>
  );

  const renderResourceAnalytics = () => {
    if (!resourceAnalytics.springs) return <EmptySection message="Resource statistics not available. Please sync data first." />;

    const { springs, streams, groundwater } = resourceAnalytics;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* KPI Row for Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#0a3d62] to-[#1a5276] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                  <Droplets className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase py-1 px-2 bg-green-500/20 text-green-300 rounded-lg">Springshed</span>
              </div>
              <h3 className="text-3xl font-black mb-1">{springs.total} Sources</h3>
              <p className="text-xs text-blue-100/70 font-medium mb-4">Total Springs identified across district</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-60">Perennial</p>
                  <p className="font-bold">{springs.perennial}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-60">Seasonal</p>
                  <p className="font-bold">{springs.seasonal}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-60">Avg LPM</p>
                  <p className="font-bold text-teal-300">{springs.avgDischarge?.toFixed(1)}</p>
                </div>
              </div>
            </div>
            <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-gradient-to-br from-[#1e8449] to-[#27ae60] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase py-1 px-2 bg-white/20 text-white rounded-lg">Streamshed</span>
              </div>
              <h3 className="text-3xl font-black mb-1">{streams.total} Catchments</h3>
              <p className="text-xs text-green-50/70 font-medium mb-4">Total streamshed areas identified</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-60">Total Area (Ha)</p>
                  <p className="font-bold">{streams.totalCatchmentArea?.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-60">Total Length (Km)</p>
                  <p className="font-bold">{streams.totalLength?.toFixed(1)}</p>
                </div>
              </div>
            </div>
            <Layers className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase py-1 px-2 bg-white/20 text-white rounded-lg">Groundwater</span>
              </div>
              <h3 className="text-3xl font-black mb-1">{groundwater.stats.totalARS} ARS</h3>
              <p className="text-xs text-purple-50/70 font-medium mb-4">Artificial Recharge Structures</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-60">Recharge Area</p>
                  <p className="font-bold">{groundwater.stats.totalRechargeArea?.toFixed(1)} Ha</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-60">Avg Depth</p>
                  <p className="font-bold">{groundwater.stats.avgDepthPre?.toFixed(1)}m / {groundwater.stats.avgDepthPost?.toFixed(1)}m</p>
                </div>
              </div>
            </div>
            <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

        {/* Land Breakdown Section */}
        <ChartCard title="Land Ownership Breakdown" subtitle="Distribution of resource areas by land type (Ha)">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Forest Land</p>
              <h4 className="text-xl font-black text-emerald-900">{resourceAnalytics.land?.forest?.toFixed(1) || '0.0'} Ha</h4>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Revenue Land</p>
              <h4 className="text-xl font-black text-orange-900">{resourceAnalytics.land?.revenue?.toFixed(1) || '0.0'} Ha</h4>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Private Land</p>
              <h4 className="text-xl font-black text-blue-900">{resourceAnalytics.land?.private?.toFixed(1) || '0.0'} Ha</h4>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Impacted</p>
              <h4 className="text-xl font-black text-slate-900">{resourceAnalytics.land?.total?.toFixed(1) || '0.0'} Ha</h4>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Forest', value: resourceAnalytics.land?.forest || 0, fill: '#10b981' },
                { name: 'Revenue', value: resourceAnalytics.land?.revenue || 0, fill: '#f59e0b' },
                { name: 'Private', value: resourceAnalytics.land?.private || 0, fill: '#3b82f6' }
              ]} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={60} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Detailed Analytics for Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Spring Health & Typology" subtitle="Geological and Nature distribution">
            <div className="grid grid-cols-2 gap-4 h-[300px]">
              <div className="relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Perennial', value: springs.perennial, fill: '#1e8449' },
                      { name: 'Seasonal', value: springs.seasonal, fill: '#f39c12' },
                      { name: 'Dried', value: springs.dried, fill: '#ef4444' }
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                      <Cell fill="#1e8449" />
                      <Cell fill="#f39c12" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-slate-800">{springs.total}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Nature</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Average Discharge</p>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-black text-blue-600">{springs.avgDischarge?.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-slate-500 mb-1">LPM</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Primary Typology</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">Fracture/Fault Controlled</p>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Groundwater Availability & Risk" subtitle="Sustainability and Vulnerability assessment">
            <div className="h-[300px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={80} data={[
                  { subject: 'Safe', A: groundwater.availability.find(a => a.status === 'SAFE')?.count || 0 },
                  { subject: 'Semi-Critical', A: groundwater.availability.find(a => a.status === 'SEMI_CRITICAL')?.count || 0 },
                  { subject: 'Critical', A: groundwater.availability.find(a => a.status === 'CRITICAL')?.count || 0 },
                  { subject: 'Over-Exploited', A: groundwater.availability.find(a => a.status === 'OVER_EXPLOITED')?.count || 0 },
                ]}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                  <Radar name="Count" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Hydrological Depth Trend" subtitle="Pre vs Post Monsoon levels (m)">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Pre-Monsoon', depth: groundwater.stats.avgDepthPre, fill: '#f59e0b' },
                  { name: 'Post-Monsoon', depth: groundwater.stats.avgDepthPost, fill: '#3b82f6' }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="depth" radius={[10, 10, 10, 10]} barSize={40}>
                    <LabelList dataKey="depth" position="top" formatter={(v) => `${v.toFixed(1)}m`} style={{ fontSize: 12, fontWeight: 800 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Groundwater Usage" subtitle="Sector-wise distribution">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groundwater.uses.sort((a, b) => b.count - a.count).slice(0, 5)} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="use" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Vulnerability Levels" subtitle="District-wide groundwater risk">
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={groundwater.vulnerability} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="level" label={({ level, count }) => `${level}: ${count}`}>
                    {groundwater.vulnerability.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.level === 'HIGH' ? '#ef4444' : entry.level === 'MODERATE' ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[#f8fafc] rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Info className="w-4 h-4" /></div>
              <h4 className="font-bold text-slate-800 text-sm">Groundwater Insight</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {groundwater.stats.avgDepthPre - groundwater.stats.avgDepthPost > 5 
                ? "Significant seasonal variation in groundwater depth ( >5m) observed. Prioritize multi-stage recharge structures to stabilize water table."
                : "Groundwater levels appear stable with moderate seasonal recharge. Focus on maintaining existing ARS structures."}
            </p>
          </div>
          <div className="p-5 bg-[#f8fafc] rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
              <h4 className="font-bold text-slate-800 text-sm">Streamshed Health</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Total catchment area of {streams.totalCatchmentArea?.toFixed(0)} Ha has been demarcated. 
              {streams.dried > 0 ? ` WARNING: ${streams.dried} streams are currently dried and require immediate rejuvenation through intensive soil & water conservation.` : " All identified streams are currently perennial or seasonal."}
            </p>
          </div>
        </div>
      </div>
    );
  };


  const renderBudgetAnalytics = () => {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Proposed Budget" value={formatBudget(budgetStats.totalProposedLakh)} icon={DollarSign} sub="All submitted DPRs" colorClass="border-l-[#0a3d62]" />
          <KPICard title="Approved Budget" value={formatBudget(budgetStats.totalApprovedBudgetLakh)} icon={CheckCircle} sub="From approved DPRs" colorClass="border-l-[#1e8449]" />
          <KPICard title="Avg per Project" value={formatBudget(budgetStats.avgBudgetPerDPR)} icon={TrendingUp} sub="Mean project cost" colorClass="border-l-[#e67e22]" />
          <KPICard title="SARRA Funds" value={formatBudget(budgetStats.totalSARRAConvergenceLakh)} icon={Target} sub="Convergence amount" colorClass="border-l-[#3b82f6]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <ChartCard title="Funding Source Breakdown" subtitle="Distribution of funds" className="lg:col-span-4">
            <div className="h-[280px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: 'PIA/Dept', value: budgetStats.totalPIAFundLakh || 0 },
                    { name: 'SARRA', value: budgetStats.totalSARRAConvergenceLakh || 0 },
                    { name: 'Other', value: budgetStats.totalOtherSourceLakh || 0 },
                  ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    <Cell fill="#0a3d62" />
                    <Cell fill="#1e8449" />
                    <Cell fill="#e67e22" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{formatBudget(budgetStats.totalProposedLakh)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {[
                { n: 'PIA / Department Funds', v: budgetStats.totalPIAFundLakh, p: (budgetStats.totalPIAFundLakh / budgetStats.totalProposedLakh * 100), c: '#0a3d62' },
                { n: 'SARRA Convergence', v: budgetStats.totalSARRAConvergenceLakh, p: (budgetStats.totalSARRAConvergenceLakh / budgetStats.totalProposedLakh * 100), c: '#1e8449' },
                { n: 'Other Source Funds', v: budgetStats.totalOtherSourceLakh, p: (budgetStats.totalOtherSourceLakh / budgetStats.totalProposedLakh * 100), c: '#e67e22' },
              ].map((f, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: f.c }} /> {f.n}
                    </span>
                    <span className="text-slate-800">{f.p?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: f.c, width: `${f.p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Budget by Department" subtitle="Stacked funding sources" className="lg:col-span-8">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetStats.budgetByDepartment || []} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, angle: -45, textAnchor: 'end' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar name="PIA Fund" dataKey="totalPIAFundLakh" stackId="a" fill="#0a3d62" />
                  <Bar name="SARRA" dataKey="totalSARRAConvergenceLakh" stackId="a" fill="#1e8449" />
                  <Bar name="Other" dataKey="totalOtherSourceLakh" stackId="a" fill="#e67e22" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Top Activities by Budget" subtitle="Financial allocation per activity">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(budgetStats.activityWiseBudget || []).slice(0, 10).sort((a, b) => b.totalFinancialAmountLakh - a.totalFinancialAmountLakh)} layout="vertical" margin={{ left: 100 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="activityLabel" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, width: 90 }} width={120} tickFormatter={(val) => val.length > 20 ? val.substring(0, 18) + '...' : val} />
                  <Tooltip />
                  <Bar dataKey="totalFinancialAmountLakh" name="Budget (L)" fill="#0a3d62" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="totalFinancialAmountLakh" position="right" formatter={(v) => `₹${v.toFixed(1)}L`} style={{ fontSize: 10, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Activity Stats Table" subtitle="Detailed breakdown">
            <div className="overflow-auto max-h-[400px] border border-slate-100 rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Budget (₹L)</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Physical</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(budgetStats.activityWiseBudget || []).sort((a, b) => b.totalFinancialAmountLakh - a.totalFinancialAmountLakh).map((act, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-3 py-2.5 text-slate-700 font-medium">{act.activityLabel}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-[#e67e22]">{act.totalFinancialAmountLakh?.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{act.totalPhysicalTarget} {act.unit || 'Units'}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#0a3d62] text-white font-bold">
                    <td className="px-3 py-3 rounded-bl-lg">TOTAL DISTRICT BUDGET</td>
                    <td className="px-3 py-3 text-right">₹{budgetStats.totalProposedLakh?.toFixed(2)} L</td>
                    <td className="px-3 py-3 text-right rounded-br-lg">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  const renderLandRechargeAnalytics = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Recharge Area" value={`${stats.totalRechargeAreaHa} Ha`} icon={Layers} sub="Demarcated area" colorClass="border-l-[#1e8449]" />
        <KPICard title="Demarcated Areas" value={springStats.totalRechargeAreaDemarcated} icon={Target} sub="Number of project areas" colorClass="border-l-[#0a3d62]" />
        <KPICard title="Avg per DPR" value={`${(stats.totalRechargeAreaHa / (stats.totalForms || 1)).toFixed(1)} Ha`} icon={TrendingUp} sub="Mean area per project" colorClass="border-l-[#e67e22]" />
        <KPICard title="KML Files" value={stats.totalSprings} icon={MapPin} sub="Mapped locations" colorClass="border-l-[#3b82f6]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Recharge Area by Type" subtitle="Forest vs Revenue vs Private">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Springshed', forest: 45, revenue: 30, private: 15 },
                { name: 'Streamshed', forest: 60, revenue: 20, private: 10 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Area (Ha)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar name="Forest Land" dataKey="forest" stackId="a" fill="#1e8449" />
                <Bar name="Revenue Land" dataKey="revenue" stackId="a" fill="#f39c12" />
                <Bar name="Private Land" dataKey="private" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Recharge Composition" subtitle="Overall land distribution">
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: 'Forest', value: 65, fill: '#1e8449' },
                  { name: 'Revenue', value: 25, fill: '#f39c12' },
                  { name: 'Private', value: 10, fill: '#ef4444' },
                ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Water Recharge Compliance (Streamshed)" subtitle="Min 10% budget mandate for recharge">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 font-bold text-slate-400 uppercase">App No</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-right">Total Budget (₹L)</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-right">Recharge Budget (₹L)</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-right">Percentage</th>
                <th className="pb-3 font-bold text-slate-400 uppercase text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 font-mono font-bold">STR/DDN/001</td>
                <td className="py-3 text-right">15.50</td>
                <td className="py-3 text-right">1.80</td>
                <td className="py-3 text-right font-bold">11.6%</td>
                <td className="py-3 text-right"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">COMPLIANT</span></td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 font-mono font-bold">STR/DDN/004</td>
                <td className="py-3 text-right">12.00</td>
                <td className="py-3 text-right">0.95</td>
                <td className="py-3 text-right font-bold text-red-600">7.9%</td>
                <td className="py-3 text-right"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">NON-COMPLIANT</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Overall Compliance Rate</p>
            <h4 className="text-2xl font-black text-slate-800">84%</h4>
          </div>
          <div className="w-2/3 h-4 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '84%' }} />
          </div>
        </div>
      </ChartCard>
    </div>
  );

  const renderFormsTable = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by App No, Block, Dept..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50">
          <option>Sort by Date (Newest)</option>
          <option>Sort by Budget (High to Low)</option>
          <option>Sort by Status</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">App No</th>
                <th className="px-6 py-4">Form Type</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Block</th>
                <th className="px-6 py-4">Sources</th>
                <th className="px-6 py-4">Budget (₹L)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formsLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="8" className="px-6 py-4">
                      <div className="h-4 bg-slate-50 animate-pulse rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : formsData?.data?.length > 0 ? (
                formsData.data.map((form, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-[#0a3d62]">{form.applicationNo}</td>
                    <td className="px-6 py-4">
                      <span className={getFormTypeBadgeClass(form.formType) + ' px-2.5 py-1 rounded-full text-[10px] font-bold uppercase'}>
                        {form.formType === 'SPRINGSHED' ? 'Spring' : form.formType === 'STREAMSHED' ? 'Stream' : 'Groundwater'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[150px] truncate">{form.department}</td>
                    <td className="px-6 py-4 text-slate-600">{form.block}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        {form.formType === 'SPRINGSHED' ? form.springCount : form.formType === 'STREAMSHED' ? form.streamCount : form.arsCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">{form.totalBudgetLakh?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadgeClass(form.status)}>{form.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/dd/review/${form.dprId}?type=${form.formType}`}
                          className="p-2 hover:bg-[#0a3d62] hover:text-white rounded-lg transition-all text-slate-400 group-hover:text-slate-600 border border-transparent hover:border-[#0a3d62]">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">No forms found matching filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {formsData?.pagination && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing {((formsPage - 1) * 20) + 1}-{Math.min(formsPage * 20, formsData.pagination.totalItems)} of {formsData.pagination.totalItems} forms
            </p>
            <div className="flex gap-2">
              <button disabled={formsPage === 1} onClick={() => setFormsPage(p => p - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-white transition-all">
                Previous
              </button>
              <button disabled={formsPage === formsData.pagination.totalPages} onClick={() => setFormsPage(p => p + 1)}
                className="px-3 py-1.5 bg-[#0a3d62] text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-[#1a5276] transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {formsData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-900 text-white rounded-2xl shadow-xl">
          <div className="border-r border-blue-800/50 px-4">
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-1">Filtered Count</p>
            <h4 className="text-xl font-black">{formsData.pagination?.totalItems || 0} DPRs</h4>
          </div>
          <div className="border-r border-blue-800/50 px-4">
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-1">Total Budget</p>
            <h4 className="text-xl font-black">₹{formsData.data.reduce((sum, f) => sum + (f.totalBudgetLakh || 0), 0).toFixed(2)} L</h4>
          </div>
          <div className="border-r border-blue-800/50 px-4">
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-1">Beneficiaries</p>
            <h4 className="text-xl font-black">{formsData.data.reduce((sum, f) => sum + (f.totalPopulationBenefited || 0), 0).toLocaleString()}</h4>
          </div>
          <div className="px-4">
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-1">Recharge Area</p>
            <h4 className="text-xl font-black">{formsData.data.reduce((sum, f) => sum + (f.totalRechargeAreaHa || 0), 0).toFixed(1)} Ha</h4>
          </div>
        </div>
      )}
    </div>
  );

  // ── Final Page Layout ─────────────────────────────────────────────────────

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Dashboard</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button onClick={() => fetchDashboard()} className="w-full py-3 bg-[#0a3d62] text-white rounded-xl font-bold transition-all hover:bg-[#1a5276]">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {renderTabHeader()}
      {renderFilterBar()}

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[400px] bg-white rounded-xl border border-slate-200 animate-pulse" />
              <div className="h-[400px] bg-white rounded-xl border border-slate-200 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'water-resources' && renderResourceAnalytics()}
            {activeTab === 'budget' && renderBudgetAnalytics()}
            {activeTab === 'land' && renderLandRechargeAnalytics()}
            {activeTab === 'forms' && renderFormsTable()}
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

const ExportDropdown = ({ filters }) => {
  const [open, setOpen] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const buildQuery = (extra = {}) => {
    const params = new URLSearchParams();
    const f = { ...filters, ...extra };
    Object.entries(f).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '') params.append(k, v);
    });
    return params.toString();
  };

  const exports = [
    { label: '📄 CSV Summary', type: 'csv', query: 'type=summary' },
    { label: '📊 CSV Detailed', type: 'csv', query: 'type=detailed' },
    { label: '📈 Excel District Report', type: 'excel', query: 'type=district_report' },
    { label: '💰 Budget Breakdown (Excel)', type: 'excel', query: 'type=budget' },
    { label: '📑 Summary Report (PDF)', type: 'pdf', query: '' },
  ];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-[#e67e22] hover:bg-[#d35400] text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-orange-900/10">
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 min-w-[240px] py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="px-4 py-2 border-b border-slate-50 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Export Type</p>
            </div>
            {exports.map((e, idx) => {
              let url = '';
              if (e.type === 'csv') url = `${API_URL}/reports/export/csv?${e.query}&${buildQuery()}`;
              else if (e.type === 'excel') url = `${API_URL}/reports/export/excel?${e.query}&${buildQuery()}`;
              else if (e.type === 'pdf') url = `${API_URL}/reports/export/summary-pdf?${buildQuery()}`;

              return (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-all font-medium">
                  <div className={`p-1.5 rounded-lg ${e.type === 'pdf' ? 'bg-red-50 text-red-500' : e.type === 'excel' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                    {e.type === 'pdf' ? <FileText className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                  </div>
                  {e.label}
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
