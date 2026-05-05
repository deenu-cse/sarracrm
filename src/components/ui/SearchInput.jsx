import React from 'react';
import { Search } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-navy focus:border-navy sm:text-sm placeholder:text-slate-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
