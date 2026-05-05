import React from 'react';
import { DPR_STATUS, STATUS_LABELS } from '@/constants/status';

export function Badge({ status, className = '' }) {
  const mapping = {
    [DPR_STATUS.APPROVED]: 'bg-green-100 text-green-800 border border-green-200',
    [DPR_STATUS.REJECTED]: 'bg-red-100 text-red-800 border border-red-200',
    [DPR_STATUS.SUBMITTED]: 'bg-blue-100 text-blue-800 border border-blue-200',
    [DPR_STATUS.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    [DPR_STATUS.DRAFT]: 'bg-gray-100 text-gray-600 border border-gray-200',
    [DPR_STATUS.RESUBMITTED]: 'bg-purple-100 text-purple-800 border border-purple-200',
  };

  const style = mapping[status] || 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  );
}
