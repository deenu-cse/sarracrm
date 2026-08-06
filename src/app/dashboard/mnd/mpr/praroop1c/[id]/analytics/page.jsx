"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { get } from "@/lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  ArrowLeft,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  MapPin,
  Calendar,
  FileText,
  Target
} from "lucide-react";
import { Card } from "@/components/ui/Card";

const COLORS = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-sm">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-mono font-bold">
              {entry.name.includes("Expend") || entry.name.includes("Budget") || entry.name.includes("Lakh") ? `₹${Number(entry.value).toFixed(2)} L` : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Praroop1AAnalytics() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await get(`/mpr/praroop1c/${id}`);
        if (res.success) {
          setForm(res.data);
        } else {
          setError(res.message || "Failed to fetch report details");
        }
      } catch (err) {
        setError("An error occurred while fetching report data");
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const charts = useMemo(() => {
    if (!form || !form.computed) return null;

    const distFinancials = form.computed.districtWiseSummary?.map(d => ({
      name: d.district,
      expenditure: d.totalSarraExpend,
      physical: d.totalPhysical
    })) || [];

    const activityFinancials = form.activities?.filter(a => !a.isHeader).map(a => ({
      name: a.activityEnglishName,
      code: a.activityCode,
      expenditure: a.districtTotals.totalSarraExpend,
      physical: a.districtTotals.totalPhysicalProgress,
      target: a.districtTotals.targetSarraShareLakh
    })) || [];

    const physicalPie = activityFinancials
      .filter(a => a.physical > 0)
      .map(a => ({
        name: a.name,
        value: a.physical
      }));

    return {
      distFinancials,
      activityFinancials,
      physicalPie
    };
  }, [form]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-xl" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 max-w-md text-center">
          <p className="font-bold">Error</p>
          <p>{error || "Report not found"}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg"
        >
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back to Details
            </button>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">
              Dashboard &bull; Praroop-1(C) &bull; {form.applicationNo} &bull; Analytics
            </p>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-blue-600" />
              Praroop-1(C) Insights
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</p>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${form.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                form.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                {form.status}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <Calendar size={14} className="text-slate-400" />
            {form.reportingMonth}, {form.financialYear}
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <FileText size={14} className="text-slate-400" />
            {form.applicationNo}
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <MapPin size={14} className="text-slate-400" />
            {form.submittedByDistrict}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-none shadow-md bg-gradient-to-br from-[#0a3d62] to-[#1e3799] text-white">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">Total Expenditure</p>
          <h2 className="text-3xl font-bold">₹{form.computed.grandTotalSarraExpend?.toFixed(2)}<span className="text-lg ml-1 opacity-70">L</span></h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-blue-200">
            <TrendingUp size={12} className="text-emerald-400" />
            SARRA Share Utilization
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md bg-white">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Physical Progress</p>
          <h2 className="text-3xl font-bold text-slate-900">{form.computed.grandTotalPhysicalProgress}</h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
            <Target size={12} className="text-blue-500" />
            Units completed across districts
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md bg-white">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Budget</p>
          <h2 className="text-3xl font-bold text-slate-900">₹{form.computed.grandTotalTargetSarraLakh?.toFixed(2)}<span className="text-lg ml-1 text-slate-400">L</span></h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Approved SARRA Share
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md bg-white">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Dept Share</p>
          <h2 className="text-3xl font-bold text-slate-900">₹{form.computed.grandTotalTargetDeptLakh?.toFixed(2)}<span className="text-lg ml-1 text-slate-400">L</span></h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Target Departmental Share
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="shadow-sm border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <MapPin size={18} className="text-indigo-500" />
            District-wise Expenditure (₹ Lakh)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.distFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="expenditure"
                  fill="#0a3d62"
                  radius={[4, 4, 0, 0]}
                  name="Expenditure"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* District-wise Physical Progress */}
        <Card className="shadow-sm border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Target size={18} className="text-emerald-500" />
            District Physical Progress
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.distFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="physical"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Physical Progress"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Financial Comparison */}
        <Card className="shadow-sm border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-blue-500" />
            Activity Financial Overview: Budget vs Expenditure (₹ Lakh)
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.activityFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="code"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                <Bar dataKey="target" fill="#f97316" radius={[4, 4, 0, 0]} name="Target Budget" />
                <Bar dataKey="expenditure" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Total Expenditure" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Distribution */}
        <Card className="shadow-sm border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <PieChartIcon size={18} className="text-fuchsia-500" />
            Activity Progress Distribution
          </h3>
          <div className="h-[350px] w-full flex flex-col md:row items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.physicalPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.physicalPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 max-h-[100px] overflow-y-auto px-4 w-full">
              {charts.physicalPie.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600 truncate max-w-[100px]">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Physical Breakdown by Activity */}
        <Card className="shadow-sm border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Target size={18} className="text-amber-500" />
            Activity-wise Physical Progress
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.activityFinancials} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="code"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="physical"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                  name="Physical Progress"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
