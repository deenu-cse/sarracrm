import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  className = '', 
  fullWidth = false,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-navy hover:bg-navy-light text-white focus:ring-navy',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500',
    danger: 'bg-danger hover:bg-red-700 text-white focus:ring-danger',
    success: 'bg-success hover:bg-green-700 text-white focus:ring-success',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <button 
      className={classes} 
      disabled={disabled || loading} 
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
