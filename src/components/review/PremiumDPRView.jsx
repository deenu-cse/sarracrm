import React, { useState } from 'react';
import {
  FileText, Download, MapPin, Droplets, Users, CheckCircle2,
  ArrowRight, Info, Camera, Activity, ShieldCheck,
  IndianRupee, Landmark, TreePine, Map as MapIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/formatters';

export function PremiumDPRView({ dpr }) {
  const [activeSection, setActiveSection] = useState(1);

  if (!dpr) return null;

  const sections = [
    { id: 1, label: 'Department Details', icon: <Landmark className="w-4 h-4" /> },
    { id: 2, label: 'Spring Identification', icon: <MapPin className="w-4 h-4" /> },
    { id: 3, label: 'Spring Description', icon: <FileText className="w-4 h-4" /> },
    { id: 4, label: 'Photographs', icon: <Camera className="w-4 h-4" /> },
    { id: 5, label: 'Hydro-Geological', icon: <Activity className="w-4 h-4" /> },
    { id: 6, label: 'Physical Characteristics', icon: <Droplets className="w-4 h-4" /> },
    { id: 7, label: 'Other Information', icon: <Info className="w-4 h-4" /> },
    { id: 8, label: 'Recharge Area', icon: <TreePine className="w-4 h-4" /> },
    { id: 9, label: 'Community Initiatives', icon: <Users className="w-4 h-4" /> },
    { id: 10, label: 'Budget & Plan', icon: <IndianRupee className="w-4 h-4" /> },
  ];

  // Helper to get total budget
  const totalBudget = dpr.section10_budgetAndPlan?.table101?.totalBudgetLakh || 0;
  const rechargeArea = dpr.section8_rechargeArea?.table81?.[0]?.totalRechargeAreaHa || 0;
  const households = dpr.section7_otherInformation?.table73?.[0]?.dependentHouseholds || 0;
  const population = dpr.section7_otherInformation?.table73?.[0]?.dependentPopulation || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[800px]">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <div className="bg-slate-900 rounded-3xl p-6 text-white h-full shadow-2xl">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">SARRA</p>
              <p className="text-sm font-semibold">Uttarakhand</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">DPR Sections</p>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-medium ${activeSection === s.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                {s.icon}
                <span>Section {s.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Hero Header */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-2">DPR Application Details</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {dpr.applicationNo}
                  </h1>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {dpr.formType || 'SPRINGSHED'}
                    </span>
                    <Badge status={dpr.status} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                    <span>By <span className="font-semibold text-slate-700">{dpr.submittedBy?.name || 'Officer'}</span>, {dpr.submittedByDepartment || 'Dept'}</span>
                  </div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Submitted on {formatDate(dpr.submittedAt)}</span>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                <Download className="w-4 h-4" />
                Download DPR
              </button>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            label="Total Budget"
            value={`₹${totalBudget.toFixed(2)} Lakh`}
            subValue={`(Total ₹${totalBudget}L Heads)`}
            icon={<IndianRupee className="w-5 h-5" />}
            color="bg-slate-900 text-white"
            iconColor="bg-white/10"
          />
          <KPICard
            label="Recharge Area"
            value={`${rechargeArea} Ha`}
            subValue="Demarcated"
            icon={<TreePine className="w-5 h-5" />}
            color="bg-emerald-600 text-white"
            iconColor="bg-white/10"
          />
          <KPICard
            label="Beneficiaries"
            value={`${households} Households`}
            subValue={`${population} Population`}
            icon={<Users className="w-5 h-5" />}
            color="bg-indigo-100 text-indigo-700"
            iconColor="bg-indigo-200"
          />
          <KPICard
            label="Current Status"
            value={dpr.status}
            subValue={`On ${formatDate(dpr.submittedAt || dpr.updatedAt)}`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="bg-white border border-slate-100"
            iconColor="bg-emerald-100 text-emerald-600"
            isStatus
          />
        </div>

        {/* Section Content */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px]">
          {activeSection === 1 && <SectionOne data={dpr.section1_deptDetails} />}
          {activeSection === 2 && <SectionTwo data={dpr.section2_springIdentification} />}
          {activeSection === 3 && <SectionThree data={dpr.section3_springDescription} />}
          {activeSection === 4 && <SectionFour data={dpr.section4_photographs} />}
          {activeSection === 5 && <SectionFive data={dpr.section5_hydroGeological} />}
          {activeSection === 6 && <SectionSix data={dpr.section6_physicalCharacteristics} />}
          {activeSection === 7 && <SectionSeven data={dpr.section7_otherInformation} />}
          {activeSection === 8 && <SectionEight data={dpr.section8_rechargeArea} />}
          {activeSection === 9 && <SectionNine data={dpr.section9_communityInitiatives} />}
          {activeSection === 10 && <SectionTen data={dpr.section10_budgetAndPlan} springNames={dpr.section2_springIdentification?.springs?.map(s => s.name) || []} />}
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
        <h3 className={`text-2xl font-black tracking-tight ${isStatus ? 'text-emerald-600' : ''}`}>{value}</h3>
        <p className="text-[11px] opacity-60 font-medium mt-1">{subValue}</p>
      </div>
    </div>
  );
}

// Section Components
function SectionOne({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 1: Department Details" subtitle="Officer and Agency Information" icon={<Landmark />} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        <InfoItem label="Department" value={data.department} />
        <InfoItem label="District" value={data.district} />
        <InfoItem label="Block" value={data.block} />
        <InfoItem label="Nodal Officer" value={data.nodalOfficer} />
        <InfoItem label="Contact No" value={data.contactNo} />
        <InfoItem label="Email" value={data.email} />
        <div className="md:col-span-2">
          <InfoItem label="Address" value={data.address} />
        </div>
      </div>
    </div>
  );
}

function SectionTwo({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 2: Spring Identification" subtitle="Geographical and Administrative Mapping" icon={<MapPin />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <InfoItem label="District" value={data.springDistrict} />
            <InfoItem label="Block" value={data.springBlock} />
            <InfoItem label="Gram Panchayat" value={data.springGP} />
            <InfoItem label="Revenue Village" value={data.revenuVillage} />
            <InfoItem label="Town" value={data.town} />
            <InfoItem label="Ward No" value={data.wardNo} />
          </div>
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Survey Metadata</p>
            <InfoItem label="Survey Date" value={formatDate(data.surveyDate)} />
          </div>
        </div>

        <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-100 min-h-[300px] border border-slate-200 shadow-inner group">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-blue-600">
                <MapIcon className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-600">Spring Location Map</p>
              <p className="text-xs text-slate-400 mt-1">Satellite View Integrated</p>
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm">
            {data.springs?.[0]?.latitude?.dd}°N, {data.springs?.[0]?.longitude?.dd}°E
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-bold text-slate-800 mb-4">Springs in this DPR ({data.springs?.length})</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.springs?.map((s, i) => (
            <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
              <div>
                <p className="text-xs font-bold text-blue-600 mb-1">{s.springCode || `SPRING-${i + 1}`}</p>
                <p className="text-lg font-black text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-400 mt-1">{s.revenueVillage}, {s.hamletTok}</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionThree({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 3: Spring Description" subtitle="Technical and Usage Specifications" icon={<FileText />} />

      <div className="space-y-10 mt-8">
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            General Description (Table 3.1)
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {data.table31?.map((row, i) => (
              <div key={i} className="bg-slate-50 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoItem label="Spring Name" value={row.springName} />
                <InfoItem label="Spring Type" value={row.springType} />
                <InfoItem label="Nature" value={row.springNature} />
                <InfoItem label="Cleanliness" value={row.cleanliness} />
                <div className="flex gap-4">
                  <StatusBadge label="Newly Emerged" active={row.newlyEmerged} />
                  <StatusBadge label="Muddy Water" active={row.muddyWaterInRain} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-600 rounded-full" />
            Structure & Supply (Table 3.2)
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {data.table32?.map((row, i) => (
              <div key={i} className="bg-slate-50 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoItem label="Spring Name" value={row.springName} />
                <InfoItem label="Ownership" value={row.ownership} />
                <InfoItem label="Beneficiaries" value={row.populationBenefited} />
                <InfoItem label="Scheme Type" value={row.schemeType} />
                <div className="flex flex-wrap gap-2 lg:col-span-2">
                  <StatusBadge label="Chamber/Tank" active={row.chamberTank} />
                  <StatusBadge label="Permanent Structure" active={row.permanentStructure} />
                  <StatusBadge label="Piped Supply" active={row.pipeWaterSupply} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionFour({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 4: Photographs" subtitle="Visual Documentation of Spring State" icon={<Camera />} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <PhotoCard label="Close-up View" url={data.closeUpPhoto?.url} />
        <PhotoCard label="Wide Angle View" url={data.wideAnglePhoto?.url} />
        <PhotoCard label="Selfie with Spring" url={data.selfieWithSpring?.url} />
      </div>
    </div>
  );
}

function SectionTen({ data, springNames }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 10: Budget & Plan" subtitle="Interventions and Financial Allocation" icon={<IndianRupee />} />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <BudgetMiniCard label="Total Budget" value={data.table101?.totalBudgetLakh} color="bg-slate-900" />
        <BudgetMiniCard label="Interventions" value={data.table101?.totalInterventionsCostLakh} color="bg-emerald-600" />
        <BudgetMiniCard label="DPR Preparation" value={data.table101?.dprPreparationBudgetLakh} color="bg-blue-600" />
        <BudgetMiniCard label="M&E Allocation" value={data.table101?.monitoringEvaluationBudgetLakh} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* Budget Summary */}
        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 mb-6">Budget Summary</h4>
          <div className="space-y-4">
            <SummaryRow label="DPR Preparation Budget" value={data.table101?.dprPreparationBudgetLakh} />
            <SummaryRow label="Total Interventions Cost" value={data.table101?.totalInterventionsCostLakh} />
            <SummaryRow label="Monitoring & Evaluation" value={data.table101?.monitoringEvaluationBudgetLakh} />
            <div className="h-px bg-slate-200 my-4" />
            <SummaryRow label="Total Budget" value={data.table101?.totalBudgetLakh} bold />
            <SummaryRow label="Grand Total (All Sources)" value={data.table103?.grandTotalLakh} bold highlight />
          </div>
        </div>

        {/* Interventions Plan */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="p-8 pb-4">
            <h4 className="text-sm font-bold text-slate-800">Interventions Plan (Top 5)</h4>
          </div>
          <div className="flex-1 overflow-auto px-4">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">Activity</th>
                  <th className="px-4 py-3 text-center">Unit</th>
                  <th className="px-4 py-3 text-center">Target</th>
                  <th className="px-4 py-3 text-right">Amount (₹L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.table102?.slice(0, 5).map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-all group">
                    <td className="px-4 py-4 font-semibold text-slate-700">{act.activityLabel}</td>
                    <td className="px-4 py-4 text-center text-slate-400">{act.unit}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-900">{act.totalPhysicalTarget}</td>
                    <td className="px-4 py-4 text-right font-black text-blue-600">{act.financialAmountLakh?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6">
            <button className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-bold hover:bg-blue-100 transition-all">View All Activities</button>
          </div>
        </div>
      </div>

      {/* Financial Sources */}
      <div className="mt-10 bg-slate-900 rounded-[2.5rem] p-8 text-white">
        <h4 className="text-sm font-bold text-blue-400 mb-8 uppercase tracking-widest">Financial Sources</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <SourceItem label="From PIA Dept." value={data.table103?.fundFromPIADeptLakh} />
          <SourceItem label="Other Sources" value={data.table103?.fundFromOtherSourcesLakh} />
          <SourceItem label="SARRA Convergence" value={data.table103?.fundFromSARRAConvergenceLakh} />
          <SourceItem label="Grand Total" value={data.table103?.grandTotalLakh} highlight />
        </div>
      </div>

      {/* Annexures */}
      <div className="mt-10">
        <h4 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Annexures</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FileCard label="DPR Document" url={data.annexures?.detailProjectReport?.url} />
          <FileCard label="Dhara Naula Details" url={data.annexures?.dharaNaulaDetails?.url} />
          <FileCard label="Other Documents" url={data.annexures?.otherDocuments?.url} />
          <div className="p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col gap-3 shadow-sm group border-dashed">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signature with Stamp</p>
            {data.signatureWithStamp?.url ? (
              <img src={data.signatureWithStamp.url} alt="Signature" className="h-16 object-contain grayscale group-hover:grayscale-0 transition-all" />
            ) : (
              <div className="h-16 flex items-center justify-center text-slate-300">
                <ShieldCheck className="w-8 h-8" />
              </div>
            )}
            <button className="text-[10px] font-bold text-blue-600 hover:underline text-left">View Image</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
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

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-sm font-black text-slate-800 break-words">{value || 'N/A'}</p>
    </div>
  );
}

function StatusBadge({ label, active }) {
  return (
    <div className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
      {label}
    </div>
  );
}

function PhotoCard({ label, url }) {
  return (
    <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 group">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{label}</p>
      <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-200 shadow-inner relative">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Camera className="w-8 h-8" />
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetMiniCard({ label, value, color }) {
  return (
    <div className={`${color} rounded-3xl p-6 text-white shadow-lg`}>
      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-xl font-black">₹{value?.toFixed(2)} L</p>
    </div>
  );
}

function SummaryRow({ label, value, bold, highlight }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${bold ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-black' : 'font-bold'} ${highlight ? 'text-emerald-600 text-base' : 'text-slate-800'}`}>
        ₹{value?.toFixed(2)} Lakh
      </span>
    </div>
  );
}

function SourceItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-xl font-black ${highlight ? 'text-blue-400' : 'text-white'}`}>₹{value?.toFixed(2)} L</p>
    </div>
  );
}

function FileCard({ label, url }) {
  return (
    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col gap-4 shadow-sm group hover:border-blue-200 transition-all">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        <FileText className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{label}</p>
        <button
          onClick={() => url && window.open(url, '_blank')}
          className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2 hover:underline disabled:text-slate-300"
          disabled={!url}
        >
          {url ? 'View PDF' : 'Not Uploaded'}
        </button>
      </div>
    </div>
  );
}

function EmptySection() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Info className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest">Section Data Missing</p>
    </div>
  );
}

// Add these missing section placeholders for completeness
function SectionFive({ data }) { return <SimpleSection data={data} title="Section 5: Hydro-Geological" icon={<Activity />} tableKey="table51" />; }
function SectionSix({ data }) { return <SimpleSection data={data} title="Section 6: Physical Characteristics" icon={<Droplets />} tableKey="table61" />; }
function SectionSeven({ data }) { return <SimpleSection data={data} title="Section 7: Other Information" icon={<Info />} tableKey="table71" />; }
function SectionEight({ data }) { return <SimpleSection data={data} title="Section 8: Recharge Area" icon={<TreePine />} tableKey="table81" />; }
function SectionNine({ data }) { return <SimpleSection data={data} title="Section 9: Community Initiatives" icon={<Users />} tableKey="table91" />; }

function SimpleSection({ data, title, icon, tableKey }) {
  if (!data || !data[tableKey]) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={title} subtitle="Detailed Technical Records" icon={icon} />
      <div className="mt-8 space-y-6">
        {data[tableKey].map((row, i) => (
          <div key={i} className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
            <p className="text-xs font-bold text-blue-600 mb-6 uppercase tracking-widest">Record #{i + 1} — {row.springName}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(row).filter(([key]) => !key.startsWith('_')).map(([key, val]) => (
                <InfoItem key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
