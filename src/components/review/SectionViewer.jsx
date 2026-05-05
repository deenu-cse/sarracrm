import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function SectionViewer({ title, data, expanded = true, renderContent }) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden">
      <div 
        className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <button className="text-slate-500 hover:text-navy focus:outline-none">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-6">
          {renderContent ? (
            renderContent(data)
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {Object.entries(data || {}).map(([key, value]) => {
                if (value === null || value === undefined || typeof value === 'object') return null;
                // simple camel case to label conversion
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                return (
                  <div key={key}>
                    <dt className="text-sm font-medium text-slate-500 mb-1">{label}</dt>
                    <dd className="text-sm text-slate-900 bg-slate-50 px-3 py-2 rounded-md border border-slate-100 min-h-[38px] flex items-center">
                      {String(value) || '-'}
                    </dd>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DataRow({ label, value, highlight = false }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500 mb-1">{label}</dt>
      <dd className={`text-sm ${highlight ? 'font-semibold text-navy bg-blue-50 border-blue-100' : 'text-slate-900 bg-slate-50 border-slate-100'} px-3 py-2 rounded-md border min-h-[38px] flex items-center`}>
        {value === undefined || value === null || value === '' ? '-' : value}
      </dd>
    </div>
  );
}
