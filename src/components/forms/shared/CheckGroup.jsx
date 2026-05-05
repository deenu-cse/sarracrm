import React from 'react';

export function CheckGroup({ label, options, selectedValues = [], onChange, required = false, error }) {
  const handleToggle = (value) => {
    let newValues;
    if (selectedValues.includes(value)) {
      newValues = selectedValues.filter(v => v !== value);
    } else {
      newValues = [...selectedValues, value];
    }
    onChange(newValues);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          const isSelected = selectedValues.includes(val);
          
          return (
            <div 
              key={i} 
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-navy' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => handleToggle(val)}
            >
              <input
                type="checkbox"
                className="w-4 h-4 text-navy rounded border-slate-300 focus:ring-navy cursor-pointer"
                checked={isSelected}
                readOnly
              />
              <span className="ml-3 text-sm text-slate-700 font-medium select-none">{lbl}</span>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
