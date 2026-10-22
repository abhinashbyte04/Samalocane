import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function Alert({ children, type = 'info', title, className = '', onDismiss }) {
  const configs = {
    info: {
      bg: 'bg-sky-50/90 border-sky-200 text-sky-950',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
    },
    warning: {
      bg: 'bg-amber-50/90 border-amber-300 text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
    },
    danger: {
      bg: 'bg-rose-50/90 border-rose-300 text-rose-950',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
    },
    success: {
      bg: 'bg-emerald-50/90 border-emerald-300 text-emerald-950',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
    }
  };

  const config = configs[type] || configs.info;

  return (
    <div className={`p-4 rounded-xl border text-sm sm:text-base flex items-start gap-3 shadow-2xs ${config.bg} ${className}`}>
      {config.icon}
      <div className="flex-1 space-y-1 leading-relaxed">
        {title && <div className="font-bold text-base text-slate-900 tracking-tight">{title}</div>}
        <div className="font-medium text-sm sm:text-base leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-lg"
          title="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
