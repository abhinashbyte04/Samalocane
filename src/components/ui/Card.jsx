import React from 'react';

export function Card({ 
  children, 
  className = '', 
  hoverable = false,
  ...props 
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-150 ${
        hoverable ? 'hover:border-slate-300 hover:shadow-card' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  title, 
  subtitle, 
  action, 
  icon: Icon, 
  className = '' 
}) {
  return (
    <div className={`flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-4 ${className}`}>
      <div className="flex items-start gap-2.5">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 border border-teal-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
