import React from 'react';
import { SearchX } from 'lucide-react';

export function EmptyState({ 
  title = 'No Data Found', 
  message = 'There is no data to display matching your criteria.', 
  icon: Icon = SearchX,
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
