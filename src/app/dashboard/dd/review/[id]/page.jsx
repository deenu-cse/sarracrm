"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { get, patch } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, Download } from "lucide-react";
import { useUI } from "@/contexts/UIContext";

const formatDateTime = (val) => {
  try { return val ? format(new Date(val), "dd MMM yyyy, hh:mm a") : "—"; } catch { return "—"; }
};
const formatBudget = (val) => (Number.isFinite(Number(val)) ? `₹${Number(val).toFixed(2)} Lakh` : "—");
const sumBy = (arr, key) => (Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b?.[key] || 0), 0) : 0);
const formatDMS = (dms) => (dms && typeof dms === "object" ? `${dms.dd ?? 0}°${dms.mm ?? 0}'${dms.ss ?? 0}"` : "—");
const toTextList = (value) => {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.replace(/\n/g, ", ");
  return String(value);
};

const DataTable = ({ columns, rows }) => (
  <div className="overflow-x-auto border border-slate-200 rounded-lg">
    <table className="min-w-full text-sm">
      <thead className="bg-[#0a3d62] text-white">
        <tr>{columns.map((col) => <th key={col} className="px-3 py-2 text-left">{col}</th>)}</tr>
      </thead>
      <tbody>
        {(rows || []).length === 0 && <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-slate-500">No data available for this section</td></tr>}
        {(rows || []).map((row, idx) => (
          <tr key={idx} className={idx % 2 ? "bg-slate-50" : "bg-white"}>
            {row.map((cell, i) => <td key={i} className="px-3 py-2 align-top">{cell ?? "—"}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function DDFormReviewPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");
  const { addToast } = useUI();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSections, setOpenSections] = useState([1]);
  const [rejectReason, setRejectReason] = useState("");
  const [imageModal, setImageModal] = useState("");

  const fetchForm = async () => {
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
      
      let data = null;
      if (queryType) {
        data = await fetchByType(queryType);
      } else {
        // Only fallback if no queryType provided
        data = await fetchByType("SPRINGSHED");
        if (!data) data = await fetchByType("STREAMSHED");
        if (!data) data = await fetchByType("GROUNDWATER");
      }
      
      if (!data) throw new Error("Unable to load this form");
      setForm(data);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForm(); }, [id, queryType]);

  useEffect(() => {
    const markUnderReview = async () => {
      if (!form || form?.status !== "SUBMITTED") return;
      const base = form?.formType === "STREAMSHED" ? "/dpr/streamshed" : form?.formType === "GROUNDWATER" ? "/dpr/groundwater" : "/dpr/springshed";
      await patch(`${base}/${id}/status`, { status: "UNDER_REVIEW" });
    };
    markUnderReview();
  }, [form, id]);

  const approve = async () => {
    if (!form) return;
    const base = form?.formType === "STREAMSHED" ? "/dpr/streamshed" : form?.formType === "GROUNDWATER" ? "/dpr/groundwater" : "/dpr/springshed";
    const res = await patch(`${base}/${id}/approve`);
    if (res?.success) {
      addToast("Form approved successfully", "success");
      router.push("/dashboard/dd/review");
    } else {
      addToast(res?.message || "Approve failed", "error");
    }
  };

  const reject = async () => {
    if (!form) return;
    if (!rejectReason.trim()) {
      addToast("Please enter rejection reason", "error");
      return;
    }
    const base = form?.formType === "STREAMSHED" ? "/dpr/streamshed" : form?.formType === "GROUNDWATER" ? "/dpr/groundwater" : "/dpr/springshed";
    const res = await patch(`${base}/${id}/reject`, { rejectionReason: rejectReason.trim() });
    if (res?.success) {
      addToast("Form rejected", "success");
      router.push("/dashboard/dd/review");
    } else {
      addToast(res?.message || "Reject failed", "error");
    }
  };

  const isSpring = form?.formType === "SPRINGSHED";
  const isGroundwater = form?.formType === "GROUNDWATER";
  const sections = useMemo(() => {
    if (!form) return [];
    const s1 = form?.section1_deptDetails || {};
    const common = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <p><b>Department:</b> {s1.department || "—"}</p><p><b>District:</b> {s1.district || "—"}</p>
        <p><b>Block:</b> {s1.block || "—"}</p><p><b>Nodal Officer:</b> {s1.nodalOfficer || "—"}</p>
        <p><b>Contact:</b> {s1.contactNo || s1.contact || "—"}</p><p><b>Email:</b> {s1.email || "—"}</p>
        <p className="md:col-span-2"><b>Address:</b> {s1.address || s1.officeAddress || "—"}</p>
      </div>
    );
    if (isSpring) {
      const s2 = form?.section2_springIdentification || {};
      const s3 = form?.section3_springDescription || {};
      const s4 = form?.section4_photographs || {};
      const s5 = form?.section5_hydroGeological || {};
      const s6 = form?.section6_physicalCharacteristics || {};
      const s7 = form?.section7_otherInformation || {};
      const s8 = form?.section8_rechargeArea || {};
      const s9 = form?.section9_communityInitiatives || {};
      const s10 = form?.section10_budgetAndPlan || {};
      return [
        { n: 1, t: "Department Details", c: common },
        { n: 2, t: "Spring Identification", c: <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <p><b>District:</b> {s2.springDistrict || s2.district || "—"}</p><p><b>Block:</b> {s2.springBlock || s2.block || "—"}</p><p><b>GP:</b> {s2.springGP || s2.gp || "—"}</p><p><b>Revenue Village:</b> {s2.revenuVillage || s2.revenueVillage || "—"}</p><p><b>Town:</b> {s2.town || "—"}</p><p><b>Ward:</b> {s2.wardNo || "—"}</p>
          </div>
          <DataTable columns={["#", "Spring Name", "Revenue Village", "Hamlet/Tok", "Latitude", "Longitude", "Altitude", "Spring Code"]} rows={(s2.springs || []).map((r, i) => [i + 1, r.name || r.springName, r.revenueVillage, r.hamletTok, formatDMS(r.latitude), formatDMS(r.longitude), r.altitude, r.springCode])} />
        </> },
        { n: 3, t: "Spring Description", c: <>
          <DataTable columns={["Spring Name", "Spring Type", "Nature", "Newly Emerged", "Muddy Water", "Cleanliness"]} rows={(s3.table31 || []).map((r) => [r.springName, r.springType, r.springNature || r.nature, r.newlyEmerged ? "✅ Yes" : "❌ No", (r.muddyWaterInRain ?? r.muddyWater) ? "✅ Yes" : "❌ No", r.cleanliness])} />
          <div className="mt-4" />
          <DataTable columns={["Spring Name", "Ownership", "Chamber", "Permanent Structure", "Pipe Supply", "Scheme Type", "Population"]} rows={(s3.table32 || []).map((r) => [r.springName, r.ownership, (r.chamberTank ?? r.chamber) ? "✅ Yes" : "❌ No", r.permanentStructure ? "✅ Yes" : "❌ No", (r.pipeWaterSupply ?? r.pipeSupply) ? "✅ Yes" : "❌ No", r.schemeType, r.populationBenefited])} />
        </> },
        { n: 4, t: "Photographs", c: <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[
          ["Close-up", s4?.closeUpPhoto?.url], ["Wide Angle", s4?.wideAnglePhoto?.url], ["Selfie", s4?.selfieWithSpring?.url]
        ].map(([label, url]) => <div key={label} className="border border-slate-200 rounded p-2"><p className="text-xs font-semibold mb-2">{label}</p>{url ? <img src={url} className="h-36 w-full object-cover rounded cursor-pointer" onClick={() => setImageModal(url)} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="h-36 bg-slate-100 rounded grid place-content-center text-xs">No photo uploaded</div>}</div>)}</div> },
        { n: 5, t: "Hydro-Geological", c: <DataTable columns={["Spring Name", "Typology", "Rock Type", "Aquifer", "Topographical Feature", "Settlement Near", "Accessibility"]} rows={(s5.table51 || []).map((r) => [r.springName, r.typology, r.rockType, r.aquiferType || r.aquifer, r.topographicalFeature, (r.settlementNearSpring ?? r.settlementNear) ? "✅ Yes" : "❌ No", r.accessibility])} /> },
        { n: 6, t: "Physical Characteristics", c: <>
          <DataTable columns={["Spring Name", "Discharge measurable", "LPM", "Variability", "Peak Months", "Lean Months"]} rows={(s6.table61 || []).map((r) => [r.springName, (r.dischargeMessurable ?? r.dischargeMeasurable) ? "✅ Yes" : "❌ No", r.springDischargeLPM || r.dischargeLpm, r.seasonalVariability || r.variability, toTextList(r.peakMonths), toTextList(r.leanMonths)])} />
          <div className="mt-4" />
          <DataTable columns={["Spring Name", "Trend", "Water Colour", "Smell", "Taste"]} rows={(s6.table62 || []).map((r) => [r.springName, r.dischargeTrend || r.trend, r.waterColour, r.smellOdour || r.smell, r.taste])} />
        </> },
        { n: 7, t: "Other Information", c: <>
          <DataTable columns={["Spring Name", "Land use", "Threat", "Degree", "Stressor", "Water usage"]} rows={(s7.table71 || []).map((r) => [r.springName, r.dominantLandUse || r.landUse, (r.resourceThreat ?? r.threat) ? "✅ Yes" : "❌ No", r.degreeOfThreat || r.degree, r.majorStressor || r.stressor, toTextList(r.waterUsage)])} />
          <div className="mt-4" />
          <DataTable columns={["Spring Name", "Stressor Type", "Categories"]} rows={(s7.table72 || []).map((r) => [r.springName, r.stressorType, [r.naturalStressors?.length > 0 && `Natural: ${toTextList(r.naturalStressors)}`, r.anthropogenicStressors?.length > 0 && `Anthropic: ${toTextList(r.anthropogenicStressors)}`, r.bothStressors?.length > 0 && `Both: ${toTextList(r.bothStressors)}`].filter(Boolean).join(" | ") || ([r.natural && "Natural", r.anthropogenic && "Anthropogenic", r.both && "Both"].filter(Boolean).join(", "))])} />
          <div className="mt-4" />
          <DataTable columns={["Spring Name", "Households", "Population", "Livestock", "Dependency", "Other source"]} rows={(s7.table73 || []).map((r) => [r.springName, r.dependentHouseholds, r.dependentPopulation, r.dependentLivestock, r.dependencyLevel || r.dependencyPercentage, r.otherWaterSource || r.otherSource])} />
        </> },
        { n: 8, t: "Recharge Area", c: <>
          <DataTable columns={["Spring Name", "Demarcated?", "Total Ha", "Forest Ha", "Revenue Ha", "Private Ha"]} rows={(s8.table81 || []).map((r) => [r.springName || r.name, (r.rechargeAreaDemarcated ?? r.demarcated) ? "✅ Yes" : "❌ No", r.totalRechargeAreaHa, r.forestLandHa || r.forestLandAreaHa, r.revenueLandHa || r.revenueLandAreaHa, r.privateLandHa || r.privateLandAreaHa])} />
          {s8?.kmlFile?.url && <a href={s8.kmlFile.url} target="_blank" className="mt-3 inline-flex text-sm items-center gap-2 text-[#0a3d62] hover:underline"><Download className="w-4 h-4" /> Download KML File</a>}
        </> },
        { n: 9, t: "Community Initiatives", c: <DataTable columns={["Spring Name", "Prev. Initiatives", "Samiti Exists", "Interested?", "For Monitoring"]} rows={(s9.table91 || []).map((r) => [r.springName, r.previousCommunityInitiatives ? "✅ Yes" : "❌ No", r.dharaNaulaSamitiExists ? "✅ Yes" : "❌ No", r.samitiInterestedInImplementation ? "✅ Yes" : "❌ No", r.samitiForMonitoring ? "✅ Yes" : "❌ No"])} /> },
        { n: 10, t: "Budget & Plan", c: <>
          <DataTable columns={["DPR Prep", "Interventions", "M&E", "Total"]} rows={[[s10?.table101?.dprPreparationBudgetLakh || s10?.table101?.dprPreparationCostLakh, s10?.table101?.totalInterventionsCostLakh || s10?.table101?.interventionsCostLakh, s10?.table101?.monitoringEvaluationBudgetLakh || s10?.table101?.monitoringCostLakh, s10?.table101?.totalBudgetLakh]]} />
          <div className="mt-4" />
          <DataTable columns={["#", "Activity", "Unit", "Total", "Amount"]} rows={(s10.table102 || []).map((r, i) => [i + 1, r.activityLabel || r.activity, r.unit, r.totalPhysicalTarget || r.total, r.financialAmountLakh])} />
          <div className="mt-4" />
          <DataTable columns={["PIA Fund", "Other", "SARRA", "Grand Total"]} rows={[[s10?.table103?.fundFromPIADeptLakh || s10?.table103?.piaFundLakh, s10?.table103?.fundFromOtherSourcesLakh || s10?.table103?.otherSourcesLakh, s10?.table103?.fundFromSARRAConvergenceLakh || s10?.table103?.sarraConvergenceLakh, s10?.table103?.grandTotalLakh]]} />
        </> },
      ];
    }
    if (isGroundwater) {
      const s2 = form?.section2_aquiferIdentification || {};
      const s3 = form?.section3_photographs || {};
      const s4 = form?.section4_riskAssessment || {};
      const s5 = form?.section5_budgetAndPlan || {};
      return [
        { n: 1, t: "Department Details", c: common },
        { n: 2, t: "Aquifer Identification", c: <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
            <p><b>Aquifer Name:</b> {s2.aquiferName || "—"}</p><p><b>Recharge Site:</b> {s2.aquiferRechargeSiteName || "—"}</p><p><b>District:</b> {s2.district || "—"}</p><p><b>Block:</b> {s2.blockTown || "—"}</p><p><b>Sub-watershed:</b> {s2.subWatershedName || "—"}</p><p><b>Micro-watershed:</b> {s2.microWatershedName || "—"} ({s2.microWatershedCode || "—"})</p><p><b>Villages:</b> {s2.villages || "—"}</p><p><b>No. of Habitations:</b> {s2.noOfVillagesHabitation || 0}</p>
          </div>
          <DataTable columns={["#", "ARS Detail", "Name", "Latitude", "Longitude", "Altitude", "Recharge Ha", "Ownership", "Type"]} rows={(s2.arsDetails || []).map((r, i) => [i + 1, r.arsDetail, r.name, formatDMS(r.latitude), formatDMS(r.longitude), r.altitudeMasl, r.approxRechargeAreaHa, r.landOwnership, r.landTypeDesignation])} />
          <div className="mt-4" />
          <h4 className="font-semibold text-sm mb-2 text-slate-700">Hydrological Details</h4>
          <DataTable columns={["ARS Detail", "Name", "Pre-Monsoon (m)", "Post-Monsoon (m)", "10 Yrs Ago (m)", "Trend"]} rows={(s2.hydrologicalDetails || []).map((r) => {
            const current = Number(r.depthToWaterTablePostMonsoon) || 0;
            const past = Number(r.depthToWaterTable10YrsAgo) || 0;
            const trend = current === past ? "—" : current > past ? <span className="text-red-600 font-bold">🔴 Declining ({current - past}m deeper)</span> : <span className="text-green-600 font-bold">🟢 Rising ({past - current}m shallower)</span>;
            return [r.arsDetail, r.name, r.depthToWaterTablePreMonsoon, r.depthToWaterTablePostMonsoon, r.depthToWaterTable10YrsAgo, trend];
          })} />
          <div className="mt-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><b>Water Source for Recharge:</b> {s2.sourceOfWaterForRecharge === "Other" ? s2.sourceOfWaterOther : s2.sourceOfWaterForRecharge || "—"}</p>
            <p><b>Availability Period:</b> {s2.avgAvailabilityPeriodMonths || 0} months</p>
            <p><b>Groundwater Status:</b> <span className={`px-2 py-1 rounded font-semibold text-xs ${s2.groundwaterAvailabilityStatus === 'Safe' ? 'bg-green-100 text-green-700' : s2.groundwaterAvailabilityStatus === 'Critical' ? 'bg-orange-100 text-orange-700' : s2.groundwaterAvailabilityStatus === 'Over-exploited' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{s2.groundwaterAvailabilityStatus || "—"}</span></p>
            <p><b>Primary Uses:</b> {toTextList(s2.primaryGroundwaterUses)} {s2.primaryGroundwaterUses?.includes('Other') ? `(${s2.primaryGroundwaterUsesOther})` : ""}</p>
          </div>
        </> },
        { n: 3, t: "Photographs", c: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[
          ["Recharge Site", s3?.rechargeSitePhoto?.url], ["Interventions Site", s3?.interventionSitePhoto?.url]
        ].map(([label, url]) => <div key={label} className="border border-slate-200 rounded p-2"><p className="text-xs font-semibold mb-2">{label}</p>{url ? <img src={url} className="h-40 w-full object-cover rounded cursor-pointer" onClick={() => setImageModal(url)} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="h-40 bg-slate-100 rounded grid place-content-center text-xs">No photo uploaded</div>}</div>)}</div> },
        { n: 4, t: "Risk Assessment", c: <div className="text-sm space-y-4">
          <div><p className="font-semibold text-slate-700 mb-1">Potential Risks:</p><blockquote className="border-l-4 border-rose-500 bg-rose-50 p-3 rounded text-rose-900">{s4.potentialRisks || "—"}</blockquote></div>
          <div><p className="font-semibold text-slate-700 mb-1">Vulnerability Level:</p><span className={`px-3 py-1 rounded-full text-sm font-bold border ${s4.vulnerabilityLevel === 'High' ? 'bg-red-50 text-red-700 border-red-200' : s4.vulnerabilityLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{s4.vulnerabilityLevel || "—"}</span></div>
        </div> },
        { n: 5, t: "Budget & Plan", c: <>
          <DataTable columns={["DPR Prep", "Interventions", "M&E", "Total"]} rows={[[s5?.table51?.dprPreparationBudgetLakh, s5?.table51?.totalInterventionsCostLakh, s5?.table51?.monitoringEvaluationBudgetLakh, s5?.table51?.totalBudgetLakh]]} />
          <div className="mt-4" />
          <DataTable columns={["#", "Activity", "Unit", "Total Target", "Amount"]} rows={(s5.table52 || []).filter((r) => !r?.isHeader).map((r, i) => [i + 1, r.activityLabel, r.unit, r.totalPhysicalTarget, r.financialAmountLakh])} />
          <div className="mt-4" />
          <DataTable columns={["Water Recharge %", "Compliance"]} rows={[[s5?.table83?.waterRechargePercentage, Number(s5?.table83?.waterRechargePercentage || 0) < 10 ? "Below 10% guideline" : "Compliant"]]} />
          <div className="mt-4" />
          <DataTable columns={["PIA Fund", "Other", "SARRA", "Grand Total"]} rows={[[s5?.table74?.fundFromPIADeptLakh, s5?.table74?.fundFromOtherSourcesLakh, s5?.table74?.fundFromSARRAConvergenceLakh, s5?.table74?.grandTotalLakh]]} />
        </> },
        { n: 6, t: "Analytics Overview", c: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Land Cover Composition</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(s2.arsDetails || []).map(r => ({
                  name: r.name || r.arsDetail,
                  agri: r.landTypeDesignation === "Agricultural" ? r.approxRechargeAreaHa : 0,
                  forest: r.landTypeDesignation === "Forest" ? r.approxRechargeAreaHa : 0,
                  other: (r.landTypeDesignation !== "Agricultural" && r.landTypeDesignation !== "Forest") ? r.approxRechargeAreaHa : 0
                }))}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar name="Agri" dataKey="agri" stackId="a" fill="#84cc16" />
                  <Bar name="Forest" dataKey="forest" stackId="a" fill="#22c55e" />
                  <Bar name="Other" dataKey="other" stackId="a" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Hydrological Trends</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(s2.hydrologicalDetails || []).map(r => ({
                  name: r.name || r.arsDetail,
                  pre: r.depthToWaterTablePreMonsoon,
                  post: r.depthToWaterTablePostMonsoon
                }))}>
                  <XAxis dataKey="name" hide />
                  <YAxis reversed />
                  <Tooltip />
                  <Bar name="Pre-Monsoon" dataKey="pre" fill="#0a3d62" />
                  <Bar name="Post-Monsoon" dataKey="post" fill="#e67e22" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div> },
      ];
    }
    const s2 = form?.section2_streamIdentification || {};
    const s3 = form?.section3_catchmentArea || {};
    const s4 = form?.section4_photographs || {};
    const s5 = form?.section5_rechargeAreas || {};
    const s6 = form?.section6_maps || {};
    const s7 = form?.section7_budgetAndPlan || {};
    const s8 = form?.section8_geoLocation || {};
    return [
      { n: 1, t: "Department Details", c: common },
      { n: 2, t: "Stream Identification", c: <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
          <p><b>Stream Name:</b> {s2.streamName || "—"}</p><p><b>Stream Order:</b> {s2.streamOrder || "—"}</p><p><b>District:</b> {s2.district || "—"}</p><p><b>Block/Town:</b> {s2.blockTown || "—"}</p><p><b>Length (Km):</b> {s2.lengthOfStreamKm || s2.lengthKm || 0}</p><p><b>Sub-watershed:</b> {s2.subWatershedName || s2.subWatershed || "—"}</p><p><b>Micro-watershed:</b> {s2.microWatershedName || s2.microWatershed || "—"}</p><p><b>No. of Villages:</b> {s2.noOfVillagesHabitation || s2.numberOfVillages || 0}</p>
        </div>
        <DataTable columns={["#", "Detail", "Name", "Order", "Start Point", "End Point", "Length", "Altitude"]} rows={(s2.table21 || []).map((r, i) => [i + 1, r.detail, r.name, r.streamOrder || r.order, `${formatDMS(r.startPoint?.latitude || r.startLat)} / ${formatDMS(r.startPoint?.longitude || r.startLong)}`, `${formatDMS(r.endPoint?.latitude || r.endLat)} / ${formatDMS(r.endPoint?.longitude || r.endLong)}`, r.lengthKm, r.altitudeMtr])} />
        <div className="mt-4" />
        <DataTable columns={["Detail", "Name", "Nature", "Seasonal Months", "Dec-Jan", "May-Jun", "Decrease 15yr %"]} rows={(s2.table22 || []).map((r) => [r.detail, r.name, r.streamNature || r.nature, toTextList(r.ifSeasonalMonths || r.seasonalMonths), r.dischargeDecJanLPM || r.decJanLpm, r.dischargeMayJuneLPM || r.mayJunLpm, r.decreaseInDischarge15YrsPercent || r.decrease15YrPercent])} />
        <div className="mt-4" />
        <DataTable columns={["Detail", "Name", "Water Use", "Schemes", "Population", "Irrigation Area"]} rows={(s2.table23 || []).map((r) => [r.detail, r.name, toTextList(r.waterUse), toTextList(r.noOfSchemes || r.schemes), r.benefitedPopulation, r.irrigationCommandAreaHa || r.irrigationAreaHa])} />
      </> },
      { n: 3, t: "Catchment Area", c: <>
        <DataTable columns={["Stream", "Catchment", "Land Cover %"]} rows={(s3.table31 || []).map((r) => [r.name || r.streamName, r.catchmentAreaHa, `Agr ${r?.landCoverPercent?.agriculture || 0}% | RF ${r?.landCoverPercent?.reserveForest || 0}% | VP ${r?.landCoverPercent?.vanPanchayat || 0}% | Pasture ${r?.landCoverPercent?.pastureNonForest || r?.landCoverPercent?.pasture || 0}% | Settlement ${r?.landCoverPercent?.settlement || 0}%`])} />
        {s3?.attachLandCoverMap?.url && <img src={s3.attachLandCoverMap.url} alt="Land Cover" className="mt-4 h-44 rounded cursor-pointer" onClick={() => setImageModal(s3.attachLandCoverMap.url)} />}
      </> },
      { n: 4, t: "Photographs", c: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[
        ["Main Stream", s4?.mainStreamPhoto?.url], ["Tributaries Confluence", s4?.tributariesConfluencePhoto?.url]
      ].map(([label, url]) => <div key={label} className="border border-slate-200 rounded p-2"><p className="text-xs font-semibold mb-2">{label}</p>{url ? <img src={url} className="h-40 w-full object-cover rounded cursor-pointer" onClick={() => setImageModal(url)} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="h-40 bg-slate-100 rounded grid place-content-center text-xs">No photo uploaded</div>}</div>)}</div> },
      { n: 5, t: "Recharge Areas", c: <DataTable columns={["Detail", "Name", "Demarcated?", "Total Ha", "Forest Ha", "Revenue Ha", "Private Ha"]} rows={(s5.table51 || []).map((r) => [r.detail, r.name, (r.rechargeAreaDemarcated ?? r.demarcated) ? "✅ Yes" : "❌ No", r.totalRechargeAreaHa, r.forestLandHa || r.forestLandAreaHa, r.revenueLandHa || r.revenueLandAreaHa, r.privateLandHa || r.privateLandAreaHa])} /> },
      { n: 6, t: "Maps", c: <div className="text-sm space-y-3"><blockquote className="border-l-4 border-[#0a3d62] bg-slate-50 p-3 rounded">{s6.mapDescription || "—"}</blockquote>{s6?.geoCoordinatesFile?.url && <a href={s6.geoCoordinatesFile.url} target="_blank" className="inline-flex items-center gap-2 text-[#0a3d62] hover:underline"><Download className="w-4 h-4" /> Download geo-coordinates file</a>}</div> },
      { n: 7, t: "Budget & Plan", c: <>
        <DataTable columns={["DPR Prep", "Interventions", "M&E", "Total"]} rows={[[s7?.table71?.dprPreparationBudgetLakh || s7?.table71?.dprPreparationCostLakh, s7?.table71?.totalInterventionsCostLakh || s7?.table71?.interventionsCostLakh, s7?.table71?.monitoringEvaluationBudgetLakh || s7?.table71?.monitoringCostLakh, s7?.table71?.totalBudgetLakh]]} />
        <div className="mt-4" />
        <DataTable columns={["#", "Activity", "Unit", "Total", "Amount"]} rows={(s7.table72 || []).filter((r) => !r?.isHeader).map((r, i) => [i + 1, r.activityLabel || r.activity, r.unit, r.totalPhysicalTarget || r.total, r.financialAmountLakh])} />
        <div className="mt-4" />
        <DataTable columns={["Water Recharge %", "Compliance"]} rows={[[s7?.table73?.waterRechargePercentage, Number(s7?.table73?.waterRechargePercentage || 0) < 10 ? "Below 10% guideline" : "Compliant"]]} />
        <div className="mt-4" />
        <DataTable columns={["PIA Fund", "Other", "SARRA", "Grand Total"]} rows={[[s7?.table74?.fundFromPIADeptLakh || s7?.table74?.piaFundLakh, s7?.table74?.fundFromOtherSourcesLakh || s7?.table74?.otherSourcesLakh, s7?.table74?.fundFromSARRAConvergenceLakh || s7?.table74?.sarraConvergenceLakh, s7?.table74?.grandTotalLakh]]} />
      </> },
      { n: 8, t: "Geo Location", c: <div className="text-sm space-y-3"><blockquote className="border-l-4 border-[#0a3d62] bg-slate-50 p-3 rounded">{s8.geoDescription || "—"}</blockquote>{s8?.geoFile?.url && <a href={s8.geoFile.url} target="_blank" className="inline-flex items-center gap-2 text-[#0a3d62] hover:underline"><Download className="w-4 h-4" /> Download geo file</a>}</div> },
    ];
  }, [form, isSpring, isGroundwater]);

  const toggle = (n) => setOpenSections((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  if (loading) return <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded" />)}</div>;
  if (error || !form) return <div className="p-6"><div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4">{error || "Unable to load form"} <button onClick={fetchForm} className="underline ml-2">Retry</button></div></div>;

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-start">
            <div>
              <button onClick={() => router.push("/dashboard/dd/review")} className="inline-flex items-center text-sm text-[#0a3d62] mb-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back to review list</button>
              <h1 className="font-mono text-lg font-bold text-slate-800">{form?.applicationNo || "—"}</h1>
              <p className="text-sm text-slate-500">{form?.formType} | Submitted {formatDateTime(form?.submittedAt)}</p>
            </div>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{form?.status || "—"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3"><p className="text-xs text-slate-500 uppercase">Count</p><p className="text-2xl font-bold">{isGroundwater ? (form?.section2_aquiferIdentification?.arsDetails || []).length : isSpring ? (form?.section2_springIdentification?.springs || []).length : (form?.section2_streamIdentification?.table21 || []).length}</p></div>
            <div className="bg-white border border-slate-200 rounded-lg p-3"><p className="text-xs text-slate-500 uppercase">{isGroundwater ? "Total Area (Ha)" : "Population"}</p><p className="text-2xl font-bold">{isGroundwater ? sumBy(form?.section2_aquiferIdentification?.arsDetails || [], "approxRechargeAreaHa") : isSpring ? sumBy(form?.section3_springDescription?.table32 || [], "populationBenefited") : sumBy(form?.section2_streamIdentification?.table23 || [], "benefitedPopulation")}</p></div>
            <div className="bg-white border border-slate-200 rounded-lg p-3"><p className="text-xs text-slate-500 uppercase">{isGroundwater ? "Aquifer Type" : "Recharge (Ha)"}</p><p className="text-2xl font-bold">{isGroundwater ? form?.section2_aquiferIdentification?.groundwaterAvailabilityStatus || "—" : isSpring ? sumBy(form?.section8_rechargeArea?.table81 || [], "totalRechargeAreaHa") : sumBy(form?.section5_rechargeAreas?.table51 || [], "totalRechargeAreaHa")}</p></div>
            <div className="bg-white border border-slate-200 rounded-lg p-3"><p className="text-xs text-slate-500 uppercase">Budget</p><p className="text-2xl font-bold">{formatBudget(isGroundwater ? form?.section5_budgetAndPlan?.table51?.totalBudgetLakh : isSpring ? form?.section10_budgetAndPlan?.table101?.totalBudgetLakh : form?.section7_budgetAndPlan?.table71?.totalBudgetLakh)}</p></div>
          </div>

          {sections.map((s) => {
            const open = openSections.includes(s.n);
            return (
              <div key={s.n} className="bg-white rounded-xl border border-slate-200">
                <button className="w-full px-4 py-3 flex justify-between items-center" onClick={() => toggle(s.n)}>
                  <span className="font-semibold text-sm">{s.n}. {s.t}</span>
                  {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[4000px] p-4 pt-0" : "max-h-0"}`}>{s.c}</div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold mb-3 text-slate-800">Approval Panel</h3>
              <button onClick={approve} className="w-full mb-2 px-3 py-2 rounded bg-green-600 text-white text-sm inline-flex justify-center items-center gap-2"><CheckCircle className="w-4 h-4" /> Approve</button>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Reason for rejection" />
              <button onClick={reject} className="w-full mt-2 px-3 py-2 rounded bg-red-600 text-white text-sm inline-flex justify-center items-center gap-2"><XCircle className="w-4 h-4" /> Reject</button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold mb-2 text-slate-800">Revision Timeline</h3>
              {(form?.revisionHistory || []).length === 0 && <p className="text-sm text-slate-500">No revision history yet</p>}
              <div className="space-y-2">
                {(form?.revisionHistory || []).map((r, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium text-slate-700">{r?.status || "Updated"}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(r?.changedAt)} by {r?.changedBy?.name || "System"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {imageModal && (
        <div className="fixed inset-0 bg-black/70 z-50 grid place-content-center p-4" onClick={() => setImageModal("")}>
          <img src={imageModal} alt="Preview" className="max-h-[85vh] rounded-lg" />
        </div>
      )}
    </div>
  );
}
