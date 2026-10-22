import React from 'react';

export function Badge({ 
  children, 
  variant = 'neutral', 
  dot = false, 
  className = '' 
}) {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-800 border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    brand: 'bg-teal-50 text-teal-800 border-teal-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200'
  };

  const dotStyles = {
    neutral: 'bg-slate-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    brand: 'bg-teal-600',
    info: 'bg-sky-500'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${variantStyles[variant] || variantStyles.neutral} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant] || 'bg-slate-400'}`} />}
      {children}
    </span>
  );
}
