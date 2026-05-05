import React from 'react';

export function Card({ children, className = '', noPadding = false }) {
  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border overflow-hidden ${className}`}>
      {!noPadding ? (
        <div className="p-6">
          {children}
        </div>
      ) : children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-border flex justify-between items-center bg-slate-50/50 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
