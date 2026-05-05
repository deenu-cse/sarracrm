import React, { useState } from 'react';
import { 
  FileText, Download, MapPin, Droplets, Users, CheckCircle2, 
  ArrowRight, Info, Camera, Activity, ShieldCheck, 
  IndianRupee, Landmark, TreePine, Map as MapIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/formatters';

export function StreamshedFormDetailView({ dpr }) {
  const [activeSection, setActiveSection] = useState(1);

  if (!dpr) return null;

  const sections = [
    { id: 1, label: 'Department Details', icon: <Landmark className="w-4 h-4" /> },
    { id: 2, label: 'Stream Identification', icon: <MapPin className="w-4 h-4" /> },
    { id: 3, label: 'Catchment Area', icon: <FileText className="w-4 h-4" /> },
    { id: 4, label: 'Photographs', icon: <Camera className="w-4 h-4" /> },
    { id: 5, label: 'Recharge Areas', icon: <TreePine className="w-4 h-4" /> },
    { id: 6, label: 'Maps', icon: <MapIcon className="w-4 h-4" /> },
    { id: 7, label: 'Budget & Plan', icon: <IndianRupee className="w-4 h-4" /> },
    { id: 8, label: 'Geo Location', icon: <MapPin className="w-4 h-4" /> },
  ];

  const totalBudget = dpr.section7_budgetAndPlan?.table71?.totalBudgetLakh || 0;
  const rechargeArea = dpr.section5_rechargeAreas?.table51?.[0]?.forestLandHa || 0; // Simplified for display
  const streamCount = dpr.section2_streamIdentification?.table21?.length || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[800px]">
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
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-medium ${
                  activeSection === s.id 
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

      <div className="flex-1 space-y-6">
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
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      STREAMSHED
                    </span>
                    <Badge status={dpr.status} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                    <span>By <span className="font-semibold text-slate-700">{dpr.section7_budgetAndPlan?.submittedByName || 'Officer'}</span></span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            label="Total Budget" 
            value={`₹${totalBudget.toFixed(2)} L`} 
            subValue={`Estimated Cost`}
            icon={<IndianRupee className="w-5 h-5" />} 
            color="bg-slate-900 text-white"
            iconColor="bg-white/10"
          />
          <KPICard 
            label="Tributaries" 
            value={`${streamCount}`} 
            subValue="Treated"
            icon={<Droplets className="w-5 h-5" />} 
            color="bg-emerald-600 text-white"
            iconColor="bg-white/10"
          />
          <KPICard 
            label="Catchment" 
            value="Mapped" 
            subValue="Completed"
            icon={<TreePine className="w-5 h-5" />} 
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

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[500px]">
          {activeSection === 1 && <SectionOne data={dpr.section1_deptDetails} />}
          {activeSection === 2 && <SectionTwo data={dpr.section2_streamIdentification} />}
          {activeSection === 3 && <SectionThree data={dpr.section3_catchmentArea} />}
          {activeSection === 4 && <SectionFour data={dpr.section4_photographs} />}
          {activeSection === 5 && <SectionFive data={dpr.section5_rechargeAreas} />}
          {activeSection === 6 && <SectionSix data={dpr.section6_maps} />}
          {activeSection === 7 && <SectionSeven data={dpr.section7_budgetAndPlan} />}
          {activeSection === 8 && <SectionEight data={dpr.section8_geoLocation} />}
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

function EmptySection() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Info className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest">Section Data Missing</p>
    </div>
  );
}

// Section renders (simplified for brevity)
function SectionOne({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 1: Department Details" subtitle="Officer Information" icon={<Landmark />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <InfoItem label="Department" value={data.department} />
        <InfoItem label="District" value={data.district} />
        <InfoItem label="Nodal Officer" value={data.nodalOfficer} />
        <InfoItem label="Contact No" value={data.contactNo} />
      </div>
    </div>
  );
}

function SectionTwo({ data }) {
  if (!data) return <EmptySection />;
  const table21 = data.table21 || [];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 2: Stream Identification" subtitle="Stream Data" icon={<MapPin />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <InfoItem label="Sub Watershed" value={data.subWatershedName} />
        <InfoItem label="Micro Watershed" value={data.microWatershedName} />
      </div>
      
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {['Detail', 'Name', 'Order', 'Length (Km)', 'Altitude'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {table21.map((row, i) => (
              <tr key={i} className="text-sm font-medium text-slate-700">
                <td className="px-4 py-3">{row.detail}</td>
                <td className="px-4 py-3 font-bold text-navy">{row.name}</td>
                <td className="px-4 py-3">{row.streamOrder}</td>
                <td className="px-4 py-3">{row.lengthKm}</td>
                <td className="px-4 py-3">{row.altitudeMtr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionThree({ data }) {
  if (!data) return <EmptySection />;
  const table31 = data.table31 || [];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 3: Catchment Area" subtitle="Catchment Data" icon={<TreePine />} />
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {['Detail', 'Name', 'Land Cover', 'Area (Ha)'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {table31.map((row, i) => (
              <tr key={i} className="text-sm font-medium text-slate-700">
                <td className="px-4 py-3">{row.detail}</td>
                <td className="px-4 py-3 font-bold text-navy">{row.name}</td>
                <td className="px-4 py-3 text-xs">{row.landCover}</td>
                <td className="px-4 py-3">{row.catchmentAreaHa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionFour({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 4: Photographs" subtitle="Images" icon={<Camera />} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <PhotoPreview label="Main Stream" url={data.mainStreamPhoto?.url} />
        <PhotoPreview label="Tributaries Confluence" url={data.tributariesConfluencePhoto?.url} />
      </div>
    </div>
  );
}

function PhotoPreview({ label, url }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      {url ? (
        <img src={url} alt={label} className="w-full h-48 object-cover rounded-2xl border border-slate-200" />
      ) : (
        <div className="w-full h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium">No Image Uploaded</div>
      )}
    </div>
  );
}

function SectionFive({ data }) {
  if (!data) return <EmptySection />;
  const table51 = data.table51 || [];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 5: Recharge Areas" subtitle="Recharge Data" icon={<TreePine />} />
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {['Detail', 'Name', 'Demarcated', 'Total Area (Ha)'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {table51.map((row, i) => (
              <tr key={i} className="text-sm font-medium text-slate-700">
                <td className="px-4 py-3">{row.detail}</td>
                <td className="px-4 py-3 font-bold text-navy">{row.name}</td>
                <td className="px-4 py-3">
                  <Badge status={row.rechargeAreaDemarcated ? 'SUCCESS' : 'DANGER'} text={row.rechargeAreaDemarcated ? 'YES' : 'NO'} />
                </td>
                <td className="px-4 py-3">{row.totalRechargeAreaHa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionSix({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 6: Maps" subtitle="Map Data" icon={<MapIcon />} />
      <div className="mt-8 space-y-6">
        <InfoItem label="Map Description" value={data.mapDescription} />
        {data.geoCoordinatesFile?.url && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Geo-Coordinates Map (KML)</span>
            </div>
            <a href={data.geoCoordinatesFile.url} target="_blank" rel="noreferrer" className="text-xs font-black text-blue-600 uppercase hover:underline">View Map</a>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionSeven({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 7: Budget & Plan" subtitle="Financials" icon={<IndianRupee />} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">DPR Preparation</p>
          <p className="text-lg font-black text-navy">{formatCurrency(data.table71?.dprPreparationBudgetLakh)}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Interventions</p>
          <p className="text-lg font-black text-navy">{formatCurrency(data.table71?.totalInterventionsCostLakh)}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">M&E Cost</p>
          <p className="text-lg font-black text-navy">{formatCurrency(data.table71?.monitoringEvaluationBudgetLakh)}</p>
        </div>
        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
          <p className="text-[10px] font-bold text-blue-200 uppercase mb-1">Total Project Cost</p>
          <p className="text-lg font-black text-white">{formatCurrency(data.table71?.totalBudgetLakh)}</p>
        </div>
      </div>

      <div className="mt-8">
        <InfoItem label="Financial Convergence Summary" value={`Grand Total: ${formatCurrency(data.table74?.grandTotalLakh)}`} />
      </div>
    </div>
  );
}

function SectionEight({ data }) {
  if (!data) return <EmptySection />;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Section 8: Geo Location" subtitle="Location Data" icon={<MapPin />} />
      <div className="mt-8 space-y-6">
        <InfoItem label="Location Description" value={data.geoLocationDescription} />
        {data.geoLocationFile?.url && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-900">Geo-Location Documentation</span>
            </div>
            <a href={data.geoLocationFile.url} target="_blank" rel="noreferrer" className="text-xs font-black text-emerald-600 uppercase hover:underline">View Document</a>
          </div>
        )}
      </div>
    </div>
  );
}

