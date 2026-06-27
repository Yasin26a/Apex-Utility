import React from 'react';

interface BrandingLogoProps {
  className?: string;
  size?: number;
}

export const BrandingLogo: React.FC<BrandingLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <div
      className={`branding-logo-wrapper relative select-none flex items-center justify-center ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <style>{`
        @keyframes apexPulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.35));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.85));
          }
        }
        .branding-logo-wrapper .apex-svg {
          filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.1));
        }
        .branding-logo-wrapper:hover .apex-svg {
          transform: scale(1.08);
          animation: apexPulseGlow 2s infinite ease-in-out;
        }
        .branding-logo-wrapper .apex-shield {
          transition: stroke-width 0.4s ease, stroke 0.4s ease;
        }
        .branding-logo-wrapper:hover .apex-shield {
          stroke: #ff4b4b;
          stroke-width: 3px;
        }
        .branding-logo-wrapper .apex-wing {
          transition: fill 0.4s ease, opacity 0.4s ease;
        }
        .branding-logo-wrapper:hover .apex-wing {
          opacity: 1.0;
        }
      `}</style>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full apex-svg"
      >
        <defs>
          {/* Intense Cyber Red Gradient */}
          <linearGradient id="apexRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4b4b" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          {/* Premium Carbon Metallic Dark Gradient */}
          <linearGradient id="apexShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1e24" />
            <stop offset="100%" stopColor="#0f0f12" />
          </linearGradient>

          {/* Electric Edge Light */}
          <linearGradient id="apexEdgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff7878" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
          </linearGradient>

          {/* Soft Red Backlight Glow Filter */}
          <filter id="apexBrandGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Cyber Shield Outer Border (Hexagonal shape representing safety/sandboxed computation) */}
        <path
          d="M50 8 L88 28 L88 72 L50 92 L12 72 L12 28 Z"
          fill="url(#apexShieldGrad)"
          stroke="#ef4444"
          strokeWidth="1.5"
          className="apex-shield"
          filter="url(#apexBrandGlow)"
        />

        {/* 2. Inner Tech Grid Accents (Subtle detail lines) */}
        <path
          d="M50 16 L78 33 L78 67 L50 84 L22 67 L22 33 Z"
          stroke="#ef4444"
          strokeWidth="1"
          strokeOpacity="0.2"
          strokeDasharray="4 3"
        />

        {/* 3. Outer Left Wing of the "A" */}
        <path
          d="M28 66 L44 26 L50 26 L36 66 Z"
          fill="url(#apexRedGrad)"
          opacity="0.85"
          className="apex-wing"
        />

        {/* 4. Outer Right Wing of the "A" */}
        <path
          d="M72 66 L56 26 L50 26 L64 66 Z"
          fill="url(#apexRedGrad)"
          opacity="0.85"
          className="apex-wing"
        />

        {/* 5. Central Power Lightning Bolt / Core (Fills the "A" center, shooting up to the apex) */}
        <path
          d="M50 22 L38 52 H51 L44 76 L66 42 H52 Z"
          fill="url(#apexRedGrad)"
          filter="url(#apexBrandGlow)"
        />

        {/* 6. Sharp Apex Crest Highlight (Visual lens point) */}
        <circle cx="50" cy="22" r="2.5" fill="#ffffff" className="animate-ping" style={{ transformOrigin: '50% 22%' }} />
        <circle cx="50" cy="22" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
};
