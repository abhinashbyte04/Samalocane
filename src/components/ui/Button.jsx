import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-sm min-h-[38px]",
    md: "px-4.5 py-2.5 text-sm sm:text-base min-h-[44px]",
    lg: "px-6 py-3.5 text-base sm:text-lg min-h-[48px]"
  };

  const variantStyles = {
    primary: "bg-teal-700 hover:bg-teal-800 text-white shadow-sm hover:shadow focus:ring-teal-600 border border-teal-800/20",
    secondary: "bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs focus:ring-slate-400",
    emergency: "bg-rose-700 hover:bg-rose-800 text-white shadow-sm hover:shadow focus:ring-rose-600 border border-rose-800/20",
    outline: "border-2 border-teal-700 text-teal-800 bg-white hover:bg-teal-50/70 focus:ring-teal-600",
    subtle: "bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 focus:ring-teal-600",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700 border-transparent shadow-none"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
