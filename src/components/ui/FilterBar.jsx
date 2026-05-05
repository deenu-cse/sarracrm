import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from './Button';
import { SearchInput } from './SearchInput';

export function FilterBar({ filters, onChange, onApply, onClear, options = {} }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-border mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3">
          <SearchInput 
            value={filters.search || ''} 
            onChange={(val) => onChange({ search: val })} 
            placeholder="Search by App No..." 
          />
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <Button 
            variant="secondary" 
            className="md:hidden w-full flex justify-center items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          <div className="hidden md:flex items-center gap-3">
            {options.status && (
              <select 
                name="status" 
                value={filters.status || ''} 
                onChange={handleChange}
                className="form-select border-slate-300 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                {options.status.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            )}
            
            {options.departments && (
              <select 
                name="department" 
                value={filters.department || ''} 
                onChange={handleChange}
                className="form-select border-slate-300 rounded-lg text-sm"
              >
                <option value="">All Departments</option>
                {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <Button onClick={onApply} variant="primary" size="sm">Apply</Button>
            <Button onClick={onClear} variant="ghost" size="sm" className="text-slate-500">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Filters Dropdown */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3 md:hidden">
          {options.status && (
            <select name="status" value={filters.status || ''} onChange={handleChange} className="form-select w-full border-slate-300 rounded-lg text-sm">
              <option value="">All Statuses</option>
              {options.status.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          )}
          {options.departments && (
            <select name="department" value={filters.department || ''} onChange={handleChange} className="form-select w-full border-slate-300 rounded-lg text-sm">
              <option value="">All Departments</option>
              {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => { onApply(); setIsOpen(false); }} fullWidth>Apply</Button>
            <Button onClick={() => { onClear(); setIsOpen(false); }} variant="secondary" fullWidth>Clear</Button>
          </div>
        </div>
      )}
    </div>
  );
}
