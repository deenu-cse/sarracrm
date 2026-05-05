"use client";

import React, { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader } from '@/components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  FileText, CheckCircle, Users, Target, Activity, RefreshCw 
} from 'lucide-react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

// ── Constants ───────────────────────────────────────────────────────────────

const DISTRICTS = [
  "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
  "Haridwar", "Nainital", "Pauri", "Pithoragarh",
  "Rudraprayag", "Tehri", "USNagar", "Uttarkashi"
];

const DEPARTMENTS = [
  'Forest', 'RD', 'MI', 'Irrigation', 'Jal Sansthan',
  'Peyjal', 'HRDA', 'WMD-VCRRFP', 'Agriculture', 'Horticulture', 'Other'
];

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const ACTIVITIES = [
  { code: '55-01', en: 'DPR Preparation' },
  { code: '55-01(01)', en: 'Contour Trenches' },
  { code: '55-01(02)', en: 'Recharge Pit' },
  { code: '55-01(03)', en: 'Dugout Ponds' },
  { code: '55-01(04)', en: 'Chal-Khal' },
  { code: '55-01(05)', en: 'Brushwood Check Dam' },
  { code: '55-01(06)', en: 'Temporary Check Dam' },
  { code: '55-01(07)', en: 'Loose Boulder Check Dam' },
  { code: '55-01(08)', en: 'RR Dry Check Dam' },
  { code: '55-01(09)', en: 'Gabion/Crate Wire Check Dam' },
  { code: '55-01(10)', en: 'Cemented Check Dam' },
  { code: '55-01(11)', en: 'Vegetative Treatment' },
  { code: '55-01(12)', en: 'Forestry Plantation' },
  { code: '55-01(13)', en: 'Fodder/Grass Plantation' },
  { code: '55-01(14)', en: 'ANR Activities' },
  { code: '55-01(15)', en: 'Plantation Activities' },
  { code: '55-01(16)', en: 'Total Catchment Area Treated' },
  { code: 'M&E', en: 'Monitoring & Evaluation' }
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

// ── Abstract 55 Analytics ───────────────────────────────────────────────────

function Abstract55Analytics() {
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [month, setMonth] = useState('');
  
  const query = new URLSearchParams();
  if (financialYear) query.append('financialYear', financialYear);
  if (month) query.append('month', month);

  const { data: mprsList, loading, refresh } = useFetch(`/mpr/abstract55/my-reports?${query.toString()}`);
  const mprs = Array.isArray(mprsList) ? mprsList : [];

  const analyticsData = useMemo(() => {
    if (!mprs || mprs.length === 0) return null;

    let totalProposals = 0;
    let totalSarraBudget = 0;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    
    const monthlyData = {};
    MONTHS.forEach(m => monthlyData[m] = { month: m, proposals: 0, budget: 0 });

    const deptDataMap = {};
    DEPARTMENTS.forEach(d => deptDataMap[d] = { name: d, deptShare: 0, sarraShare: 0, total: 0 });

    mprs.forEach(mpr => {
      if (mpr.status === 'APPROVED') approved++;
      else if (mpr.status === 'REJECTED') rejected++;
      else pending++;

      totalProposals += mpr.computed?.totalProposalsAllDepts || 0;
      totalSarraBudget += mpr.computed?.totalSarraShareLakh || 0;

      if (monthlyData[mpr.reportingMonth]) {
        monthlyData[mpr.reportingMonth].proposals += mpr.computed?.totalProposalsAllDepts || 0;
        monthlyData[mpr.reportingMonth].budget += (mpr.computed?.totalSarraShareLakh || 0);
      }

      mpr.computed?.departmentTotals?.forEach(dt => {
        if (deptDataMap[dt.department]) {
          deptDataMap[dt.department].deptShare += dt.totalDeptShare;
          deptDataMap[dt.department].sarraShare += dt.totalSarraShare;
          deptDataMap[dt.department].total += (dt.totalDeptShare + dt.totalSarraShare);
        }
      });
    });

    return {
      kpi: { totalMPRs: mprs.length, approved, pending, totalProposals, totalSarraBudget },
      monthlyChart: MONTHS.map(m => monthlyData[m]),
      deptChart: Object.values(deptDataMap).sort((a, b) => b.total - a.total),
      pieData: [
        { name: 'Approved', value: approved, color: '#1e8449' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Rejected', value: rejected, color: '#ef4444' }
      ]
    };
  }, [mprs]);

  return (
    <div className="space-y-8 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Abstract 55 Analytics</h2>
        <div className="flex gap-2">
          <button onClick={() => refresh()} className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <select value={financialYear} onChange={e => setFinancialYear(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none">
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-slate-200"></div>)}
        </div>
      ) : !analyticsData ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
           <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
           <p className="text-slate-500">No data available for the selected filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard title="My Total MPRs" value={analyticsData.kpi.totalMPRs} sub="Forms submitted" icon={FileText} colorClass="border-l-[#0a3d62]" />
            <KPICard title="Approved" value={analyticsData.kpi.approved} sub="Successfully processed" icon={CheckCircle} colorClass="border-l-[#1e8449]" />
            <KPICard title="Total Proposals" value={analyticsData.kpi.totalProposals} sub="Across all months" icon={Users} colorClass="border-l-blue-600" />
            <KPICard title="SARRA Budget" value={`₹${analyticsData.kpi.totalSarraBudget.toFixed(2)} L`} sub="Proposed budget" icon={Target} colorClass="border-l-[#e67e22]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card noPadding>
              <CardHeader title="Submission Trend" subtitle="Proposals over months" />
              <div className="p-6 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyChart}>
                    <defs>
                      <linearGradient id="colorProposals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="proposals" name="Proposals" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProposals)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card noPadding>
              <CardHeader title="Departmental Breakdown" subtitle="Budget by agency" />
              <div className="p-6 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.deptChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={100} />
                    <Tooltip formatter={(val) => `₹${val.toFixed(2)}L`} />
                    <Bar dataKey="sarraShare" name="SARRA Share" fill="#0a3d62" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card noPadding className="h-full">
                <CardHeader title="Approval Status" />
                <div className="p-6 h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={analyticsData.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                         {analyticsData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card noPadding className="h-full">
                <CardHeader title="Insights & Summary" />
                <div className="p-6 space-y-4">
                   <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">i</div>
                      <div>
                        <h4 className="font-bold text-blue-900">Performance Summary</h4>
                        <p className="text-sm text-blue-700">You have submitted {analyticsData.kpi.totalMPRs} reports this year with an approval rate of {((analyticsData.kpi.approved / analyticsData.kpi.totalMPRs) * 100).toFixed(1)}%.</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 rounded-xl">
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Most Active Month</p>
                         <p className="font-bold text-slate-800">{analyticsData.monthlyChart.sort((a,b) => b.proposals - a.proposals)[0].month}</p>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-xl">
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Top Dept (Budget)</p>
                         <p className="font-bold text-slate-800">{analyticsData.deptChart[0].name}</p>
                      </div>
                   </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Praroop-1A Analytics ────────────────────────────────────────────────────

function Praroop1AAnalytics() {
  const [financialYear, setFinancialYear] = useState('2025-26');
  
  const { data: mprsList, loading, refresh } = useFetch(`/mpr/praroop1a/my-reports?financialYear=${financialYear}`);
  const mprs = Array.isArray(mprsList) ? mprsList : [];

  const { data: mprsListLastYear } = useFetch(`/mpr/praroop1a/my-reports?financialYear=2024-25`);
  const mprsLastYear = Array.isArray(mprsListLastYear) ? mprsListLastYear : [];

  const analyticsData = useMemo(() => {
    if (!mprs || mprs.length === 0) return null;

    let totalPhysical = 0;
    let totalSarraSpend = 0;
    
    // Top Activities by Spend
    const activityMap = {};
    ACTIVITIES.forEach(a => activityMap[a.code] = { name: a.en, spend: 0, physical: 0 });

    const monthlyData = {};
    MONTHS.forEach(m => monthlyData[m] = { month: m, '2025-26': 0 });
    
    mprs.forEach(mpr => {
      totalPhysical += mpr.computed?.grandTotalPhysicalProgress || 0;
      totalSarraSpend += mpr.computed?.grandTotalSarraExpend || 0;

      if(monthlyData[mpr.reportingMonth]) {
        monthlyData[mpr.reportingMonth]['2025-26'] += mpr.computed?.grandTotalPhysicalProgress || 0;
      }
      
      mpr.activities?.forEach(a => {
         if(!a.isHeader && activityMap[a.activityCode]) {
            activityMap[a.activityCode].spend += a.districtTotals?.totalSarraExpend || 0;
            activityMap[a.activityCode].physical += a.districtTotals?.totalPhysicalProgress || 0;
         }
      });
    });

    MONTHS.forEach(m => {
        if(monthlyData[m]) monthlyData[m]['2024-25'] = 0;
    });
    mprsLastYear.forEach(mpr => {
        if(monthlyData[mpr.reportingMonth]) {
            monthlyData[mpr.reportingMonth]['2024-25'] += mpr.computed?.grandTotalPhysicalProgress || 0;
        }
    });

    const topActivities = Object.values(activityMap).sort((a, b) => b.spend - a.spend).slice(0, 5);
    
    // District-wise Heatmap (simplified using Scatter for matrix or Bar for aggregation)
    const districtProgress = {};
    DISTRICTS.forEach(d => districtProgress[d] = { name: d, physical: 0, target: 0, spend: 0 });
    
    mprs.forEach(mpr => {
       mpr.computed?.districtWiseSummary?.forEach(d => {
          if(districtProgress[d.district]) {
              districtProgress[d.district].physical += d.totalPhysical || 0;
              districtProgress[d.district].spend += d.totalSarraExpend || 0;
          }
       });
       mpr.activities?.forEach(act => {
          act.districts?.forEach(d => {
             if(districtProgress[d.districtName]) {
                 districtProgress[d.districtName].target += d.targetUnit || 0;
             }
          });
       });
    });

    const underPerforming = Object.values(districtProgress).filter(d => {
        return d.target > 0 && (d.physical / d.target) < 0.5;
    });

    return {
      totalPhysical, totalSarraSpend,
      monthlyChart: MONTHS.map(m => monthlyData[m]),
      topActivities,
      underPerforming,
      districtProgress: Object.values(districtProgress).sort((a,b) => b.physical - a.physical)
    };
  }, [mprs, mprsLastYear]);

  return (
    <div className="space-y-8 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Praroop-1(A) Analytics</h2>
        <div className="flex gap-2">
          <button onClick={() => refresh()} className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <select value={financialYear} onChange={e => setFinancialYear(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none">
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-slate-200"></div>)}
        </div>
      ) : !analyticsData ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
           <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
           <p className="text-slate-500">No data available for Praroop-1(A) in selected FY.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <KPICard title="Total Physical Progress" value={analyticsData.totalPhysical} sub="Total units across districts" icon={Target} colorClass="border-l-[#1e8449]" />
            <KPICard title="Total SARRA Expenditure" value={`₹${analyticsData.totalSarraSpend.toFixed(2)} L`} sub="Actual spent" icon={Activity} colorClass="border-l-[#e67e22]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card noPadding>
              <CardHeader title="Year-over-Year Comparison" subtitle="Physical Progress: 2024-25 vs 2025-26" />
              <div className="p-6 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="2024-25" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} name="2024-25" />
                    <Area type="monotone" dataKey="2025-26" stroke="#1e8449" fill="#1e8449" fillOpacity={0.6} name="2025-26" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card noPadding>
              <CardHeader title="Top 5 Activities" subtitle="By SARRA Expenditure (₹L)" />
              <div className="p-6 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topActivities} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={120} />
                    <Tooltip formatter={(val) => `₹${val.toFixed(2)}L`} />
                    <Bar dataKey="spend" name="SARRA Spend" fill="#e67e22" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <Card noPadding>
                 <CardHeader title="District-wise Physical Progress" subtitle="Aggregate Overview" />
                 <div className="p-6 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={analyticsData.districtProgress}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="physical" fill="#0a3d62" name="Physical Progress" radius={[4,4,0,0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
               </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card noPadding className="h-full border-red-200">
                <CardHeader title="Under-performing Districts" subtitle="< 50% of Target Achieved" />
                <div className="p-6">
                   {analyticsData.underPerforming.length === 0 ? (
                       <div className="text-center p-8">
                           <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                           <p className="text-green-700 font-bold">All districts on track!</p>
                       </div>
                   ) : (
                       <div className="space-y-4">
                           {analyticsData.underPerforming.map((d, i) => (
                               <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                   <span className="font-bold text-slate-800">{d.name}</span>
                                   <div className="text-right">
                                       <div className="text-sm font-bold text-red-600">{((d.physical / d.target)*100).toFixed(1)}%</div>
                                       <div className="text-xs text-slate-500">{d.physical} / {d.target}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Layout ─────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('abstract55');

  return (
    <RoleGuard allowedRoles={[USER_ROLES.MND_OFFICER, USER_ROLES.MND_SUPER_ADMIN, USER_ROLES.MND_ADMIN, USER_ROLES.DD_ADMIN]}>
      <div className="min-h-screen bg-slate-50/50 p-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-4">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
              <p className="text-slate-500">Track state-wide submissions and physical/financial progress.</p>
            </div>
            <div className="flex bg-slate-200 p-1 rounded-lg">
               <button 
                  onClick={() => setActiveTab('abstract55')}
                  className={`px-4 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'abstract55' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  Abstract 55
               </button>
               <button 
                  onClick={() => setActiveTab('praroop1a')}
                  className={`px-4 py-2 rounded-md font-bold transition-all text-sm ${activeTab === 'praroop1a' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  Praroop-1(A)
               </button>
            </div>
          </div>

          {activeTab === 'abstract55' ? <Abstract55Analytics /> : <Praroop1AAnalytics />}

        </div>
      </div>
    </RoleGuard>
  );
}
