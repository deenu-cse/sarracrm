import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-navy`} />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col justify-center items-center z-50">
      <Spinner size="lg" />
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading SARRA CRM...</p>
    </div>
  );
}
