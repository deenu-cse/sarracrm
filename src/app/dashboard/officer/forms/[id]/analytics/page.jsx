"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { get } from "@/lib/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  LabelList,
} from "recharts";

const COLORS = ["#0a3d62", "#e67e22", "#1e8449", "#3b82f6", "#ef4444", "#14b8a6"];
const sumBy = (arr, key) => (Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b?.[key] || 0), 0) : 0);
const formatMoney = (val) => `₹${Number(val || 0).toFixed(2)} L`;
const truncate = (text, len = 25) => (String(text || "").length > len ? `${String(text).slice(0, len - 3)}...` : String(text || "—"));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
      {payload?.[0]?.payload?.fullName && <p className="text-slate-500 mt-1">{payload[0].payload.fullName}</p>}
    </div>
  );
};

const EmptyChart = ({ reason = "No data available" }) => (
  <div className="h-[260px] grid place-content-center text-slate-500 border border-dashed border-slate-300 rounded-lg text-center p-4">
    <p className="font-medium">{reason}</p>
    <p className="text-xs mt-1">Fill this section in the form to see analytics</p>
  </div>
);

export default function OfficerFormAnalytics({ params }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");
  const [form, setForm] = useState(null);
  const [districtStats, setDistrictStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const fetchByType = async (type) => {
        let endpoint;
        if (type === "STREAMSHED") endpoint = `/dpr/streamshed/${id}`;
        else if (type === "GROUNDWATER") endpoint = `/dpr/groundwater/${id}`;
        else endpoint = `/dpr/springshed/${id}`;
        
        const res = await get(endpoint);
        return res?.success ? { ...res.data, formType: res?.data?.formType || type } : null;
      };
      let d = null;
      if (queryType) {
        d = await fetchByType(queryType);
      } else {
        d = await fetchByType("SPRINGSHED");
        if (!d) d = await fetchByType("STREAMSHED");
        if (!d) d = await fetchByType("GROUNDWATER");
      }
      if (!d) throw new Error("Form not found");
      setForm(d);

      const districtRes = await get("/reports/district-stats");
      setDistrictStats(Array.isArray(districtRes?.data) ? districtRes.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, queryType]);

  const isSpring = form?.formType === "SPRINGSHED";
  const isGroundwater = form?.formType === "GROUNDWATER";

  const computed = useMemo(() => {
    if (!form) return null;

    if (isSpring) {
      const s1 = form?.section1_deptDetails || {};
      const s2 = form?.section2_springIdentification || {};
      const s3 = form?.section3_springDescription || {};
      const s4 = form?.section4_photographs || {};
      const s5 = form?.section5_hydroGeological || {};
      const s6 = form?.section6_physicalCharacteristics || {};
      const s7info = form?.section7_otherInformation || {};
      const s8 = form?.section8_rechargeArea || {};
      const s9 = form?.section9_communityInitiatives || {};
      const s10 = form?.section10_budgetAndPlan || {};

      const springCount = (s2?.springs || []).length;
      const totalPopulation = sumBy(s3?.table32 || [], "populationBenefited");
      const totalHouseholds = sumBy(s7info?.table73 || [], "dependentHouseholds");
      const totalLivestock = sumBy(s7info?.table73 || [], "dependentLivestock");
      const totalRechargeHa = sumBy(s8?.table81 || [], "totalRechargeAreaHa");
      const totalBudget = Number(s10?.table101?.totalBudgetLakh || 0);

      const budgetBreakdown = [
        { name: "DPR Preparation", value: Number(s10?.table101?.dprPreparationBudgetLakh || 0) },
        { name: "Interventions", value: Number(s10?.table101?.totalInterventionsCostLakh || 0) },
        { name: "M&E", value: Number(s10?.table101?.monitoringEvaluationBudgetLakh || 0) },
      ].filter((d) => d.value > 0);

      const fundDist = [
        { name: "PIA/Dept Fund", value: Number(s10?.table103?.fundFromPIADeptLakh || 0) },
        { name: "Other Sources", value: Number(s10?.table103?.fundFromOtherSourcesLakh || 0) },
        { name: "SARRA Convergence", value: Number(s10?.table103?.fundFromSARRAConvergenceLakh || 0) },
      ].filter((d) => d.value > 0);

      const recharge = (s8?.table81 || []).map((r) => ({
        name: r?.springName || "Spring",
        forest: Number(r?.forestLandHa || 0),
        revenue: Number(r?.revenueLandHa || 0),
        private: Number(r?.privateLandHa || 0),
        total: Number(r?.totalRechargeAreaHa || 0),
      }));

      const activities = (s10?.table102 || [])
        .filter((a) => Number(a?.financialAmountLakh || 0) > 0)
        .map((a) => ({
          name: a?.activityLabel || "Activity",
          fullName: a?.activityLabel || "Activity",
          amount: Number(a?.financialAmountLakh || 0),
          unit: a?.unit || "—",
          total: Number(a?.totalPhysicalTarget || 0),
        }))
        .sort((a, b) => b.amount - a.amount);

      const springDischarge = (s6?.table61 || []).map((r, i) => {
        const desc = (s3?.table31 || []).find((d) => d?.springName === r?.springName) || {};
        const quality = (s6?.table62 || []).find((q) => q?.springName === r?.springName) || {};
        return {
          name: r?.springName || `Spring ${i + 1}`,
          lpm: Number(r?.springDischargeLPM || 0),
          nature: desc?.springNature || "Unknown",
          type: desc?.springType || "—",
          trend: quality?.dischargeTrend || "No change",
          peak: (r?.peakMonths || []).join(", "),
          lean: (r?.leanMonths || []).join(", "),
        };
      });

      const natureDist = (s3?.table31 || []).reduce((acc, row) => {
        const key = row?.springNature || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const landUse = (s7info?.table71 || []).map((r, i) => ({
        name: r?.springName || `Spring ${i + 1}`,
        dominant: r?.dominantLandUse || "—",
        nearSpring: r?.landUseNearSpring || "—",
        threat: r?.resourceThreat ? "Yes" : "No",
        degree: r?.degreeOfThreat || "Low",
        degreeScore: r?.degreeOfThreat === "High" ? 3 : r?.degreeOfThreat === "Moderate" ? 2 : 1,
        stressor: r?.majorStressor || "None",
      }));

      const timeline = (form?.revisionHistory || []).map((r, i) => ({
        stage: r?.status || `Stage ${i + 1}`,
        day: i + 1,
        date: r?.changedAt ? format(new Date(r.changedAt), "dd MMM") : "—",
        note: r?.note || "",
      }));

      return {
        kpis: [
          { l: "Total Springs", v: springCount, s: "identified in this DPR" },
          { l: "Population Benefited", v: totalPopulation.toLocaleString("en-IN"), s: "people served" },
          { l: "Dependent Households", v: totalHouseholds, s: "households" },
          { l: "Livestock", v: totalLivestock, s: "livestock dependent" },
          { l: "Total Recharge Area", v: `${totalRechargeHa} Ha`, s: "demarcated" },
          { l: "Total Budget", v: `₹${totalBudget.toFixed(2)} L`, s: "project cost" },
        ],
        budgetBreakdown,
        fundDist,
        recharge,
        activities,
        springDischarge,
        natureDist,
        landUse,
        timeline,
        totalBudget,
      };
    }

    if (isGroundwater) {
      const s2 = form?.section2_aquiferIdentification || {};
      const s5 = form?.section5_budgetAndPlan || {};

      const arsCount = (s2?.arsDetails || []).length;
      const totalArea = sumBy(s2?.arsDetails || [], "approxRechargeAreaHa");
      const totalBudget = Number(s5?.table51?.totalBudgetLakh || 0);

      const budgetBreakdown = [
        { name: "DPR Preparation", value: Number(s5?.table51?.dprPreparationBudgetLakh || 0) },
        { name: "Interventions", value: Number(s5?.table51?.totalInterventionsCostLakh || 0) },
        { name: "M&E", value: Number(s5?.table51?.monitoringEvaluationBudgetLakh || 0) },
      ].filter((d) => d.value > 0);

      const fundDist = [
        { name: "PIA/Dept Fund", value: Number(s5?.table74?.fundFromPIADeptLakh || 0) },
        { name: "Other Sources", value: Number(s5?.table74?.fundFromOtherSourcesLakh || 0) },
        { name: "SARRA Convergence", value: Number(s5?.table74?.fundFromSARRAConvergenceLakh || 0) },
      ].filter((d) => d.value > 0);

      const activities = (s5?.table52 || [])
        .filter((a) => !a.isHeader && Number(a.financialAmountLakh || 0) > 0)
        .map((a) => ({
          name: truncate(a.activityLabel || "Activity", 25),
          fullName: a.activityLabel || "Activity",
          amount: Number(a.financialAmountLakh || 0),
          unit: a.unit || "—",
          total: Number(a.totalPhysicalTarget || 0),
        }))
        .sort((a, b) => b.amount - a.amount);

      const hydroAnalysis = (s2?.hydrologicalDetails || []).map((r) => ({
        name: r.arsDetail || "ARS",
        pre: Number(r.depthToWaterTablePreMonsoon || 0),
        post: Number(r.depthToWaterTablePostMonsoon || 0),
        past: Number(r.depthToWaterTable10YrsAgo || 0),
      }));

      const timeline = (form?.revisionHistory || []).map((r, i) => ({
        stage: r.status || `Stage ${i + 1}`,
        day: i + 1,
        date: r.changedAt ? format(new Date(r.changedAt), "dd MMM") : "—",
        note: r.note || "",
      }));

      const waterRechargeBudget = Number(s5?.table83?.waterRechargeBudgetLakh || 0);
      const totalProjectCost = Number(s5?.table83?.totalProjectCostLakh || totalBudget || 0);
      const rechargeCompliance = totalProjectCost > 0 ? (waterRechargeBudget / totalProjectCost) * 100 : 0;

      const recharge = (s2?.arsDetails || []).map((r) => ({
        name: r.name || r.arsDetail || "ARS",
        forest: r.landTypeDesignation === "Forest" ? Number(r.approxRechargeAreaHa || 0) : 0,
        revenue: r.landTypeDesignation === "Revenue" ? Number(r.approxRechargeAreaHa || 0) : 0,
        private: r.landOwnership === "Private" ? Number(r.approxRechargeAreaHa || 0) : 0,
        total: Number(r.approxRechargeAreaHa || 0),
      }));

      const landCoverStack = (s2?.arsDetails || []).map((r) => ({
        name: r.name || r.arsDetail || "ARS",
        agriculture: r.landTypeDesignation === "Agricultural" ? Number(r.approxRechargeAreaHa || 0) : 0,
        reserveForest: r.landTypeDesignation === "Forest" ? Number(r.approxRechargeAreaHa || 0) : 0,
        vanPanchayat: r.landOwnership === "Community" ? Number(r.approxRechargeAreaHa || 0) : 0,
        pastureNonForest: r.landTypeDesignation === "Grazing" ? Number(r.approxRechargeAreaHa || 0) : 0,
        settlement: r.landTypeDesignation === "Urban" ? Number(r.approxRechargeAreaHa || 0) : 0,
        catchment: Number(r.approxRechargeAreaHa || 0),
      }));

      return {
        kpis: [
          { l: "Total ARS", v: arsCount, s: "identified recharge sites" },
          { l: "Total Area (Ha)", v: totalArea.toFixed(2), s: "approx. recharge area" },
          { l: "GW Status", v: s2.groundwaterAvailabilityStatus || "—", s: "availability status" },
          { l: "Water Source", v: s2.sourceOfWaterForRecharge || "—", s: "source for recharge" },
          { l: "Total Budget", v: `₹${totalBudget.toFixed(2)} L`, s: "project cost" },
          { l: "Compliance", v: `${rechargeCompliance.toFixed(1)}%`, s: "water recharge share" },
        ],
        budgetBreakdown,
        fundDist,
        activities,
        hydroAnalysis,
        timeline,
        recharge,
        landCoverStack,
        totalBudget,
        rechargeCompliance,
        waterRechargeBudget,
        totalProjectCost,
      };
    }

    const s1 = form?.section1_deptDetails || {};
    const s2 = form?.section2_streamIdentification || {};
    const s3 = form?.section3_catchmentArea || {};
    const s5 = form?.section5_rechargeAreas || {};
    const s6maps = form?.section6_maps || {};
    const s7 = form?.section7_budgetAndPlan || {};
    const s8geo = form?.section8_geoLocation || {};

    const streamCount = (s2?.table21 || []).length;
    const totalStreamLength = sumBy(s2?.table21 || [], "lengthKm");
    const totalPopulation = sumBy(s2?.table23 || [], "benefitedPopulation");
    const totalCatchment = sumBy(s3?.table31 || [], "catchmentAreaHa");
    const totalRechargeHa = sumBy(s5?.table51 || [], "totalRechargeAreaHa");
    const totalBudget = Number(s7?.table71?.totalBudgetLakh || 0);

    const budgetBreakdown = [
      { name: "DPR Preparation", value: Number(s7?.table71?.dprPreparationBudgetLakh || 0) },
      { name: "Interventions", value: Number(s7?.table71?.totalInterventionsCostLakh || 0) },
      { name: "M&E", value: Number(s7?.table71?.monitoringEvaluationBudgetLakh || 0) },
    ].filter((d) => d.value > 0);

    const fundDist = [
      { name: "PIA/Dept Fund", value: Number(s7?.table74?.fundFromPIADeptLakh || 0) },
      { name: "Other Sources", value: Number(s7?.table74?.fundFromOtherSourcesLakh || 0) },
      { name: "SARRA Convergence", value: Number(s7?.table74?.fundFromSARRAConvergenceLakh || 0) },
    ].filter((d) => d.value > 0);

    const streamDischarge = (s2?.table22 || []).map((r) => ({
      name: r?.name || r?.detail || "Stream",
      dec: Number(r?.dischargeDecJanLPM || 0),
      may: Number(r?.dischargeMayJuneLPM || 0),
      decrease: Number(r?.decreaseInDischarge15YrsPercent || 0),
      nature: r?.streamNature || "Unknown",
      seasonal: r?.ifSeasonalMonths || "—",
    }));

    const streamNature = (s2?.table22 || []).reduce((acc, row) => {
      const key = row?.streamNature || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const landCoverStack = (s3?.table31 || []).map((r) => ({
      name: r?.name || r?.detail || "Stream",
      agriculture: Number(r?.landCoverPercent?.agriculture || 0),
      reserveForest: Number(r?.landCoverPercent?.reserveForest || 0),
      vanPanchayat: Number(r?.landCoverPercent?.vanPanchayat || 0),
      pastureNonForest: Number(r?.landCoverPercent?.pastureNonForest || 0),
      settlement: Number(r?.landCoverPercent?.settlement || 0),
      catchment: Number(r?.catchmentAreaHa || 0),
    }));

    const recharge = (s5?.table51 || []).map((r) => ({
      name: r?.name || r?.detail || "Stream",
      forest: Number(r?.forestLandHa || 0),
      revenue: Number(r?.revenueLandHa || 0),
      private: Number(r?.privateLandHa || 0),
      total: Number(r?.totalRechargeAreaHa || 0),
    }));

    const activities = (s7?.table72 || [])
      .filter((a) => !a?.isHeader && Number(a?.financialAmountLakh || 0) > 0)
      .map((a) => ({
        name: truncate(a?.activityLabel || "Activity", 25),
        fullName: a?.activityLabel || "Activity",
        amount: Number(a?.financialAmountLakh || 0),
        unit: a?.unit || "—",
        total: Number(a?.totalPhysicalTarget || 0),
      }))
      .sort((a, b) => b.amount - a.amount);

    const waterRechargeBudget = Number(s7?.table73?.waterRechargeBudgetLakh || 0);
    const totalProjectCost = Number(s7?.table73?.totalProjectCostLakh || s7?.table71?.totalBudgetLakh || 0);
    const rechargeCompliance = totalProjectCost > 0 ? Math.round((waterRechargeBudget / totalProjectCost) * 100 * 100) / 100 : 0;

    const timeline = (form?.revisionHistory || []).map((r, i) => ({
      stage: r?.status || `Stage ${i + 1}`,
      day: i + 1,
      date: r?.changedAt ? format(new Date(r.changedAt), "dd MMM") : "—",
      note: r?.note || "",
    }));

    return {
      kpis: [
        { l: "Streams/Tributaries", v: streamCount, s: "in this DPR" },
        { l: "Total Stream Length", v: `${totalStreamLength} Km`, s: "across tributaries" },
        { l: "Population Benefited", v: totalPopulation.toLocaleString("en-IN"), s: "people" },
        { l: "Catchment Area", v: `${totalCatchment} Ha`, s: "total catchment" },
        { l: "Total Recharge Area", v: `${totalRechargeHa} Ha`, s: "recharge zones" },
        { l: "Total Budget", v: `₹${totalBudget.toFixed(2)} L`, s: "project cost" },
      ],
      budgetBreakdown,
      fundDist,
      streamDischarge,
      streamNature,
      landCoverStack,
      recharge,
      activities,
      rechargeCompliance,
      waterRechargeBudget,
      totalProjectCost,
      timeline,
      totalBudget,
    };
  }, [form, isSpring, isGroundwater]);

  useEffect(() => {
    if (computed) {
      console.log("[SARRA Analytics] computed:", computed);
    }
  }, [computed]);

  const district = form?.submittedByDistrict || form?.section1_deptDetails?.district || "";
  const districtMatch = useMemo(
    () => (districtStats || []).find((d) => d?.district === district),
    [districtStats, district]
  );

  const thisBudget = Number(
    isSpring
      ? form?.section10_budgetAndPlan?.table101?.totalBudgetLakh || 0
      : isGroundwater
      ? form?.section5_budgetAndPlan?.table51?.totalBudgetLakh || 0
      : form?.section7_budgetAndPlan?.table71?.totalBudgetLakh || 0
  );
  const thisPopulation = Number(
    isSpring
      ? sumBy(form?.section3_springDescription?.table32 || [], "populationBenefited")
      : isGroundwater
      ? 0 // Groundwater doesn't strictly have population benefit field in same way
      : sumBy(form?.section2_streamIdentification?.table23 || [], "benefitedPopulation")
  );
  const thisRecharge = Number(
    isSpring
      ? sumBy(form?.section8_rechargeArea?.table81 || [], "totalRechargeAreaHa")
      : isGroundwater
      ? sumBy(form?.section2_aquiferIdentification?.arsDetails || [], "approxRechargeAreaHa")
      : sumBy(form?.section5_rechargeAreas?.table51 || [], "totalRechargeAreaHa")
  );

  if (loading) {
    return <div className="p-6 space-y-3">{[1, 2, 3, 4].map((k) => <div key={k} className="h-28 bg-slate-200 rounded animate-pulse" />)}</div>;
  }
  if (error || !form || !computed) {
    return (
      <div className="p-6">
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4">
          {error || "Unable to load analytics"} 
          <button onClick={fetchData} className="underline ml-2">Retry</button>
        </div>
      </div>
    );
  }

  const fundTotal = (computed?.fundDist || []).reduce((a, b) => a + Number(b?.value || 0), 0);
  const springNaturePie = Object.entries(computed?.natureDist || {}).map(([name, value]) => ({ name, value }));
  const streamNaturePie = Object.entries(computed?.streamNature || {}).map(([name, value]) => ({ name, value }));
  const rechargeGauge = [{ name: "Recharge %", value: Math.min(100, Number(computed?.rechargeCompliance || 0)) }];

  const districtBars = [
    { name: "This DPR", budget: thisBudget, population: thisPopulation, recharge: thisRecharge },
    {
      name: "District Total",
      budget: Number(districtMatch?.totalBudgetLakh || 0),
      population: Number(districtMatch?.totalPopulation || 0),
      recharge: Number(districtMatch?.totalRechargeAreaHa || 0),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => router.push(`/dashboard/officer/forms/${id}?type=${form?.formType}`)} className="text-sm px-3 py-2 rounded border">Back</button>
          <input type="date" className="text-sm border rounded px-3 py-2" />
          <input type="date" className="text-sm border rounded px-3 py-2" />
          <select className="text-sm border rounded px-3 py-2" value={form?.formType} readOnly><option>{form?.formType}</option></select>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/reports/export/pdf/${id}`} target="_blank" className="text-sm px-3 py-2 rounded bg-[#0a3d62] text-white">Export PDF</a>
      </div>

      <div className="mb-5">
        <p className="text-sm text-slate-500">Dashboard → Forms → {form?.applicationNo} → Analytics</p>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-slate-800">Analytics — {form?.applicationNo}</h1>
          <span className="text-sm text-slate-600">{form?.formType} | {district || "—"} | {form?.section1_deptDetails?.department || "—"} | {form?.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 mb-5">
        {(computed?.kpis || []).map((k) => (
          <div key={k.l} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-slate-800">{k.v}</p>
            <p className="text-xs uppercase text-slate-500 mt-1">{k.l}</p>
            <p className="text-xs text-slate-400">{k.s}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold mb-2">Budget Breakdown</h3>
          {(computed?.budgetBreakdown || []).length > 0 ? (
            <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={computed.budgetBreakdown} dataKey="value" nameKey="name" outerRadius={100} label>{computed.budgetBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer></div>
          ) : <EmptyChart reason="No budget breakdown data in this form" />}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold mb-2">Fund Source Distribution</h3>
          {(computed?.fundDist || []).length > 0 ? (
            <>
              <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={computed.fundDist} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} label>{computed.fundDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer></div>
              <p className="text-sm text-slate-600">Total: {formatMoney(fundTotal)}</p>
            </>
          ) : <EmptyChart reason="No fund source data in this form" />}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold mb-2">{isSpring ? "Spring Discharge Analysis" : isGroundwater ? "Hydrological Analysis (Depth to Water)" : "Stream Discharge Analysis"}</h3>
          {isSpring ? (
            (computed?.springDischarge || []).length > 0 ? (
              <>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computed.springDischarge} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="lpm" fill="#0a3d62" name="Discharge (LPM)">
                        <LabelList dataKey="lpm" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {(springNaturePie || []).length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={springNaturePie} dataKey="value" nameKey="name" outerRadius={70}>
                          {springNaturePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyChart reason="No spring nature data in this form" />}
              </>
            ) : <EmptyChart reason="No spring discharge data in this form" />
          ) : isGroundwater ? (
            (computed?.hydroAnalysis || []).length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computed.hydroAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis reversed label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="pre" fill="#0a3d62" name="Pre-Monsoon" />
                    <Bar dataKey="post" fill="#e67e22" name="Post-Monsoon" />
                    <Bar dataKey="past" fill="#1e8449" name="10 Years Ago" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart reason="No hydrological data in this form" />
          ) : (
            (computed?.streamDischarge || []).length > 0 ? (
              <>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computed.streamDischarge}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="dec" fill="#3b82f6" name="Dec-Jan LPM" />
                      <Bar dataKey="may" fill="#14b8a6" name="May-Jun LPM" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {(streamNaturePie || []).length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={streamNaturePie} dataKey="value" nameKey="name" outerRadius={70}>
                          {streamNaturePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyChart reason="No stream nature data in this form" />}
              </>
            ) : <EmptyChart reason="No stream discharge data in this form" />
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold mb-2">{isSpring ? "Land Use & Threat Analysis" : "Land Cover Composition"}</h3>
          {isSpring ? (
            (computed?.landUse || []).length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computed.landUse}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="degreeScore" fill="#e67e22" name="Threat Degree Index" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart reason="No land use data in this form" />
          ) : (
            (computed?.landCoverStack || []).length > 0 ? (
              <>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computed.landCoverStack}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="agriculture" stackId="lc" fill="#84cc16" />
                      <Bar dataKey="reserveForest" stackId="lc" fill="#22c55e" />
                      <Bar dataKey="vanPanchayat" stackId="lc" fill="#10b981" />
                      <Bar dataKey="pastureNonForest" stackId="lc" fill="#a3e635" />
                      <Bar dataKey="settlement" stackId="lc" fill="#a16207" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-slate-500 mb-2">Catchment area distribution by stream (in Hectares)</p>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={computed.landCoverStack.map((r) => ({ name: `${r.name} (${r.catchment} Ha)`, value: r.catchment }))}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label={({ name, value, percent }) => `${name}: ${value} Ha (${((percent || 0) * 100).toFixed(0)}%)`}
                        labelLine
                      >
                        {computed.landCoverStack.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(value) => value} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : <EmptyChart reason="No land cover data in this form" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold mb-2">Recharge Area Analysis</h3>
          {(computed?.recharge || []).length > 0 ? (
            <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={computed.recharge}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="forest" stackId="a" fill="#1e8449" name="Forest Land" /><Bar dataKey="revenue" stackId="a" fill="#e67e22" name="Revenue Land" /><Bar dataKey="private" stackId="a" fill="#ef4444" name="Private Land" /></BarChart></ResponsiveContainer></div>
          ) : <EmptyChart reason="No recharge area data in this form" />}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold mb-2">Activity Budget Distribution</h3>
          {(computed?.activities || []).length > 0 ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computed.activities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={180} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#0a3d62" name="Budget (Lakh)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart reason="No activity budget data in this form" />}
        </div>
      </div>

      {!isSpring && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
          <h3 className="font-semibold mb-2">Water Recharge Compliance Gauge</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={20} data={rechargeGauge} startAngle={180} endAngle={0}>
                <RadialBar minAngle={15} background clockWise dataKey="value" fill={Number(computed?.rechargeCompliance || 0) >= 10 ? "#1e8449" : "#ef4444"} />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-slate-700 text-center">{Number(computed?.rechargeCompliance || 0).toFixed(2)}% of total project cost</p>
          <p className="text-xs text-slate-500 text-center">Minimum required: 10% as per SARRA guidelines</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 bg-slate-50 rounded text-center">
              <p className="text-lg font-bold">₹{Number(computed?.waterRechargeBudget || 0).toFixed(2)} L</p>
              <p className="text-xs text-slate-500">Water Recharge Budget</p>
            </div>
            <div className="p-3 bg-slate-50 rounded text-center">
              <p className="text-lg font-bold">₹{Number(computed?.totalProjectCost || 0).toFixed(2)} L</p>
              <p className="text-xs text-slate-500">Total Project Cost</p>
            </div>
            <div className={`p-3 rounded text-center ${Number(computed?.rechargeCompliance || 0) >= 10 ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`text-lg font-bold ${Number(computed?.rechargeCompliance || 0) >= 10 ? "text-green-700" : "text-red-700"}`}>{Number(computed?.rechargeCompliance || 0).toFixed(2)}%</p>
              <p className="text-xs text-slate-500">{Number(computed?.rechargeCompliance || 0) >= 10 ? "✓ Compliant" : "✗ Below 10% minimum"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <h3 className="font-semibold mb-2">Timeline & Status History</h3>
        {(computed?.timeline || []).length > 0 ? (
          <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={computed.timeline}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stage" /><YAxis hide /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="day" stroke="#0a3d62" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
        ) : <EmptyChart reason="No status timeline data in this form" />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <h3 className="font-semibold mb-3">Physical Targets Table</h3>
        {(computed?.activities || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#0a3d62] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Activity</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-left">Total</th>
                  <th className="px-3 py-2 text-left">Budget (₹L)</th>
                  <th className="px-3 py-2 text-left">Budget %</th>
                </tr>
              </thead>
              <tbody>
                {(computed.activities || []).map((a, i) => (
                  <tr key={i} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                    <td className="px-3 py-2">{a.fullName || a.name}</td>
                    <td className="px-3 py-2">{a.unit || "—"}</td>
                    <td className="px-3 py-2">{a.total}</td>
                    <td className="px-3 py-2">{Number(a.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">{((Number(a.amount || 0) / ((computed.activities || []).reduce((x, y) => x + Number(y?.amount || 0), 0) || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyChart reason="No physical target activity data in this form" />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold mb-1">This DPR in Context of {district || "District"}</h3>
        <p className="text-sm text-slate-500 mb-4">How this form compares to the district's overall data</p>

        {districtMatch ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Budget", thisVal: thisBudget, totalVal: Number(districtMatch?.totalBudgetLakh || 0), suffix: " Lakh", symbol: "₹" },
                { label: "Population Benefited", thisVal: thisPopulation, totalVal: Number(districtMatch?.totalPopulation || 0), suffix: "", symbol: "" },
                { label: "Recharge Area", thisVal: thisRecharge, totalVal: Number(districtMatch?.totalRechargeAreaHa || 0), suffix: " Ha", symbol: "" },
              ].map((card) => {
                const share = card.totalVal > 0 ? Math.min(100, (card.thisVal / card.totalVal) * 100) : 0;
                return (
                  <div key={card.label} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-700 mb-2">{card.label}</p>
                    <p className="text-xs text-slate-600">This DPR: {card.symbol}{Number(card.thisVal || 0).toFixed(2)}{card.suffix}</p>
                    <p className="text-xs text-slate-600">District Total: {card.symbol}{Number(card.totalVal || 0).toFixed(2)}{card.suffix}</p>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0a3d62]" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Approved</th>
                    <th className="px-3 py-2 text-left">Pending</th>
                    <th className="px-3 py-2 text-left">Rejected</th>
                    <th className="px-3 py-2 text-left">Approval Rate%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2">{districtMatch?.district || "—"}</td>
                    <td className="px-3 py-2">{districtMatch?.approved ?? 0}</td>
                    <td className="px-3 py-2">{districtMatch?.pending ?? 0}</td>
                    <td className="px-3 py-2">{districtMatch?.rejected ?? 0}</td>
                    <td className="px-3 py-2">{Number(districtMatch?.approvalRate || 0).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="budget" fill="#0a3d62" name="Budget (Lakh)" />
                  <Bar dataKey="population" fill="#e67e22" name="Population" />
                  <Bar dataKey="recharge" fill="#1e8449" name="Recharge (Ha)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <EmptyChart reason="No district context data available for this district" />
        )}
      </div>
    </div>
  );
}
