import React from 'react';

export default function Section2({ data = {}, onChange, errors = {} }) {
  return (
    <div className="space-y-6 p-2">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Section 2</h2>
      <p className="text-slate-500 text-sm">Form logic mirrors the SARRA web application. Simplified fields for CRM display.</p>
    </div>
  );
}
