import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { LogIn, CheckCircle, XCircle, Edit, FilePlus } from 'lucide-react';

export function RecentActivity({ logs }) {
  if (!logs || logs.length === 0) {
    return <div className="p-6 text-center text-slate-400">No recent activity</div>;
  }

  const getLogIcon = (action) => {
    switch (action) {
      case 'LOGIN': return <div className="p-2 bg-blue-100 rounded-full text-blue-600"><LogIn className="w-4 h-4" /></div>;
      case 'APPROVE': return <div className="p-2 bg-green-100 rounded-full text-green-600"><CheckCircle className="w-4 h-4" /></div>;
      case 'REJECT': return <div className="p-2 bg-red-100 rounded-full text-red-600"><XCircle className="w-4 h-4" /></div>;
      case 'SUBMIT_DPR': return <div className="p-2 bg-navy-light rounded-full text-white"><FilePlus className="w-4 h-4" /></div>;
      default: return <div className="p-2 bg-slate-100 rounded-full text-slate-600"><Edit className="w-4 h-4" /></div>;
    }
  };

  const formatActionText = (log) => {
    const roleMap = {
      'SUPER_ADMIN': 'Admin',
      'DD_LEVEL': 'DD',
      'PIA_OFFICER': 'Officer'
    };
    const roleBadge = `<span class="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded mr-1">${roleMap[log.role] || log.role}</span>`;
    
    switch (log.action) {
      case 'LOGIN': return `${roleBadge} <strong>${log.performedBy}</strong> logged in`;
      case 'APPROVE': return `${roleBadge} <strong>${log.performedBy}</strong> approved form ${log.resource}`;
      case 'REJECT': return `${roleBadge} <strong>${log.performedBy}</strong> rejected form ${log.resource}`;
      case 'SUBMIT_DPR': return `${roleBadge} <strong>${log.performedBy}</strong> submitted new DPR ${log.resource}`;
      default: return `${roleBadge} <strong>${log.performedBy}</strong> performed ${log.action}`;
    }
  };

  return (
    <div className="flow-root px-6 py-4">
      <ul className="-mb-8">
        {logs.map((log, index) => (
          <li key={log._id || index}>
            <div className="relative pb-8">
              {index !== logs.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>{getLogIcon(log.action)}</div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: formatActionText(log) }}></p>
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-slate-500">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
