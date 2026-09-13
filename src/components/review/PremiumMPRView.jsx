import React, { useState } from 'react';
import {
  FileText, MapPin, Activity, Calendar, Download,
  IndianRupee, Hash, CheckCircle2, AlertCircle, Info, TreePine
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';

export function PremiumMPRView({ mpr }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!mpr) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[800px]">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <div className="bg-slate-900 rounded-3xl p-6 text-white h-full shadow-2xl">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">SARRA MPR</p>
              <p className="text-sm font-semibold">Uttarakhand</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">MPR Sections</p>
            {[
              { id: 'summary', label: 'Overview Summary', icon: <Info className="w-4 h-4" /> },
              { id: 'districts', label: 'District Details', icon: <MapPin className="w-4 h-4" /> },
              { id: 'activities', label: 'Activities Progress', icon: <TreePine className="w-4 h-4" /> },
              { id: 'financial', label: 'Financials', icon: <IndianRupee className="w-4 h-4" /> }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-medium ${activeTab === s.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Hero Header */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] mb-2">Monthly Progress Report</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {mpr.applicationNo}
                  </h1>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-200">
                      {mpr.reportType || mpr.formType || 'PRAROOP_1A'}
                    </span>
                    <Badge status={mpr.status} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                    <span>By <span className="font-semibold text-slate-700">{mpr.submittedBy?.name || 'Officer'}</span>, {mpr.submittedByDistrict || 'District'}</span>
                  </div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {mpr.reportingMonth}, {mpr.financialYear}
                  </div>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            label="Total Schemes"
            value={mpr.totalApprovedSchemes || 0}
            subValue="Approved Schemes"
            icon={<Hash className="w-5 h-5" />}
            color="bg-slate-900 text-white"
            iconColor="bg-white/10"
          />
          <KPICard
            label="Physical Progress"
            value={mpr.computed?.grandTotalPhysicalProgress || 0}
            subValue="Total Completed"
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="bg-emerald-600 text-white"
            iconColor="bg-white/10"
          />
          <KPICard
            label="SARRA Expend."
            value={`₹${(mpr.computed?.grandTotalSarraExpend || 0).toFixed(2)}L`}
            subValue="Total Expenditure"
            icon={<IndianRupee className="w-5 h-5" />}
            color="bg-indigo-100 text-indigo-700"
            iconColor="bg-indigo-200"
          />
          <KPICard
            label="Current Status"
            value={mpr.status}
            subValue={`Submitted on ${formatDate(mpr.submittedAt)}`}
            icon={<AlertCircle className="w-5 h-5" />}
            color="bg-white border border-slate-100"
            iconColor="bg-blue-100 text-blue-600"
            isStatus
          />
        </div>

        {/* Section Content */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px]">
          {activeTab === 'summary' && <SummaryTab mpr={mpr} />}
          {activeTab === 'districts' && <DistrictsTab districts={mpr.districts || []} />}
          {activeTab === 'activities' && <ActivitiesTab activities={mpr.activities || []} />}
          {activeTab === 'financial' && <FinancialTab mpr={mpr} />}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, subValue, icon, color, iconColor, isStatus }) {
  return (
    <div className={`${color} rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between h-40 group shadow-sm`}>
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
        <div className={`${iconColor} p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-500`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className={`text-2xl font-black tracking-tight ${isStatus ? 'text-blue-600' : ''}`}>{value}</h3>
        <p className="text-[11px] opacity-60 font-medium mt-1">{subValue}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
      <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function SummaryTab({ mpr }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Overview Summary" subtitle="Key reporting data" icon={<Info />} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reporting Period</p>
          <p className="text-lg font-black text-slate-800">{mpr.reportingMonth} {mpr.financialYear}</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Submitted By District</p>
          <p className="text-lg font-black text-slate-800">{mpr.submittedByDistrict}</p>
        </div>
        {mpr.totalApprovedSchemes !== undefined && (
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Approved Schemes</p>
            <p className="text-lg font-black text-slate-800">{mpr.totalApprovedSchemes}</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
         <h4 className="text-sm font-bold text-indigo-900 mb-4 uppercase tracking-widest">Computed Totals</h4>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-indigo-600 font-semibold">Physical Progress</p>
              <p className="text-xl font-black text-indigo-900">{mpr.computed?.grandTotalPhysicalProgress || 0}</p>
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-semibold">SARRA Expend.</p>
              <p className="text-xl font-black text-indigo-900">₹{(mpr.computed?.grandTotalSarraExpend || 0).toFixed(2)}L</p>
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-semibold">Dept Expend.</p>
              <p className="text-xl font-black text-indigo-900">₹{(mpr.computed?.grandTotalDeptExpend || 0).toFixed(2)}L</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function DistrictsTab({ districts }) {
  if (!districts || districts.length === 0) return <EmptyState />;
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="District Level Details" subtitle="Breakdown by districts" icon={<MapPin />} />
      <div className="mt-8 space-y-6">
        {districts.map((d, i) => (
          <div key={i} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-center">
            <div>
              <p className="text-lg font-black text-slate-800">{d.districtName}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs font-semibold text-slate-500">Rivers: {d.totalRivers || 0}</span>
                <span className="text-xs font-semibold text-slate-500">Springs: {d.totalSprings || 0}</span>
                <span className="text-xs font-semibold text-slate-500">Treated: {d.treatedSites || 0}</span>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical</p>
                <p className="text-sm font-bold text-slate-900">{d.physicalProgress || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenditure</p>
                <p className="text-sm font-bold text-blue-600">₹{((d.sarraExpenditureLakh || 0) + (d.deptExpenditureLakh || 0)).toFixed(2)}L</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitiesTab({ activities }) {
  if (!activities || activities.length === 0) return <EmptyState />;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Activities Progress" subtitle="Detailed activity interventions" icon={<TreePine />} />
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left rounded-tl-xl">Activity</th>
              <th className="px-4 py-3 text-center">Unit</th>
              <th className="px-4 py-3 text-center">Approved Target</th>
              <th className="px-4 py-3 text-center">Physical Prog.</th>
              <th className="px-4 py-3 text-right">SARRA Exp.</th>
              <th className="px-4 py-3 text-right rounded-tr-xl">Dept Exp.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activities.map((act, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-all">
                <td className="px-4 py-4 font-semibold text-slate-700">{act.activityName}</td>
                <td className="px-4 py-4 text-center text-slate-400">{act.unit}</td>
                <td className="px-4 py-4 text-center font-bold text-slate-900">{act.approvedTargetTotal}</td>
                <td className="px-4 py-4 text-center font-bold text-emerald-600">{act.cumulativePhysicalProgress}</td>
                <td className="px-4 py-4 text-right font-black text-indigo-600">{act.cumulativeSarraExpenditureLakh?.toFixed(2)}</td>
                <td className="px-4 py-4 text-right font-black text-slate-600">{act.cumulativeDeptExpenditureLakh?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinancialTab({ mpr }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Financial Breakdown" subtitle="Expenditure tracking" icon={<IndianRupee />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
          <h4 className="text-sm font-bold text-indigo-400 mb-6 uppercase tracking-widest">SARRA EXPENDITURE (₹ LAKH)</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Monthly Progress</span>
              <span className="font-bold">{mpr.computed?.totalSarraExpend?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="h-px bg-slate-800" />
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Cumulative Total</span>
              <span className="font-black text-indigo-400">{mpr.computed?.grandTotalSarraExpend?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8">
          <h4 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">DEPT EXPENDITURE (₹ LAKH)</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Monthly Progress</span>
              <span className="font-bold text-slate-900">{mpr.computed?.totalDeptExpend?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-slate-900">Cumulative Total</span>
              <span className="font-black text-slate-900">{mpr.computed?.grandTotalDeptExpend?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Info className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest">No Data Available</p>
    </div>
  );
}
