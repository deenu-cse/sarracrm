const fs = require('fs');
const path = require('path');

const DISTRICTS = [
    'Dehradun', 'Haridwar', 'Tehri', 'Pauri', 'Chamoli',
    'Uttarkashi', 'Rudraprayag', 'USNagar', 'Nainital',
    'Almora', 'Pithoragarh', 'Bageshwar', 'Champawat'
];

const ACTIVITIES_1C = [
  { code:'55-03', name:'प्राथमिक / विस्तृत परियोजना रिपोर्ट पर व्यय', en:'DPR Preparation', hasPhysical:false, hasSize:false },
  { code:'55-03(01)', name:'समोच्च खनियां / कन्टूर ट्रेंचेज', en:'Contour Trenches', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-03(02)', name:'रिचार्ज पिट', en:'Recharge Pit', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-03(03)', name:'डग आउट पौण्ड', en:'Dugout Ponds', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-03(04)', name:'चाल / खाल', en:'Chal-Khal', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-03(05)', name:'ब्रशवुड चेक डेम', en:'Brushwood Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-03(06)', name:'अस्थाई चेक डेम (पिरुल आदि)', en:'Temporary Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-03(07)', name:'Loose Boulder Check Dam', en:'Loose Boulder Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-03(08)', name:'R:R Dry Check Dam', en:'RR Dry Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-03(09)', name:'Gabion / Crate Wire Check Dam', en:'Gabion/Crate Wire Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-03(10)', name:'Cemented Check Dam', en:'Cemented Check Dam', hasPhysical:true, hasSize:false, unit:'No.' },
  { code:'55-03(11)', name:'वानस्पतिक उपचार गतिविधि', en:'Vegetative Treatment', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-03(12)', name:'वनीकरण गतिविधि', en:'Forestry Plantation', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-03(13)', name:'चारा / घास रोपण', en:'Fodder/Grass Plantation', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-03(14)', name:'प्राकृतिक पुनरोत्पादन गतिविधि', en:'ANR Activities', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-03(15)', name:'वृक्षारोपण गतिविधि', en:'Plantation Activities', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'55-03(16)', name:'उपरोक्त गतिविधियों से कुल उपचारित जल संग्रहण क्षेत्र', en:'Total Catchment Area Treated', hasPhysical:true, hasSize:false, unit:'Ha.' },
  { code:'M&E', name:'मूल्यांकन एवं अनुश्रवण पर व्यय', en:'Monitoring & Evaluation', hasPhysical:false, hasSize:false },
];

const ACTIVITIES_1D = [
  { code:'55-04', name:'प्राथमिक / विस्तृत परियोजना रिपोर्ट पर व्यय', en:'DPR Preparation', hasPhysical:false, hasSize:false },
  { code:'55-04(01)', name:'समोच्च खन्तियां/कन्टूर ट्रेंच', en:'Contour Trenches', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(02)', name:'रिचार्ज पिट', en:'Recharge Pit', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(03)', name:'रिचार्ज शॉफ्ट', en:'Recharge Shaft', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(04)', name:'डग आउट पॉण्ड', en:'Dugout Pond', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(05)', name:'चाल / खाल', en:'Chal-Khal', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(06)', name:'मैदानी क्षेत्रों में अमृत सरोवर', en:'Amrit Sarovar (Plains)', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(07)', name:'मैदानी क्षेत्रों में अमृत सरोवर का पुनरोद्धार', en:'Amrit Sarovar Restoration (Plains)', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(08)', name:'मैदानी क्षेत्रों में बड़े तालाब', en:'Large Ponds (Plains)', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'55-04(09)', name:'मैदानी क्षेत्रों में बड़े तालाब का पुनरोद्धार', en:'Large Ponds Restoration (Plains)', hasPhysical:true, hasSize:true, unit:'No.' },
  { code:'M&E', name:'मूल्यांकन एवं अनुश्रवण पर व्यय', en:'Monitoring & Evaluation', hasPhysical:false, hasSize:false },
];

function r(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }
function rf(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }

function generatePayload(activities, fields) {
    return {
        financialYear: "2026-27",
        reportingMonth: "August",
        ...fields,
        activities: activities.map(act => ({
            activityCode: act.code,
            activityName: act.name,
            activityEnglishName: act.en,
            unit: act.unit || "",
            hasPhysical: act.hasPhysical,
            hasSize: act.hasSize,
            isHeader: false,
            districts: DISTRICTS.map(district => {
                const targetUnit = act.hasPhysical ? r(150, 3000) : 0;
                const targetSize = act.hasSize ? r(2000, 35000) : 0;
                return {
                    districtName: district,
                    physicalProgressTillLastFY: act.hasPhysical ? r(30, Math.floor(targetUnit * 0.45)) : 0,
                    targetUnit,
                    targetSizeCubicMeter: targetSize,
                    lastMonthPhysicalProgress: act.hasPhysical ? r(10, Math.floor(targetUnit * 0.18)) : 0,
                    thisMonthPhysicalProgress: act.hasPhysical ? r(10, Math.floor(targetUnit * 0.18)) : 0,
                    sarraExpendTillLastFY: rf(10, 180),
                    ratePerUnit: rf(0.75, 18),
                    targetDeptShareLakh: rf(80, 400),
                    targetSarraShareLakh: rf(120, 650),
                    lastMonthSarraExpend: rf(5, 60),
                    thisMonthSarraExpend: rf(5, 60)
                };
            })
        }))
    };
}

const payload1C = generatePayload(ACTIVITIES_1C, {
    totalApprovedSchemes: r(100, 200),
    totalMajorRiversUnderSchemes: r(300, 800),
    majorRiversCurrentlyBeingTreated: r(150, 400)
});

const payload1D = generatePayload(ACTIVITIES_1D, {
    totalApprovedSchemes: r(100, 200),
    totalGroundwaterSitesUnderSchemes: r(300, 800),
    groundwaterSitesCurrentlyBeingTreated: r(150, 400)
});

fs.writeFileSync(path.join(__dirname, 'payload1C.json'), JSON.stringify(payload1C, null, 2));
fs.writeFileSync(path.join(__dirname, 'payload1D.json'), JSON.stringify(payload1D, null, 2));

console.log('Generated payload1C.json and payload1D.json');
