"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { get } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import {
  BarChart2, TrendingUp, Users, DollarSign, MapPin,
  Activity, Filter, RefreshCw, Download, Calendar,
  CheckCircle, Clock, FileText, Target, Building2,
  Info, ArrowUpRight,
  IndianRupee
} from 'lucide-react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

// ── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = ["#0a3d62", "#e67e22", "#1e8449", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", "#f59e0b"];

const STATUS_COLORS = {
  SUBMITTED: "#3b82f6",
  APPROVED: "#1e8449",
  REJECTED: "#c0392b",
};

const DISTRICTS = [
  { id: "Almora", label: "Almora" },
  { id: "Bageshwar", label: "Bageshwar" },
  { id: "Chamoli", label: "Chamoli" },
  { id: "Champawat", label: "Champawat" },
  { id: "Dehradun", label: "Dehradun" },
  { id: "Haridwar", label: "Haridwar" },
  { id: "Nainital", label: "Nainital" },
  { id: "Pauri", label: "Pauri Garhwal" },
  { id: "Pithoragarh", label: "Pithoragarh" },
  { id: "Rudraprayag", label: "Rudraprayag" },
  { id: "Tehri", label: "Tehri Garhwal" },
  { id: "USNagar", label: "Udham Singh Nagar" },
  { id: "Uttarkashi", label: "Uttarkashi" }
];

// ── Components ──────────────────────────────────────────────────────────────

const KPICard = ({ title, value, icon: Icon, sub, colorClass }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 ${colorClass}`}>
    <div className="flex justify-between items-start mb-2">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="p-2 rounded-lg bg-slate-50">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    <p className="text-xs text-slate-500 mt-2">{sub}</p>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5 flex-1">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm min-w-[160px] z-50">
      <p className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color || entry.fill }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800 ml-auto">
            {typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function MNDAdminAnalytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    financialYear: '2025-26',
    district: '',
    status: ''
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.financialYear) query.append('financialYear', filters.financialYear);
      if (filters.district) query.append('district', filters.district);
      if (filters.status) query.append('status', filters.status);
      const res = await get(`/mpr/abstract55/analytics/full?${query.toString()}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.financialYear, filters.district, filters.status]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stats = data?.overview || {};

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_SUPER_ADMIN]}>
      <div className="min-h-screen bg-slate-50/50">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 px-6 py-8 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">MND Advanced Analytics</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" /> State-wide Monitoring Dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => fetchAnalytics()} className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 font-medium bg-white text-slate-700">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Data
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0a3d62] text-white rounded-lg hover:bg-[#1a5276] font-medium shadow-sm">
                <Download className="w-4 h-4" /> Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Financial Year</label>
              <select
                value={filters.financialYear}
                onChange={e => setFilters({ ...filters, financialYear: e.target.value })}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none min-w-[140px]"
              >
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">District Focus</label>
              <select
                value={filters.district}
                onChange={e => setFilters({ ...filters, district: e.target.value })}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none min-w-[140px]"
              >
                <option value="">All Districts</option>
                {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <button
              onClick={() => fetchAnalytics()}
              className="flex items-center gap-2 px-6 py-2 bg-[#0a3d62] text-white text-sm font-bold rounded-lg hover:bg-[#1a5276] transition-all ml-auto"
            >
              <Filter className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
            {['overview', 'praroop1a', 'praroop1b', 'praroop1c', 'praroop1d', 'departments', 'districts', 'trends'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold capitalize transition-all border-b-2 whitespace-nowrap
                  ${activeTab === tab
                    ? 'border-[#0a3d62] text-[#0a3d62]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'praroop1a' ? 'Praroop-1(A)' : tab === 'praroop1b' ? 'Praroop-1(B)' : tab === 'praroop1c' ? 'Praroop-1(C)' : tab === 'praroop1d' ? 'Praroop-1(D)' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total MPRs" value={stats.totalForms || 0} sub="Forms submitted" icon={FileText} colorClass="border-l-[#0a3d62]" />
                <KPICard title="Total Proposals" value={stats.totalProposals || 0} sub="Across all depts" icon={Users} colorClass="border-l-[#3b82f6]" />
                <KPICard title="Total Budget" value={`₹${stats.totalBudget?.toFixed(1) || 0} L`} sub="Proposed amount" icon={IndianRupee} colorClass="border-l-[#1e8449]" />
                <KPICard title="SARRA Share" value={`₹${stats.totalSarraShare?.toFixed(1) || 0} L`} sub="Convergence part" icon={Target} colorClass="border-l-[#e67e22]" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Status Distribution" subtitle="Form processing breakdown">
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
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                    </div>
                  </div>
                </ChartCard>
                <ChartCard title="Funding Trend" subtitle="Budget allocation over time">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.monthlyTrend}>
                        <defs>
                          <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0a3d62" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#0a3d62" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="budget" name="Budget (₹L)" stroke="#0a3d62" strokeWidth={3} fillOpacity={1} fill="url(#colorBudget)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {activeTab === 'praroop1a' && (<Praroop1ATab data={data?.praroop1a} />)}
          {activeTab === 'praroop1b' && (<Praroop1BTab data={data?.praroop1b} />)}

          {activeTab === 'departments' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <ChartCard title="Departmental Analytics" subtitle="Proposals and funding breakdown by agency">
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.departmentStats} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="deptShare" name="Dept Share" fill="#0a3d62" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="sarraShare" name="SARRA Share" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          )}

          {activeTab === 'districts' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <ChartCard title="District Comparison" subtitle="Project volume across districts">
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.districtStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="proposals" name="Proposals" fill="#1e8449" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <ChartCard title="Submission Velocity" subtitle="Monthly activity tracking">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data?.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="submitted" name="Forms Submitted" fill="#e2e8f0" barSize={50} radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="proposals" name="Proposals" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

// ── Praroop-1(A) Analytics Tab Component ─────────────────────────────────
const P1A_COLORS = ['#0a3d62', '#e67e22', '#1e8449', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b', '#3b82f6', '#6366f1', '#ec4899'];

function Praroop1ATab({ data }) {
  if (!data) return <div className="text-center py-16 text-slate-400">No Praroop-1(A) data available</div>;
  const ov = data.overview || {};
  const utilPct = ov.totalSarraBudget > 0 ? Math.min(100, ((ov.totalSarraExpend / ov.totalSarraBudget) * 100)).toFixed(1) : 0;
  const radialData = [{ name: 'Utilization', value: parseFloat(utilPct), fill: parseFloat(utilPct) > 80 ? '#1e8449' : parseFloat(utilPct) > 50 ? '#e67e22' : '#ef4444' }];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniKPI label="Total Forms" value={ov.totalForms} />
        <MiniKPI label="Approved" value={ov.totalApproved} color="text-green-600" />
        <MiniKPI label="Pending" value={ov.totalPending} color="text-blue-600" />
        <MiniKPI label="Physical Progress" value={ov.totalPhysicalProgress?.toLocaleString()} color="text-emerald-700" />
        <MiniKPI label="SARRA Spent" value={`₹${ov.totalSarraExpend?.toFixed(2)} L`} color="text-amber-600" />
        <MiniKPI label="SARRA Budget" value={`₹${ov.totalSarraBudget?.toFixed(2)} L`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity-wise Physical Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise Physical Progress</h3>
            <p className="text-xs text-slate-500">Cumulative units completed per activity</p>
          </div>
          <div className="p-5 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="code" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysicalProgress" name="Physical Progress" fill="#1e8449" radius={[0, 4, 4, 0]} />
                <Bar dataKey="targetUnit" name="Target" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Utilization Radial */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Budget Utilization</h3>
            <p className="text-xs text-slate-500">SARRA expenditure vs allocation</p>
          </div>
          <div className="p-5 h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={10} fill={radialData[0].fill} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
              <span className="text-4xl font-bold text-slate-800">{utilPct}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilized</span>
            </div>
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Allocated</p>
              <p className="text-sm font-bold text-slate-800">₹{ov.totalSarraBudget?.toFixed(2)} L</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
              <p className="text-sm font-bold text-amber-600">₹{ov.totalSarraExpend?.toFixed(2)} L</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity-wise SARRA Expenditure */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise SARRA Expenditure</h3>
            <p className="text-xs text-slate-500">Budget vs Spend per activity (₹ Lakh)</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalSarraBudget" name="SARRA Budget" fill="#0a3d62" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA Spent" fill="#e67e22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District-wise Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">District-wise Summary</h3>
            <p className="text-xs text-slate-500">Physical progress & SARRA spend by district</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.districtStats} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} width={90} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysical" name="Physical" fill="#1e8449" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA (₹L)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Forms Table */}
      {data.recentForms?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Praroop-1(A) Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left">Application No</th>
                  <th className="px-5 py-3 text-left">Month</th>
                  <th className="px-5 py-3 text-left">District</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Physical</th>
                  <th className="px-5 py-3 text-right">SARRA (₹L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentForms.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0a3d62]">{f.applicationNo}</td>
                    <td className="px-5 py-3 text-slate-600">{f.reportingMonth} {f.financialYear}</td>
                    <td className="px-5 py-3 text-slate-600">{f.submittedByDistrict}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${f.status === 'APPROVED' ? 'bg-green-100 text-green-700' : f.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{f.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-green-700">{f.grandTotalPhysicalProgress}</td>
                    <td className="px-5 py-3 text-right font-bold text-amber-600">₹{f.grandTotalSarraExpend?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Praroop-1(B) Analytics Tab Component ─────────────────────────────────
function Praroop1BTab({ data }) {
  if (!data) return <div className="text-center py-16 text-slate-400">No Praroop-1(B) data available</div>;
  const ov = data.overview || {};
  const utilPct = ov.totalSarraBudget > 0 ? Math.min(100, ((ov.totalSarraExpend / ov.totalSarraBudget) * 100)).toFixed(1) : 0;
  const radialData = [{ name: 'Utilization', value: parseFloat(utilPct), fill: parseFloat(utilPct) > 80 ? '#1a6fc4' : parseFloat(utilPct) > 50 ? '#e67e22' : '#ef4444' }];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniKPI label="Total Forms" value={ov.totalForms} />
        <MiniKPI label="Approved" value={ov.totalApproved} color="text-green-600" />
        <MiniKPI label="Pending" value={ov.totalPending} color="text-blue-600" />
        <MiniKPI label="Physical Progress" value={ov.totalPhysicalProgress?.toLocaleString()} color="text-[#1a6fc4]" />
        <MiniKPI label="SARRA Spent" value={`₹${ov.totalSarraExpend?.toFixed(2)} L`} color="text-amber-600" />
        <MiniKPI label="SARRA Budget" value={`₹${ov.totalSarraBudget?.toFixed(2)} L`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity-wise Physical Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise Physical Progress</h3>
            <p className="text-xs text-slate-500">Cumulative units completed per activity</p>
          </div>
          <div className="p-5 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="code" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysicalProgress" name="Physical Progress" fill="#1a6fc4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="targetUnit" name="Target" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Utilization Radial */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Budget Utilization</h3>
            <p className="text-xs text-slate-500">SARRA expenditure vs allocation</p>
          </div>
          <div className="p-5 h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={10} fill={radialData[0].fill} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
              <span className="text-4xl font-bold text-slate-800">{utilPct}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilized</span>
            </div>
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Allocated</p>
              <p className="text-sm font-bold text-slate-800">₹{ov.totalSarraBudget?.toFixed(2)} L</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
              <p className="text-sm font-bold text-amber-600">₹{ov.totalSarraExpend?.toFixed(2)} L</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity-wise SARRA Expenditure */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise SARRA Expenditure</h3>
            <p className="text-xs text-slate-500">Budget vs Spend per activity (₹ Lakh)</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalSarraBudget" name="SARRA Budget" fill="#0a3d62" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA Spent" fill="#e67e22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District-wise Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">District-wise Summary</h3>
            <p className="text-xs text-slate-500">Physical progress & SARRA spend by district</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.districtStats} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} width={90} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysical" name="Physical" fill="#1a6fc4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA (₹L)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Forms Table */}
      {data.recentForms?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Praroop-1(B) Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left">Application No</th>
                  <th className="px-5 py-3 text-left">Month</th>
                  <th className="px-5 py-3 text-left">District</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Physical</th>
                  <th className="px-5 py-3 text-right">SARRA (₹L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentForms.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0a3d62]">{f.applicationNo}</td>
                    <td className="px-5 py-3 text-slate-600">{f.reportingMonth} {f.financialYear}</td>
                    <td className="px-5 py-3 text-slate-600">{f.submittedByDistrict}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${f.status === 'APPROVED' ? 'bg-green-100 text-green-700' : f.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{f.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#1a6fc4]">{f.grandTotalPhysicalProgress}</td>
                    <td className="px-5 py-3 text-right font-bold text-amber-600">₹{f.grandTotalSarraExpend?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



function Praroop1CTab({ data }) {
  if (!data) return <div className="text-center py-16 text-slate-400">No Praroop-1(C) data available</div>;
  const ov = data.overview || {};
  const utilPct = ov.totalSarraBudget > 0 ? Math.min(100, ((ov.totalSarraExpend / ov.totalSarraBudget) * 100)).toFixed(1) : 0;
  const radialData = [{ name: 'Utilization', value: parseFloat(utilPct), fill: parseFloat(utilPct) > 80 ? '#1a6fc4' : parseFloat(utilPct) > 50 ? '#e67e22' : '#ef4444' }];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniKPI label="Total Forms" value={ov.totalForms} />
        <MiniKPI label="Approved" value={ov.totalApproved} color="text-green-600" />
        <MiniKPI label="Pending" value={ov.totalPending} color="text-blue-600" />
        <MiniKPI label="Physical Progress" value={ov.totalPhysicalProgress?.toLocaleString()} color="text-[#1a6fc4]" />
        <MiniKPI label="SARRA Spent" value={`₹${ov.totalSarraExpend?.toFixed(2)} L`} color="text-amber-600" />
        <MiniKPI label="SARRA Budget" value={`₹${ov.totalSarraBudget?.toFixed(2)} L`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity-wise Physical Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise Physical Progress</h3>
            <p className="text-xs text-slate-500">Cumulative units completed per activity</p>
          </div>
          <div className="p-5 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="code" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysicalProgress" name="Physical Progress" fill="#1a6fc4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="targetUnit" name="Target" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Utilization Radial */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Budget Utilization</h3>
            <p className="text-xs text-slate-500">SARRA expenditure vs allocation</p>
          </div>
          <div className="p-5 h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={10} fill={radialData[0].fill} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
              <span className="text-4xl font-bold text-slate-800">{utilPct}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilized</span>
            </div>
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Allocated</p>
              <p className="text-sm font-bold text-slate-800">₹{ov.totalSarraBudget?.toFixed(2)} L</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
              <p className="text-sm font-bold text-amber-600">₹{ov.totalSarraExpend?.toFixed(2)} L</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity-wise SARRA Expenditure */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise SARRA Expenditure</h3>
            <p className="text-xs text-slate-500">Budget vs Spend per activity (₹ Lakh)</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalSarraBudget" name="SARRA Budget" fill="#0a3d62" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA Spent" fill="#e67e22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District-wise Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">District-wise Summary</h3>
            <p className="text-xs text-slate-500">Physical progress & SARRA spend by district</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.districtStats} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} width={90} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysical" name="Physical" fill="#1a6fc4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA (₹L)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Forms Table */}
      {data.recentForms?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Praroop-1(C) Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left">Application No</th>
                  <th className="px-5 py-3 text-left">Month</th>
                  <th className="px-5 py-3 text-left">District</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Physical</th>
                  <th className="px-5 py-3 text-right">SARRA (₹L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentForms.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0a3d62]">{f.applicationNo}</td>
                    <td className="px-5 py-3 text-slate-600">{f.reportingMonth} {f.financialYear}</td>
                    <td className="px-5 py-3 text-slate-600">{f.submittedByDistrict}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${f.status === 'APPROVED' ? 'bg-green-100 text-green-700' : f.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{f.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#1a6fc4]">{f.grandTotalPhysicalProgress}</td>
                    <td className="px-5 py-3 text-right font-bold text-amber-600">₹{f.grandTotalSarraExpend?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



function Praroop1DTab({ data }) {
  if (!data) return <div className="text-center py-16 text-slate-400">No Praroop-1(D) data available</div>;
  const ov = data.overview || {};
  const utilPct = ov.totalSarraBudget > 0 ? Math.min(100, ((ov.totalSarraExpend / ov.totalSarraBudget) * 100)).toFixed(1) : 0;
  const radialData = [{ name: 'Utilization', value: parseFloat(utilPct), fill: parseFloat(utilPct) > 80 ? '#1a6fc4' : parseFloat(utilPct) > 50 ? '#e67e22' : '#ef4444' }];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniKPI label="Total Forms" value={ov.totalForms} />
        <MiniKPI label="Approved" value={ov.totalApproved} color="text-green-600" />
        <MiniKPI label="Pending" value={ov.totalPending} color="text-blue-600" />
        <MiniKPI label="Physical Progress" value={ov.totalPhysicalProgress?.toLocaleString()} color="text-[#1a6fc4]" />
        <MiniKPI label="SARRA Spent" value={`₹${ov.totalSarraExpend?.toFixed(2)} L`} color="text-amber-600" />
        <MiniKPI label="SARRA Budget" value={`₹${ov.totalSarraBudget?.toFixed(2)} L`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity-wise Physical Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise Physical Progress</h3>
            <p className="text-xs text-slate-500">Cumulative units completed per activity</p>
          </div>
          <div className="p-5 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="code" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysicalProgress" name="Physical Progress" fill="#1a6fc4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="targetUnit" name="Target" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Utilization Radial */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Budget Utilization</h3>
            <p className="text-xs text-slate-500">SARRA expenditure vs allocation</p>
          </div>
          <div className="p-5 h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={10} fill={radialData[0].fill} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
              <span className="text-4xl font-bold text-slate-800">{utilPct}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilized</span>
            </div>
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Allocated</p>
              <p className="text-sm font-bold text-slate-800">₹{ov.totalSarraBudget?.toFixed(2)} L</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
              <p className="text-sm font-bold text-amber-600">₹{ov.totalSarraExpend?.toFixed(2)} L</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity-wise SARRA Expenditure */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Activity-wise SARRA Expenditure</h3>
            <p className="text-xs text-slate-500">Budget vs Spend per activity (₹ Lakh)</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalSarraBudget" name="SARRA Budget" fill="#0a3d62" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA Spent" fill="#e67e22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District-wise Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">District-wise Summary</h3>
            <p className="text-xs text-slate-500">Physical progress & SARRA spend by district</p>
          </div>
          <div className="p-5 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.districtStats} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} width={90} />
                <Tooltip content={<PTooltip />} />
                <Legend />
                <Bar dataKey="totalPhysical" name="Physical" fill="#1a6fc4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalSarraExpend" name="SARRA (₹L)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Forms Table */}
      {data.recentForms?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Praroop-1(D) Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left">Application No</th>
                  <th className="px-5 py-3 text-left">Month</th>
                  <th className="px-5 py-3 text-left">District</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Physical</th>
                  <th className="px-5 py-3 text-right">SARRA (₹L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentForms.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#0a3d62]">{f.applicationNo}</td>
                    <td className="px-5 py-3 text-slate-600">{f.reportingMonth} {f.financialYear}</td>
                    <td className="px-5 py-3 text-slate-600">{f.submittedByDistrict}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${f.status === 'APPROVED' ? 'bg-green-100 text-green-700' : f.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{f.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#1a6fc4]">{f.grandTotalPhysicalProgress}</td>
                    <td className="px-5 py-3 text-right font-bold text-amber-600">₹{f.grandTotalSarraExpend?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



function MiniKPI({ label, value, color = 'text-slate-800' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
    </div>
  );
}

function PTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.color || e.fill }} />
          <span className="text-slate-600">{e.name}:</span>
          <span className="font-semibold text-slate-800 ml-auto">{typeof e.value === 'number' ? e.value.toLocaleString('en-IN') : e.value}</span>
        </div>
      ))}
    </div>
  );
}
