
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * XApi Central Logo Component
 * Design: Logic Prism v5.0
 * Colors: Logic Blue (#00F2FF) & Creative Purple (#FF00E5)
 */
export const Logo: React.FC<LogoProps> = ({ className = "", size = 32, showText = true }) => {
  const uniqueId = React.useId().replace(/:/g, "");
  
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 128 128" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id={`grad_blue_${uniqueId}`} x1="20" y1="20" x2="108" y2="108" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00F2FF" />
              <stop offset="100%" stopColor="#2D8CFF" />
          </linearGradient>
          <linearGradient id={`grad_purple_${uniqueId}`} x1="108" y1="20" x2="20" y2="108" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF00E5" />
              <stop offset="100%" stopColor="#7000FF" />
          </linearGradient>
        </defs>

        {/* Left bracket [ */}
        <path
          d="M48 24H32C27.5817 24 24 27.5817 24 32V96C24 100.418 27.5817 104 32 104H48"
          stroke={`url(#grad_blue_${uniqueId})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center slash / */}
        <path
          d="M76 24L52 104"
          stroke={`url(#grad_purple_${uniqueId})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Right decoration dot */}
        <rect 
          x="88" y="80" width="16" height="24" rx="4" 
          fill={`url(#grad_blue_${uniqueId})`} 
          className="animate-logo-pulse"
        />
      </svg>

      {showText && (
        <span 
          className="font-black tracking-tighter text-slate-800 select-none"
          style={{ fontSize: size * 0.7, lineHeight: 1 }}
        >
          X<span className="font-light text-slate-400">Api</span>
        </span>
      )}
    </div>
  );
};
