import React from 'react';

export function FloatSelect({ id, label, options, value, onChange, required = false, disabled = false, error }) {
  return (
    <div className="relative mb-4">
      <select
        id={id}
        name={id}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`peer block w-full px-4 pt-6 pb-2 text-sm text-slate-900 bg-transparent rounded-lg border appearance-none focus:outline-none focus:ring-0 ${
          error ? 'border-red-500 focus:border-red-600' : 'border-slate-300 focus:border-navy'
        } ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
      >
        <option value="" disabled hidden></option>
        {options.map((opt, i) => (
          <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={`absolute text-sm duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none ${
          !value ? 'scale-100 translate-y-0' : ''
        } ${error ? 'text-red-500' : 'text-slate-500 peer-focus:text-navy'}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {/* Custom arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
        </svg>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
