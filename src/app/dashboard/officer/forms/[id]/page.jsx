"use client";
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { get } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown, ChevronUp, FileText, Download, Edit, ArrowLeft, BarChart2, CheckCircle, XCircle, Clock, Users, Droplets, MapPin, DollarSign,
  IndianRupee
} from "lucide-react";

const formatDateTime = (val) => {
  try {
    return val ? format(new Date(val), "dd MMM yyyy, hh:mm a") : "—";
  } catch {
    return "—";
  }
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
const statusStyle = {
  APPROVED: "bg-green-100 text-green-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  DRAFT: "bg-slate-100 text-slate-700",
};

const DetailRow = ({ label, value, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm font-medium text-slate-800 break-words">{value || "—"}</p>
  </div>
);

const DataTable = ({ columns, rows }) => (
  <div className="overflow-x-auto border border-slate-200 rounded-lg">
    <table className="min-w-full text-sm">
      <thead className="bg-[#0a3d62] text-white">
        <tr>{columns.map((col) => <th key={col} className="px-3 py-2 text-left">{col}</th>)}</tr>
      </thead>
      <tbody>
        {(rows || []).length === 0 && (
          <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-slate-500">No data available for this section</td></tr>
        )}
        {(rows || []).map((row, idx) => (
          <tr key={idx} className={idx % 2 ? "bg-slate-50" : "bg-white"}>
            {row.map((cell, i) => <td key={i} className="px-3 py-2 align-top">{cell ?? "—"}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function OfficerFormDetail({ params }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSections, setOpenSections] = useState([1]);
  const [imageModal, setImageModal] = useState("");

  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    const tryEndpoint = async (type) => {
      let endpoint;
      if (type === "STREAMSHED") endpoint = `/dpr/streamshed/${id}`;
      else if (type === "GROUNDWATER") endpoint = `/dpr/groundwater/${id}`;
      else endpoint = `/dpr/springshed/${id}`;
      
      const res = await get(endpoint);
      return res?.success ? { ...res.data, formType: res?.data?.formType || type } : null;
    };
    try {
      let data = null;
      if (queryType) {
        data = await tryEndpoint(queryType);
      } else {
        // Fallback only if queryType is missing
        data = await tryEndpoint("SPRINGSHED");
        if (!data) data = await tryEndpoint("STREAMSHED");
        if (!data) data = await tryEndpoint("GROUNDWATER");
      }
      
      if (!data) setError("Form not found or inaccessible");
      setForm(data);
    } catch (e) {
      setError(e?.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, queryType]);

  const isSpring = form?.formType === "SPRINGSHED";
  const isGroundwater = form?.formType === "GROUNDWATER";
  const canEdit = form?.status === "DRAFT" || form?.status === "REJECTED";

  const kpis = useMemo(() => {
    if (!form) return [];
    if (isSpring) {
      const springs = form?.section2_springIdentification?.springs || [];
      const population = sumBy(form?.section3_springDescription?.table32 || [], "populationBenefited");
      const recharge = sumBy(form?.section8_rechargeArea?.table81 || [], "totalRechargeAreaHa");
      const budget = Number(form?.section10_budgetAndPlan?.table101?.totalBudgetLakh || 0);
      return [
        { icon: <Droplets className="w-5 h-5 text-[#0a3d62]" />, label: "Springs Identified", value: springs.length, border: "border-l-blue-500" },
        { icon: <Users className="w-5 h-5 text-[#e67e22]" />, label: "Population Benefited", value: population, border: "border-l-amber-500" },
        { icon: <MapPin className="w-5 h-5 text-[#1e8449]" />, label: "Recharge Area (Ha)", value: recharge, border: "border-l-green-500" },
        { icon: <IndianRupee className="w-5 h-5 text-[#0a3d62]" />, label: "Total Budget (₹ Lakh)", value: budget.toFixed(2), border: "border-l-slate-500" },
      ];
    }
    if (isGroundwater) {
      const ars = form?.section2_aquiferIdentification?.arsDetails || [];
      const area = sumBy(ars, "approxRechargeAreaHa");
      const budget = Number(form?.section5_budgetAndPlan?.table51?.totalBudgetLakh || 0);
      const status = form?.section2_aquiferIdentification?.groundwaterAvailabilityStatus || "—";
      return [
        { icon: <Droplets className="w-5 h-5 text-[#0a3d62]" />, label: "ARS Identified", value: ars.length, border: "border-l-blue-500" },
        { icon: <MapPin className="w-5 h-5 text-[#e67e22]" />, label: "Total Area (Ha)", value: area.toFixed(2), border: "border-l-amber-500" },
        { icon: <BarChart2 className="w-5 h-5 text-[#1e8449]" />, label: "GW Status", value: status, border: "border-l-green-500" },
        { icon: <IndianRupee className="w-5 h-5 text-[#0a3d62]" />, label: "Total Budget (₹ Lakh)", value: budget.toFixed(2), border: "border-l-slate-500" },
      ];
    }
    const streams = form?.section2_streamIdentification?.table21 || [];
    const population = sumBy(form?.section2_streamIdentification?.table23 || [], "benefitedPopulation");
    const recharge = sumBy(form?.section5_rechargeAreas?.table51 || [], "totalRechargeAreaHa");
    const budget = Number(form?.section7_budgetAndPlan?.table71?.totalBudgetLakh || 0);
    return [
      { icon: <Droplets className="w-5 h-5 text-[#0a3d62]" />, label: "Streams/Tributaries", value: streams.length, border: "border-l-blue-500" },
      { icon: <Users className="w-5 h-5 text-[#e67e22]" />, label: "Population Benefited", value: population, border: "border-l-amber-500" },
      { icon: <MapPin className="w-5 h-5 text-[#1e8449]" />, label: "Recharge Area (Ha)", value: recharge, border: "border-l-green-500" },
      { icon: <IndianRupee className="w-5 h-5 text-[#0a3d62]" />, label: "Total Budget (₹ Lakh)", value: budget.toFixed(2), border: "border-l-slate-500" },
    ];
  }, [form, isSpring]);

  const sections = useMemo(() => {
    if (!form) return [];
    const s1 = form?.section1_deptDetails || {};
    const commonOne = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailRow label="Department" value={s1.department} />
        <DetailRow label="District" value={s1.district} />
        <DetailRow label="Block" value={s1.block} />
        <DetailRow label="Nodal Officer" value={s1.nodalOfficer} />
        <DetailRow label="Contact" value={s1.contactNo || s1.contact} />
        <DetailRow label="Email" value={s1.email} />
        <DetailRow label="Address" value={s1.address || s1.officeAddress} full />
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
        { n: 1, t: "Dept Details", c: commonOne },
        {
          n: 2, t: "Spring Identification", c: <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <DetailRow label="District" value={s2.springDistrict || s2.district} />
              <DetailRow label="Block" value={s2.springBlock || s2.block} />
              <DetailRow label="GP" value={s2.springGP || s2.gp} />
              <DetailRow label="Revenue Village" value={s2.revenuVillage || s2.revenueVillage} />
              <DetailRow label="Town" value={s2.town} />
              <DetailRow label="Ward No" value={s2.wardNo} />
              <DetailRow label="Survey Date" value={formatDateTime(s2.surveyDate)} />
            </div>
            <DataTable columns={["#", "Spring Name", "Revenue Village", "Hamlet/Tok", "Latitude", "Longitude", "Altitude", "Spring Code"]} rows={(s2.springs || []).map((r, i) => [i + 1, r.name || r.springName, r.revenueVillage, r.hamletTok, formatDMS(r.latitude), formatDMS(r.longitude), r.altitude, r.springCode])} />
          </>
        },
        {
          n: 3, t: "Spring Description", c: <>
            <DataTable columns={["Spring Name", "Spring Type", "Nature", "Newly Emerged", "Muddy Water", "Cleanliness"]} rows={(s3.table31 || []).map((r) => [r.springName, r.springType, r.springNature || r.nature, r.newlyEmerged ? "✅ Yes" : "❌ No", (r.muddyWaterInRain ?? r.muddyWater) ? "✅ Yes" : "❌ No", r.cleanliness])} />
            <div className="mt-4" />
            <DataTable columns={["Spring Name", "Ownership", "Chamber", "Permanent Structure", "Pipe Supply", "Scheme Type", "Population"]} rows={(s3.table32 || []).map((r) => [r.springName, r.ownership, (r.chamberTank ?? r.chamber) ? "✅ Yes" : "❌ No", r.permanentStructure ? "✅ Yes" : "❌ No", (r.pipeWaterSupply ?? r.pipeSupply) ? "✅ Yes" : "❌ No", r.schemeType, r.populationBenefited])} />
          </>
        },
        {
          n: 4, t: "Photographs", c: <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[
            ["Close-up", s4?.closeUpPhoto?.url], ["Wide Angle", s4?.wideAnglePhoto?.url], ["Selfie", s4?.selfieWithSpring?.url]
          ].map(([label, url]) => <div key={label} className="border border-slate-200 rounded-lg p-3"><p className="text-sm font-semibold mb-2">{label}</p>{url ? <img src={url} alt={label} className="h-44 w-full object-cover rounded cursor-pointer" onClick={() => setImageModal(url)} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="h-44 bg-slate-100 rounded grid place-content-center text-slate-500 text-sm">No photo uploaded</div>}</div>)}</div>
        },
        { n: 5, t: "Hydro-Geological", c: <DataTable columns={["Spring Name", "Typology", "Rock Type", "Aquifer", "Topographical Feature", "Settlement Near", "Accessibility"]} rows={(s5.table51 || []).map((r) => [r.springName, r.typology, r.rockType, r.aquiferType || r.aquifer, r.topographicalFeature, (r.settlementNearSpring ?? r.settlementNear) ? "✅ Yes" : "❌ No", r.accessibility])} /> },
        {
          n: 6, t: "Physical Characteristics", c: <>
            <DataTable columns={["Spring Name", "Discharge measurable", "LPM", "Variability", "Peak Months", "Lean Months"]} rows={(s6.table61 || []).map((r) => [r.springName, (r.dischargeMessurable ?? r.dischargeMeasurable) ? "✅ Yes" : "❌ No", r.springDischargeLPM || r.dischargeLpm, r.seasonalVariability || r.variability, toTextList(r.peakMonths), toTextList(r.leanMonths)])} />
            <div className="mt-4" />
            <DataTable columns={["Spring Name", "Trend", "Water Colour", "Smell", "Taste"]} rows={(s6.table62 || []).map((r) => [r.springName, r.dischargeTrend || r.trend, r.waterColour, r.smellOdour || r.smell, r.taste])} />
          </>
        },
        {
          n: 7, t: "Other Information", c: <>
            <DataTable columns={["Spring Name", "Land use", "Threat", "Degree", "Stressor", "Water usage"]} rows={(s7.table71 || []).map((r) => [r.springName, r.dominantLandUse || r.landUse, (r.resourceThreat ?? r.threat) ? "✅ Yes" : "❌ No", r.degreeOfThreat || r.degree, r.majorStressor || r.stressor, toTextList(r.waterUsage)])} />
            <div className="mt-4" />
            <DataTable columns={["Spring Name", "Stressor Type", "Categories"]} rows={(s7.table72 || []).map((r) => [r.springName, r.stressorType, [r.naturalStressors?.length > 0 && `Natural: ${toTextList(r.naturalStressors)}`, r.anthropogenicStressors?.length > 0 && `Anthropic: ${toTextList(r.anthropogenicStressors)}`, r.bothStressors?.length > 0 && `Both: ${toTextList(r.bothStressors)}`].filter(Boolean).join(" | ") || ([r.natural && "Natural", r.anthropogenic && "Anthropogenic", r.both && "Both"].filter(Boolean).join(", "))])} />
            <div className="mt-4" />
            <DataTable columns={["Spring Name", "Households", "Population", "Livestock", "Dependency", "Other source"]} rows={(s7.table73 || []).map((r) => [r.springName, r.dependentHouseholds, r.dependentPopulation, r.dependentLivestock, r.dependencyLevel || r.dependencyPercentage, r.otherWaterSource || r.otherSource])} />
          </>
        },
        {
          n: 8, t: "Recharge Area", c: <>
            <DataTable columns={["Spring Name", "Demarcated?", "Total Ha", "Forest Ha", "Revenue Ha", "Private Ha"]} rows={(s8.table81 || []).map((r) => [r.springName || r.name, (r.rechargeAreaDemarcated ?? r.demarcated) ? "✅ Yes" : "❌ No", r.totalRechargeAreaHa, r.forestLandHa || r.forestLandAreaHa, r.revenueLandHa || r.revenueLandAreaHa, r.privateLandHa || r.privateLandAreaHa])} />
            {s8?.kmlFile?.url && <a className="mt-4 inline-flex items-center gap-2 text-[#0a3d62] hover:underline" href={s8.kmlFile.url} target="_blank"><Download className="w-4 h-4" /> Download KML File</a>}
          </>
        },
        { n: 9, t: "Community Initiatives", c: <DataTable columns={["Spring Name", "Prev. Initiatives", "Samiti Exists", "Interested?", "For Monitoring"]} rows={(s9.table91 || []).map((r) => [r.springName, r.previousCommunityInitiatives ? "✅ Yes" : "❌ No", r.dharaNaulaSamitiExists ? "✅ Yes" : "❌ No", r.samitiInterestedInImplementation ? "✅ Yes" : "❌ No", r.samitiForMonitoring ? "✅ Yes" : "❌ No"])} /> },
        {
          n: 10, t: "Budget & Plan", c: <>
            <DataTable columns={["DPR Prep", "Interventions", "M&E", "Total"]} rows={[[s10?.table101?.dprPreparationBudgetLakh || s10?.table101?.dprPreparationCostLakh, s10?.table101?.totalInterventionsCostLakh || s10?.table101?.interventionsCostLakh, s10?.table101?.monitoringEvaluationBudgetLakh || s10?.table101?.monitoringCostLakh, s10?.table101?.totalBudgetLakh]]} />
            <div className="mt-4" />
            <DataTable columns={["#", "Activity", "Unit", "Total", "Amount (Lakh)"]} rows={(s10.table102 || []).map((r, i) => [i + 1, r.activityLabel || r.activity, r.unit, r.totalPhysicalTarget || r.total, r.financialAmountLakh])} />
            <div className="mt-4" />
            <DataTable columns={["PIA Fund", "Other", "SARRA", "Grand Total"]} rows={[[s10?.table103?.fundFromPIADeptLakh || s10?.table103?.piaFundLakh, s10?.table103?.fundFromOtherSourcesLakh || s10?.table103?.otherSourcesLakh, s10?.table103?.fundFromSARRAConvergenceLakh || s10?.table103?.sarraConvergenceLakh, s10?.table103?.grandTotalLakh]]} />
          </>
        },
      ];
    }
    if (isGroundwater) {
      const s2 = form?.section2_aquiferIdentification || {};
      const s3 = form?.section3_photographs || {};
      const s4 = form?.section4_riskAssessment || {};
      const s5 = form?.section5_budgetAndPlan || {};
      return [
        { n: 1, t: "Dept Details", c: commonOne },
        { n: 2, t: "Aquifer Identification", c: <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <DetailRow label="Aquifer Name" value={s2.aquiferName} />
            <DetailRow label="Recharge Site" value={s2.aquiferRechargeSiteName} />
            <DetailRow label="District" value={s2.district} />
            <DetailRow label="Block" value={s2.blockTown} />
            <DetailRow label="Sub-watershed" value={s2.subWatershedName} />
            <DetailRow label="Micro-watershed" value={`${s2.microWatershedName} (${s2.microWatershedCode})`} />
            <DetailRow label="Villages" value={s2.villages} full />
          </div>
          <DataTable columns={["#", "ARS Detail", "Name", "Latitude", "Longitude", "Altitude", "Recharge Area (Ha)", "Ownership", "Land Type"]} rows={(s2.arsDetails || []).map((r, i) => [i + 1, r.arsDetail, r.name, formatDMS(r.latitude), formatDMS(r.longitude), r.altitudeMasl, r.approxRechargeAreaHa, r.landOwnership, r.landTypeDesignation])} />
          <div className="mt-4" />
          <h4 className="font-semibold text-slate-700 mb-2">Hydrological Details</h4>
          <DataTable columns={["ARS Detail", "Name", "Pre-Monsoon (m)", "Post-Monsoon (m)", "10 Yrs Ago (m)", "Trend"]} rows={(s2.hydrologicalDetails || []).map((r) => {
            const current = Number(r.depthToWaterTablePostMonsoon) || 0;
            const past = Number(r.depthToWaterTable10YrsAgo) || 0;
            const trend = current === past ? "—" : current > past ? "Declining" : "Rising";
            return [r.arsDetail, r.name, r.depthToWaterTablePreMonsoon, r.depthToWaterTablePostMonsoon, r.depthToWaterTable10YrsAgo, trend];
          })} />
          <div className="mt-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailRow label="Water Source" value={s2.sourceOfWaterForRecharge === "Other" ? s2.sourceOfWaterOther : s2.sourceOfWaterForRecharge} />
            <DetailRow label="Availability Period" value={`${s2.avgAvailabilityPeriodMonths} months`} />
            <DetailRow label="GW Status" value={s2.groundwaterAvailabilityStatus} />
            <DetailRow label="Primary Uses" value={toTextList(s2.primaryGroundwaterUses)} />
          </div>
        </> },
        { n: 3, t: "Photographs", c: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[
          ["Recharge Site", s3?.rechargeSitePhoto?.url], ["Intervention Site", s3?.interventionSitePhoto?.url]
        ].map(([label, url]) => <div key={label} className="border border-slate-200 rounded-lg p-3"><p className="text-sm font-semibold mb-2">{label}</p>{url ? <img src={url} alt={label} className="h-44 w-full object-cover rounded cursor-pointer" onClick={() => setImageModal(url)} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="h-44 bg-slate-100 rounded grid place-content-center text-slate-500 text-sm">No photo uploaded</div>}</div>)}</div> },
        { n: 4, t: "Risk Assessment", c: <div className="space-y-4">
          <DetailRow label="Potential Risks" value={s4.potentialRisks} full />
          <DetailRow label="Vulnerability Level" value={s4.vulnerabilityLevel} />
        </div> },
        { n: 5, t: "Budget & Plan", c: <>
          <DataTable columns={["DPR Prep", "Interventions", "M&E", "Total"]} rows={[[s5?.table51?.dprPreparationBudgetLakh, s5?.table51?.totalInterventionsCostLakh, s5?.table51?.monitoringEvaluationBudgetLakh, s5?.table51?.totalBudgetLakh]]} />
          <div className="mt-4" />
          <DataTable columns={["#", "Activity", "Unit", "Total Target", "Amount"]} rows={(s5.table52 || []).filter(r => !r.isHeader).map((r, i) => [i + 1, r.activityLabel, r.unit, r.totalPhysicalTarget, r.financialAmountLakh])} />
          <div className="mt-4" />
          <DataTable columns={["Water Recharge %", "Compliance"]} rows={[[s5?.table83?.waterRechargePercentage, Number(s5?.table83?.waterRechargePercentage) >= 10 ? "Compliant" : "Below Guideline"]]} />
          <div className="mt-4" />
          <DataTable columns={["PIA Fund", "Other", "SARRA", "Grand Total"]} rows={[[s5?.table74?.fundFromPIADeptLakh, s5?.table74?.fundFromOtherSourcesLakh, s5?.table74?.fundFromSARRAConvergenceLakh, s5?.table74?.grandTotalLakh]]} />
        </> },
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
      { n: 1, t: "Dept Details", c: commonOne },
      {
        n: 2, t: "Stream Identification", c: <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <DetailRow label="Stream Name" value={s2.streamName} />
            <DetailRow label="Stream Order" value={s2.streamOrder} />
            <DetailRow label="District" value={s2.district} />
            <DetailRow label="Block/Town" value={s2.blockTown} />
            <DetailRow label="Length (Km)" value={s2.lengthKm ?? s2.lengthOfStreamKm} />
            <DetailRow label="Sub-watershed" value={s2.subWatershed ?? s2.subWatershedName} />
            <DetailRow label="Micro-watershed" value={s2.microWatershed ?? s2.microWatershedName} />
            <DetailRow label="No. of Villages" value={s2.numberOfVillages ?? s2.noOfVillagesHabitation} />
            <DetailRow label="Village Names" value={toTextList(s2.villageNames ?? s2.villagesHabitationNames)} full />
          </div>
          <DataTable columns={["#", "Detail", "Name", "Order", "Start Point", "End Point", "Length (Km)", "Altitude"]} rows={(s2.table21 || []).map((r, i) => [i + 1, r.detail, r.name, r.order ?? r.streamOrder, `${formatDMS(r.startLat || r?.startPoint?.latitude)} / ${formatDMS(r.startLong || r?.startPoint?.longitude)}`, `${formatDMS(r.endLat || r?.endPoint?.latitude)} / ${formatDMS(r.endLong || r?.endPoint?.longitude)}`, r.lengthKm, r.altitudeMtr])} />
          <div className="mt-4" />
          <DataTable columns={["Detail", "Name", "Nature", "Seasonal Months", "Dec-Jan LPM", "May-Jun LPM", "Decrease 15yr %"]} rows={(s2.table22 || []).map((r) => [r.detail, r.name, r.nature ?? r.streamNature, toTextList(r.seasonalMonths ?? r.ifSeasonalMonths), r.decJanLpm ?? r.dischargeDecJanLPM, r.mayJunLpm ?? r.dischargeMayJuneLPM, r.decrease15YrPercent ?? r.decreaseInDischarge15YrsPercent])} />
          <div className="mt-4" />
          <DataTable columns={["Detail", "Name", "Water Use", "Schemes", "Population", "Irrigation Area (Ha)"]} rows={(s2.table23 || []).map((r) => [r.detail, r.name, toTextList(r.waterUse), toTextList(r.schemes ?? r.noOfSchemes), r.benefitedPopulation, r.irrigationAreaHa ?? r.irrigationCommandAreaHa])} />
        </>
      },
      {
        n: 3, t: "Catchment Area", c: <>
          <DataTable columns={["Stream", "Catchment (Ha)", "Land Cover %"]} rows={(s3.table31 || []).map((r) => [r.streamName ?? r.name, r.catchmentAreaHa, `Agr ${r?.landCoverPercent?.agriculture || 0}% | RF ${r?.landCoverPercent?.reserveForest || 0}% | VP ${r?.landCoverPercent?.vanPanchayat || 0}% | Pasture ${r?.landCoverPercent?.pasture || r?.landCoverPercent?.pastureNonForest || 0}% | Settlement ${r?.landCoverPercent?.settlement || 0}%`])} />
          {s3?.attachLandCoverMap?.url && <img src={s3.attachLandCoverMap.url} className="mt-4 h-48 rounded-lg cursor-pointer" alt="Land cover" onClick={() => setImageModal(s3.attachLandCoverMap.url)} />}
          <div className="mt-4" />
          <DataTable columns={["Treatment done", "Permanent structure"]} rows={(s3.table32 || []).map((r) => [r.treatmentDone ?? r.catchmentTreatmentDoneLast3Yrs ? "✅ Yes" : "❌ No", r.permanentStructure ?? r.permanentFunctionalStructure ? "✅ Yes" : "❌ No"])} />
        </>
      },
      {
        n: 4, t: "Photographs", c: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[
          ["Main Stream", s4?.mainStreamPhoto?.url], ["Tributaries Confluence", s4?.tributariesConfluencePhoto?.url]
        ].map(([label, url]) => <div key={label} className="border border-slate-200 rounded-lg p-3"><p className="text-sm font-semibold mb-2">{label}</p>{url ? <img src={url} alt={label} className="h-44 w-full object-cover rounded cursor-pointer" onClick={() => setImageModal(url)} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="h-44 bg-slate-100 rounded grid place-content-center text-slate-500 text-sm">No photo uploaded</div>}</div>)}</div>
      },
      { n: 5, t: "Recharge Areas", c: <DataTable columns={["Detail", "Name", "Demarcated?", "Total Ha", "Forest Ha", "Revenue Ha", "Private Ha"]} rows={(s5.table51 || []).map((r) => [r.detail, r.name, r.demarcated ?? r.rechargeAreaDemarcated ? "✅ Yes" : "❌ No", r.totalRechargeAreaHa, r.forestLandAreaHa ?? r.forestLandHa, r.revenueLandAreaHa ?? r.revenueLandHa, r.privateLandAreaHa ?? r.privateLandHa])} /> },
      {
        n: 6, t: "Maps", c: <>
          <blockquote className="border-l-4 border-[#0a3d62] bg-slate-50 p-4 rounded">{s6.mapDescription || "—"}</blockquote>
          {s6?.geoCoordinatesFile?.url && <a className="mt-4 inline-flex items-center gap-2 text-[#0a3d62] hover:underline" href={s6.geoCoordinatesFile.url} target="_blank"><Download className="w-4 h-4" /> Download geo-coordinates file</a>}
        </>
      },
      {
        n: 7, t: "Budget & Plan", c: <>
          <DataTable columns={["DPR Prep", "Interventions", "M&E", "Total"]} rows={[[s7?.table71?.dprPreparationCostLakh ?? s7?.table71?.dprPreparationBudgetLakh, s7?.table71?.interventionsCostLakh ?? s7?.table71?.totalInterventionsCostLakh, s7?.table71?.monitoringCostLakh ?? s7?.table71?.monitoringEvaluationBudgetLakh, s7?.table71?.totalBudgetLakh]]} />
          <div className="mt-4" />
          <DataTable columns={["#", "Activity", "Unit", "Total", "Amount (Lakh)"]} rows={(s7.table72 || []).filter((r) => !r?.isHeader).map((r, i) => [i + 1, r.activity ?? r.activityLabel, r.unit, r.total ?? r.totalPhysicalTarget, r.financialAmountLakh])} />
          <div className="mt-4" />
          <DataTable columns={["Water Recharge %", "Compliance"]} rows={[[s7?.table73?.waterRechargePercentage, Number(s7?.table73?.waterRechargePercentage || 0) < 10 ? "Below 10% guideline" : "Compliant"]]} />
          <div className="mt-4" />
          <DataTable columns={["PIA Fund", "Other", "SARRA", "Grand Total"]} rows={[[s7?.table74?.piaFundLakh ?? s7?.table74?.fundFromPIADeptLakh, s7?.table74?.otherSourcesLakh ?? s7?.table74?.fundFromOtherSourcesLakh, s7?.table74?.sarraConvergenceLakh ?? s7?.table74?.fundFromSARRAConvergenceLakh, s7?.table74?.grandTotalLakh]]} />
        </>
      },
      {
        n: 8, t: "Geo Location", c: <>
          <blockquote className="border-l-4 border-[#0a3d62] bg-slate-50 p-4 rounded">{s8.geoDescription || s8.geoLocationDescription || "—"}</blockquote>
          {s8?.geoFile?.url && <a className="mt-4 inline-flex items-center gap-2 text-[#0a3d62] hover:underline" href={s8.geoFile.url} target="_blank"><Download className="w-4 h-4" /> Download geo file</a>}
        </>
      },
    ];
  }, [form, isSpring]);

  const toggleSection = (n) => setOpenSections((prev) => (prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n]));

  if (loading) {
    return <div className="p-6 space-y-4">{[1, 2, 3, 4].map((k) => <div key={k} className="h-28 bg-slate-200 rounded animate-pulse" />)}</div>;
  }

  if (error || !form) return <div className="p-6"><div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4">{error || "Unable to load form details."} <button onClick={fetchDetail} className="underline ml-2">Retry</button></div></div>;

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-4 md:p-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <button onClick={() => router.push("/dashboard/officer/forms")} className="inline-flex items-center text-[#0a3d62] text-sm font-medium mb-2"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Forms</button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-mono text-lg font-bold text-slate-800">{form?.applicationNo || "—"}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[form?.status] || "bg-slate-100 text-slate-700"}`}>{form?.status || "—"}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${form?.formType === "STREAMSHED" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>{form?.formType || "SPRINGSHED"}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Submitted: {formatDateTime(form?.submittedAt)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => router.push(`/dashboard/officer/forms/${id}/analytics?type=${form?.formType || "SPRINGSHED"}`)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm inline-flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Analytics</button>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/reports/export/pdf/${id}`} target="_blank" className="px-3 py-2 rounded-lg border border-slate-200 text-sm inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Export PDF</a>
          {canEdit && <button onClick={() => router.push(`/dashboard/officer/forms/${id}/edit`)} className="px-3 py-2 rounded-lg bg-[#e67e22] text-white text-sm inline-flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {kpis.map((k) => <div key={k.label} className={`bg-white border border-slate-200 rounded-xl shadow-sm p-4 border-l-4 ${k.border}`}><div className="flex items-center justify-between">{k.icon}<p className="text-3xl font-bold text-slate-800">{k.value}</p></div><p className="text-xs mt-2 text-slate-500 uppercase">{k.label}</p></div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-7 space-y-3">
          {sections.map((section) => {
            const open = openSections.includes(section.n);
            return (
              <div key={section.n} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <button className="w-full px-4 py-3 flex justify-between items-center text-left" onClick={() => toggleSection(section.n)}>
                  <span className="font-semibold text-slate-800">{section.n}. {section.t}</span>
                  {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[4000px] p-4 pt-0" : "max-h-0"}`}>{section.c}</div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sticky top-24">
            <h3 className="font-semibold text-slate-800 mb-3">Submitted By</h3>
            <p className="text-sm text-slate-700">{form?.submittedBy?.name || form?.submittedByName || "—"}</p>
            <p className="text-sm text-slate-500">{form?.submittedBy?.email || "—"}</p>
            <p className="text-xs mt-2 inline-block px-2 py-1 rounded-full bg-slate-100 text-slate-700">{form?.submittedBy?.role || "Officer"}</p>
            <div className="mt-3 text-sm text-slate-600">
              <p>District: {form?.submittedByDistrict || form?.section1_deptDetails?.district || "—"}</p>
              <p>Department: {form?.submittedByDepartment || form?.section1_deptDetails?.department || "—"}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Form Summary</h3>
            <p className="text-sm text-slate-700">{isSpring ? `Springs: ${(form?.section2_springIdentification?.springs || []).length}` : `Streams: ${(form?.section2_streamIdentification?.table21 || []).length}`}</p>
            <p className="text-sm text-slate-700">Budget: {formatBudget(isSpring ? form?.section10_budgetAndPlan?.table101?.totalBudgetLakh : form?.section7_budgetAndPlan?.table71?.totalBudgetLakh)}</p>
            <p className="text-sm text-slate-700">Population: {isSpring ? sumBy(form?.section3_springDescription?.table32 || [], "populationBenefited") : sumBy(form?.section2_streamIdentification?.table23 || [], "benefitedPopulation")}</p>
            <p className="text-sm text-slate-700">Recharge: {isSpring ? sumBy(form?.section8_rechargeArea?.table81 || [], "totalRechargeAreaHa") : sumBy(form?.section5_rechargeAreas?.table51 || [], "totalRechargeAreaHa")} Ha</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Revision Timeline</h3>
            {(form?.revisionHistory || []).length === 0 && <p className="text-sm text-slate-500">No revision history yet</p>}
            <div className="space-y-3">
              {(form?.revisionHistory || []).map((r, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="mt-1">{r?.status === "APPROVED" ? <CheckCircle className="w-4 h-4 text-green-600" /> : r?.status === "REJECTED" ? <XCircle className="w-4 h-4 text-red-600" /> : <Clock className="w-4 h-4 text-blue-600" />}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{r?.status || "Updated"}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(r?.changedAt)} by {r?.changedBy?.name || "System"}</p>
                    {r?.notes && <p className="text-xs text-slate-500">{r.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
            {form?.status === "APPROVED" && <p className="text-sm text-green-700 mt-3">Approved on {formatDateTime(form?.approvedAt)}</p>}
            {form?.status === "REJECTED" && <p className="text-sm text-red-700 mt-3">Reason: {form?.rejectionReason || "—"}</p>}
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
