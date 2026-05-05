import React from 'react';
import { SectionViewer, DataRow } from './SectionViewer';
import { PhotoGallery } from './PhotoGallery';
import { FilePreview } from '../ui/FilePreview';
import { formatCurrency, formatDate } from '@/lib/formatters';

export function FormDetailView({ dpr }) {
  if (!dpr) return null;

  return (
    <div className="space-y-6">
      <SectionViewer title="1. Department Details" expanded={true} renderContent={() => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
          <DataRow label="Executing Department" value={dpr.departmentDetails?.executingDepartment} />
          <DataRow label="Type of PIA" value={dpr.departmentDetails?.typeOfPia} />
          <DataRow label="Name of Officer" value={dpr.departmentDetails?.nameOfOfficer} />
          <DataRow label="Designation" value={dpr.departmentDetails?.designation} />
          <DataRow label="Mobile Number" value={dpr.departmentDetails?.mobileNumber} />
          <DataRow label="Email" value={dpr.departmentDetails?.email} />
        </div>
      )} />

      <SectionViewer title="2. Spring Identification" expanded={false} renderContent={() => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
          <DataRow label="District" value={dpr.springIdentification?.district} />
          <DataRow label="Block" value={dpr.springIdentification?.block} />
          <DataRow label="Gram Panchayat" value={dpr.springIdentification?.gramPanchayat} />
          <DataRow label="Village" value={dpr.springIdentification?.village} />
          <DataRow label="Latitude" value={dpr.springIdentification?.latitude} />
          <DataRow label="Longitude" value={dpr.springIdentification?.longitude} />
          <DataRow label="Elevation (m)" value={dpr.springIdentification?.elevation} />
          <DataRow label="Ownership" value={dpr.springIdentification?.ownership} />
        </div>
      )} />

      <SectionViewer title="3. Spring Description" expanded={false} renderContent={() => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
          <DataRow label="Local Name" value={dpr.springDescription?.localName} />
          <DataRow label="Spring Type" value={dpr.springDescription?.springType} />
          <DataRow label="Land Use" value={dpr.springDescription?.landUse} />
          <DataRow label="Dependents (HH)" value={dpr.springDescription?.dependents} />
          <DataRow label="Discharge (LPM)" value={dpr.springDescription?.dischargeLpm} />
        </div>
      )} />

      <SectionViewer title="4. Photos" expanded={false} renderContent={() => (
        <PhotoGallery photos={dpr.photos || []} />
      )} />

      <SectionViewer title="5. Hydro-Geological Details" expanded={false} renderContent={() => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <DataRow label="Rock Type" value={dpr.hydroGeological?.rockType} />
          <DataRow label="Soil Type" value={dpr.hydroGeological?.soilType} />
          <DataRow label="Catchment Area (Ha)" value={dpr.hydroGeological?.catchmentArea} />
          <DataRow label="Slope Angle (Degrees)" value={dpr.hydroGeological?.slopeAngle} />
        </div>
      )} />

      <SectionViewer title="10. Budget and Financials" expanded={true} renderContent={() => (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
            <DataRow label="Proposed Budget" value={formatCurrency(dpr.financials?.totalProposedBudget)} highlight />
            <DataRow label="Convergence Budget" value={formatCurrency(dpr.financials?.convergenceBudget)} />
            <DataRow label="SARRA Share" value={formatCurrency(dpr.financials?.sarraShare)} highlight />
            <DataRow label="Expected Completion" value={`${dpr.financials?.expectedCompletionMonths || 0} Months`} />
          </div>
          
          {dpr.financials?.activities && dpr.financials.activities.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Activity Breakdown</h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Activity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Unit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Rate</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total (₹L)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {dpr.financials.activities.map((act, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-slate-900">{act.name}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{act.unit}</td>
                        <td className="px-4 py-2 text-sm text-slate-600 text-right">{act.quantity}</td>
                        <td className="px-4 py-2 text-sm text-slate-600 text-right">{formatCurrency(act.rate)}</td>
                        <td className="px-4 py-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(act.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )} />

      {dpr.annexures && dpr.annexures.length > 0 && (
        <SectionViewer title="Annexures & Documents" expanded={true} renderContent={() => (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dpr.annexures.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs uppercase">{doc.type || 'DOC'}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate" title={doc.name || 'Document'}>
                    {doc.name || `Attachment ${idx + 1}`}
                  </p>
                </div>
                <FilePreview url={doc.url} type={doc.type?.toLowerCase() === 'kml' ? 'kml' : 'pdf'} />
              </div>
            ))}
          </div>
        )} />
      )}
    </div>
  );
}
