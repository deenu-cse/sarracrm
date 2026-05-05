import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RejectionModal } from './RejectionModal';
import { formatCurrency } from '@/lib/formatters';
import { Check, X, FileText } from 'lucide-react';
import { useExport } from '@/hooks/useExport';

export function ApprovalPanel({ form, onApprove, onReject, isReadOnly = false }) {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { triggerExport, exporting } = useExport();

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove();
    setIsSubmitting(false);
  };

  const handleReject = async (reason) => {
    setIsSubmitting(true);
    await onReject(reason);
    setIsSubmitting(false);
    setIsRejectModalOpen(false);
  };

  const canApprove = !isReadOnly && (form.status === 'SUBMITTED' || form.status === 'RESUBMITTED' || form.status === 'UNDER_REVIEW');

  return (
    <div className="space-y-6 sticky top-24">
      {/* Action Section */}
      <Card noPadding>
        <div className="p-6 bg-slate-50 border-b border-border text-center">
          <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-semibold">Current Status</p>
          <Badge status={form.status} className="text-lg px-4 py-1.5" />
        </div>
        
        <div className="p-6">
          {canApprove ? (
            <div className="flex flex-col gap-3">
              <Button 
                variant="success" 
                fullWidth 
                size="lg"
                onClick={handleApprove}
                loading={isSubmitting}
                className="shadow-sm font-semibold"
              >
                <Check className="w-5 h-5 mr-2" /> Approve DPR
              </Button>
              <Button 
                variant="danger" 
                fullWidth 
                size="lg"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isSubmitting}
                className="shadow-sm font-semibold"
              >
                <X className="w-5 h-5 mr-2" /> Reject DPR
              </Button>
            </div>
          ) : (
            <div className="text-center">
              {form.status === 'APPROVED' && (
                <div className="text-green-600 flex items-center justify-center gap-2 mb-4">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Form has been approved</span>
                </div>
              )}
              {form.status === 'REJECTED' && (
                <div className="text-red-600 flex items-center justify-center gap-2 mb-4">
                  <X className="w-5 h-5" />
                  <span className="font-medium">Form has been rejected</span>
                </div>
              )}
              
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => triggerExport(`/reports/export/pdf/${form._id}`, `DPR_${form.applicationNo}.pdf`)}
                loading={exporting}
              >
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Form Stats */}
      <Card>
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Form Overview</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">{form.formType === 'STREAMSHED' ? 'Total Streams' : 'Total Springs'}</span>
            <span className="text-sm font-medium text-navy bg-blue-50 px-2 py-0.5 rounded">
              {form.formType === 'STREAMSHED' 
                ? (form.section2_streamIdentification?.table21?.length || 0)
                : (form.technicalDetails?.totalSprings || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Total Budget</span>
            <span className="text-sm font-medium text-navy">
              {form.formType === 'STREAMSHED'
                ? formatCurrency(form.section7_budgetAndPlan?.table71?.totalBudgetLakh)
                : formatCurrency(form.financials?.totalProposedBudget)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Beneficiaries</span>
            <span className="text-sm font-medium text-slate-800">
              {form.formType === 'STREAMSHED'
                ? (form.section2_streamIdentification?.table23?.reduce((acc, curr) => acc + (Number(curr.benefitedPopulation) || 0), 0) || 0)
                : (form.outcomes?.beneficiaryHouseholds || 0)} {form.formType === 'STREAMSHED' ? 'Pax' : 'HH'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Recharge Area</span>
            <span className="text-sm font-medium text-slate-800">
              {form.formType === 'STREAMSHED'
                ? (form.section5_rechargeAreas?.table51?.reduce((acc, curr) => acc + (Number(curr.totalRechargeAreaHa) || 0), 0) || 0)
                : (form.technicalDetails?.totalRechargeAreaHa || 0)} Ha
            </span>
          </div>
        </div>
      </Card>


      {/* Officer Info */}
      <Card>
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Submitted By</h4>
        {form.submittedBy ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium text-slate-900">{form.submittedBy.name}</p>
            <p className="text-slate-500">{form.submittedBy.designation || 'PIA Officer'}</p>
            <p className="text-slate-600">{form.submittedBy.department}</p>
            <p className="text-slate-600">{form.submittedBy.district} District</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <a href={`mailto:${form.submittedBy.email}`} className="text-navy hover:underline block mb-1">{form.submittedBy.email}</a>
              {form.submittedBy.phone && <a href={`tel:${form.submittedBy.phone}`} className="text-navy hover:underline">{form.submittedBy.phone}</a>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Officer details not available</p>
        )}
      </Card>

      <RejectionModal 
        isOpen={isRejectModalOpen} 
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        loading={isSubmitting}
      />
    </div>
  );
}
