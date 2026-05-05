"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Cell,
  Cell as ReCell
} from "recharts";
import {
  ArrowLeft,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  MapPin,
  Building2,
  Calendar,
  FileText
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
              {entry.name.includes("Share") ? `₹${entry.value.toFixed(2)} L` : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MNDFormAnalytics({ params }) {
  const { id } = params;
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await get(`/mpr/abstract55/${id}`);
        if (res.success) {
          setForm(res.data);
        } else {
          setError(res.message || "Failed to fetch form details");
        }
      } catch (err) {
        setError("An error occurred while fetching form data");
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const charts = useMemo(() => {
    if (!form || !form.computed) return null;

    const deptFinancials = form.computed.departmentTotals.map(d => ({
      name: d.department,
      deptShare: d.totalDeptShare,
      sarraShare: d.totalSarraShare,
      proposals: d.totalProposals
    })).filter(d => d.proposals > 0 || d.deptShare > 0);

    const distFinancials = form.computed.districtTotals.map(d => ({
      name: d.district,
      deptShare: d.totalDeptShare,
      sarraShare: d.totalSarraShare,
      proposals: d.totalProposals
    })).filter(d => d.proposals > 0 || d.deptShare > 0);

    const proposalsPie = form.computed.departmentTotals
      .filter(d => d.totalProposals > 0)
      .map(d => ({
        name: d.department,
        value: d.totalProposals
      }));

    return {
      deptFinancials,
      distFinancials,
      proposalsPie
    };
  }, [form]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
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
              Dashboard &bull; Reports &bull; {form.applicationNo} &bull; Analytics
            </p>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-blue-600" />
              Report Insights
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/reports/export/pdf/${id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <FileText size={16} />
              Export PDF
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-100">
            {form.status}
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <Calendar size={14} className="text-slate-400" />
            {form.reportingMonth}, {form.financialYear}
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <FileText size={14} className="text-slate-400" />
            {form.applicationNo}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Proposals</p>
              <h2 className="text-4xl font-bold">{form.computed.totalProposalsAllDepts}</h2>
            </div>
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp size={14} className="text-emerald-400" />
            Across all 13 districts
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Dept Share</p>
              <h2 className="text-4xl font-bold text-slate-900">₹{form.computed.totalDeptShareLakh.toFixed(2)}<span className="text-xl ml-1 text-slate-500">L</span></h2>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Building2 className="text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Total departmental contribution
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">SARRA Share</p>
              <h2 className="text-4xl font-bold text-slate-900">₹{form.computed.totalSarraShareLakh.toFixed(2)}<span className="text-xl ml-1 text-slate-500">L</span></h2>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Total convergence funding
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-1 shadow-sm border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={18} className="text-blue-500" />
              Department-wise Proposals
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.deptFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="proposals"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="No. of Proposals"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department-wise Financials */}
        <Card className="p-1 shadow-sm border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Department Financials (₹ Lakh)
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.deptFinancials}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                <Bar dataKey="deptShare" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Dept Share" />
                <Bar dataKey="sarraShare" fill="#10b981" radius={[4, 4, 0, 0]} name="SARRA Share" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* District-wise Proposals */}
        <Card className="p-1 shadow-sm border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={18} className="text-red-500" />
              District-wise Proposals
            </h3>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.distFinancials} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="proposals"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  name="No. of Proposals"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Pie */}
        <Card className="p-1 shadow-sm border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PieChartIcon size={18} className="text-fuchsia-500" />
              Proposals Distribution
            </h3>
          </div>
          <div className="h-[400px] w-full flex flex-col md:flex-row items-center">
            <div className="w-full md:w-3/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.proposalsPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.proposalsPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-2/5 flex flex-col gap-2 mt-4 md:mt-0">
              {charts.proposalsPie.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600 truncate max-w-[120px]">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* District Financial Comparison */}
      <Card className="p-1 shadow-sm border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-500" />
            District Financial Comparison (₹ Lakh)
          </h3>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.distFinancials}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
              <Bar dataKey="deptShare" fill="#f97316" radius={[4, 4, 0, 0]} name="Dept Share" />
              <Bar dataKey="sarraShare" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="SARRA Share" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
