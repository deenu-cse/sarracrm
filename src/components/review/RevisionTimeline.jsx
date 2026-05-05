import React from 'react';
import { formatDate } from '@/lib/formatters';
import { CheckCircle2, Clock, FilePlus, XCircle, RefreshCw } from 'lucide-react';

export function RevisionTimeline({ revisions, currentStatus }) {
  if (!revisions || revisions.length === 0) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return <FilePlus className="w-5 h-5 text-slate-400" />;
      case 'SUBMITTED': return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'UNDER_REVIEW': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'RESUBMITTED': return <RefreshCw className="w-5 h-5 text-purple-500" />;
      default: return <div className="w-3 h-3 rounded-full bg-slate-300" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-6">Revision History</h3>
      
      <div className="relative min-w-[600px]">
        {/* Timeline Line */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200" />
        
        <div className="flex justify-between relative z-10">
          {revisions.map((rev, index) => {
            const isLast = index === revisions.length - 1;
            const isCurrent = rev.status === currentStatus && isLast;
            
            return (
              <div key={index} className={`flex flex-col items-center w-32 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border-4 ${isCurrent ? 'border-navy shadow-md' : 'border-slate-100'} z-10`}>
                  {getStatusIcon(rev.status)}
                </div>
                <div className="text-center mt-3">
                  <p className={`text-xs font-bold ${isCurrent ? 'text-navy' : 'text-slate-600'}`}>{rev.status}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{formatDate(rev.date, 'dd MMM yyyy, HH:mm')}</p>
                  {rev.by && <p className="text-[10px] text-slate-400 truncate w-24 mx-auto">{rev.by}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
