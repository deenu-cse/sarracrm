import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import { Button } from './Button';

export function ExportButton({ filters, availableTypes = ['csv', 'excel', 'pdf-summary'] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { triggerExport, exporting } = useExport();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (type) => {
    setIsOpen(false);
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
    }
    
    let endpoint = '';
    switch (type) {
      case 'csv': endpoint = `/reports/export/csv`; break;
      case 'excel': endpoint = `/reports/export/excel`; break;
      case 'pdf-summary': endpoint = `/reports/export/summary-pdf`; break;
      default: return;
    }
    
    const qs = queryParams.toString();
    if (qs) endpoint += `?${qs}`;
    
    triggerExport(endpoint, `SARRA_Export_${type}_${new Date().getTime()}.${type === 'excel' ? 'xlsx' : type === 'csv' ? 'csv' : 'pdf'}`);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button 
        variant="secondary" 
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        loading={exporting}
      >
        <Download className="w-4 h-4 mr-2" />
        Export
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {availableTypes.includes('csv') && (
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                role="menuitem"
              >
                <FileText className="w-4 h-4 mr-2 text-slate-400" /> CSV Data
              </button>
            )}
            {availableTypes.includes('excel') && (
              <button
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                role="menuitem"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel Report
              </button>
            )}
            {availableTypes.includes('pdf-summary') && (
              <button
                onClick={() => handleExport('pdf-summary')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                role="menuitem"
              >
                <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF Summary
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
