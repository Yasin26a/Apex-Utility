import React from 'react';

interface BrandingLogoProps {
  className?: string;
  size?: number;
}

export const BrandingLogo: React.FC<BrandingLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center select-none group branding-logo-wrapper ${className}`}
      style={{ width: size, height: size }}
    >
      <style>{`
        @keyframes apexPulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.35));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(250, 204, 21, 0.85));
          }
        }
        .branding-logo-wrapper .apex-svg {
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease;
          filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.15));
        }
        .branding-logo-wrapper:hover .apex-svg {
          transform: scale(1.12);
          animation: apexPulseGlow 1.8s infinite ease-in-out;
        }
        .branding-logo-wrapper .apex-lightning {
          transition: fill 0.3s ease;
        }
      `}</style>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full apex-svg"
      >
        <defs>
          {/* Intense Cyber Gold/Yellow Gradient for the Lightning Bolt */}
          <linearGradient id="apexGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Premium Carbon Metallic Dark Gradient */}
          <linearGradient id="apexDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b1b" />
            <stop offset="100%" stopColor="#090505" />
          </linearGradient>

          {/* Electric Edge Light */}
          <linearGradient id="apexEdgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.2" />
          </linearGradient>

          {/* Soft Gold Backlight Glow Filter */}
          <filter id="apexBrandGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Outer Tech Hexagonal Shield Base */}
        <path
          d="M50 8 L88 30 L88 70 L50 92 L12 70 L12 30 Z"
          fill="url(#apexDarkGrad)"
          stroke="url(#apexEdgeGrad)"
          strokeWidth="2.5"
          className="apex-shield"
        />

        {/* 2. Inner Tech Grid Accents (Subtle detail lines) */}
        <path
          d="M50 16 L78 33 L78 67 L50 84 L22 67 L22 33 Z"
          stroke="#facc15"
          strokeWidth="1"
          strokeOpacity="0.15"
          strokeDasharray="4 3"
        />

        {/* 3. The Central Premium Lightning Bolt */}
        <path
          d="M62 14 L24 56 H49 L34 88 L74 44 H49 Z"
          fill="url(#apexGoldGrad)"
          filter="url(#apexBrandGlow)"
          className="apex-lightning"
        />

        {/* 4. Sharp Sparks/Aura points */}
        <circle cx="62" cy="14" r="1.5" fill="#ffffff" />
        <circle cx="34" cy="88" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
};
