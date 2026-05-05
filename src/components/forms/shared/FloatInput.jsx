import React from 'react';

export function FloatInput({ id, label, type = 'text', value, onChange, placeholder = ' ', required = false, disabled = false, error }) {
  return (
    <div className="relative mb-4">
      <input
        type={type}
        id={id}
        name={id}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`peer block w-full px-4 pt-6 pb-2 text-sm text-slate-900 bg-transparent rounded-lg border appearance-none focus:outline-none focus:ring-0 ${
          error ? 'border-red-500 focus:border-red-600' : 'border-slate-300 focus:border-navy'
        } ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none ${
          error ? 'text-red-500' : 'text-slate-500 peer-focus:text-navy'
        }`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
