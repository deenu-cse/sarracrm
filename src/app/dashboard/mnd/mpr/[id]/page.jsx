"use client";
import React, { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Info, Edit } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatDate } from '@/lib/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function MPRDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: mpr, loading } = useFetch(`/mpr/abstract55/${params.id}`);

  const DISTRICTS = [
    'Almora', 'Nainital', 'Champawat', 'U S Nagar', 'Pithoragarh',
    'Bageshwar', 'Dehradun', 'Haridwar', 'Tehri', 'Chamoli',
    'Uttarkashi', 'Rudraprayag', 'Pauri'
  ];

  const chartData = useMemo(() => {
    if (!mpr) return null;

    // Dept Chart Data
    const deptData = mpr.computed.departmentTotals.map(d => ({
      name: d.department,
      deptShare: d.totalDeptShare,
      sarraShare: d.totalSarraShare,
      total: d.totalDeptShare + d.totalSarraShare
    })).sort((a, b) => b.total - a.total);

    // District Chart Data
    const distData = mpr.computed.districtTotals.map(d => ({
      name: d.district,
      proposals: d.totalProposals,
      totalBudget: d.totalDeptShare + d.totalSarraShare
    }));

    const topDistricts = [...distData].sort((a, b) => b.totalBudget - a.totalBudget).slice(0, 5);
    const topDistProposals = [...distData].sort((a, b) => b.proposals - a.proposals);

    // Donut Data
    const donutData = [
      { name: 'Dept Share', value: mpr.computed.totalDeptShareLakh, color: '#1e3a8a' }, // navy
      { name: 'SARRA Share', value: mpr.computed.totalSarraShareLakh, color: '#f97316' } // saffron
    ];

    // Heatmap Matrix
    const matrix = {};
    DISTRICTS.forEach(dist => {
      matrix[dist] = {};
      mpr.departments.forEach(dept => {
        const dData = dept.districts[dist] || { noOfProposals: 0, deptShareLakh: 0, sarraShareLakh: 0 };
        matrix[dist][dept.departmentName] = dData.noOfProposals;
      });
    });

    return { deptData, topDistricts, topDistProposals, donutData, matrix };
  }, [mpr]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading MPR details...</div>;
  if (!mpr) return <div className="p-8 text-center text-red-500">MPR not found.</div>;

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-white';
    if (count <= 2) return 'bg-blue-100 text-blue-800';
    if (count <= 5) return 'bg-blue-300 text-blue-900';
    if (count <= 10) return 'bg-blue-500 text-white';
    return 'bg-navy text-white';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 font-mono">{mpr.applicationNo}</h1>
            <span className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 ${mpr.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              mpr.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              mpr.status === 'RESUBMITTED' ? 'bg-purple-100 text-purple-700' :
                'bg-amber-100 text-amber-700'
              }`}>
              {mpr.status}
              {mpr.status === 'REJECTED' && mpr.rejectionReason && (
                <span title={mpr.rejectionReason} className="cursor-help text-red-700 hover:text-red-900">
                  <Info size={14} />
                </span>
              )}
            </span>
          </div>
          <p className="text-slate-500 font-medium">Submitted by {mpr.submittedBy?.name} ({mpr.submittedByDistrict}) &bull; {mpr.reportingMonth} {mpr.financialYear} &bull; Submitted on {formatDate(mpr.submittedAt)}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
            Download Excel
          </button>
          {mpr.status === 'SUBMITTED' && user?.role === 'MND_SUPER_ADMIN' && (
            <>
              <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all">
                ✗ Reject
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md">
                ✓ Approve
              </button>
            </>
          )}
          {mpr.status === 'REJECTED' && user?.role === 'MND_OFFICER' && (
            <button
              onClick={() => {
                localStorage.setItem(`sarra_mpr_abstract55_${user._id}`, JSON.stringify({
                  formData: mpr.departments.reduce((acc, dept) => {
                    acc[dept.departmentName] = dept.districts;
                    return acc;
                  }, {}), // Note: might need precise formatting depending on backend response format vs local storage format, checking next
                  isResubmit: true,
                  mprId: mpr._id,
                  savedAt: new Date().toISOString()
                }));
                router.push('/dashboard/mnd/abstract55');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Edit size={16} /> Edit & Resubmit
            </button>
          )}
          <Link href={`/dashboard/mnd/mpr/${mpr._id}/analytics`} className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-xl transition-all shadow-sm">
            📊 View Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Dept Budget */}
        <Card noPadding>
          <CardHeader title="Department-wise Total Budget (₹ Lakh)" />
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.deptData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="deptShare" name="Dept Share" stackId="a" fill="#1e3a8a" />
                <Bar dataKey="sarraShare" name="SARRA Share" stackId="a" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* CHART 2: Dist Proposals */}
        <Card noPadding>
          <CardHeader title="District-wise Proposal Count" />
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.topDistProposals} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="proposals" name="Proposals" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* CHART 3: Donut */}
        <Card noPadding>
          <CardHeader title="Funding Distribution" />
          <div className="p-4 h-80 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%" className='z-50'>
              <PieChart>
                <Pie data={chartData.donutData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {chartData.donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}L`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="text-center">
                <div className="text-xs text-slate-500 font-bold uppercase">Total Budget</div>
                <div className="text-xl font-bold text-slate-800">₹{(mpr.computed.totalDeptShareLakh + mpr.computed.totalSarraShareLakh).toFixed(2)}L</div>
              </div>
            </div>
          </div>
        </Card>

        {/* CHART 4: Top Dist Budget */}
        <Card noPadding>
          <CardHeader title="Top 5 Districts by Budget (₹ Lakh)" />
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.topDistricts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(val) => `₹${val.toFixed(2)}L`} />
                <Bar dataKey="totalBudget" name="Total Budget" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* HEATMAP */}
      <Card noPadding>
        <CardHeader title="District-Department Coverage Heatmap (Proposal Count)" />
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-slate-200 bg-slate-50 text-left font-bold text-slate-600">District</th>
                {mpr.departments.map(d => (
                  <th key={d.departmentName} className="p-2 border border-slate-200 bg-slate-50 text-center font-bold text-slate-600 truncate max-w-[80px]" title={d.departmentName}>
                    {d.departmentName.substring(0, 8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISTRICTS.map(dist => (
                <tr key={dist}>
                  <td className="p-2 border border-slate-200 font-medium text-slate-700 bg-white">{dist}</td>
                  {mpr.departments.map(d => {
                    const count = chartData.matrix[dist][d.departmentName];
                    return (
                      <td key={d.departmentName} className={`p-2 border border-slate-200 text-center font-semibold transition-colors hover:opacity-80 ${getHeatmapColor(count)}`} title={`${dist} - ${d.departmentName}: ${count} proposals`}>
                        {count > 0 ? count : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FULL MATRIX DATA TABLE */}
      <Card noPadding>
        <CardHeader title="Complete MPR Matrix" />
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-20">
              <tr>
                <th rowSpan={2} className="bg-navy p-3 border border-blue-900 text-white min-w-[130px] sticky left-0 z-30">District</th>
                {mpr.departments.map(d => (
                  <th key={d.departmentName} colSpan={3} className="bg-navy p-2 border border-blue-900 text-white text-center font-bold min-w-[220px]">
                    {d.departmentName}
                  </th>
                ))}
                <th colSpan={3} className="bg-indigo-900 p-2 border border-indigo-950 text-white text-center font-bold min-w-[220px]">
                  District Grand Total
                </th>
              </tr>
              <tr>
                {mpr.departments.map(d => (
                  <React.Fragment key={d.departmentName}>
                    <th className="bg-blue-800 p-2 text-xs text-blue-100 border border-blue-900">No.</th>
                    <th className="bg-blue-800 p-2 text-xs text-blue-100 border border-blue-900">Dept(L)</th>
                    <th className="bg-blue-800 p-2 text-xs text-blue-100 border border-blue-900">SARRA(L)</th>
                  </React.Fragment>
                ))}
                <th className="bg-indigo-800 p-2 text-xs text-indigo-100 border border-indigo-900">No.</th>
                <th className="bg-indigo-800 p-2 text-xs text-indigo-100 border border-indigo-900">Dept(L)</th>
                <th className="bg-indigo-800 p-2 text-xs text-indigo-100 border border-indigo-900">SARRA(L)</th>
              </tr>
            </thead>
            <tbody>
              {DISTRICTS.map((dist, i) => {
                const distTotal = mpr.computed.districtTotals.find(t => t.district === dist) || { totalProposals: 0, totalDeptShare: 0, totalSarraShare: 0 };
                return (
                  <tr key={dist} className="hover:bg-blue-50">
                    <td className="p-3 border border-slate-200 font-medium bg-slate-50 sticky left-0 z-10">{dist}</td>
                    {mpr.departments.map(d => {
                      const dt = d.districts[dist] || { noOfProposals: 0, deptShareLakh: 0, sarraShareLakh: 0 };
                      return (
                        <React.Fragment key={d.departmentName}>
                          <td className="p-2 border border-slate-200 text-center text-slate-600">{dt.noOfProposals || '—'}</td>
                          <td className="p-2 border border-slate-200 text-right text-slate-600">{dt.deptShareLakh ? dt.deptShareLakh.toFixed(2) : '—'}</td>
                          <td className="p-2 border border-slate-200 text-right text-slate-600">{dt.sarraShareLakh ? dt.sarraShareLakh.toFixed(2) : '—'}</td>
                        </React.Fragment>
                      )
                    })}
                    <td className="p-2 border border-slate-200 text-center font-bold text-indigo-700 bg-indigo-50/50">{distTotal.totalProposals || '—'}</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-indigo-700 bg-indigo-50/50">{distTotal.totalDeptShare ? distTotal.totalDeptShare.toFixed(2) : '—'}</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-indigo-700 bg-indigo-50/50">{distTotal.totalSarraShare ? distTotal.totalSarraShare.toFixed(2) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-20">
              <tr className="bg-navy text-white font-bold">
                <td className="p-3 border border-blue-900 text-right sticky left-0 z-30 bg-navy">GRAND TOTAL</td>
                {mpr.departments.map(d => {
                  const deptTotal = mpr.computed.departmentTotals.find(t => t.department === d.departmentName) || { totalProposals: 0, totalDeptShare: 0, totalSarraShare: 0 };
                  return (
                    <React.Fragment key={d.departmentName}>
                      <td className="p-2 border border-blue-900 text-center text-amber-300">{deptTotal.totalProposals || '—'}</td>
                      <td className="p-2 border border-blue-900 text-right text-amber-300">{deptTotal.totalDeptShare ? deptTotal.totalDeptShare.toFixed(2) : '—'}</td>
                      <td className="p-2 border border-blue-900 text-right text-amber-300">{deptTotal.totalSarraShare ? deptTotal.totalSarraShare.toFixed(2) : '—'}</td>
                    </React.Fragment>
                  )
                })}
                <td className="p-2 border border-indigo-950 text-center text-green-300 bg-indigo-900">{mpr.computed.totalProposalsAllDepts}</td>
                <td className="p-2 border border-indigo-950 text-right text-green-300 bg-indigo-900">{mpr.computed.totalDeptShareLakh.toFixed(2)}</td>
                <td className="p-2 border border-indigo-950 text-right text-green-300 bg-indigo-900">{mpr.computed.totalSarraShareLakh.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

    </div>
  );
}
