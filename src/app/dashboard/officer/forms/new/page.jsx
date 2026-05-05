"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { postFormData } from "@/lib/api";
import { toast } from "sonner";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DISTRICTS = [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
    "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh",
    "Rudra Prayag", "Tehri Garhwal", "Udam Singh Nagar", "Uttarkashi"
];
const DEPARTMENTS = [
    "Forest Department", "Minor Irrigation", "Irrigation Department",
    "Rural Development", "Urban Development", "UCRRFP", "Jal Sansthan",
    "Peyjal", "Other Department/Organization"
];
const BLOCKS_BY_DISTRICT = {
    "Dehradun": ["Chakrata", "Vikasnagar", "Sahaspur", "Raipur", "Doiwala", "Rishikesh", "Kalsi"],
    "Pauri Garhwal": ["Pauri", "Kot", "Srikot", "Ekeshwar", "Pabau", "Bironkhal", "Thalisain", "Dwarikhal", "Jaykhandani", "Nainidanda", "Yamkeshwar", "Pokhara", "Rikhnikhal", "Kaljikhal"],
    "Tehri Garhwal": ["Tehri", "Devprayag", "Dhanolti", "Chamba", "Jakhnidhar", "Narendra Nagar", "Bhilangana", "Pratapnagar"],
    "Uttarkashi": ["Bhatwari", "Chinyalisaur", "Dunda", "Mori", "Naugaon", "Purola"],
    "Almora": ["Almora", "Bhikiasain", "Dhauladevi", "Hawalbagh", "Lamgara", "Salt", "Syaldeh", "Takula"],
    "Nainital": ["Betalghat", "Bhimtal", "Dhari", "Haldwani", "Kotabagh", "Okhalkanda", "Ramnagar", "Ramgarh"],
    "Chamoli": ["Gairsain", "Gharat", "Joshimath", "Karnprayag", "Narayanbagar", "Pokhari", "Tharali"],
    "Bageshwar": ["Bageshwar", "Garur", "Kapkot"],
    "Champawat": ["Barakot", "Champawat", "Lohaghat", "Pati"],
    "Pithoragarh": ["Berinag", "Dharchula", "Gangolihat", "Kanalichhina", "Munsiari", "Pithoragarh"],
    "Rudra Prayag": ["Augustmuni", "Jakoli", "Rudraprayag", "Ukhimath"],
    "Haridwar": ["Bahadrabad", "Bhagwanpur", "Haridwar", "Khanpur", "Laksar", "Narsan", "Roorkee"],
    "Udam Singh Nagar": ["Bazpur", "Gadarpur", "Jaspur", "Kashipur", "Khatima", "Kichha", "Rudrapur", "Sitarganj"],
};

// Panchayats by Block (sample data — expand as needed)
const PANCHAYATS_BY_BLOCK = {
    "Chakrata": ["Lakhamandal", "Kimoi", "Sahiya", "Chuharpur", "Raipur (C)"],
    "Vikasnagar": ["Badasi", "Thano", "Selaqui", "Hariyawala", "Bhagwanpur (V)"],
    "Sahaspur": ["Sahaspur", "Majra", "Pondha", "Bahadarpur", "Chandrothi"],
    "Raipur": ["Raipur", "Maldevta", "Guchhupani", "Aamwala", "Dhakrani"],
    "Doiwala": ["Doiwala", "Raiwala", "Lachhiwala", "Motichur", "Shyampur"],
    "Rishikesh": ["Jonk", "Shivpuri", "Gular Dogi", "Barrage", "Muni Ki Reti"],
    "Kalsi": ["Kalsi", "Dakpathar", "Herbertpur", "Vikas Nagar (K)", "Bairatkhai"],
    "Pauri": ["Pauri", "Kandoliya", "Khirsu", "Adwani", "Jaiharikhal"],
    "Kot": ["Kot", "Satpuli", "Dugadda", "Bironkhal (K)"],
    "Almora": ["Almora", "Hawalbagh (A)", "Kosi", "Takula (A)", "Ranikhet"],
    "Bhikiasain": ["Bhikiasain", "Chaukhutiya", "Ganaigangoli"],
    "Dhauladevi": ["Dhauladevi", "Panuwanaula", "Dwarahat"],
    "Hawalbagh": ["Hawalbagh", "Someshwar", "Kosi (H)"],
    "Lamgara": ["Lamgara", "Tarikhet", "Ranikhet (L)"],
    "Salt": ["Salt", "Shitlakhet", "Galla"],
    "Syaldeh": ["Syaldeh", "Basauli", "Pantkotli"],
    "Takula": ["Takula", "Masi", "Binta"],
    "Betalghat": ["Betalghat", "Naukuchiyatal", "Suyalgarh"],
    "Bhimtal": ["Bhimtal", "Sattal", "Mehragaon"],
    "Dhari": ["Dhari", "Manilla", "Okhalkanda (D)"],
    "Haldwani": ["Haldwani", "Kathgodam", "Mukteshwar"],
    "Kotabagh": ["Kotabagh", "Peora", "Padampuri"],
    "Okhalkanda": ["Okhalkanda", "Ghorakhal", "Jeolikot"],
    "Ramnagar": ["Ramnagar", "Kaladungi", "Garjia"],
    "Ramgarh": ["Ramgarh", "Nathuakhan", "Bhatelia"],
    "Bageshwar": ["Bageshwar", "Kanda", "Garud"],
    "Garur": ["Garur", "Baijnath", "Kausani"],
    "Kapkot": ["Kapkot", "Bharari", "Tejam"],
    "Barakot": ["Barakot", "Banbasa", "Tanakpur"],
    "Champawat": ["Champawat", "Meetha Reetha", "Baluti"],
    "Lohaghat": ["Lohaghat", "Devidhura", "Purnagiri"],
    "Pati": ["Pati", "Khatoli", "Punyagiri"],
    "Gairsain": ["Gairsain", "Tharali (G)", "Dewal"],
    "Gharat": ["Gharat", "Chandpur", "Ghat"],
    "Joshimath": ["Joshimath", "Pipalkoti", "Tapovan"],
    "Karnprayag": ["Karnprayag", "Simli", "Nauti"],
    "Narayanbagar": ["Narayanbagar", "Tharali (N)", "Gwaldam"],
    "Pokhari": ["Pokhari", "Rudranath", "Mandal"],
    "Tharali": ["Tharali", "Gwaldam (T)", "Dewal (T)"],
    "Tehri": ["Tehri", "New Tehri", "Kirtinagar"],
    "Devprayag": ["Devprayag", "Narendranagar (D)", "Byasi"],
    "Dhanolti": ["Dhanolti", "Surkanda", "Kanatal"],
    "Chamba": ["Chamba", "Mussoorie", "Bhatwari (C)"],
    "Jakhnidhar": ["Jakhnidhar", "Hindolakhal", "Lambgaon"],
    "Narendra Nagar": ["Narendra Nagar", "Chamba (N)", "Kaudiyala"],
    "Bhilangana": ["Bhilangana", "Ghansali", "Pratapnagar (B)"],
    "Pratapnagar": ["Pratapnagar", "Jakholi (P)", "Bhatwari (P)"],
    "Bhatwari": ["Bhatwari", "Gangotri", "Harshil"],
    "Chinyalisaur": ["Chinyalisaur", "Rajgarhi", "Naugaon (C)"],
    "Dunda": ["Dunda", "Barkot", "Dharasu"],
    "Mori": ["Mori", "Netwar", "Sankri"],
    "Naugaon": ["Naugaon", "Dunda (N)", "Tiloth"],
    "Purola": ["Purola", "Fatehparvat", "Naugaon (P)"],
    "Berinag": ["Berinag", "Udiyari", "Gangolihat (B)"],
    "Dharchula": ["Dharchula", "Baluwakot", "Tawaghat"],
    "Gangolihat": ["Gangolihat", "Reetha", "Patal Bhuvaneshwar"],
    "Kanalichhina": ["Kanalichhina", "Ogla", "Didihat"],
    "Munsiari": ["Munsiari", "Madkot", "Birthi"],
    "Pithoragarh": ["Pithoragarh", "Thal", "Kapkot (P)"],
    "Augustmuni": ["Augustmuni", "Kund", "Tilwara"],
    "Jakoli": ["Jakoli", "Banswara", "Jakholi"],
    "Rudraprayag": ["Rudraprayag", "Chopta", "Gaurikund"],
    "Ukhimath": ["Ukhimath", "Guptkashi", "Kedarnath"],
    "Bahadrabad": ["Bahadrabad", "Bhadrabad", "Jwalapur"],
    "Bhagwanpur": ["Bhagwanpur", "Landhaura", "Libarheri"],
    "Haridwar": ["Haridwar", "Kankhal", "BHEL"],
    "Khanpur": ["Khanpur", "Sultanpur", "Pathri"],
    "Laksar": ["Laksar", "Niranjanpur", "Shahpur"],
    "Narsan": ["Narsan", "Jhabrera", "Sherpur"],
    "Roorkee": ["Roorkee", "Manglaur", "Bhagwanpur (R)"],
    "Bazpur": ["Bazpur", "Kashipur (Bz)", "Bilaspur"],
    "Gadarpur": ["Gadarpur", "Mahua", "Kiccha (G)"],
    "Jaspur": ["Jaspur", "Kashipur (J)", "Afzalgarh"],
    "Kashipur": ["Kashipur", "Bazpur (K)", "Mohanpur"],
    "Khatima": ["Khatima", "Sitarganj (Kh)", "Nanakmatta"],
    "Kichha": ["Kichha", "Rudrapur (Ki)", "Pantnagar"],
    "Rudrapur": ["Rudrapur", "Pantnagar (R)", "Gadarpur (R)"],
    "Sitarganj": ["Sitarganj", "Khatima (S)", "Nanakmatta (S)"],
};

// Villages by Panchayat (sample data — expand as needed)
const VILLAGES_BY_PANCHAYAT = {};
Object.values(PANCHAYATS_BY_BLOCK).flat().forEach(p => {
    VILLAGES_BY_PANCHAYAT[p] = [`${p} Village`, `${p} Talla`, `${p} Malla`];
});
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SPRING_TYPES = ["Naula", "Dhara", "Gadhera/Nala", "Other"];
const SPRING_NATURES = ["Perennial", "Seasonal", "Dried"];
const TYPOLOGIES = ["Contact", "Depression", "Fracture/Fault", "Karst", "Thermal"];
const ROCK_TYPES = ["Phyllite", "Schist", "Shale", "Sandstone", "Limestone", "Granite", "Gneiss", "Basalt", "Quartzite", "Any other type"];
const AQUIFER_TYPES = ["Confined", "Unconfined", "Karst"];
const TOPO_FEATURES = ["Hill top", "Middle of the hill", "Valley/Bottom of the hill"];
const WATER_COLOURS = ["Clean", "Yellowish", "Reddish", "Brownish", "Greyish", "Greenish", "Other"];
const DISCHARGE_TRENDS = ["Highly decreased", "Slightly decreased", "No change", "Increased"];
const LAND_USE = ["Agriculture", "Forest", "Pasture", "Shrubs", "Settlement"];
const WATER_USAGES = ["Drinking/Cooking", "Washing/Sanitation", "Cattles/Livestock", "Irrigation", "Industrial", "Other"];
const NATURAL_STRESSORS = ["Drought", "Forest Fire", "Scouring/Gully Erosion", "Landslide/Subsidence", "Earthquake", "Avalanche", "Other"];
const ANTHROPOGENIC_STRESSORS = ["Urbanisation", "Deforestation", "Pollutant load", "Introduction of non-native plants", "Animal grazing", "Mining", "Other"];
const BOTH_STRESSORS = [...NATURAL_STRESSORS.slice(0, -1), ...ANTHROPOGENIC_STRESSORS.slice(0, -1), "Other"];
const OTHER_WATER_SOURCES = ["Other spring", "Piped supply", "Hand pump", "Dugwell", "Pond", "Lifting scheme", "None", "Other"];
const ACTIVITIES = [
    { id: "recharge_area", label: "Identified recharge area of spring", unit: "Ha." },
    { id: "contour_trenches", label: "Contour Trenches", unit: "No." },
    { id: "recharge_pit", label: "Recharge Pit", unit: "No." },
    { id: "dugout_ponds", label: "Dugout Ponds", unit: "No." },
    { id: "chal_khal", label: "Chal-Khal", unit: "No." },
    { id: "brushwood_dam", label: "Brushwood check dam", unit: "No." },
    { id: "temp_dam", label: "Temporary check dam (Pirul etc.)", unit: "No." },
    { id: "boulder_dam", label: "Loose Boulder check dam", unit: "No." },
    { id: "rr_dam", label: "RR Dry Check Dam", unit: "No." },
    { id: "gabion_dam", label: "Gabion/Crate wire check dam", unit: "No." },
    { id: "cemented_dam", label: "Cemented check dam", unit: "No." },
    { id: "vegetative", label: "Vegetative Treatment", unit: "Ha." },
    { id: "fodder", label: "Fodder/Grass Plantation", unit: "Ha." },
    { id: "forestry", label: "Forestry Plantation", unit: "Ha." },
    { id: "anr", label: "ANR Activities", unit: "Ha." },
    { id: "plantation", label: "Plantation Activities", unit: "Ha." },
    { id: "catchment", label: "Estimated Area of Catchment Treated", unit: "Ha." },
];

const SECTIONS = [
    { id: 1, label: "Dept. Details", icon: "🏛️" },
    { id: 2, label: "Spring ID", icon: "📍" },
    { id: 3, label: "Description", icon: "📝" },
    { id: 4, label: "Photos", icon: "📷" },
    { id: 5, label: "Hydro-Geo", icon: "🪨" },
    { id: 6, label: "Physical Chars", icon: "💧" },
    { id: 7, label: "Other Info", icon: "ℹ️" },
    { id: 8, label: "Recharge Area", icon: "🗺️" },
    { id: 9, label: "Community", icon: "👥" },
    { id: 10, label: "Budget & Plan", icon: "💰" },
];

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const inp = "w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all placeholder-slate-400";
const sel = inp + " cursor-pointer";
// Compact styles for table cells — smaller padding, tighter fit
const tinp = "w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all placeholder-slate-400";
const tsel = tinp + " cursor-pointer";
const lbl = "block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide";
const card = "bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden";
const secHead = "flex items-center gap-3 mb-6";
const secTitle = "text-xl font-bold text-slate-800";
const tableHead = "bg-gradient-to-r from-blue-700 to-blue-800 text-white text-xs font-bold uppercase tracking-wider px-2 py-3 whitespace-nowrap";
const tableCell = "px-2 py-2 text-sm border-b border-slate-100 align-top";
const tableCellAlt = "px-2 py-2 text-sm border-b border-slate-100 align-top bg-blue-50/30";

// ─── COORDINATE VALIDATION ───────────────────────────────────────────────────
function validateCoord(type, part, value) {
    if (value === "") return "";
    const v = parseInt(value, 10);
    if (isNaN(v)) return "Invalid number";
    if (type === "lat") {
        if (part === "dd" && (v < 28 || v > 31)) return "Latitude degrees out of range (28-31)";
        if (part === "mm" && (v < 0 || v > 59)) return "Minutes out of range (0-59)";
        if (part === "ss" && (v < 0 || v > 59)) return "Seconds out of range (0-59)";
    }
    if (type === "lng") {
        if (part === "dd" && (v < 76 || v > 81)) return "Longitude degrees out of range (76-81)";
        if (part === "mm" && (v < 0 || v > 59)) return "Minutes out of range (0-59)";
        if (part === "ss" && (v < 0 || v > 59)) return "Seconds out of range (0-59)";
    }
    return "";
}

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────
function FloatSelect({ label, value, onChange, options, required }) {
    return (
        <div className="relative">
            <label className={lbl}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className={sel}>
                <option value="">— Select —</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function FloatInput({ label, value, onChange, type = "text", required, placeholder, maxLength, pattern }) {
    return (
        <div className="relative">
            <label className={lbl}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                className={inp} placeholder={placeholder || label}
                maxLength={maxLength} pattern={pattern}
            />
        </div>
    );
}

function CheckGroup({ options, selected, onChange, max }) {
    const toggle = (opt) => {
        if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
        else if (!max || selected.length < max) onChange([...selected, opt]);
    };
    return (
        <div className="flex flex-col gap-2">
            {options.map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <div onClick={() => toggle(opt)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                        {selected.includes(opt) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                    </div>
                    <span className="text-sm text-slate-700">{opt}</span>
                </label>
            ))}
        </div>
    );
}

function MonthPicker({ selected, onChange, disabled }) {
    const disabledSet = new Set(disabled || []);
    const toggle = m => {
        if (disabledSet.has(m)) return;
        selected.includes(m) ? onChange(selected.filter(x => x !== m)) : selected.length < 3 ? onChange([...selected, m]) : null;
    };
    return (
        <div>
            <div className="grid grid-cols-4 gap-1.5">
                {MONTHS.map(m => (
                    <button key={m} type="button" onClick={() => toggle(m)}
                        disabled={disabledSet.has(m)}
                        className={`px-2.5 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${disabledSet.has(m) ? 'bg-red-50 border-red-200 text-red-300 cursor-not-allowed line-through' :
                            selected.includes(m) ? 'bg-blue-600 border-blue-600 text-white shadow-md' :
                                'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                            }`}>
                        {m}
                    </button>
                ))}
            </div>
            {selected.length > 0 && <div className="mt-2 text-sm text-blue-600 font-medium">{selected.join(", ")}</div>}
        </div>
    );
}

function SectionTag({ step, current }) {
    const done = current > step.id;
    const active = current === step.id;
    return (
        <div className={`flex flex-col items-center gap-1 cursor-default transition-all`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${done ? 'bg-green-500 border-green-500 text-white' :
                active ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' :
                    'bg-white border-slate-200 text-slate-400'
                }`}>
                {done ? '✓' : step.icon}
            </div>
            <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'}`}>{step.label}</span>
        </div>
    );
}

function SpringNameCell({ springs, rowIdx, onChange }) {
    return (
        <td className={tableCell}>
            <select className={sel + " min-w-[120px]"} value={springs[rowIdx] || ""} onChange={e => onChange(e.target.value)}>
                <option value="">— Select Spring —</option>
                {springs.filter(Boolean).map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
        </td>
    );
}

function SaveDraftBtn({ onClick }) {
    return (
        <button type="button" onClick={onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all border border-slate-200">
            💾 Save as Draft
        </button>
    );
}

function NavBtn({ onClick, label, primary, icon }) {
    return (
        <button type="button" onClick={onClick}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${primary ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200' :
                'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
            {!primary && icon} {label} {primary && icon}
        </button>
    );
}

function TableWrapper({ title, subtitle, children }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="bg-blue-600 px-4 py-2.5 flex items-center gap-3">
                <span className="text-white font-bold text-sm">{title}</span>
                {subtitle && <span className="text-blue-200 text-xs">{subtitle}</span>}
            </div>
            <table className="w-full min-w-max border-collapse">
                {children}
            </table>
        </div>
    );
}

function InfoBadge({ text }) {
    return (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 mb-4">
            <span className="text-amber-500 mt-0.5">ℹ</span>
            <span>{text}</span>
        </div>
    );
}

// ─── SECTION COMPONENTS ───────────────────────────────────────────────────────

function Section1({ data, setData }) {
    const upd = k => v => setData(d => ({ ...d, [k]: v }));
    const blocks = data.district ? (BLOCKS_BY_DISTRICT[data.district] || []) : [];
    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">🏛️</div>
                <div><p className={secTitle}>Department / Organization Details</p><p className="text-xs text-slate-400">Section 1 of 10</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FloatSelect label="Department/Organization" value={data.department} onChange={upd("department")} options={DEPARTMENTS} required />
                    {data.department === "Other Department/Organization" && (
                        <div className="mt-3"><FloatInput label="Specify Other Department" value={data.deptOther || ""} onChange={upd("deptOther")} /></div>
                    )}
                </div>
                <FloatSelect label="District" value={data.district} onChange={v => { setData(d => ({ ...d, district: v, block: "" })); }} options={DISTRICTS} required />
                <FloatSelect label="Block" value={data.block} onChange={upd("block")} options={blocks} />
                <FloatInput label="Address of Department/Organization" value={data.address} onChange={upd("address")} />
                <FloatInput label="Key Nodal Officer" value={data.nodalOfficer} onChange={upd("nodalOfficer")} required />
                <FloatInput label="Contact No" value={data.contactNo} onChange={upd("contactNo")} type="tel" maxLength={10} required placeholder="10-digit mobile number" />
                <FloatInput label="Email ID" value={data.email} onChange={upd("email")} type="email" required />
            </div>
        </div>
    );
}

function Section2({ data, setData, sec1 }) {
    const upd = k => v => setData(d => ({ ...d, [k]: v }));
    // Auto-sync district & block from Section 1
    const effectiveDistrict = data.springDistrict || sec1?.district || "";
    const effectiveBlock = data.springBlock || sec1?.block || "";
    const blocks = effectiveDistrict ? (BLOCKS_BY_DISTRICT[effectiveDistrict] || []) : [];
    const panchayats = effectiveBlock ? (PANCHAYATS_BY_BLOCK[effectiveBlock] || []) : [];
    const villages = data.springGP ? (VILLAGES_BY_PANCHAYAT[data.springGP] || []) : [];

    // Sync on mount
    useEffect(() => {
        if (sec1?.district && !data.springDistrict) setData(d => ({ ...d, springDistrict: sec1.district }));
        if (sec1?.block && !data.springBlock) setData(d => ({ ...d, springBlock: sec1.block }));
    }, [sec1?.district, sec1?.block]);

    const addSpringRow = () => setData(d => ({ ...d, springs: [...d.springs, { name: "", village: data.revVillage || "", hamlet: "", lat: { dd: "", mm: "", ss: "" }, lng: { dd: "", mm: "", ss: "" }, altitude: "", code: "" }] }));
    const delSpringRow = () => { if (data.springs.length > 1) setData(d => ({ ...d, springs: d.springs.slice(0, -1) })); };
    const updSpring = (i, k, v) => setData(d => ({ ...d, springs: d.springs.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));
    const updCoord = (i, coord, part, v) => setData(d => ({ ...d, springs: d.springs.map((s, idx) => idx === i ? { ...s, [coord]: { ...s[coord], [part]: v } } : s) }));

    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">📍</div>
                <div><p className={secTitle}>Spring Identification Particulars</p><p className="text-sm text-slate-400">Section 2 of 10</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatSelect label="District" value={effectiveDistrict} onChange={v => setData(d => ({ ...d, springDistrict: v, springBlock: "", springGP: "", revVillage: "" }))} options={DISTRICTS} required />
            </div>

            <div className="p-5 bg-green-50 rounded-2xl border-2 border-green-200">
                <p className="text-sm font-bold text-green-700 mb-4 uppercase tracking-wide">📌 For Rural</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FloatSelect label="Block/Tehsil" value={effectiveBlock} onChange={v => setData(d => ({ ...d, springBlock: v, springGP: "", revVillage: "" }))} options={blocks} required />
                    <FloatSelect label="Gram Panchayat" value={data.springGP || ""} onChange={v => setData(d => ({ ...d, springGP: v, revVillage: "" }))} options={panchayats} required />
                    <FloatSelect label="Revenue Village Name" value={data.revVillage || ""} onChange={upd("revVillage")} options={villages} required />
                </div>
            </div>

            <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <p className="text-sm font-bold text-blue-700 mb-4 uppercase tracking-wide">🏙️ For Urban (if applicable)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FloatInput label="Town/Municipality" value={data.town || ""} onChange={upd("town")} />
                    <FloatInput label="Ward No." value={data.wardNo || ""} onChange={upd("wardNo")} />
                </div>
            </div>

            <TableWrapper title="Table 2.1 — Springs within Village/Town" subtitle="*Spring Code is mandatory | Revenue Village auto-filled from selection above">
                <thead>
                    <tr>
                        {["S.N.", "Spring Name", "Revenue Village", "Hamlet/Tok", "Latitude (DD/MM/SS)", "Longitude (DD/MM/SS)", "Altitude (m)", "Spring Code *"].map(h => (
                            <th key={h} className={tableHead + " whitespace-nowrap"}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.springs.map((s, i) => {
                        const latErrors = { dd: validateCoord("lat", "dd", s.lat.dd), mm: validateCoord("lat", "mm", s.lat.mm), ss: validateCoord("lat", "ss", s.lat.ss) };
                        const lngErrors = { dd: validateCoord("lng", "dd", s.lng.dd), mm: validateCoord("lng", "mm", s.lng.mm), ss: validateCoord("lng", "ss", s.lng.ss) };
                        return (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                <td className={tableCell + " font-bold text-slate-500 text-center w-12"}>{i + 1}</td>
                                <td className={tableCell}><input className={tinp + " w-[80px] "} value={s.name} onChange={e => updSpring(i, "name", e.target.value)} placeholder="Enter spring name" /></td>
                                <td className={tableCell}><span className="text-base font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg inline-block min-w-[120px]">{data.revVillage || "—"}</span></td>
                                <td className={tableCell}><input className={tinp + " min-w-[80px] h-[30px]"} value={s.hamlet} onChange={e => updSpring(i, "hamlet", e.target.value)} placeholder="Hamlet/Tok" /></td>
                                <td className={tableCell}>
                                    <div className="flex gap-1.5">
                                        {["dd", "mm", "ss"].map(p => (
                                            <div key={p} className="flex flex-col">
                                                <input className={`${inp} w-8 text-center ${latErrors[p] ? 'border-red-400 bg-red-50' : ''}`} value={s.lat[p]} onChange={e => updCoord(i, "lat", p, e.target.value)} placeholder={p.toUpperCase()} maxLength={2} />
                                                {latErrors[p] && <span className="text-[13px] text-red-500 mt-1 max-w-[92px]">{latErrors[p]}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className={tableCell}>
                                    <div className="flex gap-1.5">
                                        {["dd", "mm", "ss"].map(p => (
                                            <div key={p} className="flex flex-col">
                                                <input className={`${inp} w-8 text-center ${lngErrors[p] ? 'border-red-400 bg-red-50' : ''}`} value={s.lng[p]} onChange={e => updCoord(i, "lng", p, e.target.value)} placeholder={p.toUpperCase()} maxLength={2} />
                                                {lngErrors[p] && <span className="text-[13px] text-red-500 mt-1 max-w-[92px]">{lngErrors[p]}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className={tableCell}><input className={tinp + " w-24"} value={s.altitude} onChange={e => updSpring(i, "altitude", e.target.value)} placeholder="meters" type="number" /></td>
                                <td className={tableCell}><input className={tinp + " w-28 border-amber-300 bg-amber-50"} value={s.code} onChange={e => updSpring(i, "code", e.target.value)} placeholder="Required *" required /></td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr><td colSpan={8} className="px-4 py-3">
                        <div className="flex gap-3">
                            <button type="button" onClick={addSpringRow} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold">+ Add Spring</button>
                            {data.springs.length > 1 && <button type="button" onClick={delSpringRow} className="text-sm px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all font-semibold">− Remove Last</button>}
                        </div>
                    </td></tr>
                </tfoot>
            </TableWrapper>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatInput label="Survey Date" value={data.surveyDate || ""} onChange={upd("surveyDate")} type="date" />
            </div>
        </div>
    );
}

function Section3({ data, setData, springNames }) {
    // Auto-sync rows to match springNames count
    useEffect(() => {
        const count = Math.max(springNames.length, 1);
        setData(d => ({
            ...d,
            desc31: Array.from({ length: count }, (_, i) => ({
                ...(d.desc31[i] || { type: "", typeOther: "", nature: "", newlyEmerged: "", muddy: "", cleanliness: "" }),
                springName: springNames[i] || ""
            })),
            desc32: Array.from({ length: count }, (_, i) => ({
                ...(d.desc32[i] || { ownership: "", chamber: "", permStruct: "", pipeSupply: "", schemeType: "", population: "" }),
                springName: springNames[i] || ""
            }))
        }));
    }, [springNames.join(",")]);
    const upd31 = (i, k, v) => setData(d => ({ ...d, desc31: d.desc31.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    const upd32 = (i, k, v) => setData(d => ({ ...d, desc32: d.desc32.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));

    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">📝</div>
                <div><p className={secTitle}>Spring Description</p><p className="text-sm text-slate-400">Section 3 of 10</p></div>
            </div>
            <InfoBadge text="Spring names are auto-populated from Section 2. Rows match the number of springs you added." />

            <TableWrapper title="Table 3.1 — Spring Type & Nature">
                <thead>
                    <tr>
                        {["S.N.", "Spring Name", "Spring Type", "Spring Nature", "Newly Emerged (last 10yr)", "Muddy Water in Rain", "Cleanliness"].map(h => (
                            <th key={h} className={tableHead}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.desc31.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                            <td className={tableCell}>
                                <select className={tsel + " min-w-[130px]"} value={row.type} onChange={e => upd31(i, "type", e.target.value)}>
                                    <option value="">— Select —</option>
                                    {SPRING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {row.type === "Other" && <input className={tinp + " mt-2"} value={row.typeOther || ""} onChange={e => upd31(i, "typeOther", e.target.value)} placeholder="Specify..." />}
                            </td>
                            <td className={tableCell}><select className={tsel + " min-w-[120px]"} value={row.nature} onChange={e => upd31(i, "nature", e.target.value)}><option value="">— Select —</option>{SPRING_NATURES.map(n => <option key={n} value={n}>{n}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.newlyEmerged} onChange={e => upd31(i, "newlyEmerged", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.muddy} onChange={e => upd31(i, "muddy", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[140px]"} value={row.cleanliness} onChange={e => upd31(i, "cleanliness", e.target.value)}><option value="">—</option><option>Satisfactory</option><option>Unsatisfactory</option></select></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>

            <TableWrapper title="Table 3.2 — Ownership & Infrastructure">
                <thead>
                    <tr>
                        {["S.N.", "Spring Name", "Ownership", "Chamber/Tank?", "Permanent Structure?", "Pipe Water Supply?", "Scheme Type", "Population Benefited"].map(h => (
                            <th key={h} className={tableHead}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.desc32.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-10"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">{row.springName || "—"}</span></td>
                            <td className={tableCell}><select className={tsel + " min-w-[100px]"} value={row.ownership} onChange={e => upd32(i, "ownership", e.target.value)}><option value="">—</option><option>Public</option><option>Private</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[80px]"} value={row.chamber} onChange={e => upd32(i, "chamber", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[80px]"} value={row.permStruct} onChange={e => upd32(i, "permStruct", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[80px]"} value={row.pipeSupply} onChange={e => upd32(i, "pipeSupply", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[140px]"} value={row.schemeType} onChange={e => upd32(i, "schemeType", e.target.value)}><option value="">—</option><option>Single Village</option><option>Multiple Village</option></select></td>
                            <td className={tableCell}><input className={tinp + " w-24"} type="number" min="0" value={row.population} onChange={e => upd32(i, "population", e.target.value)} placeholder="No." /></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>
        </div>
    );
}

function Section4({ data, setData }) {
    const photos = [
        { key: "closeUp", label: "A — Close-up photograph", hint: "~2m from spring outlet" },
        { key: "wideAngle", label: "B — Wide angle photograph", hint: "10–20m from spring outlet" },
        { key: "selfie", label: "C — Selfie with spring", hint: "Clear face + spring visible" },
    ];
    const handleFile = (key, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => setData(d => ({ ...d, [key + "Preview"]: e.target.result, [key + "File"]: file }));
        reader.readAsDataURL(file);
    };
    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">📷</div>
                <div><p className={secTitle}>Capture Three Photographs</p><p className="text-xs text-slate-400">Section 4 of 10 — JPG/JPEG, max 5MB each</p></div>
            </div>
            <InfoBadge text="All three photos are required: close-up, wide-angle, and selfie with spring. JPG/JPEG format only." />
            <div className="space-y-4">
                {photos.map(p => (
                    <div key={p.key} className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-700">{p.label}</p>
                            <p className="text-xs text-slate-400 mb-3">{p.hint}</p>
                            <input type="file" accept=".jpg,.jpeg"
                                onChange={e => handleFile(p.key, e.target.files[0])}
                                className="text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-slate-500" />
                        </div>
                        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
                            {data[p.key + "Preview"]
                                ? <img src={data[p.key + "Preview"]} alt="preview" className="w-full h-full object-cover" />
                                : <div className="text-center text-xs text-slate-400"><div className="text-2xl mb-1">🖼️</div>No image</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Section5({ data, setData, springNames }) {
    useEffect(() => {
        const count = Math.max(springNames.length, 1);
        setData(d => ({
            ...d,
            hydro: Array.from({ length: count }, (_, i) => ({
                ...(d.hydro[i] || { typology: "", rockType: "", aquifer: "", topo: "", settlement: "", accessibility: "" }),
                springName: springNames[i] || ""
            }))
        }));
    }, [springNames.join(",")]);
    const upd = (i, k, v) => setData(d => ({ ...d, hydro: d.hydro.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🪨</div>
                <div><p className={secTitle}>Hydro-Geological Information</p><p className="text-sm text-slate-400">Section 5 of 10</p></div>
            </div>
            <TableWrapper title="Table 5.1 — Geological Characteristics">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Spring Typology", "Rock Type", "Aquifer Type", "Topographical Feature", "Settlement Near?", "Accessibility"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.hydro.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                            <td className={tableCell}><select className={tsel + " min-w-[130px]"} value={row.typology} onChange={e => upd(i, "typology", e.target.value)}><option value="">—</option>{TYPOLOGIES.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[120px]"} value={row.rockType} onChange={e => upd(i, "rockType", e.target.value)}><option value="">—</option>{ROCK_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[120px]"} value={row.aquifer} onChange={e => upd(i, "aquifer", e.target.value)}><option value="">—</option>{AQUIFER_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[170px]"} value={row.topo} onChange={e => upd(i, "topo", e.target.value)}><option value="">—</option>{TOPO_FEATURES.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.settlement} onChange={e => upd(i, "settlement", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[110px]"} value={row.accessibility} onChange={e => upd(i, "accessibility", e.target.value)}><option value="">—</option><option>Easy</option><option>Moderate</option><option>Difficult</option></select></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>
        </div>
    );
}

function Section6({ data, setData, springNames }) {
    useEffect(() => {
        const count = Math.max(springNames.length, 1);
        setData(d => ({
            ...d,
            phys61: Array.from({ length: count }, (_, i) => ({
                ...(d.phys61[i] || { measurable: "", discharge: "", variability: "", peakMonths: [], leanMonths: [] }),
                springName: springNames[i] || ""
            })),
            phys62: Array.from({ length: count }, (_, i) => ({
                ...(d.phys62[i] || { trend: "", colour: "", smell: "", taste: "" }),
                springName: springNames[i] || ""
            }))
        }));
    }, [springNames.join(",")]);
    const upd61 = (i, k, v) => setData(d => ({ ...d, phys61: d.phys61.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    const upd62 = (i, k, v) => setData(d => ({ ...d, phys62: d.phys62.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl">💧</div>
                <div><p className={secTitle}>General Physical Characteristics of Spring</p><p className="text-sm text-slate-400">Section 6 of 10</p></div>
            </div>

            <TableWrapper title="Table 6.1 — Discharge & Seasonality">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Discharge Measurable?", "Discharge (LPM)", "Seasonal Variability", "Peak Months (max 3)", "Lean Months (max 3)"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.phys61.map((row, i) => {
                        const peakSet = row.peakMonths || [];
                        const leanSet = row.leanMonths || [];
                        const conflict = peakSet.some(m => leanSet.includes(m));
                        return (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                                <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                                <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.measurable} onChange={e => upd61(i, "measurable", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                                <td className={tableCell}><input className={tinp + " w-28"} type="number" value={row.discharge} onChange={e => upd61(i, "discharge", e.target.value)} placeholder="LPM" /></td>
                                <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.variability} onChange={e => upd61(i, "variability", e.target.value)}><option value="">—</option><option>High</option><option>Low</option></select></td>
                                <td className={tableCell + " min-w-[240px]"}>
                                    <MonthPicker selected={peakSet} onChange={v => upd61(i, "peakMonths", v)} disabled={leanSet} />
                                    {conflict && <div className="mt-2 text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">⚠️ Cannot select same month as Lean!</div>}
                                </td>
                                <td className={tableCell + " min-w-[240px]"}>
                                    <MonthPicker selected={leanSet} onChange={v => upd61(i, "leanMonths", v)} disabled={peakSet} />
                                    {conflict && <div className="mt-2 text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">⚠️ Cannot select same month as Peak!</div>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </TableWrapper>

            <TableWrapper title="Table 6.2 — Water Quality Indicators">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Discharge Trend (10yr)", "Water Colour", "Smell/Odour", "Taste"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.phys62.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                            <td className={tableCell}><select className={tsel + " min-w-[160px]"} value={row.trend} onChange={e => upd62(i, "trend", e.target.value)}><option value="">—</option>{DISCHARGE_TRENDS.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[120px]"} value={row.colour} onChange={e => upd62(i, "colour", e.target.value)}><option value="">—</option>{WATER_COLOURS.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[140px]"} value={row.smell} onChange={e => upd62(i, "smell", e.target.value)}><option value="">—</option><option>Agreeable</option><option>Non-agreeable</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[160px]"} value={row.taste} onChange={e => upd62(i, "taste", e.target.value)}><option value="">—</option><option>Objectionable</option><option>Unobjectionable</option></select></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>
        </div>
    );
}

function Section7({ data, setData, springNames }) {
    useEffect(() => {
        const count = Math.max(springNames.length, 1);
        setData(d => ({
            ...d,
            other71: Array.from({ length: count }, (_, i) => ({
                ...(d.other71[i] || { domLandUse: "", nearLandUse: "", threat: "", degree: "", stressor: "", usage: [] }),
                springName: springNames[i] || ""
            })),
            other72: Array.from({ length: count }, (_, i) => ({
                ...(d.other72[i] || { stressorType: "", natural: [], anthropogenic: [], both: [] }),
                springName: springNames[i] || ""
            })),
            other73: Array.from({ length: count }, (_, i) => ({
                ...(d.other73[i] || { usage: [], households: "", population: "", livestock: "", dependency: "", otherSource: "" }),
                springName: springNames[i] || ""
            }))
        }));
    }, [springNames.join(",")]);
    const upd71 = (i, k, v) => setData(d => ({ ...d, other71: d.other71.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    const upd72 = (i, k, v) => setData(d => ({ ...d, other72: d.other72.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    const upd73 = (i, k, v) => setData(d => ({ ...d, other73: d.other73.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));

    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">ℹ️</div>
                <div><p className={secTitle}>Other Information of Springs</p><p className="text-sm text-slate-400">Section 7 of 10</p></div>
            </div>

            <TableWrapper title="Table 7.1 — Land Use & Threat Assessment">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Dominant Land Use (Upstream)", "Land Use Near Spring", "Resource Threat", "Degree of Threat", "Major Stressor", "Usage (max 3)"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.other71.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                            <td className={tableCell}><select className={tsel + " min-w-[120px]"} value={row.domLandUse} onChange={e => upd71(i, "domLandUse", e.target.value)}><option value="">—</option>{LAND_USE.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[120px]"} value={row.nearLandUse} onChange={e => upd71(i, "nearLandUse", e.target.value)}><option value="">—</option>{LAND_USE.map(t => <option key={t}>{t}</option>)}</select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.threat} onChange={e => upd71(i, "threat", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[110px]"} value={row.degree} onChange={e => upd71(i, "degree", e.target.value)}><option value="">—</option><option>Low</option><option>Moderate</option><option>High</option></select></td>
                            <td className={tableCell}><input className={tinp + " min-w-[130px]"} value={row.stressor || ""} onChange={e => upd71(i, "stressor", e.target.value)} placeholder="Describe..." /></td>
                            <td className={tableCell + " min-w-[200px]"}><CheckGroup options={WATER_USAGES} selected={row.usage || []} onChange={v => upd71(i, "usage", v)} max={3} /></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>

            <TableWrapper title="Table 7.2 — Stressor Classification">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Stressor Type", "Natural Stressors", "Anthropogenic Stressors", "Both Natural & Anthropogenic"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.other72.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                            <td className={tableCell}><select className={tsel + " min-w-[120px]"} value={row.stressorType || ""} onChange={e => upd72(i, "stressorType", e.target.value)}><option value="">—</option><option>Natural</option><option>Anthropogenic</option><option>Both</option></select></td>
                            <td className={tableCell + " min-w-[220px]"}><CheckGroup options={NATURAL_STRESSORS} selected={row.natural || []} onChange={v => upd72(i, "natural", v)} max={3} /></td>
                            <td className={tableCell + " min-w-[220px]"}><CheckGroup options={ANTHROPOGENIC_STRESSORS} selected={row.anthropogenic || []} onChange={v => upd72(i, "anthropogenic", v)} max={3} /></td>
                            <td className={tableCell + " min-w-[220px]"}><CheckGroup options={BOTH_STRESSORS} selected={row.both || []} onChange={v => upd72(i, "both", v)} max={3} /></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>

            <TableWrapper title="Table 7.3 — Dependency & Water Sources">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Usage (max 3)", "Households", "Population", "Livestock", "Dependency", "Other Source"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.other73.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                            <td className={tableCell + " min-w-[180px]"}><CheckGroup options={WATER_USAGES} selected={row.usage || []} onChange={v => upd73(i, "usage", v)} max={3} /></td>
                            <td className={tableCell}><input className={tinp + " w-24"} type="number" min="0" value={row.households} onChange={e => upd73(i, "households", e.target.value)} placeholder="No." /></td>
                            <td className={tableCell}><input className={tinp + " w-24"} type="number" min="0" value={row.population} onChange={e => upd73(i, "population", e.target.value)} placeholder="No." /></td>
                            <td className={tableCell}><input className={tinp + " w-24"} type="number" min="0" value={row.livestock} onChange={e => upd73(i, "livestock", e.target.value)} placeholder="No." /></td>
                            <td className={tableCell}><select className={tsel + " min-w-[110px]"} value={row.dependency} onChange={e => upd73(i, "dependency", e.target.value)}><option value="">—</option><option>Low</option><option>Moderate</option><option>High</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[140px]"} value={row.otherSource} onChange={e => upd73(i, "otherSource", e.target.value)}><option value="">—</option>{OTHER_WATER_SOURCES.map(s => <option key={s}>{s}</option>)}</select></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>
        </div>
    );
}

function Section8({ data, setData, springNames }) {
    useEffect(() => {
        const count = Math.max(springNames.length, 1);
        setData(d => ({
            ...d,
            recharge: Array.from({ length: count }, (_, i) => ({
                ...(d.recharge[i] || { demarcated: "", totalArea: "", forestLand: "", revenueLand: "", privateLand: "", kml: null }),
                springName: springNames[i] || ""
            }))
        }));
    }, [springNames.join(",")]);
    const upd = (i, k, v) => setData(d => ({ ...d, recharge: d.recharge.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-xl">🗺️</div>
                <div><p className={secTitle}>Recharge Area Demarcation</p><p className="text-sm text-slate-400">Section 8 of 10</p></div>
            </div>
            <InfoBadge text="Upload KML/KMZ files for geo-mapped recharge zones. Total recharge area = Forest Land + Revenue Land + Private Land." />
            <TableWrapper title="Table 8.1 — Recharge Area Details">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Demarcated?", "Total Area (Ha)", "Forest Land (Ha)", "Revenue Land (Ha)", "Private Land (Ha)", "Upload KML"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.recharge.map((row, i) => {
                        const total = (parseFloat(row.forestLand) || 0) + (parseFloat(row.revenueLand) || 0) + (parseFloat(row.privateLand) || 0);
                        return (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                                <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                                <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.demarcated} onChange={e => upd(i, "demarcated", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                                <td className={tableCell}><div className={`w-24 text-center text-base font-bold rounded-xl px-3 py-2 ${total > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{total > 0 ? total.toFixed(2) : "0.00"}</div></td>
                                <td className={tableCell}><input className={tinp + " w-28"} type="number" min="0" step="0.01" value={row.forestLand} onChange={e => upd(i, "forestLand", e.target.value)} placeholder="0.00" /></td>
                                <td className={tableCell}><input className={tinp + " w-28"} type="number" min="0" step="0.01" value={row.revenueLand} onChange={e => upd(i, "revenueLand", e.target.value)} placeholder="0.00" /></td>
                                <td className={tableCell}><input className={tinp + " w-28"} type="number" min="0" step="0.01" value={row.privateLand} onChange={e => upd(i, "privateLand", e.target.value)} placeholder="0.00" /></td>
                                <td className={tableCell}><input type="file" accept=".kml,.kmz" className="text-sm file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-teal-50 file:text-teal-700" onChange={e => upd(i, "kml", e.target.files[0])} /></td>
                            </tr>
                        );
                    })}
                </tbody>
            </TableWrapper>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">8.1 — Map of Spring Recharge Area (Geo Coordinates)</p>
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm bg-slate-50">
                    📌 Upload KML file above to auto-populate geo coordinates
                </div>
            </div>
        </div>
    );
}

function Section9({ data, setData, springNames }) {
    useEffect(() => {
        const count = Math.max(springNames.length, 1);
        setData(d => ({
            ...d,
            community: Array.from({ length: count }, (_, i) => ({
                ...(d.community[i] || { prevInit: "", samitiExists: "", samitiInterested: "", samitiMonitor: "" }),
                springName: springNames[i] || ""
            }))
        }));
    }, [springNames.join(",")]);
    const upd = (i, k, v) => setData(d => ({ ...d, community: d.community.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }));
    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-xl">👥</div>
                <div><p className={secTitle}>Community Initiatives</p><p className="text-sm text-slate-400">Section 9 of 10</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                <div><span className="font-bold">*</span> The Samiti will open an O&amp;M account and collect user charges for spring operations &amp; maintenance.</div>
                <div><span className="font-bold">**</span> The Samiti can work as a petty contractor; beneficiary labour can be credited to their O&amp;M account.</div>
            </div>
            <TableWrapper title="Table 9.1 — Dhara Naula Sanrakshan Samiti">
                <thead>
                    <tr>{["S.N.", "Spring Name", "Previous Community Initiatives", "Samiti Exists in Village *", "Samiti Interested in Implementation **", "Samiti for Monitoring & Maintenance"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {data.community.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className={tableCell + " text-center font-bold text-slate-400 w-12"}>{i + 1}</td>
                            <td className={tableCell}><span className="text-base font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">{row.springName || "—"}</span></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.prevInit} onChange={e => upd(i, "prevInit", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.samitiExists} onChange={e => upd(i, "samitiExists", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.samitiInterested} onChange={e => upd(i, "samitiInterested", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                            <td className={tableCell}><select className={tsel + " min-w-[90px]"} value={row.samitiMonitor} onChange={e => upd(i, "samitiMonitor", e.target.value)}><option value="">—</option><option>Yes</option><option>No</option></select></td>
                        </tr>
                    ))}
                </tbody>
            </TableWrapper>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold text-blue-800">📋 Important Note</p>
                <p className="text-xs text-blue-700 mt-1">PIA will ensure regular monitoring of discharge from springs (Peak Season: Aug–Oct | Lean Season: Apr–Jun). Data will be uploaded via SARRA APP/Dashboard. PIA may seek Samiti support for monitoring.</p>
            </div>
        </div>
    );
}

function Section10({ data, setData, springNames, sec1, sec2 }) {
    const upd = k => v => setData(d => ({ ...d, [k]: v }));
    const updAct = (id, k, v) => setData(d => ({ ...d, activities: { ...d.activities, [id]: { ...d.activities[id], [k]: v } } }));

    // Auto-fetch from previous sections
    useEffect(() => {
        setData(d => ({
            ...d,
            deptName: d.deptName || sec1?.department || "",
            deptOther: d.deptOther || sec1?.deptOther || "",
            district: d.district || sec1?.district || "",
            block10: d.block10 || sec1?.block || "",
            gp10: d.gp10 || sec2?.springGP || "",
            nodalOfficer: d.nodalOfficer || sec1?.nodalOfficer || "",
            contact: d.contact || sec1?.contactNo || "",
            email10: d.email10 || sec1?.email || "",
        }));
    }, []);

    const blocks = (data.district || sec1?.district) ? (BLOCKS_BY_DISTRICT[data.district || sec1?.district] || []) : [];

    const totalBudget = [data.dprBudget, data.interventionsBudget, data.monitoringBudget]
        .reduce((acc, v) => acc + (parseFloat(v) || 0), 0);

    const files = [
        { key: "dpr_report", label: "1. Detail Project Report (DPR)" },
        { key: "samiti_detail", label: "2. Detail of Dhara Naula Sanrakshan Samiti" },
        { key: "mou_spring", label: "3. MOU for O&M of Spring Rejuvenation Works" },
        { key: "dlec_minutes", label: "4. DLEC Minutes" },
        { key: "other_docs", label: "5. Any other relevant documents" },
    ];

    return (
        <div className="space-y-6">
            <div className={secHead}>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">💰</div>
                <div><p className={secTitle}>Summary of Proposed Spring Rejuvenation Plan</p><p className="text-sm text-slate-400">Section 10 of 10</p></div>
            </div>

            <InfoBadge text="Officer details are auto-filled from Section 1. You can edit them if needed." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-2 bg-white rounded-2xl border-2 border-slate-200">
                <p className="col-span-2 text-base font-bold text-slate-700 border-b-2 border-slate-100 pb-3">👤 Responsible Officer Details</p>
                <div>
                    <FloatSelect label="Department/Organization" value={data.deptName || ""} onChange={upd("deptName")} options={DEPARTMENTS} />
                    {data.deptName === "Other Department/Organization" && <div className="mt-3"><FloatInput label="Specify" value={data.deptOther || ""} onChange={upd("deptOther")} /></div>}
                </div>
                <FloatSelect label="District" value={data.district || ""} onChange={v => setData(d => ({ ...d, district: v, block10: "", gp10: "" }))} options={DISTRICTS} />
                <FloatSelect label="Block" value={data.block10 || ""} onChange={upd("block10")} options={blocks} />
                <FloatInput label="Gram Panchayat/Town" value={data.gp10 || ""} onChange={upd("gp10")} />
                <FloatInput label="Nodal Officer Name" value={data.nodalOfficer || ""} onChange={upd("nodalOfficer")} />
                <FloatInput label="Designation" value={data.designation || ""} onChange={upd("designation")} />
                <FloatInput label="Contact No." value={data.contact || ""} onChange={upd("contact")} type="tel" maxLength={10} />
                <FloatInput label="Email ID" value={data.email10 || ""} onChange={upd("email10")} type="email" />
            </div>

            <TableWrapper title="Table 10.1 — Budget Allocation" subtitle="(Rs. in Lakh)">
                <thead>
                    <tr>{["S.N.", "Budget Head & Allocation", "Budget Proposed (₹ Lakh)"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {[
                        { sn: "1", label: "DPR Preparation (1–2% of total project cost)", key: "dprBudget" },
                        { sn: "2", label: "Total cost of Interventions / Activities", key: "interventionsBudget" },
                        { sn: "3", label: "Monitoring & Evaluation (2% of total project cost)", key: "monitoringBudget" },
                    ].map(row => (
                        <tr key={row.key} className="bg-white">
                            <td className={tableCell + " text-center font-bold text-slate-400 w-10"}>{row.sn}</td>
                            <td className={tableCell}>{row.label}</td>
                            <td className={tableCell}><input className={tinp + " w-40"} type="number" min="0" step="0.001" value={data[row.key] || ""} onChange={e => setData(d => ({ ...d, [row.key]: e.target.value }))} placeholder="0.000" /></td>
                        </tr>
                    ))}
                    <tr className="bg-blue-50">
                        <td className={tableCell}></td>
                        <td className={tableCell + " font-bold text-blue-800"}>Total</td>
                        <td className={tableCell}><div className="w-40 text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">₹ {totalBudget.toFixed(3)} L</div></td>
                    </tr>
                </tbody>
            </TableWrapper>

            <TableWrapper title="Table 10.2 — Physical Targets & Financial Amounts" subtitle="(Year-wise per spring)">
                <thead>
                    <tr>
                        <th className={tableHead}>S.N.</th>
                        <th className={tableHead}>Activity</th>
                        <th className={tableHead}>Unit</th>
                        {springNames.filter(Boolean).map(s => <th key={s} className={tableHead + " max-w-[100px] truncate"}>{s}</th>)}
                        <th className={tableHead}>Total Target</th>
                        <th className={tableHead}>Amount (₹L)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-slate-50"><td className={tableCell + " font-bold"}>1</td><td className={tableCell + " font-bold"} colSpan={3}>DPR Preparation</td><td colSpan={(springNames.filter(Boolean).length || 0)} className={tableCell}></td><td className={tableCell}><input className={tinp + " w-28"} type="number" value={data.dprFinancial || ""} onChange={e => setData(d => ({ ...d, dprFinancial: e.target.value }))} placeholder="0.000" /></td></tr>
                    <tr className="bg-slate-50"><td className={tableCell + " font-bold"}>2</td><td className={tableCell + " font-bold"} colSpan={2 + springNames.filter(Boolean).length + 2}>Interventions / Activities</td></tr>
                    {ACTIVITIES.map((act, idx) => {
                        const aData = data.activities?.[act.id] || {};
                        const totTarget = springNames.filter(Boolean).reduce((sum, s) => sum + (parseFloat(aData[s]) || 0), 0);
                        return (
                            <tr key={act.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                                <td className={tableCell + " text-slate-400 text-center"}>2.{idx + 1}</td>
                                <td className={tableCell}>{act.label}</td>
                                <td className={tableCell + " text-center text-slate-500 text-xs font-medium"}>{act.unit}</td>
                                {springNames.filter(Boolean).map(s => (
                                    <td key={s} className={tableCell}><input className={tinp + " w-20"} type="number" min="0" value={aData[s] || ""} onChange={e => updAct(act.id, s, e.target.value)} placeholder="0" /></td>
                                ))}
                                <td className={tableCell}><div className="w-24 text-center py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">{totTarget > 0 ? totTarget.toFixed(2) : "—"}</div></td>
                                <td className={tableCell}><input className={tinp + " w-28"} type="number" value={aData.financial || ""} onChange={e => updAct(act.id, "financial", e.target.value)} placeholder="0.000" /></td>
                            </tr>
                        );
                    })}
                    <tr className="bg-blue-50">
                        <td className={tableCell + " font-bold"}>3</td>
                        <td className={tableCell + " font-bold"}>Monitoring & Evaluation **</td>
                        <td className={tableCell}></td>
                        {springNames.filter(Boolean).map(s => <td key={s} className={tableCell}></td>)}
                        <td className={tableCell}></td>
                        <td className={tableCell}><input className={tinp + " w-28"} type="number" value={data.monitoringFinancial || ""} onChange={e => setData(d => ({ ...d, monitoringFinancial: e.target.value }))} placeholder="0.000" /></td>
                    </tr>
                </tbody>
            </TableWrapper>

            <TableWrapper title="Table 10.3 — Financial Convergence" subtitle="(Rs. in Lakh)">
                <thead>
                    <tr>{["Total Financial Amount", "Fund from PIA/Dept (A)", "Fund from Other Sources (B)", "Fund from SARRA Convergence (C)", "Total (A+B+C)"].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    <tr className="bg-white">
                        {["totalConvergence", "piaFund", "otherFund", "sarraFund", "totalFund"].map(k => (
                            <td key={k} className={tableCell}><input className={tinp + " w-28"} type="number" min="0" step="0.001" value={data[k] || ""} onChange={e => setData(d => ({ ...d, [k]: e.target.value }))} placeholder="0.000" /></td>
                        ))}
                    </tr>
                </tbody>
            </TableWrapper>

            <div className="p-5 bg-white rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-4">List of Annexures</p>
                <div className="space-y-3">
                    {files.map(f => (
                        <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <label className="text-sm text-slate-600 flex-1">{f.label}</label>
                            <div className="flex items-center gap-2">
                                <input type="file" accept=".pdf" className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 text-slate-400" onChange={e => setData(d => ({ ...d, [f.key]: e.target.files[0] }))} />
                                {data[f.key] && <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatInput label="Date of Proposal Submission" value={data.submissionDate || ""} onChange={upd("submissionDate")} type="date" />
                <FloatInput label="Submitted By (Name)" value={data.submittedBy || ""} onChange={upd("submittedBy")} />
                <div>
                    <label className={lbl}>Signature with Stamp</label>
                    <div className="flex items-center gap-2">
                        <input type="file" accept=".jpg,.jpeg,.png" onChange={e => setData(d => ({ ...d, signature: e.target.files[0] }))} className="text-xs file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-slate-500" />
                        {data.signature && <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>}
                    </div>
                </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                <strong>Note:</strong> The above format may be further modified with technical and scientific inputs from different departments/organisations.
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const initState = () => ({
    sec1: { department: "", deptOther: "", district: "", block: "", address: "", nodalOfficer: "", contactNo: "", email: "" },
    sec2: {
        springDistrict: "", springBlock: "", springGP: "", revVillage: "", town: "", wardNo: "", surveyDate: "",
        springs: [{ name: "", village: "", hamlet: "", lat: { dd: "", mm: "", ss: "" }, lng: { dd: "", mm: "", ss: "" }, altitude: "", code: "" }]
    },
    sec3: {
        desc31: [{ springName: "", type: "", typeOther: "", nature: "", newlyEmerged: "", muddy: "", cleanliness: "" }],
        desc32: [{ springName: "", ownership: "", chamber: "", permStruct: "", pipeSupply: "", schemeType: "", population: "" }]
    },
    sec4: {},
    sec5: { hydro: [{ springName: "", typology: "", rockType: "", aquifer: "", topo: "", settlement: "", accessibility: "" }] },
    sec6: {
        phys61: [{ springName: "", measurable: "", discharge: "", variability: "", peakMonths: [], leanMonths: [] }],
        phys62: [{ springName: "", trend: "", colour: "", smell: "", taste: "" }]
    },
    sec7: {
        other71: [{ springName: "", domLandUse: "", nearLandUse: "", threat: "", degree: "", stressor: "", usage: [] }],
        other72: [{ springName: "", stressorType: "", natural: [], anthropogenic: [], both: [] }],
        other73: [{ springName: "", usage: [], households: "", population: "", livestock: "", dependency: "", otherSource: "" }]
    },
    sec8: { recharge: [{ springName: "", demarcated: "", totalArea: "", forestLand: "", revenueLand: "", privateLand: "", kml: null }] },
    sec9: { community: [{ springName: "", prevInit: "", samitiExists: "", samitiInterested: "", samitiMonitor: "" }] },
    sec10: {
        deptName: "", district: "", block10: "", gp10: "", nodalOfficer: "", designation: "", contact: "", email10: "",
        dprBudget: "", interventionsBudget: "", monitoringBudget: "", dprFinancial: "", monitoringFinancial: "",
        activities: {}, totalConvergence: "", piaFund: "", otherFund: "", sarraFund: "", totalFund: "", submissionDate: "", submittedBy: ""
    }
});

export default function SpringshedDPR() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState(initState());
    const [savedDraft, setSavedDraft] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const springNames = form.sec2.springs.map(s => s.name).filter(Boolean);

    const updSec = sec => updFn => setForm(f => ({ ...f, [sec]: typeof updFn === "function" ? updFn(f[sec]) : updFn }));

    const handleDraft = async () => {
        localStorage.setItem("sarra_dpr_draft", JSON.stringify(form));
        setSavedDraft(true);
        setTimeout(() => setSavedDraft(false), 2500);
        
        // Also save to backend
        try {
            const formData = buildFormData(form);
            const response = await postFormData('/dpr/springshed/draft', formData);
            if (response?.success) {
                toast.success('Draft saved securely to server.');
            } else {
                toast.error(response?.message || 'Failed to save draft to server.');
            }
        } catch (error) {
            toast.error('Failed to save draft to server.');
        }
    };

    const buildFormData = (form) => {
        const payload = {
            section1_deptDetails: {
                department: form.sec1.department || "Other Department/Organization",
                departmentOther: form.sec1.deptOther || "",
                district: form.sec1.district || "Dehradun",
                block: form.sec1.block || "Raipur",
                address: form.sec1.address || "Draft Address",
                nodalOfficer: form.sec1.nodalOfficer || "Officer",
                contactNo: form.sec1.contactNo || "9999999999",
                email: form.sec1.email || "test@test.com"
            },
            section2_springIdentification: {
                springDistrict: form.sec2.springDistrict || "Dehradun",
                springBlock: form.sec2.springBlock || "Raipur",
                springGP: form.sec2.springGP || "Raipur",
                revenuVillage: form.sec2.revVillage || "Raipur (C)",
                town: form.sec2.town || "",
                wardNo: form.sec2.wardNo || "",
                surveyDate: form.sec2.surveyDate || new Date().toISOString(),
                springs: form.sec2.springs.map(s => ({
                    name: s.name || "Unknown",
                    revenueVillage: s.village || form.sec2.revVillage || "Unknown",
                    hamletTok: s.hamlet || "Unknown",
                    latitude: s.lat || {dd:"", mm:"", ss:""},
                    longitude: s.lng || {dd:"", mm:"", ss:""},
                    altitude: s.altitude || "0",
                    springCode: s.code || ""
                }))
            },
            section3_springDescription: {
                table31: form.sec3.desc31.map(s => ({
                    springName: s.springName || "Unknown",
                    springType: s.type || "Other",
                    springTypeOther: s.typeOther || "",
                    springNature: s.nature || "Seasonal",
                    newlyEmerged: s.newlyEmerged === "Yes",
                    muddyWaterInRain: s.muddy === "Yes",
                    cleanliness: s.cleanliness || "Satisfactory"
                })),
                table32: form.sec3.desc32.map(s => ({
                    springName: s.springName || "Unknown",
                    ownership: s.ownership || "Public",
                    chamberTank: s.chamber === "Yes",
                    permanentStructure: s.permStruct === "Yes",
                    pipeWaterSupply: s.pipeSupply === "Yes",
                    schemeType: s.schemeType || "Single Village",
                    populationBenefited: parseInt(s.population) || 0
                }))
            },
            section5_hydroGeological: {
                table51: form.sec5.hydro.map(s => ({
                    springName: s.springName || "Unknown",
                    typology: s.typology || "Contact",
                    rockType: s.rockType || "Schist",
                    aquiferType: s.aquifer || "Confined",
                    topographicalFeature: s.topo || "Hill top",
                    settlementNearSpring: s.settlement === "Yes",
                    accessibility: s.accessibility || "Easy"
                }))
            },
            section6_physicalCharacteristics: {
                table61: form.sec6.phys61.map(s => ({
                    springName: s.springName || "Unknown",
                    dischargeMessurable: s.measurable === "Yes",
                    springDischargeLPM: parseFloat(s.discharge) || null,
                    seasonalVariability: s.variability || "High",
                    peakMonths: s.peakMonths.length ? s.peakMonths : ["Jan"],
                    leanMonths: s.leanMonths.length ? s.leanMonths : ["Feb"]
                })),
                table62: form.sec6.phys62.map(s => ({
                    springName: s.springName || "Unknown",
                    dischargeTrend: s.trend || "No change",
                    waterColour: s.colour || "Clean",
                    smellOdour: s.smell || "Agreeable",
                    taste: s.taste || "Unobjectionable"
                }))
            },
            section7_otherInformation: {
                table71: form.sec7.other71.map(s => ({
                    springName: s.springName || "Unknown",
                    dominantLandUse: s.domLandUse || "Agriculture",
                    landUseNearSpring: s.nearLandUse || "Agriculture",
                    resourceThreat: s.threat === "Yes",
                    degreeOfThreat: s.degree || "Low",
                    majorStressor: s.stressor || "",
                    waterUsage: s.usage.length ? s.usage : ["Drinking/Cooking"]
                })),
                table72: form.sec7.other72.map(s => ({
                    springName: s.springName || "Unknown",
                    stressorType: s.stressorType || "Both",
                    naturalStressors: s.natural || [],
                    anthropogenicStressors: s.anthropogenic || [],
                    bothStressors: s.both || []
                })),
                table73: form.sec7.other73.map(s => ({
                    springName: s.springName || "Unknown",
                    waterUsage: s.usage || [],
                    dependentHouseholds: parseInt(s.households) || 0,
                    dependentPopulation: parseInt(s.population) || 0,
                    dependentLivestock: parseInt(s.livestock) || 0,
                    dependencyLevel: s.dependency || "Low",
                    otherWaterSource: s.otherSource || "None"
                }))
            },
            section8_rechargeArea: {
                table81: form.sec8.recharge.map(s => ({
                    springName: s.springName || "Unknown",
                    rechargeAreaDemarcated: s.demarcated === "Yes",
                    totalRechargeAreaHa: (parseFloat(s.forestLand) || 0) + (parseFloat(s.revenueLand) || 0) + (parseFloat(s.privateLand) || 0),
                    forestLandHa: parseFloat(s.forestLand) || 0,
                    revenueLandHa: parseFloat(s.revenueLand) || 0,
                    privateLandHa: parseFloat(s.privateLand) || 0
                }))
            },
            section9_communityInitiatives: {
                table91: form.sec9.community.map(s => ({
                    springName: s.springName || "Unknown",
                    previousCommunityInitiatives: s.prevInit === "Yes",
                    dharaNaulaSamitiExists: s.samitiExists === "Yes",
                    samitiInterestedInImplementation: s.samitiInterested === "Yes",
                    samitiForMonitoring: s.samitiMonitor === "Yes"
                }))
            },
            section10_budgetAndPlan: {
                responsibleOfficer: {
                    department: form.sec10.deptName || "Irrigation Department",
                    district: form.sec10.district || "Dehradun",
                    block: form.sec10.block10 || "Raipur",
                    gramPanchayat: form.sec10.gp10 || "Raipur",
                    nodalOfficerName: form.sec10.nodalOfficer || "Test",
                    designation: form.sec10.designation || "Test",
                    contactNo: form.sec10.contact || "9999999999",
                    email: form.sec10.email10 || "test@test.com"
                },
                table101: {
                    dprPreparationBudgetLakh: parseFloat(form.sec10.dprBudget) || 0,
                    totalInterventionsCostLakh: parseFloat(form.sec10.interventionsBudget) || 0,
                    monitoringEvaluationBudgetLakh: parseFloat(form.sec10.monitoringBudget) || 0,
                    totalBudgetLakh: (parseFloat(form.sec10.dprBudget)||0) + (parseFloat(form.sec10.interventionsBudget)||0) + (parseFloat(form.sec10.monitoringBudget)||0)
                },
                table102: Object.keys(form.sec10.activities || {}).map(actId => {
                    const actData = form.sec10.activities[actId];
                    const actConfig = ACTIVITIES.find(a => a.id === actId) || {};
                    return {
                        activityId: actId,
                        activityLabel: actConfig.label || actId,
                        unit: actConfig.unit || "Nos.",
                        springTargets: form.sec2.springs.map(s => ({
                            springName: s.name,
                            target: parseFloat(actData[s.name]) || 0
                        })).filter(t => t.target > 0),
                        totalPhysicalTarget: form.sec2.springs.reduce((sum, s) => sum + (parseFloat(actData[s.name]) || 0), 0),
                        financialAmountLakh: parseFloat(actData.financial) || 0
                    };
                }).filter(a => a.totalPhysicalTarget > 0 || a.financialAmountLakh > 0),
                dprFinancialAmountLakh: parseFloat(form.sec10.dprFinancial) || 0,
                monitoringFinancialAmountLakh: parseFloat(form.sec10.monitoringFinancial) || 0,
                table103: {
                    totalFinancialAmountLakh: parseFloat(form.sec10.totalConvergence) || 0,
                    fundFromPIADeptLakh: parseFloat(form.sec10.piaFund) || 0,
                    fundFromOtherSourcesLakh: parseFloat(form.sec10.otherFund) || 0,
                    fundFromSARRAConvergenceLakh: parseFloat(form.sec10.sarraFund) || 0,
                    grandTotalLakh: parseFloat(form.sec10.totalFund) || 0
                },
                submissionDate: form.sec10.submissionDate || new Date().toISOString(),
                submittedByName: form.sec10.submittedBy || "Officer"
            }
        };

        const fd = new FormData();
        Object.keys(payload).forEach(key => {
            fd.append(key, JSON.stringify(payload[key]));
        });

        if (form.sec4.closeUpFile) fd.append("closeUpPhoto", form.sec4.closeUpFile);
        if (form.sec4.wideAngleFile) fd.append("wideAnglePhoto", form.sec4.wideAngleFile);
        if (form.sec4.selfieFile) fd.append("selfieWithSpring", form.sec4.selfieFile);
        
        form.sec8.recharge.forEach(r => {
            if (r.kml) fd.append("kmlFile", r.kml);
        });

        if (form.sec10.dpr_report) fd.append("detailProjectReport", form.sec10.dpr_report);
        if (form.sec10.samiti_detail) fd.append("dharaNaulaDetails", form.sec10.samiti_detail);
        if (form.sec10.mou_spring) fd.append("mouSpringRejuvenation", form.sec10.mou_spring);
        if (form.sec10.dlec_minutes) fd.append("dlecMinutes", form.sec10.dlec_minutes);
        if (form.sec10.other_docs) fd.append("otherDocuments", form.sec10.other_docs);
        if (form.sec10.signature) fd.append("signatureWithStamp", form.sec10.signature);

        return fd;
    };

    const handleSubmitForm = async () => {
        setIsSubmitting(true);
        try {
            const formData = buildFormData(form);
            const response = await postFormData('/dpr/springshed/submit', formData);
            if (response?.success) {
                toast.success('DPR Submitted Successfully!');
                setSubmitted(true);
                localStorage.removeItem("sarra_dpr_draft");
            } else {
                toast.error(response?.message || 'Submission failed. Please check required fields.');
            }
        } catch (error) {
            toast.error('Submission failed. Please check required fields.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearDraft = () => {
        if (window.confirm("Are you sure? This will clear ALL saved data and reset the form.")) {
            localStorage.removeItem("sarra_dpr_draft");
            setForm(initState());
            setStep(1);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem("sarra_dpr_draft");
        if (saved) { try { setForm(JSON.parse(saved)); } catch (e) { } }
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 320, behavior: "smooth" });
    }, [step]);

    const progress = Math.round(((step - 1) / 9) * 100);

    if (submitted) return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
                <h2 className="text-2xl font-bold text-green-700 mb-3">DPR Submitted Successfully!</h2>
                <p className="text-slate-500 text-sm mb-6">Your Springshed Rejuvenation Plan has been submitted to SARRA. The DD Level officer will review and approve your DPR.</p>
                <div className="bg-green-50 rounded-xl p-4 text-left mb-6">
                    <p className="text-xs font-semibold text-green-700 mb-2">SUBMISSION DETAILS</p>
                    <p className="text-xs text-green-600">Application No: <strong>SARRA-{Date.now().toString().slice(-8)}</strong></p>
                    <p className="text-xs text-green-600 mt-1">Submitted: {new Date().toLocaleDateString("en-IN")}</p>
                    <p className="text-xs text-green-600 mt-1">Springs: {springNames.length} identified</p>
                </div>
                <button onClick={() => { setSubmitted(false); setStep(1); setForm(initState()); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all">Start New DPR</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* TOP HEADER */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
                <div className="max-w-[97%] mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">🌊</div>
                        <div>
                            <p className="text-sm font-bold leading-tight">SARRA — Springshed DPR Form</p>
                            <p className="text-xs text-blue-300">Spring &amp; River Rejuvenation Authority, Uttarakhand</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {savedDraft && <span className="text-xs text-green-300 bg-green-900/50 px-3 py-1 rounded-full">✓ Draft Saved</span>}
                        <button onClick={handleDraft} className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all">💾 Save Draft</button>
                        <button onClick={handleClearDraft} className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg border border-red-400/30 transition-all">🗑️ Clear Draft</button>
                        <div className="text-xs text-blue-300 bg-blue-900/50 px-3 py-1.5 rounded-lg border border-blue-700">Section {step}/10</div>
                    </div>
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
                <div className="max-w-[97%] mx-auto px-4">
                    {/* Step indicators — desktop */}
                    <div className="hidden lg:flex items-center justify-between py-3 gap-1">
                        {SECTIONS.map((s, i) => (
                            <div key={s.id} className="flex items-center flex-1">
                                <button type="button" onClick={() => setStep(s.id)} className="flex flex-col items-center gap-1 w-full group">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step === s.id ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : step > s.id ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-300'}`}>
                                        {step > s.id ? '✓' : s.icon}
                                    </div>
                                    <span className={`text-[9px] font-semibold leading-tight text-center max-w-[56px] ${step === s.id ? 'text-blue-600' : step > s.id ? 'text-green-600' : 'text-slate-400'}`}>{s.label}</span>
                                </button>
                                {i < SECTIONS.length - 1 && <div className={`h-0.5 flex-1 mx-1 rounded transition-all ${step > s.id ? 'bg-green-400' : 'bg-slate-200'}`} />}
                            </div>
                        ))}
                    </div>
                    {/* Mobile progress */}
                    <div className="lg:hidden py-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-700">{SECTIONS[step - 1].icon} {SECTIONS[step - 1].label}</span>
                            <span className="text-xs text-slate-400">{step} / 10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* FORM BODY */}
            <div className="max-w-[97%] mx-auto px-4 py-6">
                <div className={card + " p-8"}>
                    {step === 1 && <Section1 data={form.sec1} setData={updSec("sec1")} />}
                    {step === 2 && <Section2 data={form.sec2} setData={updSec("sec2")} sec1={form.sec1} />}
                    {step === 3 && <Section3 data={form.sec3} setData={updSec("sec3")} springNames={springNames} />}
                    {step === 4 && <Section4 data={form.sec4} setData={updSec("sec4")} />}
                    {step === 5 && <Section5 data={form.sec5} setData={updSec("sec5")} springNames={springNames} />}
                    {step === 6 && <Section6 data={form.sec6} setData={updSec("sec6")} springNames={springNames} />}
                    {step === 7 && <Section7 data={form.sec7} setData={updSec("sec7")} springNames={springNames} />}
                    {step === 8 && <Section8 data={form.sec8} setData={updSec("sec8")} springNames={springNames} />}
                    {step === 9 && <Section9 data={form.sec9} setData={updSec("sec9")} springNames={springNames} />}
                    {step === 10 && <Section10 data={form.sec10} setData={updSec("sec10")} springNames={springNames} sec1={form.sec1} sec2={form.sec2} />}
                </div>

                {/* NAVIGATION */}
                <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
                    <div className="flex gap-3">
                        {step > 1 && <NavBtn onClick={() => setStep(s => s - 1)} label="Previous" icon="←" />}
                    </div>
                    <div className="flex items-center gap-3">
                        <SaveDraftBtn onClick={handleDraft} />
                        <button type="button" onClick={handleClearDraft} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-all">🗑️ Clear</button>
                        {step < 10
                            ? <NavBtn onClick={() => setStep(s => s + 1)} label="Next Section" primary icon="→" />
                            : <button type="button" onClick={handleSubmitForm} disabled={isSubmitting}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all disabled:bg-emerald-400">
                                {isSubmitting ? 'Submitting...' : 'Preview & Submit 🚀'}
                            </button>
                        }
                    </div>
                </div>

                {/* SPRING NAMES CHIP BAR — shows if any springs named */}
                {springNames.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-blue-600">Springs in this DPR:</span>
                        {springNames.map(s => (
                            <span key={s} className="text-xs px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full font-medium">{s}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}