"use client";

import React, { useState, useCallback, useEffect, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const FINANCIAL_YEARS = ['2024-25', '2025-26', '2026-27', '2027-28'];
const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const DISTRICTS = [
  {id:'Dehradun', hi:'देहरादून'},
  {id:'Haridwar', hi:'हरिद्वार'},
  {id:'Tehri', hi:'टिहरी'},
  {id:'Pauri', hi:'पौड़ी'},
  {id:'Chamoli', hi:'चमोली'},
  {id:'Uttarkashi', hi:'उत्तरकाशी'},
  {id:'Rudraprayag', hi:'रुद्रप्रयाग'},
  {id:'USNagar', hi:'उधमसिंहनगर'},
  {id:'Nainital', hi:'नैनीताल'},
  {id:'Almora', hi:'अल्मोड़ा'},
  {id:'Pithoragarh', hi:'पिथौरागढ़'},
  {id:'Bageshwar', hi:'बागेश्वर'},
  {id:'Champawat', hi:'चम्पावत'},
];

const ACTIVITIES = [
  { code:'55-02', name:'प्राथमिक / विस्तृत परियोजना रिपोर्ट पर व्यय', en:'DPR Preparation', hasPhysical:false, hasSize:false },
  { code:'55-02(01)', name:'समोच्च खनियां / कन्टूर ट्रेंचेज', en:'Contour Trenches', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-02(02)', name:'रिचार्ज पिट', en:'Recharge Pit', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-02(03)', name:'डग आउट पौण्ड', en:'Dugout Ponds', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-02(04)', name:'चाल / खाल', en:'Chal-Khal', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-02(05)', name:'ब्रशवुड चेक डेम', en:'Brushwood Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-02(06)', name:'अस्थाई चेक डेम (पिरुल आदि)', en:'Temporary Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-02(07)', name:'Loose Boulder Check Dam', en:'Loose Boulder Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-02(08)', name:'R:R Dry Check Dam', en:'RR Dry Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-02(09)', name:'Gabion / Crate Wire Check Dam', en:'Gabion/Crate Wire Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-02(10)', name:'Cemented Check Dam', en:'Cemented Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-02(11)', name:'वानस्पतिक उपचार गतिविधि', en:'Vegetative Treatment', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-02(12)', name:'वनीकरण गतिविधि', en:'Forestry Plantation', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-02(13)', name:'चारा / घास रोपण', en:'Fodder/Grass Plantation', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-02(14)', name:'प्राकृतिक पुनरोत्पादन गतिविधि', en:'ANR Activities', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-02(15)', name:'वृक्षारोपण गतिविधि', en:'Plantation Activities', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-02(16)', name:'उपरोक्त गतिविधियों से कुल उपचारित जल संग्रहण क्षेत्र', en:'Total Catchment Area Treated', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'M&E', name:'मूल्यांकन एवं अनुश्रवण पर व्यय', en:'Monitoring & Evaluation', hasPhysical:false, hasSize:false },
];

const initFormData = () => {
  const data = {};
  ACTIVITIES.forEach(act => {
    data[act.code] = { districts: {} };
    DISTRICTS.forEach(dist => {
      data[act.code].districts[dist.id] = {
        lastMonthPhysicalProgress: '',
        thisMonthPhysicalProgress: '',
        lastMonthSarraExpend: '',
        thisMonthSarraExpend: '',
        physicalProgressTillLastFY: 0,
        targetUnit: 0,
        targetSizeCubicMeter: 0,
        sarraExpendTillLastFY: 0,
        ratePerUnit: 0,
        targetDeptShareLakh: 0,
        targetSarraShareLakh: 0,
      };
    });
  });
  return data;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MPRPraroop1B() {
  const router = useRouter();
  const { user } = useAuth();

  const [financialYear, setFinancialYear] = useState('2025-26');
  const [month, setMonth] = useState('April');
  
  const [totalApprovedSchemes, setTotalApprovedSchemes] = useState('');
  const [totalRiversUnderSchemes, setTotalRiversUnderSchemes] = useState('');
  const [riversCurrentlyBeingTreated, setRiversCurrentlyBeingTreated] = useState('');

  const [formData, setFormData] = useState(initFormData());
  const [activeActivityIdx, setActiveActivityIdx] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [isResubmit, setIsResubmit] = useState(false);
  const [resubmitId, setResubmitId] = useState(null);

  // Restore from localStorage
  useEffect(() => {
    const resubmitKey = `sarra_mpr_55_02_${user?._id}`;
    const resubmitData = localStorage.getItem(resubmitKey);
    
    if (resubmitData) {
      try {
        const parsed = JSON.parse(resubmitData);
        if (parsed.formData) {
          setFormData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            Object.keys(parsed.formData).forEach(actCode => {
              if (newData[actCode] && parsed.formData[actCode].districts) {
                Object.keys(parsed.formData[actCode].districts).forEach(distId => {
                  if (newData[actCode].districts[distId]) {
                    newData[actCode].districts[distId] = {
                      ...newData[actCode].districts[distId],
                      ...parsed.formData[actCode].districts[distId]
                    };
                  }
                });
              }
            });
            return newData;
          });
        }
        if (parsed.totalApprovedSchemes) setTotalApprovedSchemes(parsed.totalApprovedSchemes);
        if (parsed.totalRiversUnderSchemes) setTotalRiversUnderSchemes(parsed.totalRiversUnderSchemes);
        if (parsed.riversCurrentlyBeingTreated) setRiversCurrentlyBeingTreated(parsed.riversCurrentlyBeingTreated);
        setIsResubmit(true);
        setResubmitId(parsed.mprId);
        
        toast.info("Loaded rejected form for editing.");
        
        localStorage.setItem(`sarra_mpr_praroop1b_${user?._id || 'guest'}_${financialYear}_${month}`, resubmitData);
        localStorage.removeItem(resubmitKey);
      } catch (e) {
        console.error("Failed to parse resubmit data", e);
      }
      return;
    }

    const saved = localStorage.getItem(`sarra_mpr_praroop1b_${user?._id || 'guest'}_${financialYear}_${month}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          setFormData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            Object.keys(parsed.formData).forEach(actCode => {
              if (newData[actCode] && parsed.formData[actCode].districts) {
                Object.keys(parsed.formData[actCode].districts).forEach(distId => {
                  if (newData[actCode].districts[distId]) {
                    newData[actCode].districts[distId] = {
                      ...newData[actCode].districts[distId],
                      ...parsed.formData[actCode].districts[distId]
                    };
                  }
                });
              }
            });
            return newData;
          });
        }
        if (parsed.totalApprovedSchemes) setTotalApprovedSchemes(parsed.totalApprovedSchemes);
        if (parsed.totalRiversUnderSchemes) setTotalRiversUnderSchemes(parsed.totalRiversUnderSchemes);
        if (parsed.riversCurrentlyBeingTreated) setRiversCurrentlyBeingTreated(parsed.riversCurrentlyBeingTreated);
        if (parsed.activeActivityIdx !== undefined) setActiveActivityIdx(parsed.activeActivityIdx);
        if (parsed.isResubmit) setIsResubmit(true);
        if (parsed.mprId) setResubmitId(parsed.mprId);
        toast.info(parsed.isResubmit ? "Loaded rejected form for editing." : `Restored unsaved draft from ${new Date(parsed.savedAt).toLocaleString()}`);
      } catch (e) {
        console.error("Failed to parse localStorage draft", e);
      }
    } else {
        // Fetch baseline data if no draft
        fetchBaseline();
    }
  }, [user, financialYear, month]);

  const fetchBaseline = async () => {
      try {
          const res = await axiosInstance.get(`/mpr/praroop1b/baseline?financialYear=${financialYear}`);
          if(res.data && res.data.data) {
              const bl = res.data.data;
              setFormData(prev => {
                  const newFormData = { ...prev };
                  ACTIVITIES.forEach(act => {
                      if(bl[act.code] && bl[act.code].districts) {
                          DISTRICTS.forEach(d => {
                             if(bl[act.code].districts[d.id]) {
                                 newFormData[act.code].districts[d.id] = {
                                     ...newFormData[act.code].districts[d.id],
                                     ...bl[act.code].districts[d.id]
                                 }
                             }
                          })
                      }
                  })
                  return newFormData;
              })
          }
      } catch (e) {
          console.error("Failed to load baseline", e);
      }
  }

  // Save to localStorage whenever critical state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`sarra_mpr_praroop1b_${user?._id || 'guest'}_${financialYear}_${month}`, JSON.stringify({
        formData,
        totalApprovedSchemes,
        totalRiversUnderSchemes,
        riversCurrentlyBeingTreated,
        activeActivityIdx,
        savedAt: new Date().toISOString()
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [financialYear, month, formData, totalApprovedSchemes, totalRiversUnderSchemes, riversCurrentlyBeingTreated, activeActivityIdx, user]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleNextActivity();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if (e.key === 'Escape') {
        setShowReview(false);
        setShowSummary(false);
      }
      if (e.key === 'ArrowUp' && e.altKey) {
        if(activeActivityIdx > 0) setActiveActivityIdx(activeActivityIdx - 1);
      }
      if (e.key === 'ArrowDown' && e.altKey) {
        if(activeActivityIdx < ACTIVITIES.length - 1) setActiveActivityIdx(activeActivityIdx + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeActivityIdx]);

  const activeActivity = ACTIVITIES[activeActivityIdx];

  const handleCellChange = (actCode, districtId, field, value) => {
    let val = value;
    // Prevent negative values by removing the minus sign
    if (val.includes('-')) {
        val = val.replace(/-/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [actCode]: {
        ...prev[actCode],
        districts: {
          ...prev[actCode].districts,
          [districtId]: {
            ...prev[actCode].districts[districtId],
            [field]: val
          }
        }
      }
    }));
  };

  const handleNextActivity = () => {
    if (activeActivityIdx < ACTIVITIES.length - 1) {
      setActiveActivityIdx(prev => prev + 1);
      window.scrollTo({ top: 150, behavior: 'smooth' });
    } else {
      setShowReview(true);
    }
  };

  const handlePrevActivity = () => {
    if (activeActivityIdx > 0) {
      setActiveActivityIdx(prev => prev - 1);
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }
  };

  const isComplete = (actCode) => {
    const act = ACTIVITIES.find(a => a.code === actCode);
    if (!act.hasPhysical) {
      return DISTRICTS.every(d => formData[actCode]?.districts[d.id]?.thisMonthSarraExpend !== '');
    }
    return DISTRICTS.every(d => formData[actCode]?.districts[d.id]?.thisMonthPhysicalProgress !== '');
  };

  const isPartial = (actCode) => {
    const act = ACTIVITIES.find(a => a.code === actCode);
    if(!act.hasPhysical) {
        return DISTRICTS.some(d => formData[actCode]?.districts[d.id]?.thisMonthSarraExpend !== '');
    }
    return DISTRICTS.some(d => formData[actCode]?.districts[d.id]?.thisMonthPhysicalProgress !== '');
  };

  const completedActivitiesCount = ACTIVITIES.filter(a => isComplete(a.code)).length;

  const activityTotals = useMemo(() => {
    const totals = { lastMonthPhysical: 0, thisMonthPhysical: 0, cumulativePhysical: 0, totalPhysical: 0, targetUnit: 0, lastMonthSarra: 0, thisMonthSarra: 0, totalSarra: 0, targetSarraLakh: 0 };
    DISTRICTS.forEach(d => {
        const data = formData[activeActivity.code]?.districts[d.id] || {};
        totals.lastMonthPhysical += parseFloat(data.lastMonthPhysicalProgress) || 0;
        totals.thisMonthPhysical += parseFloat(data.thisMonthPhysicalProgress) || 0;
        totals.targetUnit += parseFloat(data.targetUnit) || 0;
        totals.lastMonthSarra += parseFloat(data.lastMonthSarraExpend) || 0;
        totals.thisMonthSarra += parseFloat(data.thisMonthSarraExpend) || 0;
        totals.targetSarraLakh += parseFloat(data.targetSarraShareLakh) || 0;

        totals.cumulativePhysical += (parseFloat(data.physicalProgressTillLastFY) || 0) + (parseFloat(data.lastMonthPhysicalProgress) || 0) + (parseFloat(data.thisMonthPhysicalProgress) || 0);
        totals.totalSarra += (parseFloat(data.sarraExpendTillLastFY) || 0) + (parseFloat(data.lastMonthSarraExpend) || 0) + (parseFloat(data.thisMonthSarraExpend) || 0);
    });
    totals.totalPhysical = totals.cumulativePhysical;
    return totals;
  }, [formData, activeActivityIdx]);

  const handleCopyLastMonth = async () => {
      try {
          const res = await axiosInstance.get(`/mpr/praroop1b/previous-month?financialYear=${financialYear}&month=${month}`);
          if(res.data && res.data.data) {
              const pmData = res.data.data;
              if(pmData[activeActivity.code]) {
                  setFormData(prev => {
                      const updated = { ...prev };
                      DISTRICTS.forEach(d => {
                          if(pmData[activeActivity.code].districts[d.id]) {
                              updated[activeActivity.code].districts[d.id].lastMonthPhysicalProgress = pmData[activeActivity.code].districts[d.id].lastMonthPhysicalProgress;
                              updated[activeActivity.code].districts[d.id].lastMonthSarraExpend = pmData[activeActivity.code].districts[d.id].lastMonthSarraExpend;
                          }
                      })
                      return updated;
                  });
                  toast.success(`Last month data copied for ${activeActivity.en}`);
              } else {
                  toast.info("No data for this activity in previous month");
              }
          } else {
              toast.info("No previous month data found");
          }
      } catch (err) {
          toast.error("Failed to copy last month data");
      }
  };

  const handleMarkAllZero = () => {
    setFormData(prev => {
      const updated = { ...prev };
      DISTRICTS.forEach(d => {
        updated[activeActivity.code].districts[d.id].thisMonthPhysicalProgress = '0';
        updated[activeActivity.code].districts[d.id].thisMonthSarraExpend = '0';
      });
      return updated;
    });
    toast.success(`Marked all districts zero for ${activeActivity.en}`);
  };

  const formatPayload = (isDraft = false) => {
    return {
      financialYear,
      reportingMonth: month,
      isDraft,
      totalApprovedSchemes: parseInt(totalApprovedSchemes) || 0,
      totalRiversUnderSchemes: parseInt(totalRiversUnderSchemes) || 0,
      riversCurrentlyBeingTreated: parseInt(riversCurrentlyBeingTreated) || 0,
      activities: ACTIVITIES.map(act => ({
        activityCode: act.code,
        activityName: act.name,
        activityEnglishName: act.en,
        unit: act.unit || '',
        hasPhysical: act.hasPhysical,
        hasSize: act.hasSize,
        isHeader: false,
        districts: DISTRICTS.map(dist => {
            const d = formData[act.code].districts[dist.id];
            return {
                districtName: dist.id,
                physicalProgressTillLastFY: parseFloat(d.physicalProgressTillLastFY) || 0,
                targetUnit: parseFloat(d.targetUnit) || 0,
                targetSizeCubicMeter: parseFloat(d.targetSizeCubicMeter) || 0,
                sarraExpendTillLastFY: parseFloat(d.sarraExpendTillLastFY) || 0,
                ratePerUnit: parseFloat(d.ratePerUnit) || 0,
                targetDeptShareLakh: parseFloat(d.targetDeptShareLakh) || 0,
                targetSarraShareLakh: parseFloat(d.targetSarraShareLakh) || 0,

                lastMonthPhysicalProgress: parseFloat(d.lastMonthPhysicalProgress) || 0,
                thisMonthPhysicalProgress: parseFloat(d.thisMonthPhysicalProgress) || 0,
                lastMonthSarraExpend: parseFloat(d.lastMonthSarraExpend) || 0,
                thisMonthSarraExpend: parseFloat(d.thisMonthSarraExpend) || 0,
            }
        })
      }))
    };
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const payload = formatPayload(true);
      await axiosInstance.post('/mpr/praroop1b/draft', payload);
      toast.success("Draft saved successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (totalApprovedSchemes === '' || totalRiversUnderSchemes === '' || riversCurrentlyBeingTreated === '') {
        toast.error("Please fill the top summary fields before submitting.");
        return;
    }
    setSubmitting(true);
    try {
      const payload = formatPayload(false);
      let url = '/mpr/praroop1b/submit';
      let method = 'POST';
      
      if (isResubmit && resubmitId) {
        url = `/mpr/praroop1b/${resubmitId}/resubmit`;
        method = 'PATCH';
      }

      const res = await axiosInstance({
        url,
        method,
        data: payload
      });
      localStorage.removeItem(`sarra_mpr_praroop1b_${user?._id || 'guest'}_${financialYear}_${month}`);
      
      const gtSarra = res.data.data.computed.grandTotalSarraExpend;
      const gtPhysical = res.data.data.computed.grandTotalPhysicalProgress;

      setSuccessData({
        applicationNo: res.data.data.applicationNo,
        physical: gtPhysical,
        totalBudget: gtSarra
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">MPR Praroop-1(B) Submitted!</h2>
          <p className="text-slate-500 mb-6">वर्षा आधारित नदी उपचार — HEAD 55-02 — Successfully submitted.</p>

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
              <span className="text-slate-500 text-sm">Physical Progress:</span>
              <span className="font-semibold text-slate-800 text-sm">{successData.physical}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Total SARRA Spent:</span>
              <span className="font-semibold text-slate-800 text-sm">₹{successData.totalBudget.toFixed(2)} L</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/dashboard/mnd/mpr')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
              Back to Dashboard
            </button>
            <button onClick={() => {
              localStorage.removeItem(`sarra_mpr_praroop1b_${user?._id || 'guest'}_${financialYear}_${month}`);
              window.location.reload();
            }} className="w-full py-3 bg-white text-slate-600 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all">
              Start New MPR
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  const inpClasses = "w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-[#0a3d62] px-6 py-6 z-50 sticky top-0 shadow-md">
        <div className="max-w-[98%] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">प्रारूप-1(B) | HEAD 55-02 (River) | MPR</h1>
            <p className="text-blue-200 text-sm mt-1">SARRA 55-पूंजीगत परिसम्पत्तियां — वर्षा आधारित नदी उपचार — वित्तीय एवं भौतिक प्रगति</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select value={financialYear} onChange={e => setFinancialYear(e.target.value)} className="px-3 py-2 rounded border-0 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#e67e22]">
                {FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(e.target.value)} className="px-3 py-2 rounded border-0 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#e67e22]">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => setShowSummary(!showSummary)} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded font-semibold transition-all text-sm backdrop-blur-sm">
                📊 Summary View
            </button>
            <button onClick={handleSaveDraft} disabled={submitting} className="px-4 py-2 bg-slate-100 hover:bg-white text-slate-800 rounded font-bold transition-all text-sm shadow">
                💾 Save Draft
            </button>
            <button onClick={() => setShowReview(true)} className="px-5 py-2 bg-[#e67e22] hover:bg-[#d35400] text-white rounded font-bold transition-all text-sm shadow-lg">
                Review & Submit →
            </button>
          </div>
        </div>
        <div className="max-w-[98%] mx-auto mt-4">
            <div className="flex justify-between text-xs text-blue-200 mb-1">
                <span>Activities filled: {completedActivitiesCount}/18</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-1.5">
                <div className="bg-[#e67e22] h-1.5 rounded-full transition-all" style={{width: `${(completedActivitiesCount/18)*100}%`}}></div>
            </div>
        </div>
      </div>

      <div className="max-w-[98%] mx-auto mt-6">
          {/* TOP SUMMARY PANEL */}
          <div className="bg-[#FFF9C4] p-4 rounded-xl shadow-sm border border-amber-200 mb-6 flex flex-wrap gap-4 items-center">
             <div className="flex-1 min-w-[200px]">
                 <label className="block text-xs font-bold text-amber-900 mb-1">1. कुल स्वीकृत योजनाओं की संख्या</label>
                 <input type="number" min="0" value={totalApprovedSchemes} onChange={e => setTotalApprovedSchemes(e.target.value.replace(/-/g, ''))} className="w-full px-3 py-2 rounded border border-amber-300 focus:ring-2 focus:ring-[#e67e22] outline-none" />
             </div>
             <div className="flex-1 min-w-[200px]">
                 <label className="block text-xs font-bold text-amber-900 mb-1">2. आच्छादित वर्षा आधारित नदी/धारा की संख्या</label>
                 <input type="number" min="0" value={totalRiversUnderSchemes} onChange={e => setTotalRiversUnderSchemes(e.target.value.replace(/-/g, ''))} className="w-full px-3 py-2 rounded border border-amber-300 focus:ring-2 focus:ring-[#e67e22] outline-none" />
             </div>
             <div className="flex-1 min-w-[200px]">
                 <label className="block text-xs font-bold text-amber-900 mb-1">3. उपचार किये जा रहे वर्षा आधारित नदी/धारा की संख्या</label>
                 <input type="number" min="0" value={riversCurrentlyBeingTreated} onChange={e => setRiversCurrentlyBeingTreated(e.target.value)} className="w-full px-3 py-2 rounded border border-amber-300 focus:ring-2 focus:ring-[#e67e22] outline-none" />
             </div>
          </div>

          {showReview ? (
             <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#0a3d62]">Review Application before Submission</h2>
                    <button onClick={() => setShowReview(false)} className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-semibold">← Back to Edit</button>
                </div>
                {/* Simplified Review table for constraints, just shows totals per activity */}
                <div className="overflow-x-auto mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#0a3d62] text-white">
                                <th className="p-3 text-left">Activity</th>
                                <th className="p-3 text-right">Unit</th>
                                <th className="p-3 text-right">Physical Progress (Month)</th>
                                <th className="p-3 text-right">SARRA Spend (Month) ₹L</th>
                                <th className="p-3 text-right">Total Physical</th>
                                <th className="p-3 text-right">Total SARRA ₹L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ACTIVITIES.map((act, i) => {
                                let tPM = 0, tSM = 0, tCP = 0, tCS = 0;
                                DISTRICTS.forEach(d => {
                                    const distData = formData[act.code].districts[d.id];
                                    tPM += parseFloat(distData.thisMonthPhysicalProgress) || 0;
                                    tSM += parseFloat(distData.thisMonthSarraExpend) || 0;
                                    tCP += (parseFloat(distData.physicalProgressTillLastFY) || 0) + (parseFloat(distData.lastMonthPhysicalProgress) || 0) + (parseFloat(distData.thisMonthPhysicalProgress) || 0);
                                    tCS += (parseFloat(distData.sarraExpendTillLastFY) || 0) + (parseFloat(distData.lastMonthSarraExpend) || 0) + (parseFloat(distData.thisMonthSarraExpend) || 0);
                                });
                                return (
                                    <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                                        <td className="p-3">
                                            <div className="font-semibold text-slate-800">{act.code}</div>
                                            <div className="text-xs text-slate-500">{act.en}</div>
                                        </td>
                                        <td className="p-3 text-right text-slate-600">{act.unit || '—'}</td>
                                        <td className="p-3 text-right font-medium text-green-600">{tPM || '—'}</td>
                                        <td className="p-3 text-right font-medium text-green-600">{tSM ? tSM.toFixed(2) : '—'}</td>
                                        <td className="p-3 text-right font-bold text-[#0a3d62]">{tCP || '—'}</td>
                                        <td className="p-3 text-right font-bold text-[#0a3d62]">{tCS ? tCS.toFixed(2) : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 bg-[#1e8449] hover:bg-green-800 text-white font-bold rounded-lg shadow-lg text-lg">
                        ✓ Confirm & Submit Application
                    </button>
                </div>
             </div>
          ) : (
             <div className="flex flex-col lg:flex-row gap-6">
                {/* SIDEBAR NAVIGATION */}
                <div className="w-full lg:w-[260px] flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden self-start sticky top-[100px]">
                   <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm">
                       Activity Navigation
                   </div>
                   <div className="max-h-[70vh] overflow-y-auto p-2 space-y-1">
                       {ACTIVITIES.map((act, idx) => {
                           const active = idx === activeActivityIdx;
                           const complete = isComplete(act.code);
                           const partial = isPartial(act.code);
                           return (
                               <button key={act.code} onClick={() => setActiveActivityIdx(idx)} 
                                   className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2 transition-all border-l-4
                                       ${active ? 'bg-[#0a3d62] text-white border-[#e67e22]' : 'hover:bg-slate-50 text-slate-600 border-transparent'}
                                   `}>
                                   <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0
                                       ${complete ? 'bg-[#1e8449]' : partial ? 'bg-[#f39c12]' : 'bg-slate-300'}
                                   `}></div>
                                   <div>
                                       <div className={`font-mono text-[10px] ${active ? 'text-blue-200' : 'text-slate-400'}`}>{act.code}</div>
                                       <div className={`font-semibold line-clamp-2 ${active ? 'text-white' : 'text-slate-700'}`}>{act.en}</div>
                                   </div>
                               </button>
                           )
                       })}
                   </div>
                </div>

                {/* MAIN TABLE AREA */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50">
                        <div>
                            <div className="inline-block px-2 py-1 bg-[#0a3d62] text-white text-xs font-mono rounded mb-2">{activeActivity.code}</div>
                            <h2 className="text-xl font-bold text-slate-800">{activeActivity.name}</h2>
                            <p className="text-sm text-slate-500 font-medium">{activeActivity.en} {activeActivity.unit && <span className="bg-slate-200 px-1.5 py-0.5 rounded ml-2 text-xs">Unit: {activeActivity.unit}</span>}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handlePrevActivity} disabled={activeActivityIdx===0} className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-50">← Prev</button>
                            <button onClick={handleNextActivity} disabled={activeActivityIdx===ACTIVITIES.length-1} className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-50">Next →</button>
                            <div className="w-px bg-slate-300 mx-1"></div>
                            <button onClick={handleCopyLastMonth} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-semibold">Copy Last Month</button>
                            <button onClick={handleMarkAllZero} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-sm font-semibold">Mark All 0</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-4">
                        <table className="w-full text-sm border-collapse min-w-[1200px]">
                            <thead>
                                <tr>
                                    <th rowSpan={2} className="bg-slate-100 p-2 border border-slate-300 sticky left-0 z-10 w-12 text-slate-600">S.No.</th>
                                    <th rowSpan={2} className="bg-slate-100 p-2 border border-slate-300 sticky left-12 z-10 min-w-[120px] text-left text-slate-600">जनपद</th>
                                    
                                    <th colSpan={activeActivity.hasSize ? 6 : 5} className="bg-blue-100 p-2 border border-slate-300 text-center font-bold text-blue-800">
                                        भौतिक लक्ष्य-पूर्ति {activeActivity.hasPhysical ? '' : '(N/A)'}
                                    </th>
                                    <th colSpan={7} className="bg-green-100 p-2 border border-slate-300 text-center font-bold text-green-800">
                                        वित्तीय लक्ष्य-पूर्ति
                                    </th>
                                </tr>
                                <tr>
                                    {/* Physical sub-cols */}
                                    <th className="bg-blue-50 p-2 border border-slate-300 text-xs text-blue-700">2024-25 तक</th>
                                    <th className="bg-blue-50 p-2 border border-slate-300 text-xs text-blue-700">लक्ष्य 2025-26</th>
                                    {activeActivity.hasSize && <th className="bg-blue-50 p-2 border border-slate-300 text-xs text-blue-700">लक्ष्य आकार</th>}
                                    <th className="bg-blue-50 p-2 border border-slate-300 text-xs text-amber-700 border-l-4 border-l-[#f39c12]">← विगत माह</th>
                                    <th className="bg-blue-50 p-2 border border-slate-300 text-xs text-green-700 border-l-4 border-l-[#1e8449] bg-green-50">★ इस माह</th>
                                    <th className="bg-blue-50 p-2 border border-slate-300 text-xs text-blue-700 font-bold">योग</th>

                                    {/* Financial sub-cols */}
                                    <th className="bg-green-50 p-2 border border-slate-300 text-xs text-green-800">24-25 तक SARRA</th>
                                    <th className="bg-green-50 p-2 border border-slate-300 text-xs text-green-800">दर</th>
                                    <th className="bg-green-50 p-2 border border-slate-300 text-xs text-green-800">लक्ष्य Dept Share</th>
                                    <th className="bg-green-50 p-2 border border-slate-300 text-xs text-green-800">लक्ष्य SARRA Share</th>
                                    <th className="bg-green-50 p-2 border border-slate-300 text-xs text-amber-700 border-l-4 border-l-[#f39c12]">← विगत माह SARRA</th>
                                    <th className="bg-green-50 p-2 border border-slate-300 text-xs text-green-700 border-l-4 border-l-[#1e8449] bg-green-100">★ इस माह SARRA</th>
                                    <th className="bg-green-50 p-2 border border-slate-300 text-xs text-green-800 font-bold">कुल SARRA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DISTRICTS.map((d, distIdx) => {
                                    const r = formData[activeActivity.code].districts[d.id];
                                    const cumPhys = (parseFloat(r.physicalProgressTillLastFY)||0) + (parseFloat(r.lastMonthPhysicalProgress)||0) + (parseFloat(r.thisMonthPhysicalProgress)||0);
                                    const totSarra = (parseFloat(r.sarraExpendTillLastFY)||0) + (parseFloat(r.lastMonthSarraExpend)||0) + (parseFloat(r.thisMonthSarraExpend)||0);
                                    
                                    const physDisabled = false; // Override: make all fields editable as requested
                                    
                                    const tabBase = distIdx * 4;

                                    return (
                                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-2 border border-slate-300 text-center text-slate-500 font-medium sticky left-0 bg-white z-10">{distIdx + 1}</td>
                                            <td className="p-2 border border-slate-300 font-bold text-slate-700 sticky left-12 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{d.hi}</td>
                                            
                                            {/* Physical */}
                                            <td className="p-1 border border-slate-300 bg-white">
                                                {physDisabled ? (
                                                    <div className="w-full h-8 flex items-center justify-center text-slate-400 bg-slate-100 text-xs font-semibold">N/A</div>
                                                ) : (
                                                    <input type="number" value={r.physicalProgressTillLastFY} onChange={e => handleCellChange(activeActivity.code, d.id, 'physicalProgressTillLastFY', e.target.value)} 
                                                        className="w-full h-8 px-2 text-center border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-blue-400 outline-none" />
                                                )}
                                            </td>
                                            <td className="p-1 border border-slate-300 bg-white">
                                                {physDisabled ? (
                                                    <div className="w-full h-8 flex items-center justify-center text-slate-400 bg-slate-100 text-xs font-semibold">N/A</div>
                                                ) : (
                                                    <input type="number" value={r.targetUnit} onChange={e => handleCellChange(activeActivity.code, d.id, 'targetUnit', e.target.value)} 
                                                        className="w-full h-8 px-2 text-center border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-blue-400 outline-none" />
                                                )}
                                            </td>
                                            {activeActivity.hasSize && (
                                            <td className="p-1 border border-slate-300 bg-white">
                                                {physDisabled ? (
                                                    <div className="w-full h-8 flex items-center justify-center text-slate-400 bg-slate-100 text-xs font-semibold">N/A</div>
                                                ) : (
                                                    <input type="number" value={r.targetSizeCubicMeter} onChange={e => handleCellChange(activeActivity.code, d.id, 'targetSizeCubicMeter', e.target.value)} 
                                                        className="w-full h-8 px-2 text-center border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-blue-400 outline-none" />
                                                )}
                                            </td>
                                            )}
                                            
                                            <td className="p-1 border border-slate-300 border-l-4 border-l-[#f39c12] bg-white">
                                                {physDisabled ? (
                                                    <div className="w-full h-8 flex items-center justify-center text-slate-400 bg-slate-100 text-xs font-semibold">N/A</div>
                                                ) : (
                                                    <input type="number" value={r.lastMonthPhysicalProgress} onChange={e => handleCellChange(activeActivity.code, d.id, 'lastMonthPhysicalProgress', e.target.value)} 
                                                        className="w-full h-8 px-2 text-right border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-[#f39c12] outline-none" 
                                                        tabIndex={tabBase + 1} />
                                                )}
                                            </td>
                                            <td className="p-1 border border-slate-300 border-l-4 border-l-[#1e8449] bg-green-50/30">
                                                {physDisabled ? (
                                                    <div className="w-full h-8 flex items-center justify-center text-slate-400 bg-slate-100 text-xs font-semibold">N/A</div>
                                                ) : (
                                                    <input type="number" value={r.thisMonthPhysicalProgress} onChange={e => handleCellChange(activeActivity.code, d.id, 'thisMonthPhysicalProgress', e.target.value)} 
                                                        className="w-full h-8 px-2 text-right font-bold text-[#1e8449] border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-[#1e8449] outline-none" 
                                                        tabIndex={tabBase + 2} />
                                                )}
                                            </td>
                                            <td className="p-2 border border-slate-300 bg-blue-50 font-bold text-blue-800 text-center">{physDisabled ? 'N/A' : cumPhys}</td>

                                            {/* Financial */}
                                            <td className="p-1 border border-slate-300 bg-white">
                                                <input type="number" step="0.01" value={r.sarraExpendTillLastFY} onChange={e => handleCellChange(activeActivity.code, d.id, 'sarraExpendTillLastFY', e.target.value)} 
                                                    className="w-full h-8 px-2 text-right border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-green-400 outline-none" />
                                            </td>
                                            <td className="p-1 border border-slate-300 bg-white">
                                                <input type="number" step="0.01" value={r.ratePerUnit} onChange={e => handleCellChange(activeActivity.code, d.id, 'ratePerUnit', e.target.value)} 
                                                    className="w-full h-8 px-2 text-right border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-green-400 outline-none" />
                                            </td>
                                            <td className="p-1 border border-slate-300 bg-white">
                                                <input type="number" step="0.01" value={r.targetDeptShareLakh} onChange={e => handleCellChange(activeActivity.code, d.id, 'targetDeptShareLakh', e.target.value)} 
                                                    className="w-full h-8 px-2 text-right border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-green-400 outline-none" />
                                            </td>
                                            <td className="p-1 border border-slate-300 bg-white">
                                                <input type="number" step="0.01" value={r.targetSarraShareLakh} onChange={e => handleCellChange(activeActivity.code, d.id, 'targetSarraShareLakh', e.target.value)} 
                                                    className="w-full h-8 px-2 text-right border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-green-400 outline-none" />
                                            </td>
                                            
                                            <td className="p-1 border border-slate-300 border-l-4 border-l-[#f39c12] bg-white">
                                                <input type="number" step="0.01" value={r.lastMonthSarraExpend} onChange={e => handleCellChange(activeActivity.code, d.id, 'lastMonthSarraExpend', e.target.value)} 
                                                    className="w-full h-8 px-2 text-right border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-[#f39c12] outline-none" 
                                                    tabIndex={tabBase + 3} />
                                            </td>
                                            <td className="p-1 border border-slate-300 border-l-4 border-l-[#1e8449] bg-green-50/30">
                                                <input type="number" step="0.01" value={r.thisMonthSarraExpend} onChange={e => handleCellChange(activeActivity.code, d.id, 'thisMonthSarraExpend', e.target.value)} 
                                                    className="w-full h-8 px-2 text-right font-bold text-[#1e8449] border-none focus:bg-[#FFF9C4] focus:ring-2 focus:ring-[#1e8449] outline-none" 
                                                    tabIndex={tabBase + 4} 
                                                    onKeyDown={(e) => {
                                                        if(distIdx === DISTRICTS.length - 1 && e.key === 'Tab' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleNextActivity();
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className={`p-2 border border-slate-300 font-bold text-right ${totSarra > (parseFloat(r.targetSarraShareLakh)||0) && (parseFloat(r.targetSarraShareLakh)||0) > 0 ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-800'}`}>{totSarra.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#0a3d62] text-white font-bold">
                                    <td colSpan={2} className="p-3 text-right uppercase sticky left-0 z-10 bg-[#0a3d62]">योग (Total)</td>
                                    <td className="p-3 text-center border border-blue-800 text-slate-300">—</td>
                                    <td className="p-3 text-center border border-blue-800">{activityTotals.targetUnit}</td>
                                    {activeActivity.hasSize && <td className="p-3 text-center border border-blue-800">—</td>}
                                    <td className="p-3 text-right border border-blue-800 text-amber-300">{activityTotals.lastMonthPhysical}</td>
                                    <td className="p-3 text-right border border-blue-800 text-green-400">{activityTotals.thisMonthPhysical}</td>
                                    <td className="p-3 text-center border border-blue-800 text-white">{activityTotals.totalPhysical}</td>

                                    <td className="p-3 text-right border border-blue-800 text-slate-300">—</td>
                                    <td className="p-3 text-right border border-blue-800 text-slate-300">—</td>
                                    <td className="p-3 text-right border border-blue-800 text-slate-300">—</td>
                                    <td className="p-3 text-right border border-blue-800 text-slate-300">{activityTotals.targetSarraLakh.toFixed(2)}</td>
                                    <td className="p-3 text-right border border-blue-800 text-amber-300">{activityTotals.lastMonthSarra.toFixed(2)}</td>
                                    <td className="p-3 text-right border border-blue-800 text-green-400">{activityTotals.thisMonthSarra.toFixed(2)}</td>
                                    <td className="p-3 text-right border border-blue-800 text-white">{activityTotals.totalSarra.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
             </div>
          )}
      </div>
    </div>
  );
}
