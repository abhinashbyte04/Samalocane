import React, { useId } from 'react';

/**
 * Samālōcane Healthcare & Telemedicine Platform Logo
 * Combines a clean healthcare cross with a digital ECG pulse wave and connectivity signal elements.
 */
export function Logo({ className = "w-10 h-10", size, ...props }) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const brandGradId = `brandGrad-${safeId}`;
  const pulseGradId = `pulseGrad-${safeId}`;
  const dropShadowId = `dropShadow-${safeId}`;

  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 aspect-square ${className}`}
      style={style}
      aria-label="Samālōcane Logo"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id={brandGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id={pulseGradId} x1="9" y1="24" x2="39" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="60%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id={dropShadowId} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Base Rounded Squircle Tile */}
      <rect width="48" height="48" rx="11" fill={`url(#${brandGradId})`} />

      {/* Subtle Top-Right Connectivity Signal Arcs */}
      <path 
        d="M30 11a7 7 0 0 1 7 7" 
        stroke="#ffffff" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        opacity="0.9" 
      />
      <path 
        d="M31 6a12 12 0 0 1 11 11" 
        stroke="#ffffff" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        opacity="0.55" 
      />

      {/* Clean Medical Cross */}
      <g filter={`url(#${dropShadowId})`}>
        <rect x="19" y="9" width="10" height="30" rx="2.5" fill="#ffffff" />
        <rect x="9" y="19" width="30" height="10" rx="2.5" fill="#ffffff" />
      </g>

      {/* Digital Telemedicine ECG Pulse Waveform */}
      <path 
        d="M9 24h7l2.2-7.5 3.6 15 3.2-11 2 4.5 1.8-1h9.2" 
        stroke={`url(#${pulseGradId})`} 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Telemedicine Signal Node */}
      <circle cx="38" cy="24" r="1.8" fill="#0284c7" />
    </svg>
  );
}

export default Logo;

