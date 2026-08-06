"use client";

import { useState, useCallback, useEffect, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const FINANCIAL_YEARS = ['2024-25', '2025-26', '2026-27', '2027-28'];
const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const DEPARTMENTS = [
  { id: 'Forest', label: 'Forest', icon: '🌲' },
  { id: 'RD', label: 'RD', icon: '🏘' },
  { id: 'MI', label: 'MI', icon: '💧' },
  { id: 'Irrigation', label: 'Irrigation', icon: '🚿' },
  { id: 'Jal Sansthan', label: 'Jal Sansthan', icon: '🏗' },
  { id: 'Peyjal', label: 'Peyjal', icon: '💦' },
  { id: 'HRDA', label: 'HRDA', icon: '🌾' },
  { id: 'WMD-VCRRFP', label: 'WMD-VCRRFP', icon: '🌊' },
  { id: 'Agriculture', label: 'Agriculture', icon: '🌱' },
  { id: 'Horticulture', label: 'Horticulture', icon: '🌼' },
  { id: 'Other', label: 'Other', icon: '📋' },
];

const DISTRICTS = [
  'Almora', 'Nainital', 'Champawat', 'U S Nagar', 'Pithoragarh',
  'Bageshwar', 'Dehradun', 'Haridwar', 'Tehri', 'Chamoli',
  'Uttarkashi', 'Rudraprayag', 'Pauri'
];

const initDeptData = () => {
  const data = {};
  DISTRICTS.forEach(d => {
    data[d] = { noOfProposals: '', deptShareLakh: '', sarraShareLakh: '' };
  });
  return data;
};

const initFormData = () => {
  const data = {};
  DEPARTMENTS.forEach(dept => { data[dept.id] = initDeptData(); });
  return data;
};

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const inp = "w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all placeholder-slate-400";
const lbl = "block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide";
const tableCell = "px-3 py-2 text-sm border-b border-slate-200 align-middle";
const tableHead = "bg-gradient-to-r from-blue-700 to-blue-800 text-white text-xs font-bold uppercase tracking-wider px-3 py-3 whitespace-nowrap text-center";

export default function MPRAbstract55() {
  const router = useRouter();
  const { user } = useAuth();

  const [financialYear, setFinancialYear] = useState('2025-26');
  const [month, setMonth] = useState('April');
  const [formData, setFormData] = useState(initFormData());
  const [activeDeptIdx, setActiveDeptIdx] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [isResubmit, setIsResubmit] = useState(false);
  const [resubmitId, setResubmitId] = useState(null);

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`sarra_mpr_abstract55_${user?._id || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.financialYear) setFinancialYear(parsed.financialYear);
        if (parsed.month) setMonth(parsed.month);
        if (parsed.formData) {
          setFormData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            Object.keys(parsed.formData).forEach(deptId => {
              if (newData[deptId] && typeof parsed.formData[deptId] === 'object') {
                Object.keys(parsed.formData[deptId]).forEach(distId => {
                  if (newData[deptId][distId]) {
                    newData[deptId][distId] = {
                      ...newData[deptId][distId],
                      ...parsed.formData[deptId][distId]
                    };
                  }
                });
              }
            });
            return newData;
          });
        }
        if (parsed.activeDeptIdx !== undefined) setActiveDeptIdx(parsed.activeDeptIdx);
        if (parsed.isResubmit) setIsResubmit(true);
        if (parsed.mprId) setResubmitId(parsed.mprId);
        toast.info(parsed.isResubmit ? "Loaded rejected form for editing." : `Restored unsaved draft from ${new Date(parsed.savedAt).toLocaleString()}`);
      } catch (e) {
        console.error("Failed to parse localStorage draft", e);
      }
    }
  }, [user]);

  // Save to localStorage whenever critical state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`sarra_mpr_abstract55_${user?._id || 'guest'}`, JSON.stringify({
        financialYear,
        month,
        formData,
        activeDeptIdx,
        savedAt: new Date().toISOString()
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [financialYear, month, formData, activeDeptIdx, user]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleNextDept();
      }
      if (e.key === 'Escape') {
        setShowReview(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDeptIdx]);

  const activeDept = DEPARTMENTS[activeDeptIdx];
  const activeDeptData = formData[activeDept.id];

  const isDeptFilled = useCallback((deptId) => {
    const dept = formData[deptId];
    return DISTRICTS.some(d => {
      const p = parseFloat(dept[d].noOfProposals);
      const ds = parseFloat(dept[d].deptShareLakh);
      const ss = parseFloat(dept[d].sarraShareLakh);
      return (p > 0 || ds > 0 || ss > 0);
    });
  }, [formData]);

  const deptTotals = useMemo(() => {
    let totalProposals = 0;
    let totalDeptShare = 0;
    let totalSarraShare = 0;

    DISTRICTS.forEach(d => {
      const p = parseInt(activeDeptData[d].noOfProposals) || 0;
      const ds = parseFloat(activeDeptData[d].deptShareLakh) || 0;
      const ss = parseFloat(activeDeptData[d].sarraShareLakh) || 0;
      totalProposals += p;
      totalDeptShare += ds;
      totalSarraShare += ss;
    });

    return {
      totalProposals,
      totalDeptShare,
      totalSarraShare,
      totalAmount: totalDeptShare + totalSarraShare
    };
  }, [activeDeptData]);

  const { grandSummary, districtGrandTotals } = useMemo(() => {
    const summary = DEPARTMENTS.map(dept => {
      let p = 0, ds = 0, ss = 0;
      DISTRICTS.forEach(d => {
        p += parseInt(formData[dept.id][d].noOfProposals) || 0;
        ds += parseFloat(formData[dept.id][d].deptShareLakh) || 0;
        ss += parseFloat(formData[dept.id][d].sarraShareLakh) || 0;
      });
      return { dept, proposals: p, deptShare: ds, sarraShare: ss, total: ds + ss, filled: p > 0 || ds > 0 || ss > 0 };
    });

    const grandTotal = summary.reduce((acc, curr) => ({
      proposals: acc.proposals + curr.proposals,
      deptShare: acc.deptShare + curr.deptShare,
      sarraShare: acc.sarraShare + curr.sarraShare,
      total: acc.total + curr.total
    }), { proposals: 0, deptShare: 0, sarraShare: 0, total: 0 });

    const distTotals = {};
    DISTRICTS.forEach(d => {
      let p = 0, ds = 0, ss = 0;
      DEPARTMENTS.forEach(dept => {
        p += parseInt(formData[dept.id][d].noOfProposals) || 0;
        ds += parseFloat(formData[dept.id][d].deptShareLakh) || 0;
        ss += parseFloat(formData[dept.id][d].sarraShareLakh) || 0;
      });
      distTotals[d] = { proposals: p, deptShare: ds, sarraShare: ss };
    });

    return { grandSummary: { summary, grandTotal }, districtGrandTotals: distTotals };
  }, [formData]);

  const handleCellChange = (deptId, district, field, value) => {
    let val = value;
    if (field === 'noOfProposals' && val !== '') val = val.replace(/[^0-9]/g, '');

    setFormData(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        [district]: {
          ...prev[deptId][district],
          [field]: val
        }
      }
    }));
  };

  const handleNextDept = () => {
    if (!isDeptFilled(activeDept.id)) {
      toast(`${activeDept.label} skipped (no data entered)`, { icon: 'ℹ️' });
    } else {
      toast.success(`${activeDept.label} saved. Now filling: ${DEPARTMENTS[Math.min(activeDeptIdx + 1, 10)].label}`);
    }

    if (activeDeptIdx < DEPARTMENTS.length - 1) {
      setActiveDeptIdx(prev => prev + 1);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } else {
      setShowReview(true);
    }
  };

  const handlePrevDept = () => {
    if (activeDeptIdx > 0) {
      setActiveDeptIdx(prev => prev - 1);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  const handleZeroFill = () => {
    setFormData(prev => {
      const nextDeptData = { ...prev[activeDept.id] };
      DISTRICTS.forEach(d => {
        nextDeptData[d] = {
          noOfProposals: '0',
          deptShareLakh: '0.00',
          sarraShareLakh: '0.00'
        };
      });
      return { ...prev, [activeDept.id]: nextDeptData };
    });
    toast.success(`Marked all districts as 0 for ${activeDept.label}`);
  };

  const handleCopyPreviousMonth = async () => {
    try {
      const res = await axiosInstance.get(`/mpr/abstract55/previous-month?financialYear=${financialYear}&month=${month}`);
      if (res.data && res.data.data) {
        const prevForm = res.data.data;
        const prevDeptData = prevForm.departments.find(d => d.departmentName === activeDept.id);
        if (prevDeptData && prevDeptData.districts) {
          setFormData(prev => {
            const nextDeptData = { ...prev[activeDept.id] };
            Object.keys(prevDeptData.districts).forEach(d => {
              if (DISTRICTS.includes(d)) {
                nextDeptData[d] = {
                  noOfProposals: prevDeptData.districts[d].noOfProposals.toString(),
                  deptShareLakh: prevDeptData.districts[d].deptShareLakh.toString(),
                  sarraShareLakh: prevDeptData.districts[d].sarraShareLakh.toString()
                };
              }
            });
            return { ...prev, [activeDept.id]: nextDeptData };
          });
          toast.success(`Copied previous month data for ${activeDept.label}`);
        } else {
          toast.info("No data found for this department in previous month");
        }
      } else {
        toast.info("No previous month data found");
      }
    } catch (err) {
      toast.error("Failed to copy previous month data");
    }
  };

  const formatPayload = (isDraft = false) => {
    return {
      financialYear,
      reportingMonth: month,
      isDraft,
      departments: DEPARTMENTS.map(dept => {
        const dists = {};
        DISTRICTS.forEach(d => {
          dists[d] = {
            noOfProposals: parseInt(formData[dept.id][d].noOfProposals) || 0,
            deptShareLakh: parseFloat(formData[dept.id][d].deptShareLakh) || 0,
            sarraShareLakh: parseFloat(formData[dept.id][d].sarraShareLakh) || 0
          };
        });
        return {
          departmentName: dept.id,
          districts: dists
        };
      })
    };
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const payload = formatPayload(true);
      await axiosInstance.post('/mpr/abstract55/draft', payload);
      toast.success("Draft saved successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (activeDeptIdx < 10 && !showReview) {
      if (!window.confirm(`You are on department ${activeDeptIdx + 1}/11. Are you sure you want to submit?`)) return;
    }

    setSubmitting(true);
    try {
      const payload = formatPayload(false);
      let url = '/mpr/abstract55/submit';
      let method = 'POST';

      if (isResubmit && resubmitId) {
        url = `/mpr/abstract55/${resubmitId}/resubmit`;
        method = 'PATCH';
      }

      const res = await axiosInstance({
        url,
        method,
        data: payload
      });
      localStorage.removeItem(`sarra_mpr_abstract55_${user?._id || 'guest'}`);
      setSuccessData({
        applicationNo: res.data.data.applicationNo,
        proposals: grandSummary.grandTotal.proposals,
        totalBudget: grandSummary.grandTotal.total
      });
      setIsSuccess(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess && successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 text-green-600">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">MPR Abstract 55 Submitted!</h2>
          <p className="text-slate-500 mb-6">Your monthly progress report has been successfully submitted and is pending review.</p>

          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 mb-8">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Reference No:</span>
              <span className="font-semibold text-slate-800 text-sm">{successData.applicationNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Period:</span>
              <span className="font-semibold text-slate-800 text-sm">{month} {financialYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Total Proposals:</span>
              <span className="font-semibold text-slate-800 text-sm">{successData.proposals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Total Budget:</span>
              <span className="font-semibold text-slate-800 text-sm">₹{successData.totalBudget.toFixed(2)} L</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/dashboard/mnd/mpr')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
              View Submitted MPR
            </button>
            <button onClick={() => {
              localStorage.removeItem(`sarra_mpr_abstract55_${user?._id || 'guest'}`);
              window.location.reload();
            }} className="w-full py-3 bg-white text-slate-600 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all">
              Start New MPR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-navy px-2 py-8 md:px-8 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Abstract 55 — MPR Form</h1>
            <p className="text-blue-500 text-sm mt-1">District wise-Department wise Approved Project (From DLEC) Status_Under Budget Head 55</p>
          </div>
        </div>
      </div>
      <div className="max-w-[98%] mx-auto px-3 md:px-6 mt-4 space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 z-40">
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-48">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Financial Year</label>
              <select value={financialYear} onChange={e => setFinancialYear(e.target.value)} className={inp}>
                {FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex-1 md:w-48">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className={inp}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleSaveDraft} disabled={submitting} className="flex-1 md:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200">
              💾 Save Draft
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md shadow-green-200 flex items-center justify-center gap-2">
              {submitting ? '...' : '✓ Submit MPR'}
            </button>
          </div>
        </div>

        {showReview ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Review MPR Data</h2>
              <button onClick={() => setShowReview(false)} className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-bold hover:bg-blue-50">
                ← Go Back to Edit
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th rowSpan={2} className="bg-slate-100 p-3 border-b border-r border-slate-200 min-w-[150px] sticky left-0 z-10">District</th>
                    {DEPARTMENTS.map(dept => (
                      <th key={dept.id} colSpan={3} className="bg-slate-50 p-2 border-b border-r border-slate-200 text-center font-bold text-slate-700 min-w-[240px]">
                        {dept.icon} {dept.label}
                      </th>
                    ))}
                    <th colSpan={3} className="bg-blue-50 p-2 border-b border-slate-200 text-center font-bold text-blue-800 min-w-[240px]">
                      Grand Total
                    </th>
                  </tr>
                  <tr>
                    {DEPARTMENTS.map(dept => (
                      <Fragment key={dept.id}>
                        <th className="bg-white p-2 text-xs font-semibold text-slate-500 border-b border-r border-slate-200">No.</th>
                        <th className="bg-white p-2 text-xs font-semibold text-slate-500 border-b border-r border-slate-200">Dept Share</th>
                        <th className="bg-white p-2 text-xs font-semibold text-slate-500 border-b border-r border-slate-200">SARRA Share</th>
                      </Fragment>
                    ))}
                    <th className="bg-blue-50/50 p-2 text-xs font-bold text-blue-600 border-b border-r border-blue-200">Total No.</th>
                    <th className="bg-blue-50/50 p-2 text-xs font-bold text-blue-600 border-b border-r border-blue-200">Total Dept</th>
                    <th className="bg-blue-50/50 p-2 text-xs font-bold text-blue-600 border-b border-blue-200">Total SARRA</th>
                  </tr>
                </thead>
                <tbody>
                  {DISTRICTS.map((d, i) => {
                    let rP = 0, rDS = 0, rSS = 0;
                    return (
                      <tr key={d} className="hover:bg-slate-50">
                        <td className="p-3 border-b border-r border-slate-200 font-medium sticky left-0 bg-white z-10">{d}</td>
                        {DEPARTMENTS.map(dept => {
                          const p = parseInt(formData[dept.id][d].noOfProposals) || 0;
                          const ds = parseFloat(formData[dept.id][d].deptShareLakh) || 0;
                          const ss = parseFloat(formData[dept.id][d].sarraShareLakh) || 0;
                          rP += p; rDS += ds; rSS += ss;
                          return (
                            <Fragment key={dept.id}>
                              <td className="p-2 border-b border-r border-slate-100 text-center text-slate-600">{p || '—'}</td>
                              <td className="p-2 border-b border-r border-slate-100 text-right text-slate-600">{ds ? ds.toFixed(2) : '—'}</td>
                              <td className="p-2 border-b border-r border-slate-200 text-right text-slate-600">{ss ? ss.toFixed(2) : '—'}</td>
                            </Fragment>
                          )
                        })}
                        <td className="p-2 border-b border-r border-blue-100 text-center font-bold text-blue-700 bg-blue-50/30">{rP || '—'}</td>
                        <td className="p-2 border-b border-r border-blue-100 text-right font-bold text-blue-700 bg-blue-50/30">{rDS ? rDS.toFixed(2) : '—'}</td>
                        <td className="p-2 border-b border-blue-100 text-right font-bold text-blue-700 bg-blue-50/30">{rSS ? rSS.toFixed(2) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 max-w-full overflow-auto">
            <div className="flex-1 space-y-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-[10px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                    Filling Department {activeDeptIdx + 1} of 11 — <span className="text-blue-600">{activeDept.label}</span>
                  </div>
                  <div className="text-xs font-semibold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                    {grandSummary.summary.filter(s => s.filled).length}/11 Filled
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                  <div className="bg-navy h-full transition-all" style={{ width: `${((activeDeptIdx + 1) / 11) * 100}%` }}></div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {DEPARTMENTS.map((dept, idx) => {
                    const filled = isDeptFilled(dept.id);
                    const active = idx === activeDeptIdx;
                    return (
                      <button key={dept.id} onClick={() => setActiveDeptIdx(idx)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2
                          ${active ? 'bg-blue-500 text-white border-navy shadow-md shadow-blue-900/20' :
                            filled ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                              'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                        <span>{dept.icon}</span>
                        <span>{dept.label}</span>
                        {filled && <span className="text-xs bg-green-200 text-green-800 w-4 h-4 flex items-center justify-center rounded-full">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 flex justify-between items-center">
                  <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                    <span>{activeDept.icon}</span> Active: {activeDept.label}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={handleCopyPreviousMonth} className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-semibold transition-all">
                      📋 Copy Last Month
                    </button>
                    <button onClick={handleZeroFill} className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-semibold transition-all">
                      0️⃣ Fill Zeros
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th rowSpan={2} className={tableHead + " w-12 border-r border-blue-600/30"}>S.No</th>
                        <th rowSpan={2} className={tableHead + " text-left w-32 border-r border-blue-600/30"}>District</th>
                        <th colSpan={3} className={tableHead + " bg-blue-700 border-r border-blue-600/30"}>Active: {activeDept.label}</th>
                        <th colSpan={3} className={tableHead + " bg-indigo-900"}>Grand Total (All Depts)</th>
                      </tr>
                      <tr>
                        <th className={tableHead + " bg-blue-600 border-r border-blue-500/30"}>No. of Proposal</th>
                        <th className={tableHead + " bg-blue-600 border-r border-blue-500/30"}>Dept Share (₹ L)</th>
                        <th className={tableHead + " bg-blue-600 border-r border-blue-600/30"}>SARRA Share (₹ L)</th>
                        <th className={tableHead + " bg-indigo-800 border-r border-indigo-700/30"}>Total Proposals</th>
                        <th className={tableHead + " bg-indigo-800 border-r border-indigo-700/30"}>Total Dept (₹ L)</th>
                        <th className={tableHead + " bg-indigo-800"}>Total SARRA (₹ L)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DISTRICTS.map((d, idx) => {
                        const p = activeDeptData[d].noOfProposals;
                        const ds = activeDeptData[d].deptShareLakh;
                        const ss = activeDeptData[d].sarraShareLakh;
                        const hasData = (parseInt(p) || 0) > 0 || (parseFloat(ds) || 0) > 0 || (parseFloat(ss) || 0) > 0;
                        const distTotal = districtGrandTotals[d];

                        return (
                          <tr key={d} className={`hover:bg-slate-50 transition-colors ${hasData ? 'bg-green-50/20' : ''}`}>
                            <td className="px-3 py-2 text-center text-slate-400 font-bold text-sm border-b border-r border-slate-200">{idx + 1}</td>
                            <td className="px-3 py-2 font-semibold text-slate-700 border-b border-r border-slate-200 text-sm">{d}</td>
                            <td className="px-3 py-2 border-b border-r border-slate-200">
                              <input type="number" min="0" step="1" placeholder="0"
                                value={p} onChange={e => handleCellChange(activeDept.id, d, 'noOfProposals', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border-2 rounded-lg text-center transition-all outline-none ${p ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-inner' : 'bg-slate-50 border-slate-200 focus:border-blue-400 focus:bg-white focus:shadow-md'}`}
                                tabIndex={idx * 3 + 1}
                              />
                            </td>
                            <td className="px-3 py-2 border-b border-r border-slate-200">
                              <input type="number" min="0" step="0.01" placeholder="0.00"
                                value={ds} onChange={e => handleCellChange(activeDept.id, d, 'deptShareLakh', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border-2 rounded-lg text-right transition-all outline-none ${ds ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-inner' : 'bg-slate-50 border-slate-200 focus:border-blue-400 focus:bg-white focus:shadow-md'}`}
                                tabIndex={idx * 3 + 2}
                              />
                            </td>
                            <td className="px-3 py-2 border-b border-r border-slate-200">
                              <input type="number" min="0" step="0.01" placeholder="0.00"
                                value={ss} onChange={e => handleCellChange(activeDept.id, d, 'sarraShareLakh', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border-2 rounded-lg text-right transition-all outline-none ${ss ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-inner' : 'bg-slate-50 border-slate-200 focus:border-blue-400 focus:bg-white focus:shadow-md'}`}
                                tabIndex={idx * 3 + 3}
                              />
                            </td>
                            <td className="px-3 py-2 border-b border-r border-slate-200 bg-slate-50/80 text-center font-bold text-indigo-600 text-sm">
                              {distTotal.proposals > 0 ? distTotal.proposals : '—'}
                            </td>
                            <td className="px-3 py-2 border-b border-r border-slate-200 bg-slate-50/80 text-right font-bold text-indigo-600 text-sm">
                              {distTotal.deptShare > 0 ? distTotal.deptShare.toFixed(2) : '—'}
                            </td>
                            <td className="px-3 py-2 border-b border-slate-200 bg-slate-50/80 text-right font-bold text-indigo-600 text-sm">
                              {distTotal.sarraShare > 0 ? distTotal.sarraShare.toFixed(2) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-navy text-white font-bold text-sm">
                        <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wide border-r border-blue-800">TOTAL ({activeDept.label})</td>
                        <td className="px-3 py-3 text-center border-r border-blue-800 text-amber-300">{deptTotals.totalProposals || '—'}</td>
                        <td className="px-3 py-3 text-right border-r border-blue-800 text-amber-300">{deptTotals.totalDeptShare ? deptTotals.totalDeptShare.toFixed(2) : '—'}</td>
                        <td className="px-3 py-3 text-right border-r border-blue-800 text-amber-300">{deptTotals.totalSarraShare ? deptTotals.totalSarraShare.toFixed(2) : '—'}</td>
                        <td className="px-3 py-3 text-center border-r border-indigo-700 bg-indigo-900 text-green-400">{grandSummary.grandTotal.proposals || '—'}</td>
                        <td className="px-3 py-3 text-right border-r border-indigo-700 bg-indigo-900 text-green-400">{grandSummary.grandTotal.deptShare ? grandSummary.grandTotal.deptShare.toFixed(2) : '—'}</td>
                        <td className="px-3 py-3 text-right bg-indigo-900 text-green-400">{grandSummary.grandTotal.sarraShare ? grandSummary.grandTotal.sarraShare.toFixed(2) : '—'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* BOTTOM NAVIGATION */}
              <div className="flex justify-between items-center gap-4">
                <button onClick={handlePrevDept} disabled={activeDeptIdx === 0}
                  className="px-6 py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all">
                  ← Previous
                </button>
                <div className="hidden md:flex gap-1">
                  {DEPARTMENTS.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i === activeDeptIdx ? 'bg-blue-600' : isDeptFilled(DEPARTMENTS[i].id) ? 'bg-green-400' : 'bg-slate-300'}`}></div>
                  ))}
                </div>
                <button onClick={handleNextDept}
                  className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                  {activeDeptIdx === 10 ? 'Review & Submit' : `Save & Next: ${DEPARTMENTS[Math.min(activeDeptIdx + 1, 10)].label}`} →
                </button>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
